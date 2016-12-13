'use strict';

const logger = require("kokomo.logger").getLogger('service');
const Config = require('config').MONGO;
const MongoClient = require('mongodb').MongoClient;
const Session = require('session');
const getConnectInfo = collectionName => Config.collection[collectionName] || Config.default;

let mongo = module.exports = {

};

mdb.initDirect = function initialize(callback) {
    const conn = getConnectInfo();
    var mc = require('mongodb').MongoClient, assert = require('assert');
    mc.connect(conn.dsn, conn.connection, function (err, _db) {
        assert.equal(null, err);
        logger.debug("MONGOOS Direct Connected: ", conn.dsn);
        _db.admin().authenticate('steam', '#justgame#123', function (err, ok) {
            callback(_db);
        });
    });
};

/**
 * Collection 별로 MongoDB Connection을 분기 / 핸들링 한다.
 */
let listMongoClients = {};
const getMongoClient = (collectionName) => {

    const {dsn, connection} = getConnectInfo(collectionName);

    // DSN 별로 Connection을 관리한다.
    return listMongoClients[dsn] = listMongoClients[dsn] || MongoClient.connect(dsn, connection).then(db =>
        // connection.user 가 정의된 경우 인증절차 추가
        !connection.user ? db : db.admin().authenticate(connection.user, connection.pass).then(() => db)
    ).then(db => {
        console.log('MongoDB Native driver connected!');
        return db;
    }).catch(e => {
        console.error('MongoDB Native driver connect failure!', e);
        process.exit(1);
    });
};

mdb.collection = collectionName => getMongoClient(collectionName).then(db => db.collection(collectionName));
mdb.createObjectId = require('mongodb').ObjectID;

const removeDocumentCache = (collectionName, doc) => {
    if (doc && doc._id) mdb.clearCacheById(null, collectionName, doc._id);
    return changeDocumentId(collectionName)(doc);
};

// dba init때 1회만 실행됨
// 전체 Mongo Client에 대해 runCommand({enablesharding:DB}) 실행
mdb.enableSharding = () => Promise.all(
    Object.keys(listMongoClients).map(dsn =>
        listMongoClients[dsn].then(db => db.admin().command({
            enablesharding: Config.db
        })).catch(e => {
            if (e.message.indexOf('sharding already enabled') > -1) // 이미 enable 되어있는 경우 무시
                return true;
            if (e.message.indexOf("no such command:") > -1) // MongoS 사용중이 아닌 경우 무시
                return true;
            throw e;
        })
    )
);

// ShardKey 설정
mdb.shardCollection = (collectionName, key) => getMongoClient(collectionName).then(db =>
    db.admin().command({
        shardcollection: `${Config.db}.${collectionName}`,
        key
    }).catch(e => {
        if (e.message.indexOf("no such command:") > -1) // MongoS 사용중이 아닌 경우 무시
            return true;
        throw e;
    })
);

mdb.createIndex = (collectionName, ...args) => mdb.directQuery('createIndex', collectionName, ...args);

mdb.count = (collectionName, ...args) => mdb.directQuery('count', collectionName, ...args);

mdb.find = (collectionName, ...args) => mdb.directQuery('find', collectionName, ...args)
    .then(cursor => cursor.toArray())
    .then(list => list.map(changeDocumentId(collectionName)));

mdb.findOne = (collectionName, ...args) => mdb.directQuery('findOne', collectionName, ...args).then(changeDocumentId(collectionName));

mdb.findOneAndDelete = (collectionName, ...args) => mdb.directQuery('findOneAndDelete', collectionName, ...args).then(r => r.value)
    .then(doc => removeDocumentCache(collectionName, doc));

mdb.findOneAndReplace = (collectionName, ...args) => mdb.directQuery('findOneAndReplace', collectionName, ...args).then(r => r.value)
    .then(doc => removeDocumentCache(collectionName, doc));

