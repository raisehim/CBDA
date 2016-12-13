'use strict';

let conf = module.exports = {};

conf.SITE = 'LOCAL';
conf.isLocal = true;
conf.isDev = true;
conf.isLive = false;

const HOST = '192.168.1.25';
const PWD = '#justgame#123';

conf.ROOT = require('path').normalize(__dirname + '/../');

conf.HOST_IP = (() => {
    var nics = require("os").networkInterfaces(), ip4s = [];
    Object.keys(nics).forEach(function (o) {
        nics[o].forEach(function (elm) {
            if (elm.family == 'IPv4' && !elm.internal) ip4s.push(elm.address);
        });
    });
    return ip4s[0];
})();
conf.KOKOMO_ENV = process.argv[2];
conf.NODE_ENV = 'production';
conf.NODE_PORT = 9001;
conf.LOGROOT = null;

// Overlord Secret Key
conf.secret = 'd4c71e198323d76bb096d55e7bb52821';

conf.SSL = {
    port: 443, // HTTPS
    key: undefined, // disable
    cert: undefined // disable
};

// lib/chatdmin
conf.CHATDMIN = {};
conf.CHATDMIN.port = 9900;
conf.CHATDMIN.pubClient = {};
conf.CHATDMIN.pubClient.host = HOST;
conf.CHATDMIN.pubClient.port = 6379;
conf.CHATDMIN.pubClient.password = PWD;
conf.CHATDMIN.subClient = {};
conf.CHATDMIN.subClient.host = HOST;
conf.CHATDMIN.subClient.port = 6379;
conf.CHATDMIN.subClient.password = PWD;

// lib/statics
conf.STAT = {};
conf.STAT.host = HOST;
conf.STAT.port = 12221;

// lib/kokomo.redis
conf.REDIS = {};

// Default Redis set
conf.REDIS.default = {
    host: HOST,
    port: 6379,
    password: PWD,
    db: 0
};

// Key Prefix 별로 Redis 를 다르게 연결할 수 있다.
// 미정의된 Key는 conf.Redis.default 로 연결 된다.
// ConnectionPool 은 Host/Port/DB 별로 공유한다.
// host/port/password/db 중 미설정된 부분은 default를 사용한다. 즉 변경이 있는 부분만 셋팅해야 한다.
conf.REDIS.key = {
    //Arena: { db: 1 },
};

// lib/kokomo.mdb
conf.MONGO = {};
conf.MONGO.debug = false;
conf.MONGO.db = 'STEAM';

// Default DB set
conf.MONGO.default = {
    dsn: `mongodb://${HOST}:27017/${conf.MONGO.db}`,
    connection: { user: 'steam', pass: '#justgame#123', auth: { authdb: 'admin' }, server: { poolSize: 5, checkServerIdentity: false } }
};

// Collection 별로 MongoDB 를 다르게 연결할 수 있다.
// 미정의된 Collection은 conf.MONGO.default 로 연결 된다.
// ConnectionPool 은 DSN 별로 공유한다.
conf.MONGO.collection = {
    //Arena: conf.MONGO.default
};

// bean/account/publisher
conf.ACCOUNT = {};
conf.ACCOUNT.nzin = {};
conf.ACCOUNT.nzin.host = 'openapi-zinny.nzincorp.com';
conf.ACCOUNT.nzin.app_id = 'overlord';
conf.ACCOUNT.nzin.app_secret = '4f28a8bbfc9e0489bf287fcea7b716c43c89e068';
conf.ACCOUNT.accountkit = {};
conf.ACCOUNT.accountkit.app_id = '898380876947667';
conf.ACCOUNT.accountkit.app_secret = 'd944eb6fd2d5c12b17a88bae1be53567';
conf.ACCOUNT.facebook = {};
conf.ACCOUNT.facebook.app_id = '898380876947667';
conf.ACCOUNT.facebook.app_secret = 'c358ebac244fc43cb5d5b2f8806886cc';
conf.ACCOUNT.kakaotalk = {};
conf.ACCOUNT.kakaotalk.app_id = 'df45b462a1a899eaae2ae32595a9553e';

