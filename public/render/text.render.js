'use strict';

define([], () => function () {

    let oRender = this;
    let $here = oRender.$here.empty();
    let resMessage = oRender._initMessage;

    if (resMessage.error) {
        $here.addClass('bg-danger');
        $here.append(
            $('<pre class="bg-danger"/>').text(resMessage.stack || resMessage.error.message || resMessage.error)
        );
    }
    else {
        $here.append(resMessage.result);
    }

});
