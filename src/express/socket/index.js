const fs = require('fs');
const { spawn } = require('child_process');
const P2J = require('pipe2jpeg');
const async = require('async');
const replaceExt = require('replace-ext');
const sanitize = require('sanitize-filename');
const pathType = require('path-type');
const pathDirname = require('path-dirname');

const EDL = require('../../common/model/EDL');

const utils = require('../../common/utils');
const encodeImageToDataURI = require('../../common/utils').encodeImageToDataURI;
const saveRangesFromEDL = require('../../common/utils').saveRangesFromEDL;
const probeTsFile = require('../../common/utils/probeTsFile');
const parseEdlFile = require('../../common/utils/parseEdlFile');

// global of media root
let rootDirectory = '/Users/bhirt/Plex';


function cutSection(sectionNumber,edl,duration,state,callback) {
    console.log(edl);
    console.log('cutting section ' + start + ' to ' + stop);
    callback(null,'success');

    // ffmpeg $FFMPEG_QUIET -y -ss $START -i input.ts -t $STOP -c copy -avoid_negative_ts 1 "$CUT"
}

function combineSections(numSections,copyAudio,state,callback) {
    console.log('combining sections');
    callback(null,success);
    // ffmpeg $FFMPEG_QUIET -y -f concat -safe 0 -i cutlist.txt -c:v copy -c:a ac3 -af "aresample=async=1000" output.ts
}

exports.ioTrimVideo = function(socket,edl,duration,state) {

    let steps = [];

    async.serial([steps]);
    
};

exports.ioProcessCuts = function(socket,msg) {
    let state = socket.handshake.session.userdata;

    let edl = new EDL(msg.edl);

    console.log('process cuts');
    console.log(edl);
    console.log(msg);
    console.log(state);
    let saves = saveRangesFromEDL(edl,state.duration);
    console.log(saves);

    let progress = { 
        current : 0, 
        duration : saves.duration * 2,
        eventName : 'trimVideoProgress' };

    let input = state.tsFile;
    let cuts = [];

    let actions = [];
    let partNumber = 0;
    saves.ranges.forEach(function(range) {
        let output = `/tmp/output${partNumber}.ts`;
        let rangeDuration = range[1] - range[0];
        cuts.push(output);
        actions.push( function(callback) {
            cutVideo(socket,undefined,progress,range[0],rangeDuration,input,output,callback); 
        } );
        partNumber++;
    });

    let output = input.replace('.ts',' - Cut.ts');
    actions.push( function(callback) {
        concatVideo(socket,progress,cuts,output,callback); 
    } );

    console.log('async actions');
    console.log(actions);

    async.series(
        actions,
        function(err, results) {
            console.log('ffmpeg completed');
            console.log('--err--');
            console.log(err);
            console.log('--results--');
            console.log(results);
        }
    );
};

exports.ioSaveEDL = function(socket,msg) {
    let state = socket.handshake.session.userdata;

    console.log('msg - ',msg);
    console.log('ioSaveEDL - ',state);

    utils.saveEdlFile(msg.edl,state.edlFile,function(err,results) {
        state.edl = msg.edl;
        socket.handshake.session.save();
    });
};
exports.ioFileSelected =  function(socket,msg) {
    let tsFile = [rootDirectory,...msg.path,msg.file].join('/');

    let state = socket.handshake.session.userdata;
    
    console.log('ioFileSelected - ',state);

    state.tsFile = tsFile;
    state.edlFile = replaceExt(tsFile,'.edl'),
    state.edl = [];
    state.duration = 0;

    console.log('ioFileSelected: ',tsFile);

    fs.stat(tsFile,function(err,stats) {

        console.log(err,stats);
    });

    async.parallel(
        {
            probe : function(callback) {
    console.log(probeTsFile);
                probeTsFile(state.tsFile,callback); 
            },
            edl : function(callback) {
                parseEdlFile(state.edlFile,callback); 
            }
        }, function(err, results) {
            console.log(err);
            console.log(results);

            let jsInit = {
                file     : msg.file,
                path     : msg.path,
                duration : results.probe.duration,
                edl      : results.edl
            };

            console.log('----');
            console.log(jsInit);
            console.log('----');

            if (err) {
                socket.emit('fileInfoError',  { msg : err } );
            }
            else {
                socket.emit('fileInfo', jsInit );

                state.edl = jsInit.edl;
                state.duration = jsInit.duration;
                socket.handshake.session.save();
            }


        });

};

