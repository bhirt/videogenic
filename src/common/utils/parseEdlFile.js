const fs = require('fs');
const readline = require('readline');
const strsplit = require('strsplit');

module.exports = function(edlFile,callback) {
    let edl = [];

    // catch input error.  
    let input = fs.createReadStream(edlFile);
    input.on('error', function(err){ 
        // if the edl doesn't exist, just return an empty edl list, it's not an error
        if (err.code == 'ENOENT') {
            callback(null,[]);
        }
        else {
            // some other error that's not normal use case
            callback(err,null);
        }
    });

    readline.createInterface({
        input: input,
        terminal: false
    }).on('line', function(line) {
        console.log('Line: ' + line);
        let ed = [];
        strsplit(line, /\s+/).forEach(function(ts)  {
            ed.push(parseFloat(ts));
        });
        edl.push(ed);
        console.log('Split: ', ed);
    }).on('close', function() {
        console.log('AAAAAAAAAAAAAAAAAAAAAA');
        callback(null,edl);
    });

};
