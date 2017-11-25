
import io from 'socket.io-client';

//const socket = io();

console.log('creating socket io object');
export const socket = io('http://localhost:3001');
console.log('socket io object created');

export function requestFileInfo(msg,callback) {
    // listen to the fileInfo event from the server one time
    socket.once('fileInfo', callback);

    // initiate file info request with server
    socket.emit('fileSelected', msg);
}


// wraps the socket.io emit/listen logic and communicates with a single callback that
// includes errors updates, percentage updates and a completion status flag.   Also
// handles turning listeners on and off.
//
// splitInfo  { filename1 : 'name', filename2 : 'name', ts: number }
//
// * input file isn't supplied, it's the file that's stored on the server state
// * paths are not included in the file name (or allowed)
// * ts is the timestamp where the file should be split.
//
export function splitVideo(splitInfo,callback) {
    function _splitVideoProgress(msg) {
        callback( { done: false, error: false, msg: null, pct: msg.pct } );
    }

    function _splitVideoError(msg) {
        callback( { done: true, error: true, msg: msg.msg, pct : null } );
        _splitVideoSocketOff();
    }

    function _splitVideoComplete(msg) {
        callback( { done: true, error: false, msg: null, pct: msg.pct } );
        _splitVideoSocketOff();
    }

    function _splitVideoSocketOff() {
        socket.off('splitVideoProgress', _splitVideoProgress);
        socket.off('splitVideoError', _splitVideoError);
        socket.off('splitVideoComplete', _splitVideoComplete);
    }

    // listen for split video updates from the server
    socket.on('splitVideoProgress', _splitVideoProgress);
    socket.on('splitVideoError', _splitVideoError);
    socket.on('splitVideoComplete', _splitVideoComplete);

    // initiate split video with server
    socket.emit('splitVideo', { 'part1' : { filename : splitInfo.filename1 }, 'part2' : { filename : splitInfo.filename2}, 'ts' : splitInfo.ts } );
}

export function cutVideo(cutInfo,callback) {
    function _cutVideoProgress(msg) {
        console.log('cutVideoProgress');
        callback( { done: false, error: false, msg: null, pct: msg.pct } );
    }

    function _cutVideoError(msg) {
        console.log('cutVideoError');
        callback( { done: true, error: true, msg: msg.msg, pct : null } );
        _cutVideoSocketOff();
    }

    function _cutVideoComplete(msg) {
        console.log('cutVideoComplete');
        callback( { done: true, error: false, msg: null, pct: msg.pct } );
        _cutVideoSocketOff();
    }

    function _cutVideoSocketOff() {
        console.log('cutVideoSocketOff');
        socket.off('cutVideoProgress', _cutVideoProgress);
        socket.off('cutVideoError', _cutVideoError);
        socket.off('cutVideoComplete', _cutVideoComplete);
    }

    // listen for  video updates from the server
    socket.on('cutVideoProgress', _cutVideoProgress);
    socket.on('cutVideoError', _cutVideoError);
    socket.on('cutVideoComplete', _cutVideoComplete);

    // initiate  video with server
    socket.emit('processCuts',cutInfo );
}

export function cancelSplitVideo(callback) {
    socket.emit('cancelSplitVideo', {} );
}

export function requestDirectoryListing(path,callback) {

    function _directoryListing(listing) {
        // server doesn't return data in the same format the FilePicker needs.
        let items = listing.files.map( (f) => {
            return { 'id' : f.id, 'name': f.file, 'isDirectory': f.isDirectory }; 
        } );

        console.log('requestDirectoryListing:directoryListing:listing',listing);
        callback( { path: listing.path, items : items } );
    }

    socket.once('directoryListing', _directoryListing);

    // unused, here for compat with jquery for now
    let msg = { column: 1 }; 
    if (path && path.length) {
        msg.path = path;
    }

    console.log('requestDirectoryListing:requesting',msg);

    socket.emit('directoryListing', msg );
}
