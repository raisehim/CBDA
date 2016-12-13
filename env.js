'use strict';

process.chdir(require('path').normalize(__dirname + '/'));

const appPath = require('app-module-path');
appPath.addPath('config');
appPath.addPath('lib');
appPath.addPath('bean');

/* moment는 시간을 타나, Date는 항시 UTC로 움직임. */
const moment = require('moment-timezone'); // "Asia/Seoul" / "Etc/GMT-7" / "Etc/GMT-9" / "UTC 0"
const timeZone = (moment().utcOffset() != 420) ? "Etc/GMT-7" : moment.tz.guess();
moment.tz.setDefault(timeZone);
Object.defineProperty(process, 'now', {
    get: () => moment(),
    enumerable: false,
    configurable: false
});
const OFFSET = process.now.utcOffset();

let config = module.exports = require(`${OFFSET}`);
config.ENV = OFFSET;
config.TimeZone = timeZone;
process.env.NODE_ENV = config.NODE_ENV;

/*
function scheduleGc() {
    if (!global.gc) return;
    setTimeout(() => { global.gc(); scheduleGc(); }, 30 * 1000); // 30sec
}
scheduleGc();
*/