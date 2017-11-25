require('babel-register')({
    babelrc: false, // dev uses babel-register and hmr, prod doesn't
    presets: [
        'env', // node needs modules
        'stage-1',
        'react'
    ]
});

const app = require('./index.js').default;

app.listen(3000, '0.0.0.0', () => console.log( // eslint-disable-line no-console
    console.log('DEV SERVER: listening on port 3000')
));
