/**
 * Render.js
 * Chatdmin Renderer Class for require.js
 */

'use strict';

define(['lib'], lib => {

    Render.doRender = ($here, reqMessage, resMessage, socket) => {
        require(['../render/' + resMessage.renderer + '.render'], function (oRender) {

            if (typeof oRender == 'function')
                new Render({ render: oRender }, reqMessage.id, resMessage, $here, socket);
            else if (typeof oRender == 'object')
                new Render(oRender, reqMessage.id, resMessage, $here, socket);
            else
                throw new Error('Invalid Renderer : ' + resMessage.renderer);

        });
    };

    function Render(clientMethods, id, initMessage, $here, socket) {

        let oRender = this;
        const randomFromTo = (from, to) => Math.floor(Math.random() * (to - from + 1) + from);
        const makeUID = prefix => (prefix || '') + (+new Date) + randomFromTo(0, 9999999999);
        let activeHere = 0;

        oRender._id = id;
        oRender._initMessage = initMessage;
        oRender._socket = socket;
        oRender._args = initMessage.args;
        oRender._commandList = initMessage.commandList;
        oRender._command = initMessage.command;
        oRender._renderer = initMessage.renderer;
        oRender.$here = $here;

        oRender.command = (name, ...args) => {

            let transactionKey = makeUID();

            return new Promise((resolve, reject) => {

                let s = +new Date();

                socket.emit(`${id}.command`, name, transactionKey, ...args);
                socket.once(`${id}.${transactionKey}.resolve`, result => {
                    console.log(`${oRender._command}`, '->', name, '(', ...args, ')', `${+new Date() - s}ms,`, result);
                    socket.removeAllListeners(`${id}.${transactionKey}.resolve`);
                    socket.removeAllListeners(`${id}.${transactionKey}.reject`);
                    resolve(result);
                });
                socket.once(`${id}.${transactionKey}.reject`, err => {
                    console.error(`${oRender._command}`, '->', name, '(', ...args, ')', `${+new Date() - s}ms,`, err);
                    socket.removeAllListeners(`${id}.${transactionKey}.resolve`);
                    socket.removeAllListeners(`${id}.${transactionKey}.reject`);
                    reject(err);
                });

            });

        };

        oRender.newCommand = function (command, args, $parent) {

            let reqMessage = {
                id: lib.makeUID(`request-`),
                who: 'me',
                type: 'request',
                command, args
            };

            let $here = $E('div').appendTo($parent);

            socket.once(reqMessage.id, resMessage => {

                //console.log(resMessage);

                socket.removeAllListeners(reqMessage.id);

                Render.doRender($here, reqMessage, resMessage, socket);

            });

            //console.log(reqMessage);

            socket.emit('request', reqMessage);

        };

        oRender.log = (...args) => {
            $here.prepend(
                $E('pre').addClass('text-info').text(args.join(' '))
            );
        };

        oRender.error = (err, ...args) => {

            let errMsg = typeof err == 'string' ? err : JSON.stringify(err);
            errMsg += ' ' + args.join(' ');

            $here.prepend(
                $E('div').append(
                    $E('button').button().text('X').css({ position: 'absolute', right: 10 }).on('click', function () {
                        $(this).parent().remove();
                    }),
                    $E('pre').addClass('text-danger').text(errMsg)
                )
            );
            return Promise.reject(err);
        };

        oRender.end = (...args) => {
            console.info(`Command session end : ${id}`);
            for (var k in socket._callbacks) { // 남은 이벤트 모두 삭제
                if (k.includes(id))
                    socket.removeAllListeners(k.substr(1));
            }
            socket.removeListener('connect', reconnect);
            socket.emit(`${id}.endServer`, ...args);
            $here.off('remove');
        };

        oRender['new'] = ($here) => { // 사용중인 $here 가 모두 BODY에서 제거되면 연결을 종료한다

            activeHere++;

            $here.on('remove', () => {
                if (--activeHere < 1) oRender.end();
            });

            return Object.assign({}, oRender, { $here });

        };

        oRender.render = () => oRender.command('ready');

        Object.assign(oRender, clientMethods);

        const reconnect = () => {
            console.warn('Reconnecting Command..', initMessage);
            socket.emit('request', initMessage);
        };

        socket.on('connect', reconnect);

        socket.on(`${id}.render`, (name, transactionKey, ...args) => {
            let p = oRender[name].apply(oRender, args);
            (p && typeof p.then === 'function' ? p : Promise.resolve(null))
                .then(result => socket.emit(`${id}.${transactionKey}.resolve`, result))
                .catch(err => socket.emit(`${id}.${transactionKey}.reject`, err));
        });

        socket.once(`${id}.endClient`, oRender.end);

        oRender.new($here);

        oRender.render.apply(oRender, initMessage.args);

        console.info(`Command session start : ${id}`);

    }

    return Render;

});