'use strict';

const globalContainer = {};
const sInstance = Symbol.for('class.helper instance');
const sPrivate = Symbol.for('class.helper private');

const HashList = {
    'md5': str => require('crypto').createHash('md5').update(str).digest('hex'),
    'xxhash32': str => require('xxhashjs').h32(str, 0xABCD).toString(16),
    'xxhash64': str => require('xxhashjs').h64(str, 0xABCD).toString(16)
};

let HashAlgorithm = HashList.md5; // default

function getHashKey(args) {

    let key = args.join('\n');

    try { key = HashAlgorithm(JSON.stringify(args)); } catch (e) { }

    return key;

}

function getInstance(withoutContainer, container, ...args) {

    let key = getHashKey(args);

    container[sInstance] = container[sInstance] || {};
    container[sInstance][this.name] = container[sInstance][this.name] || {};

    return container[sInstance][this.name][key] = container[sInstance][this.name][key] ||
        (
            withoutContainer ?
                new this(...args) :
                new this(container, ...args)
        );

}

function callInstance(withoutContainer, container, ...args) {
    return (method, ...callArgs) => Promise.resolve(
        getInstance.call(this, withoutContainer, container, ...args)
    ).then(o => {
        if (typeof o[method] !== 'function')
            throw new Error(`class.helper.callInstance : undefined method (${this.name}.${method})`);
        return o[method](...callArgs);
    });
}

function clearInstance(container, ...args) {

    let key = getHashKey(args);

    container[sInstance] = container[sInstance] || {};
    container[sInstance][this.name] = container[sInstance][this.name] || {};

    delete container[sInstance][this.name][key];

    return true;

}

class ClassHelper {

    static getInstance(container, ...args) { return getInstance.call(this, false, container, ...args); }
    static callInstance(container, ...args) { return callInstance.call(this, false, container, ...args); }
    static getInstanceWC(container, ...args) { return getInstance.call(this, true, container || {}, ...args); }
    static callInstanceWC(container, ...args) { return callInstance.call(this, true, container || {}, ...args); }
    static clearInstance(container, ...args) { return clearInstance.call(this, container, ...args); }
    static getInstanceGlobal(...args) { return getInstance.call(this, true, globalContainer, ...args); }
    static callInstanceGlobal(...args) { return callInstance.call(this, true, globalContainer, ...args); }
    get private() { return this[sPrivate] = this[sPrivate] || {}; }
    static changeHashAlgorithm(hash) { HashAlgorithm = HashList[String(hash).toLowerCase()] || HashList.md5; }

}

module.exports = ClassHelper;
