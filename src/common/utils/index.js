const sprintf = require('sprintf-js').sprintf;

exports.sec2ts = require('./sec2ts');

// takes an EDL model, look only at cuts and turn cuts into saves
function saveRangesFromEDL(edl,duration) {
    let cutOnly = [];
    let tmp = [];
    let save = [];
    let current = 0.0;
    let newDuration = 0;

    // only edl of type 0 (cut) are included in this operation
    edl.list().forEach(function(ed) {
        if (ed.action == 0) {
            cutOnly.push([ed.start,ed.end]);
        }
    });

    // invert ranges
    cutOnly.forEach(function(ed) {
        tmp.push([current,ed[0]]);
        current = ed[1];
    });
    tmp.push([current,duration]);

    // remove empty ranges
    tmp.forEach(function(ed) {
        if (ed[0] !== ed[1]) {
            save.push(ed);
            newDuration += ed[1] - ed[0];
        }
    });

    return { duration : newDuration, ranges: save };
}

exports.saveRangesFromEDL = saveRangesFromEDL;

exports.finalSplicePointsFromEDL = function(edl,duration) {
    let saves = saveRangesFromEDL(edl,duration);
    let splices = [];
    let lastSplice = 0;
    let durationAfterCut = duration - edl.cutTime();

    saves.ranges.forEach(function(r) {
        let splice = r[1]-r[0];
        
        if (splice > 0 && r[1] < duration) { 
            lastSplice += splice;

            if (lastSplice <= durationAfterCut - 0.03) {
                splices.push(lastSplice);
            }
        }
    });

    return splices;
};

exports.shortDurationDescription = function(duration) {
    duration = Math.round(duration);

    //    console.log('duration',duration)
    let h = Math.floor(duration/3600);
    let m = Math.floor( (duration - h * 3600)/60 );
    let s = Math.floor( duration - h * 3600 - m * 60 );

    if (h) {
        return sprintf('%02d:%02d:%02d',h,m,s);
    }
    if (m) {
        return sprintf('%02d:%02d',m,s);
    }
    else {
        return sprintf('00:%02d',s);
    }

};

exports.encodeImageToDataURI = function(data, mediaType) {
    if (!data || !mediaType) {
        throw('encodeImageToDataURI :: Error :: Missing some of the required params: data, mediaType ');
    }

    mediaType = (/\//.test(mediaType)) ? mediaType : 'image/' + mediaType;
    let dataBase64 = (Buffer.isBuffer(data)) ? data.toString('base64') : new Buffer(data).toString('base64');
    let dataImgBase64 = 'data:' + mediaType + ';base64,' + dataBase64;

    return dataImgBase64;
};
