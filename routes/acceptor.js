'use strict';


module.exports.api = function (req, res, next) {
    req.setEncoding('utf8');

    res.set({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': 0,
    });

    if (typeof req.session.API !== 'string' || typeof req.body.type !== 'number')
        return next(new Error('NOT_IMPLEMENTED'));

    let method;

    try { // NOT_IMPLEMENTED
        const path = pdu.getRouterPath(req.body.type);
        method = require(path)[req.session.API];
    } catch (e) { return next(new Error('NOT_IMPLEMENTED')); }

    try {
        return method.call(req.session, req.body)
            .then(result => pdu.getResponseData(req.session.API, result))
            .then(result => {
                let RTN = result;
                res._data = RTN;
                res.send(RTN);
                next();
            }).catch(next); // router/error 에서 오류 일괄 처리
    } catch (e) {
        return next(e); // router/error 에서 오류 일괄 처리
    }

};

module.exports.bin = function (req, res, next) {

    res.set({
        'Content-Type': 'application/octet-stream',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': 0,
    });

    if (!req.accepts('application/octet-stream'))
        return next(UTIL.net.HTTP.DO_NOT_USE);

    let promise;

    try {

        switch (req.params.mode) {
            case "save":
            case "write":
                promise = require('playerDungeon/route')['PDG_SAVE'].call(req.session, req.params.kId, req.params.heroIds, req.body);
                break;
            case "read":
            case "load":
                promise = require('playerDungeon/route')['PDG_GET_BIN'].call(req.session, req.params.kId);
                break;
        }

    } catch (e) {
        return next(e);
    }

    if (!promise) {
        return next(new Error('NOT_IMPLEMENTED'));
    }

    promise.then(result => {
        res.send(result);
        next();
    }).catch(next);

};

/**
 * KokomoError / 정상 처리
 * err.errorInfo가 존재하는 경우 KokomoError
 * 그외에는 모두 unhandledError 상세 리포팅.
 */
module.exports.error = (err, req, res, next) => {

    if (!err || !err.errorInfo) return next(err);

    let response = {
        type: -req.body["type"],
        is: require("pdu.enum").CRUD.CRUD_FAIL,
        error_info: err.errorInfo
    };

    res.send(response).end();
};
