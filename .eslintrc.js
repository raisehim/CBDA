module.exports = {
    "env": {
        "es6": true,
        "node": true,
        "browser": true,
        "amd": true
    },
    "extends": "eslint:recommended",
    "globals": {
        "$adm": true,
        "$E": true
    },
    "rules": {
        "indent": [
            2,
            4,
            { "SwitchCase": 1 }
        ],
        "linebreak-style": [
            0,
            "unix"
        ],
        "quotes": [
            0,
            "single"
        ],
        "semi": [
            2,
            "always"
        ],
        "comma-dangle": [
            0,
            "never"
        ],
        "no-empty": [
            0
        ],
    }
};