mdb.findOneAndUpdate = (collectionName, ...args) => mdb.directQuery('findOneAndUpdate', collectionName, ...args).then(r => r.value)
    .then(doc => removeDocumentCache(collectionName, doc));

/**
 * MDB Direct Query utility
 * @param {string} method
 * @param {string} collectionName
 * @param {...arguments} args
 * @return {Promise}
 */
mdb.directQuery = (method, collectionName, ...args) => {

    return mdb.collection(collectionName).then(collection => collection[method].apply(collection, args));

};

/**
 * findById 데이터를 Redis에 캐싱
 * Atomic이 반드시 필요한 쿼리는 이걸 쓰지 않습니다!!
 * 일반 조회용
 * @param {string} collectionName
 * @param {string} _id
 * @param {Function} [fnCreate]
 * @param {string} [cacheName]
 * @param {number} [lifetime]
 * @return {Promise}
 */
mdb.findByIdCache = (session, collectionName, _id, fnCreate, lifetime = 60, cacheKey = `MdbCache:${collectionName}:${_id}`) => {

    if (session instanceof Session === false) throw new Error('mdb.findByIdCache : Invalid session');

    const Redis = require('kokomo.redis');

    return Redis.get(cacheKey).then(cached =>
        cached ? cached : mdb.findById(session, collectionName, _id, fnCreate).then(doc =>
            doc ? Redis.set(cacheKey, doc, lifetime).then(() => doc) : doc
        )
    );

};

/**
 * Redis 캐시 삭제
 * @param {SESSION} session
 * @param {string} collectionName
 * @param {string} _id
 * @param {string} [cacheKey]
 * @return {Promise}
 */
mdb.clearCacheById = (session, collectionName, _id, cacheKey = `MdbCache:${collectionName}:${_id}`) => {

    if (session && session instanceof Session) { // 세션을 제공 받는 경우에만 세션 삭제처리
        let key = `_mdbs_${collectionName}`;
        let container = session[key] = session[key] || {};
        delete container[_id];
    }

    const Redis = require('kokomo.redis');

    return Redis.del(cacheKey);

};

/**
 * 세션기반 findOne / atomic
 * @param {SESSION} session
 * @param {string} collectionName
 * @param {string} _id
 * @param {Function} fnCreate
 * @return {Promise}
 */
mdb.findById = (session, collectionName, _id, fnCreate) => {

    if (session instanceof Session === false) throw new Error('mdb.findById : Invalid session');

    let key = `_mdbs_${collectionName}`;
    let container = session[key] = session[key] || {};

    // pending
    if (container[_id] instanceof Promise)
        return container[_id];
    // first
    else {

        let sb = session.time(`mdb.findById`, collectionName, _id);
        const timeEnd = subtitle => {
            return result => {
                session.timeEnd(sb, subtitle);
                return result;
            };
        };

        return container[_id] = mdb.findOne(collectionName, { _id })
            .then(r => {

                if (!r && fnCreate)
                    return Promise.resolve(typeof fnCreate === 'function' ? fnCreate() : fnCreate).then(doc =>
                        mdb.findOneAndUpdate(collectionName, { _id }, { $setOnInsert: Object.assign({ _id }, doc) }, { upsert: true, returnOriginal: false })
                            .then(timeEnd('MDB.findOneAndUpdate'))
                    );

                return r;

            })
            .then(timeEnd('MDB.findOne'))
            .catch(e => {
                delete container[_id];
                throw e;
            });
    }

};

/**
 * 세션기반 findOneAndReplace / atomic
 * 변경/생성된 Document 를 반환한다.
 * @param {SESSION} session
 * @param {string} collectionName
 * @param {string} _id
 * @param {Object} doc
 * @param {Object} options returnOriginal=false, upsert=true
 * @return {Promise}
 */
