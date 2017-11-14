const fs = require('fs');

module.exports = function(edl,filename,callback) {
    console.log(edl,filename);
    let wstream = fs.createWriteStream(filename);
    
    wstream.on('close',function() {
        callback(null,{});
    });

    wstream.on('error',function(err) {
        callback(err,null);
    });

    edl.forEach(function(ed) {
        wstream.write(ed.join('\t') + '\n');
    });
    wstream.end();
    
};
