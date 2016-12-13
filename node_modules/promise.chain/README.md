# promise.chain
Javascript promise.chain module

## How to use
```
npm install promise.chain
```

## Reduce Promise depth

### Using Promise
``` Javascript
function asyncProcess() {

    return asyncProcess1().then(result1 => {

        let promise;

        if( result1 )
            promise = asyncProcess2();
        else
            promise = asyncProcess3()
                .then(() => asyncProcess4())
                .then(() => asyncProcess5())
                .then(() => asyncProcess6());

        return promise.then(() => asyncProcessCommon());
        
    }).then(result => {
        // next something..
    }).catch(err => {
        // error handling
    });

}
```

### Using promise.chain
``` Javascript
const PromiseChain = require('promise.chain');

function asyncProcess() {

    const oChain = new PromiseChain();

    oChain.then = () => asyncProcess1();
    oChain.then = result1 => {

        const oSubChain = new PromiseChain();

        if( result1 )
            oSubChain.then = () => asyncProcess2();
        else {
            oSubChain.then = () => asyncProcess3();
            oSubChain.then = () => asyncProcess4();
            oSubChain.then = () => asyncProcess5();
            oSubChain.then = () => asyncProcess6();
        }

        oSubChain.then = () => asyncProcessCommon();

        return oSubChain;
        
    };
    oChain.then = result => {
        // next something..
    };
    oChain.catch = err => {
        // error handling
    };

    return oChain;

}
```

# License
MIT License

Copyright (c) 2016 Bum-Seok Hwang

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
