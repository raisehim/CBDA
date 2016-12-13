# class.helper
NodeJS class.helper module

## Feature
1. ES6 Class private 
1. Singleton pattern

## Requires
```
node >= 6.0.0
```

## Install
```
npm install class.helper
```

## How to use
``` Javascript
const ClassHelper = require('class.helper');
class A extends ClassHelper {

    constructor(session, defaultValue) {

        super();

        this.publicKey = 'public';

        this.private.session = session;
        this.private.defaultValue = defaultValue;
        this.private.currentValue = defaultValue;

    }

    add() {
        this.private.currentValue += 1;
    }

    get value() {
        return this.private.currentValue;
    }

    get userName() {
        const {session} = this.private;
        return session.userName;
    }

}

// express - singleton instance sharing by session container
app.use((req, res, next) => {
    req.session = { // set request session container
        userName: 'Jone'
    }; 
    next();
});

app.use(({session}, res, next) => {

    const oA = A.getInstance(session, 1); // first instance -> create new instance A
    const oB = A.getInstance(session, 1); // same arguments -> oA reference
    const oC = A.getInstance(session, 2); // different arguments -> create new instance A

    console.log(oA.value); // 1
    console.log(oB.value); // 1
    console.log(oC.value); // 2

    oA.add();
    oB.add();
    oC.add();

    console.log(oA.value); // 3
    console.log(oB.value); // 3
    console.log(oB.value); // 3

    console.log(Object.keys(oC)); // [ 'publicKey' ] - invisible "private"

    console.log(oA.userName); // Jone - public getter
    console.log(oA.private.session.userName); // Jone - private access

    console.log(JSON.stringify(oC)); // {"publicKey":"public"} - invisible "private"

    // instances will be removed by GC after request end. Safe from memory leaks.
    next();

});
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
