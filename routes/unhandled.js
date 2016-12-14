'use strict';

const httpStatus = require('./_define').http;
module.exports = (err, req, res, next) => {
    res.status(err.status || httpStatus.INTERNAL_SERVER_ERROR);
    res.render('error', {
        message: err.message,
        error: (process.env.NODE_ENV === 'development') ? err : {}
    });
};
