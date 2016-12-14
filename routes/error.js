'use strict';

module.exports = (err, req, res, next) => {
    if (!err || !err.errorInfo) return next(err);
    let response = {
        type: -req.body["type"],
        error_info: err.errorInfo
    };
    res.send(response).end();
};