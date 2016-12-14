'use strict';

process.on('SIGINT', () => process.exit());

const config = require('./env.js');
const path = require('path');

/*
Promise.all([ // resource initialize
    require('kokomo.mdb').init({ _caller: "KOKOMO.BROKER" }),
    require('res').init()
]).then(serverStart).then(webStart).catch(err => console.error(err));
*/
serverStart();
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
    const logManager = require('logger');
    const bodyParser = require('body-parser');
    const passport = require('passport');
    const app = express();
    // const es = require('kokomo.elasticsearch');

    const acceptor = require('./routes/acceptor');

    if (app.get('env') !== 'production') // production 에서만 동작
        throw new Error(`NODE_ENV(${app.get('env')}) production mode only.`);

    // es.init(config.ELASTICSEARCH); // ElasticSearch initialize

    app.set('trust proxy', true); // ELB 또는 LoadBalancer를 인식한다.
    app.set('port', config.NODE_PORT); // 서비스 포트
    app.set('etag', false); // cache나 식별정보 사용 불가 처리
    // app.set('views', path.join(__dirname, 'views'));
    // app.set('view engine', 'jade');

    app.use(require('serve-static')('public', { index: ["index.html"] }));
    app.use(logManager.connectLogger(logManager.getLogger('access')));
    app.use(require('cookie-parser')());
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());
    /*
    app.use(require('cookie-session')({
        name: 'cbda',
        keys: ["sid"], // 세션키
        secret: "secret", // 비밀키
        cookie: {
            maxAge: 1000 * 60 * 60 // 쿠키 유효기간 1시간
        }
    }));
    */
    // app.use(require('./routes/compress')); // 전문 암호화 / 압축
    // app.use(require('./routes/prepare').setSession); // session 설정
    // app.use(require('./routes/prepare').setNow); // session.now 설정
    app.route('/', (req, res) => res.redirect('/index.html'));
    app.route('/R/:api/').get(acceptor).post(acceptor); // API

    // app.use(require('./routes/prepare').lastBounce); // Last Bounce
    app.use(require('./routes/error')); // Associating Error Handler
    app.use(require('./routes/unhandled')); // Associating Error Handler

    const server = app.listen(app.get('port'), err => {
        err ? console.error(err) : console.log('Express Server Listening on port %s', app.get('port'));
        err ? null : process.emit('express.ready');
    });
    // config.SSL && config.SSL.cert && startHttp2(config.SSL, app); // HTTP2 / SSL enable test
    // config.CHATDMIN && require('chatdmin').init(config.CHATDMIN); // Chatdmin enable

    const io = require('socket.io')(server);
}

// HTTP2 / SSL enable test
function startHttp2({port, key, cert}, app) {
    const spdy = require('spdy');

    spdy.createServer({ key, cert }, app)
        .listen(config.SSL.port, err => err ? console.error(err) : console.log('Express Server Listening on port %s with HTTP/2', config.SSL.port));
}