exports.ioFrameSelectBefore = function(socket,referenceTs) {
    // ffmpeg -ss 00:20:10 -i PAW\ Patrol\ \(2013\)\ -\ S01E02\ -\ Pup\ Pup\ Boogie\;\ Pups\ in\ a\ Fog.ts -t 5 -an -f mpegts -r 4 - | ffmpeg -y -i - -vf reverse /tmp/blah-%d.jpg 
}


// interesting read
// https://superuser.com/questions/538112/meaningful-thumbnails-for-a-video-using-ffmpeg
exports.ioFrameSelect =  function ioFrameSelect(socket,referenceTs) {
    let thumbWidth = 200;      // width of thumbnail images, height will scale automatically
    let fps = 8.0;              // generate this many frames per second
    let durationBefore = 4.0;   // generate thumbnails for this amount of time before the reference timestamp
    let durationAfter = 4.0;    // generate thumbnails for this amount of time after the reference timestamp

    let preSeek = 3.0;         // input seek before the start time stamp to try to grab a key frame
    // I came up with this number by using ffprobe on sever inputs to identify key frames.
    // Most of my inputs had keyframes at least every 3 seconds.  However, if you have
    // inputs with keyframes further apart, you might have to increase this number.   
    // Unfortunally, the bigger this number, the slower the frame generation is because
    // output seeks have to decode the streams.
    
    // get the file from the session
    let state = socket.handshake.session.userdata;
    let tsFile = state.tsFile;

    if (!tsFile) {
        socket.emit('frameSelectError', { msg : 'no file is selected' });
        return;
    }

    fs.stat(tsFile,function(err,stats) {

        if (!err) {
            // compute start timestamp -- go back the proper duration before and the preseak
            let startTs = referenceTs - durationBefore;
            if (startTs < 0) {
                startTs = 0.0;
            }

            // compute stop timestamp
            let stopTs = startTs + durationBefore + durationAfter;

            // compute the input seek timestamp
            let inputSeekTs = startTs - preSeek;
            let outputSeekTs = preSeek;

            // if the input seek is before the start of the stream, adjust input/output accordingly
            if (inputSeekTs < 0) {
                outputSeekTs += inputSeekTs;
                inputSeekTs = 0;
            }


            // initialize the pipe context
            let frameTs = startTs;
            let frameCounter = 0;

            // ffmpeg pipe2jpeg event listener for parsing ffmpeg outpot stream
            let p2j = new P2J();
            p2j.on('jpeg', (jpeg) => {
                // Send base64 encoded image to client using socket.io
                socket.emit('frameSelect', { id : ++frameCounter,
                    selected: referenceTs >= (frameTs - 0.5/fps) && referenceTs < (frameTs + 0.5/fps),
                    src : encodeImageToDataURI(jpeg, 'jpeg'),
                    ts : frameTs } );

                frameTs += 1/fps;
            });
                
            //
            // https://trac.ffmpeg.org/ticket/5093 trying itsoffset, but not worknig so good
            // 
            // There is a bug repeort about how input seeking with mpeg/ts isn't accurate
            //
            // input/output seek
            let args = ['-hide_banner','-y',
                //'-hwaccel',
                '-ss',inputSeekTs,
                '-i',tsFile,
                '-ss',outputSeekTs,
                '-frames:v',Math.floor(fps * (durationBefore + durationAfter)),
                '-r',fps,
                '-an',
                //               '-s','hd480',
                '-vf','scale=' + thumbWidth + ':-1',
                '-q:v','10',
                '-f','image2pipe','-f','mjpeg','-'];

            // https://trac.ffmpeg.org/ticket/5093 trying itsoffset, but not worknig so good

            console.log(args.join(' '));

            let ffmpeg = spawn( 'ffmpeg',args);

            ffmpeg.on('error', (error) => {
                console.log(error);
            });

            ffmpeg.on('exit', (code, signal) => {
                console.log('exit', code, signal);
            });
                

            ffmpeg.stdout.pipe(p2j);
        }
        else {
            socket.emit('frameSelectError', { msg : 'no file is selected or selected file no longer is available' });
        }
    });

/*       socket on close??
 *        req.on('close', function (err){
                console.log('request canceled, killing child (pid: ' + ffmpeg.pid + ')');
                child.kill();
        }); */
        
};


