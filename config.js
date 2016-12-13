'use strict';

process.chdir(require('path').normalize(__dirname + '/../../'));

const appPath = require('app-module-path');
appPath.addPath('lib');
appPath.addPath('bean');

/*
function scheduleGc() {
    if (!global.gc) return;
    setTimeout(() => { global.gc(); scheduleGc(); }, 30 * 1000); // 30sec
}
scheduleGc();
*/

// 환경 Config 반환
let config = {}; //module.exports = require(`../../env/${process.argv[2]}`);

config.ENV = process.argv[2].toUpperCase();
process.env.NODE_ENV = config.NODE_ENV;