mdb.replaceById = (session, collectionName, _id, doc, options = {}) => {

    if (session instanceof Session === false) throw new Error('mdb.replaceById : Invalid session');

    let key = `_mdbs_${collectionName}`;
    let container = session[key] = session[key] || {};

    let sb = session.time(`mdb.replaceById`, collectionName, _id);
    const timeEnd = subtitle => {
        return result => {
            session.timeEnd(sb, subtitle);
            return result;
        };
    };

    return container[_id] = (container[_id] || Promise.resolve(null)).then(() =>
        mdb.findOneAndReplace(collectionName, { _id }, doc, Object.assign({ returnOriginal: false, upsert: true }, options))
    ).then(r => {
        if (!r) throw new Error(`Replace failure ${collectionName}.${_id}`);
        return r;
    }).then(timeEnd('MDB.findOneAndReplace'));

};

/**
 * 세션기반 findOneAndUpdate / atomic
 * 변경 Document 를 반환한다.
 * @param {SESSION} session
 * @param {string} collectionName
 * @param {string} _id
 * @param {Object} query
 * @param {Object} filter
 * @param {Object} options returnOriginal=false
 * @param {boolean} useVersion default=true
 * @return {Promise}
 */
mdb.updateById = (session, collectionName, _id, query, filter = {}, options = {}, useVersion = true) => {

    if (session instanceof Session === false) throw new Error('mdb.updateById : Invalid session');

    let key = `_mdbs_${collectionName}`;
    let container = session[key] = session[key] || {};

    let sb = session.time(`mdb.updateById`, collectionName, _id);
    const timeEnd = subtitle => {
        return result => {
            session.timeEnd(sb, subtitle, JSON.stringify({
                query, filter, options
            }));
            return result;
        };
    };

    return container[_id] = (container[_id] || Promise.resolve(null)).then(doc => {
        if (useVersion && doc && doc.__v !== undefined) { // document 버전 관리
            filter = filter || {};
            filter.__v = doc.__v;
            query = query || {};
            query.$inc = query.$inc || {};
            query.$inc.__v = 1;
        }
        return mdb.findOneAndUpdate(collectionName, Object.assign({ _id }, filter), query, Object.assign({ returnOriginal: false }, options));
    }).then(r => {
        if (!r) throw new Error(`Not Found Document ${collectionName}.${_id}\nFilter : ${JSON.stringify(filter)}\nQuery : ${JSON.stringify(query)}`);
        return r;
    }).then(timeEnd('MDB.findOneAndUpdate'));

};

/**
 * 세션기반 findOneAndDelete / atomic
 * 삭제된 Document 를 반환한다.
 * @param {SESSION} session
 * @param {string} collectionName
 * @param {string} _id
 * @param {Object} filter
 * @param {Object} options
 * @return {Promise}
 */
mdb.deleteById = (session, collectionName, _id, filter, options) => {

    if (session instanceof Session === false) throw new Error('mdb.deleteById : Invalid session');

    let key = `_mdbs_${collectionName}`;
    let container = session[key] = session[key] || {};

    let sb = session.time(`mdb.deleteById`, collectionName, _id);
    const timeEnd = subtitle => {
        return result => {
            session.timeEnd(sb, subtitle);
            return result;
        };
    };

    return container[_id] = (container[_id] || Promise.resolve(null)).then(() =>
        mdb.findOneAndDelete(collectionName, Object.assign({ _id }, filter), options)
    ).then(r => {
        if (!r) throw new Error(`Not Found Document ${collectionName}.${_id}`);
        delete container[_id];
        return r;
    }).then(timeEnd('MDB.findOneAndDelete'));

};

let documentIdMapper = {};
const changeDocumentId = collection => doc => {
    if (!doc || !documentIdMapper[collection])
        return doc;
    return Object.assign(doc, {
        [documentIdMapper[collection]]: doc._id
    });
};

mdb.setDocumentId = (collection, field) => documentIdMapper[collection] = field;

module.exports = mdb;