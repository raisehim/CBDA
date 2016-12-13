'use strict';

const fs = require('fs');
const log4js = require('log4js');

var CONFIG_TYPES = {
    console: {
        "type": "console",
        "layout": { "type": "colored" }
    },
    dateFile: {
        "type": "dateFile",
        "filename": null,
        "pattern": ".dd.log",
        "alwaysIncludePattern": false,
        "maxLogSize_temp": 4096000,
        "backups": 3,
        "layout": { "type": "colored" },
        "category": null
    },
    /*
    gelf: {
        type: "gelf",
        host: "192.168.1.53",
        port: 12211,
        hostname: "192.168.1.53",
        facility: "kokomo"
    },
    system: {
        type: "gelf",
        host: "192.168.1.53",
        port: 12211,
        hostname: "192.168.1.53",
        facility: "system"
    },
    */
    logLevelFilter: {
        "type": "logLevelFilter",
        "category": "smtp",
        "appender": {
            "type": "smtp",
            "recipients": "alert@kokomogames.co.kr",
            "sender": "alert@kokomogames.co.kr",
            "sendInterval": 5,
            "SMTP": {
                "host": "smtp.office365.com",
                "secure": false,
                "port": 587,
                "auth": {
                    "user": "raisehim@kokomogames.co.kr",
                    "pass": "425_chuck"
                }
            }
        }
    }
};

const LOGROOT = require('path').normalize(process.cwd() + "/log/");
var LOG4JS_CONFIG = {
    depends: {
        appender: "https://github.com/nomiddlename/log4js-node/wiki/Appenders"
    },
    levels: {
        "smtp": "ALL",
        "access": "INFO",
        "console": "INFO"
    },
    appenders: [
    ],
    replaceConsole: true
};
LOG4JS_CONFIG.levels.service = "INFO";
for (var category in LOG4JS_CONFIG.levels) {
    let cfg = null;
    switch (category) {
        case "smtp":
            cfg = Object.assign({}, CONFIG_TYPES.logLevelFilter);
            cfg.category = category;
            //LOG4JS_CONFIG.levels[category] = "DEBUG";
            LOG4JS_CONFIG.appenders.push(cfg);
            break;
        case "access":
            cfg = Object.assign({}, CONFIG_TYPES.dateFile);
            cfg.filename = category + "/" + category;
            cfg.category = category;
            cfg.path = require('path').normalize(LOGROOT + cfg.category);
            LOG4JS_CONFIG.appenders.push(cfg);
            if (!fs.existsSync(cfg.path)) fs.mkdirSync(cfg.path);
            break;
        case "service":
            cfg = Object.assign({}, CONFIG_TYPES.console);
            cfg.category = category;
            LOG4JS_CONFIG.appenders.push(cfg);
            break;
        case "console":
            cfg = Object.assign({}, CONFIG_TYPES.console);
            cfg.category = category;
            LOG4JS_CONFIG.appenders.push(cfg);
            break;
    }
}

log4js.configure(LOG4JS_CONFIG, { cwd: LOGROOT });

module.exports = log4js;