/*** file browser ***/
function hiddenFile(file) {
    return file.startsWith('.');
}

function validExtension(file) {
    const extensions = ['.m4v','.edl','.ts','.mkv','.mp4'];
    let matches = 0;


    extensions.forEach(function(ext) {
        if (matches || file.toLowerCase().endsWith(ext)) {
            matches = 1;
        }
    });

    return matches;
}

exports.ioDirectoryListing =  function(socket,msg) {
    
    let path = msg.path ? [rootDirectory, ...msg.path] : [rootDirectory];

    let directory = path.join('/');

    console.log(msg);

    fs.readdir(directory,function(err,files) {
        if (err) {
            socket.emit('directoryListingError', { error : true, msg : `error reading directory ${err}` } );
        }
        else {
            let fullPathFiles = [];

            files.forEach((file) => fullPathFiles.push(directory + '/' + file) );

            async.map(fullPathFiles, fs.stat, function(err, results) {
            // results is now an array of stats for each file
                if (err) {
                    res.send('error on stat files ' + err);
                }
                else {
                    let id = 0;
                    let fileList = [];
                    let idx = 0;
                    results.forEach( function(fsStat) {
                        if (!hiddenFile(files[idx])) {
                            if (fsStat.isDirectory()) {
                                fileList.push( { id : id++, file : files[idx], isDirectory : true } );
                            }
                            else if (fsStat.isFile() && validExtension(files[idx])) {
                                fileList.push( { id : id++, file : files[idx], isDirectory : false } );
                            }
                        }
                        idx++;
                    });

                    // remove the root directory, we don't want this exposed to the client
                    path.shift(); 

                    socket.emit('directoryListing',  { 'column' : msg.column, 'path' : path, files : fileList });
                }
            });
        }
    });
};

// sample output we are trying to match
// frame= 1550 fps=0.0 q=-1.0 size=   70720kB time=00:01:03.72 bitrate=9091.4kbits/s speed= 127x
const ffmpegMatchTimeRegex = /frame=.*fps=.*size=.*time=([0-9:.]+)/;

function ffmpegProgressHandler(socket,progress,data) {
    let found = data.toString().match(ffmpegMatchTimeRegex);

    if (found) {
        console.log(`stderr: ${data}`);
        let timeParts = found[1].split(':');
        let current = parseInt(timeParts[0]) * 3600 + parseInt(timeParts[1]) * 60 + parseFloat(timeParts[2]);
        let pct = (progress.current + current)/progress.duration;
        console.log(timeParts,`current ${current} duration ${progress.duration} pct ${pct}`);

        if (progress.eventName) {
            socket.emit(progress.eventName, { pct : pct } );
        }
    }
    else {
        console.log(`stderr: ${data}`);
    }
} 

function cutVideo(socket,metadata,progress,start,duration,input,output,callback) {
    let stdout = '';
    let stderr = '';

    if (progress.eventName) {
        socket.emit(progress.eventName, { pct : progress.current/progress.duration } );
    }

    // sample output we are trying to match
    // frame= 1550 fps=0.0 q=-1.0 size=   70720kB time=00:01:03.72 bitrate=9091.4kbits/s speed= 127x
    let re = /frame=.*fps=.*size=.*time=([0-9:.]+)/;
    
    let args = ['-hide_banner','-y',
        '-ss',start,
        '-i',input];

    if (duration > 0) {
        args.push('-t',duration);
    }
    args.push( '-c','copy',
        '-avoid_negative_ts',1 );

    if (metadata) {
        Object.keys(metadata).forEach(function(key) {
            console.log(`metadata key ${key} value ${metadata[key]}`);
            args.push('-metadata',`${key}="${metadata[key]}"`);
        });
    }

    // last argument is outputfile
    args.push( output );
    console.log(`ffmpeg ${args.join(' ')}`);


    let ffmpeg = spawn( 'ffmpeg',args);

    ffmpeg.on('error', (error) => {
        console.log(error);
    });

    ffmpeg.on('exit', (code, signal) => {
        if (code == 0) {
            // ffmpeg return 0 when success
            progress.current += duration;
            if (progress.eventName) {
                socket.emit(progress.eventName, { pct : progress.current/progress.duration } );
            }
        }
        console.log('exit', code, signal);
        callback(null,{ stdout: stdout, stderr: stderr });
    });

    ffmpeg.stdout.on('data', (data) => {
        stdout += data;
        console.log(`stdout: ${data}`);
    });

    ffmpeg.stderr.on('data', (data) => {
        stderr += data;
        ffmpegProgressHandler(socket,progress,data);
    });
}

