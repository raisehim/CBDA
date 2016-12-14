'use strict';

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

function setup() {
    passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    },
        function (email, password, done) {
            // 인증 정보 체크 로직
            if (email === 'test@test.com' && password === 'test') {
                // 로그인 성공시 유저 아이디를 넘겨준다.
                var user = { id: 'user_1' };
                return done(null, user);
            } else {
                return done(null, false, { message: 'Fail to login.' });
            }
        }
    ));
};

module.exports = (req, res, next) => {
    req.setEncoding('utf8');

    res.set({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': 0,
    });

    console.log(req.query, req.body, req.params, req.session);
    console.log(~0, ~1, ~-1, ~-2);
    var jwt = require('jsonwebtoken');
    // var compose = require('composable-middleware');
    var SECRET = 'token_secret';
    var validateJwt = require('express-jwt')({ secret: SECRET });
    function signToken(id) {
        return jwt.sign({ id: id }, SECRET, { expiresInMinutes: EXPIRES });
    }

    if (req.query && req.query.hasOwnProperty('access_token')) {
        req.headers.authorization = 'Bearer ' + req.query.access_token;
    }
    req.user = {
        id: req.user.id,
        name: 'name of ' + req.user.id
    };

    // 토큰 인증 로직
    validateJwt(req, res, next);

    try {
        res.json(req.session);
        return next();
        // new Runner(req, res).then
        /*
        return method.call(req.session, req.body)
            .then(result => pdu.getResponseData(req.session.API, result))
            .then(result => {
                let RTN = result;
                res._data = RTN;
                res.json(RTN);
                next();
            }).catch(next); // router/error 에서 오류 일괄 처리
            */
    } catch (e) {
        res.json({ AA: 1 });
        return next(e); // router/error 에서 오류 일괄 처리
    }
};

class Runner {
    constructor(req, res) {
    }
}

// Pontoon Localization
/*
      .use(function(req, res, next) {
        var decoded = jwt.verify(req.headers.authorization, SECRET);
        console.log(decoded) // '{id: 'user_id'}'
        req.user = decode;
      })
      // Attach user to request
      .use(function(req, res, next) {
        req.user = {
          id: req.user.id,
          name: 'name of ' + req.user.id
        };
        next();
      });
      */