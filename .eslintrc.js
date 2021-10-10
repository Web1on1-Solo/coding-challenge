module.exports = {
    plugins: ["chatshipper"],
    "env": {
        "browser": true,
        "amd": true,
        "node": true,
        "jest": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": 13,
        "sourceType": "module"
    },
    rules: {
        "chatshipper/logger-warning-not-a-function": "error"
    }
};