function concatVideo(socket,progress,fileList,output,callback) {
    let args = [];
    let files = fileList.join('|');
    let stderr = '';
    let stdout = '';

    console.log('fileList',fileList);


    // ffmpeg $FFMPEG_QUIET -y -f concat -safe 0 -i concat:input1.ts|input2.ts -c:v copy -c:a ac3 -af "aresample=async=1000" output.ts
    args.push(
        '-y',
        '-f','mpegts',
        '-i',`concat:${files}`,
        '-c:v','copy',
        '-c:a','ac3',
        '-af','aresample=async=1000',
        output);

    console.log(`args: ${args.join(' ')}`);
    
    let ffmpeg = spawn( 'ffmpeg',args);

    ffmpeg.on('error', (error) => {
        console.log(error);
    });

    ffmpeg.on('exit', (code, signal) => {
        console.log('exit', code, signal);
        callback(null,{ great: 'i did great' } );
    });

    ffmpeg.stdout.on('data', (data) => {
        stdout += data;
        console.log(`stdout: ${data}`);
    });


    ffmpeg.stderr.on('data', (data) => {
        stderr += data;
        ffmpegProgressHandler(socket,progress,data);
    });
}

exports.ioSplitVideo = function(socket,msg) {
    console.log('msg');
    console.log(msg);
    console.log('state');
    let state = socket.handshake.session.userdata;

    if (!state) {
        socket.emit('sessionExpired', {} );
    }
    else if (! msg ) {
        socket.emit('splitVideoError', { msg: 'missing message from client'  });
    } else if ( Number.parseFloat(msg.ts) === NaN ) {
        socket.emit('splitVideoError', { msg: 'the timestamp to split at is missing'  });
    }
    else if ( msg.ts <= 0 || msg.ts >= state.duration) {
        socket.emit('splitVideoError', { msg: 'the split location must be greater than 00:00:00 and less than the duration of the video'  });
    } else if (! ( msg.part1 && msg.part2 && msg.part1.filename && msg.part2.filename) ) {
        // make sure we have all the correct arguments
        socket.emit('splitVideoError', { msg: 'the supplied arguments are incomplete or invalid'  });
    }
    else {
        console.log(state);

        let destDir = pathDirname(state.tsFile);
        pathType.dir(destDir).then(isDirectory => {

            if (isDirectory) { 
                let fileName1 = [destDir, msg.part1.filename].join('/');
                let fileName2 = [destDir, msg.part2.filename].join('/');
                fileName1 = replaceExt(fileName1,'.ts'),
                fileName2 = replaceExt(fileName2,'.ts'),

                console.log(fileName1);
                console.log(fileName2);

                if (msg.part1.filename && msg.part1.filename !== sanitize(msg.part1.filename)) {
                    console.log('filename1 not okay');
                    socket.emit('splitVideoError', { msg: `${msg.part1.filename} contains bad characters or is longer than 255 charecters.`});
                }
                else if (msg.part2.filename && msg.part2.filename !== sanitize(msg.part2.filename)) {
                    console.log('filename2 not okay');
                    socket.emit('splitVideoError', { msg: `${msg.part2.filename} contains bad characters or is longer than 255 charecters.`});
                }
                else {
                    let progress = { 
                        current   : 0, 
                        duration  : state.duration,
                        eventName : 'splitVideoProgress' };

                    async.series(
                        [
                            function(callback) {
                                cutVideo(socket,msg.part1.metadata,progress,0,msg.ts,state.tsFile,fileName1,callback); 
                            },
                            function(callback) {
                                cutVideo(socket,msg.part2.metadata,progress,msg.ts,state.duration-msg.ts,state.tsFile,fileName2,callback); 
                            }
                        ],
                        function(err, results) {
                            console.log('ffmpeg completed');
                            console.log('--err--');
                            console.log(err);
                            console.log('--results--');
                            console.log(results);

                            if (err) {
                                console.log('async.series not okay');
                                socket.emit('splitVideoError', { msg: `${results}` });
                            }
                            else {
                                socket.emit('splitVideoComplete', { pct: 1 } );
                            }
                        }
                    );
                }
            }
            else {
                socket.emit('splitVideoError', { msg: 'Could not locate destination directory' });
            }
        });
    }
};
