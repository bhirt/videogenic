const fs = require('fs');
const sprintf = require('sprintf-js').sprintf;

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
        wstream.write(sprintf('%0.2f\t%0.2f\t%d\n',ed[0],ed[1],ed[2]));
    });
    wstream.end();
    
};
