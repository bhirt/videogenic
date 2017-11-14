const sprintf = require('sprintf-js').sprintf;

// takes a floating point timestamp and converts in into time description (hh:mm:ss.ss)
//
// 128.5 -> "00:02:08.50
module.exports = function sec2ts(sec) {
    let h = Math.floor(sec / 3600);
    let m = Math.floor((sec - h * 3600)/ 60);
    let s = sec - h * 3600 - m * 60;
    let cs = Math.floor((sec % 1) * 100);
    let ts = sprintf('%02d:%02d:%02d.%02d',h,m,s,cs);

    return ts;
};