// lib/kokomo.elasticsearch
conf.ELASTICSEARCH = {};
conf.ELASTICSEARCH.host = '192.168.1.25';
conf.ELASTICSEARCH.port = 9200;
conf.ELASTICSEARCH.log = 'info';
conf.ELASTICSEARCH.index = 'overlord-local';
conf.ELASTICSEARCH.timelog = true;

// lib/email.report
conf.EMAIL_REPORT = {};
conf.EMAIL_REPORT.from = 'alert@kokomogames.co.kr';
conf.EMAIL_REPORT.to = 'alert@kokomogames.co.kr';
conf.EMAIL_REPORT.kibana = `http://${HOST}:5601/app/kibana#/doc/${conf.ELASTICSEARCH.index}*/`;

// lib/flatBuffer
conf.FBS = {};
conf.FBS.enable = false;
conf.FBS.verbose = false;
conf.FBS.server = {
    port: 9201,
    worker: {
        workers: 5,
        capacity: 200,
        maxConn: 2048,
        host: "localhost",
        port: 9001,
        path: '/overlord'
    },
};
conf.FBS.client = {
    host: "localhost",
    port: 9201
};

// lib/secure
conf.RSA = {};
conf.RSA.private = `-----BEGIN RSA PRIVATE KEY-----
MIICWwIBAAKBgHVSQG3tanrrVBvmxbfWQzaId9o0wXx7EAwXv5IqH6nQH9WX+Q5Y
b1R0QVxBC9gCq3ylxlevi1YPrY3lrEgkjn6v2bmiWmPl5ORpWOzZ/jNojJ/SdtUZ
XLhujWJkyZxef/TZrWb3H7kyJ+mU9XjH9qoIuRo9rUfrvO2r/bca/kXVAgMBAAEC
gYBA/zSasjGPr9iFLLDVTGsoRyq/RQL8x+D4EiAcBiJMnfVFDFD61Zu4GkArsA2z
uqbvA5iC88op/72TI27y+O3IF3mC7sfHbFE17XaeLcQ/yfM3bwaS91xE26yQ3648
y7pqxm5kJ9SHoLLaAZIcCOkuzVIsl4SYxrH8mgbmyp8BcQJBAMuEwTSI+gcDB4dU
3MT9eNv4pGF4pyheyjGM2bc+21lGzzRa8Ys+wrjgjtHCKkbvlO0kMGS/oA/SyOnM
LusQR3sCQQCTkzKjYogMHZwGZOMCvQCBcd/0qMQqea87nC7n0ORRH5sFdVse0qro
qefNsPC8Rh5XOXciG21mHmizKipJx37vAkBnYozzLxI0NanBaa6ss0aOGAUJLs1b
iKuV+EMw/1FWTM49fmVtovgwCoMCs2velR5GSTf8NgwNfbpqajr7Vk25AkEAg6Hj
pDrqMSxkFIv+tV2SyuOhKSE0QNLjjB9G832vefDgHOFOEtNEoV2UJzPxt24v+AuJ
CUI/tbvgFhfBOqgYvwJAOLzbOYqCWh5rgRO8bvDWRPbul6lisbOT0sfUn4qybvqo
v50S+DUtr/fDfwHrl9UlnS/o6iSoCk91wi7evQ6ckA==
-----END RSA PRIVATE KEY-----`;
conf.RSA.public = `-----BEGIN PUBLIC KEY-----
MIGeMA0GCSqGSIb3DQEBAQUAA4GMADCBiAKBgHVSQG3tanrrVBvmxbfWQzaId9o0
wXx7EAwXv5IqH6nQH9WX+Q5Yb1R0QVxBC9gCq3ylxlevi1YPrY3lrEgkjn6v2bmi
WmPl5ORpWOzZ/jNojJ/SdtUZXLhujWJkyZxef/TZrWb3H7kyJ+mU9XjH9qoIuRo9
rUfrvO2r/bca/kXVAgMBAAE=
-----END PUBLIC KEY-----`;
