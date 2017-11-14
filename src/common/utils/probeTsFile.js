const { spawn } = require('child_process');

/*
 * async callback
 *
 */
module.exports = function(tsFile,callback) {
    let stdout = '';
    let stderr = '';
    let args = ['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',tsFile];
    let ffmpeg = spawn( 'ffprobe',args);

    ffmpeg.on('exit', (code, signal) => {
        console.log('ffmpeg exited code: ', code, 'signal: ',signal);
        console.log('--stdout--');
        console.log(stdout);
        console.log('--stderr--');
        console.log(stderr);

        if (code == 0) {
            let duration = parseFloat(stdout.trim()); // has \n 

            if (duration > 0) {
                callback(null, { duration : duration } );
            }
            else {
                callback(true,'movie is reporting zero length, cannot process');
            }
        }
        else {
            callback(true,'failed to parse movie info');
        }
    });

    ffmpeg.stdout.on('data', function (data) {
        stdout += data.toString(); 
    });
    ffmpeg.stderr.on('data', function (data) {
        stderr += data.toString(); 
    });

};
