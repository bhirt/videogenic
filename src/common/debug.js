const d = require('debug');
const path = require('path');

const debug = (scope) => {
    return d(scope);
}

module.exports = debug;
