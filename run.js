'use strict';

process.on('SIGINT', () => process.exit());

const config = require('./lib/config');
const path = require('path');

Promise.all([ // resource initialize
    require('kokomo.mdb').init({ _caller: "KOKOMO.BROKER" }),
    require('res').init()
]).then(serverStart).then(webStart).catch(err => console.error(err));

// Kokomo Website
function webStart() {

    const express = require('express');
    const app = express();
    const favicon = require('serve-favicon');
    const port = 9002;

    app.set('trust proxy', true);
    app.use(favicon(__dirname + '/public/images/favicon.ico'));
    app.route('/', (req, res) => res.redirect('/index.html'));
    app.route('/health.html').get((req, res) => res.send('OK').end());
    app.use(express.static(path.join(__dirname, 'public')));
    app.listen(port, err => err ? console.error(err) : console.log('www.kokomogames.co.kr Listening on port %s', port));

}

// Game Server
function serverStart() {

    const express = require('express');
    const logManager = require('kokomo.logger');
    const app = express();
    const es = require('kokomo.elasticsearch');

    const apm = require('./routes/apm');
    const ops_pdu = require('./routes/pdu');
    const ops = require('./routes/opsadm');
    
    if (app.get('env') !== 'production') // production 에서만 동작
        throw new Error(`NODE_ENV(${app.get('env')}) production mode only.`);

    es.init(config.ELASTICSEARCH); // ElasticSearch initialize

    app.set('trust proxy', true); // ELB 또는 LoadBalancer를 인식한다.
    app.set('port', config.NODE_PORT); // 서비스 포트
    app.set('etag', false); // cache나 식별정보 사용 불가 처리

    app.route(['/', '/health.html']).get(function (req, res) { res.send('OK').end(); }); // LB health check

    app.use(logManager.connectLogger(logManager.getLogger('access')));
    app.use(require('./routes/compress')); // 전문 암호화 / 압축
    app.use(require('./routes/prepare').setSession); // session 설정
    app.use(require('./routes/prepare').setNow); // session.now 설정

    app.route('/overlord').get(apm.api).post(apm.api); // API
    app.route('/overlord_bin/:mode/:kId/:heroIds').get(apm.bin).post(apm.bin); // cookie
    app.route('/ops/:ops/:rn/:fname').get(ops.ops).post(ops.ops);
    app.route('/items/:ops/:fname').get(ops.items).post(ops.items);
    app.route('/pdu').get(ops_pdu.pdu).post(ops_pdu.pdu);

    app.use(require('./routes/prepare').lastBounce); // Last Bounce
    app.use(apm.error); // KokomoError Handler
    app.use(require('./routes/unhandledError')); // Associating Error Handler

    app.listen(app.get('port'), err => {
        err ? console.error(err) : console.log('Express Server Listening on port %s', app.get('port'));
        err ? null : process.emit('express.ready');
    });

    config.SSL && config.SSL.cert && startHttp2(config.SSL, app); // HTTP2 / SSL enable test

    config.CHATDMIN && require('chatdmin').init(config.CHATDMIN); // Chatdmin enable

}

// HTTP2 / SSL enable test
function startHttp2({port, key, cert}, app) {
    const spdy = require('spdy');

    spdy.createServer({ key, cert }, app)
        .listen(config.SSL.port, err => err ? console.error(err) : console.log('Express Server Listening on port %s with HTTP/2', config.SSL.port));
}
