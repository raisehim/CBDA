'use strict';
(function (window, define) {
    define(['lib', '/socket.io/socket.io.js', 'render/Render.js'], function (lib, io, Render) {

        var socket = io({
            'sync disconnect on unload': true,
            transports: ['websocket']
        });

        // var $adm = window.$adm;
        var $ = lib.$;
        var AJST = lib.AJST;
        var TplPrepend = lib.TplPrepend;
        var TplAppend = lib.TplAppend;
        var TplReplace = lib.TplReplace;
        var completely = window.completely;

        AJST.option({
            debug: true,
            url: function (id, option) {
                return './template/' + (id.split('-').join('/')) + '.html';
            },
            global: {
                $: $,
                lib: lib
            }
        });

        init();

        function init() {
            return Promise.all([
                TplReplace('#main-navbar', 'main-navbar'),
                TplReplace('#main-container', 'main-container'),
            ]).then(setMainContainer);
        }

        function setMainContainer() {

            var pv = completely($('#inputMessage')[0]);
            $(pv.hint).css({ 'background-color': 'transparent' });
            // $(pv.input).css({'background-color':'transparent'}).addClass('form-control');

            pv.setText($adm.getSessionStorage('chatdmin-last-command') || '');

            pv.onChange = function (text) {

                pv.repaint();
                request(text, 'suggest');

            };

            $(pv.input).on('focus', function (event) { $(pv.dropDown).show(); pv.onChange(pv.getText()); });
            $(pv.input).on('blur', function (event) { $(pv.dropDown).hide(); });

            $(pv.input).on('keydown', function (event) {

                if (event.which != 13) return true;

                let $this = $(this);
                let message = $this.val().trim();

                request(message);

                $this.val('');

                $this.change();

                $adm.setSessionStorage('chatdmin-last-command', message);

            });

            pv.input.focus();

            socket.on('push', onServerPush);

            function request(message = '', type = 'request', who = 'my') {

                let reqMessage = {
                    id: lib.makeUID(`${type}-`),
                    who: who,
                    type: type,
                    message
                };

                //console.log('request', reqMessage);

                if (type == 'request')
                    return TplPrepend(`#main-messages`, 'main-request', reqMessage).then(() => {

                        socket.once(reqMessage.id, resMessage => {

                            //console.log('resMessage', resMessage);

                            socket.removeAllListeners(reqMessage.id);

                            Render.doRender($adm(`#${resMessage.id} .response:first`).empty(), reqMessage, resMessage, socket);

                        });

                        socket.emit('request', reqMessage);

                    });
                else if (type == 'suggest') {
                    socket.once(reqMessage.id, onSuggest);
                    socket.emit('request', reqMessage);
                }

            }

            function onSuggest(resMessage) {

                socket.removeAllListeners(`${resMessage.id}`);

                let text = pv.getText();
                let arr = text.split(/\s+/);

                pv.startFrom = (text && text[text.length - 1]) === ' ' ? text.length :
                    arr.length > 1 ? arr.slice(0, arr.length - 1).join(' ').length + 1 : 0;

                pv.options = (resMessage.result || []).map(s => String(s).trim() + ' ');

                //console.log(pv.startFrom, pv.options, arr);

                pv.repaint();

            }

            function onServerPush(resMessage) {

                alert(resMessage);

            }

        }

    });

})(this, this.define);