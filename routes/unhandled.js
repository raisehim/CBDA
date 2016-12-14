'use strict';

const httpStatus = require('./_define').http;
module.exports = (err, req, res, next) => {
    res.status(err.status || httpStatus.INTERNAL_SERVER_ERROR);
    res.json({
        message: err.message,
        error: err,//(process.env.NODE_ENV === 'development') ? err : {}
        trace: err.stack
    });
};
