'use strict';

const assert = require('assert');
const ClassHelper = require('../index');
const container = {};

class Human extends ClassHelper {
    constructor(container, name) {
        super();
        this.private.name = name;
    }
    get name() { return this.private.name; }
    set name(name) { this.private.name = name; }
}

describe('Test - Singleton check', () => {

    function doCheck(algorithm) {

        ClassHelper.changeHashAlgorithm(algorithm);

        let oJone = Human.getInstance(container, 'Jone');
        let oSteve = Human.getInstance(container, 'Steve');
        let oSteve2 = Human.getInstance(container, 'Steve');

        it('instance check', () => {
            assert.equal(oJone.name, 'Jone');
            assert.equal(oSteve.name, 'Steve');
            assert.equal(oSteve2.name, 'Steve');
        });

        it('instance reference check', () => {
            assert.equal(oSteve.name, oSteve2.name);
            oSteve2.name = 'Jack';
            assert.equal(oSteve.name, 'Jack');
            oSteve.name = 'Steve';
            assert.equal(oSteve2.name, 'Steve');
        });
    }

    describe('MD5', () => doCheck('md5'));
    describe('xxHash - 32bit', () => doCheck('xxhash32'));
    describe('xxHash - 64bit', () => doCheck('xxhash64'));

});

describe('Benchmark - Singleton arguments key generation', () => {

    function doLoop(algorithm, done) {

        ClassHelper.changeHashAlgorithm(algorithm);

        for (let i = 0; i < 10000; i++) {
            let oJone = Human.getInstance(container, 'Jone');
            assert.equal(oJone.name, 'Jone');
        }

        done();

    }

    it('MD5', done => doLoop('md5', done));
    it('xxHash - 32bit', done => doLoop('xxhash32', done));
    it('xxHash - 64bit', done => doLoop('xxhash64', done));

});