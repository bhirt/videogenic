const express = require('express');
const path = require('path');
const app = express();
const { spawn } = require('child_process');
const socketRoutes = require('./socket');
const sec2ts = require('../common/utils/sec2ts');

let expressSession = require('express-session');
let memoryStore = require('memorystore')(expressSession);
let ioSession = require('express-socket.io-session');

// create session
let session = expressSession({ 
    store: new memoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
    }),
    //    cookie: { maxAge: 5000 }, // set to small for testing session timeout errors (expects ms)
    resave: false,
    saveUninitialized: true,
    secret: 'mixIIoac0vwYC4'
});


let http = require('http').Server(app);
let sio = require('socket.io')(http);

app.use(session);

// Use shared session middleware for socket.io
// setting autoSave:true
sio.use(ioSession(session, {
    autoSave:true
})); 

sio.on('connection', function(socket){
    console.log('a user connected');

    socket.handshake.session.userdata = { count : 0, session : 'this is my session data' };
    socket.handshake.session.save();

    socket.on('processCuts', function(msg){
        socketRoutes.ioProcessCuts(socket,msg);
    });

    socket.on('splitVideo', function(msg){
        socketRoutes.ioSplitVideo(socket,msg);
    });

    socket.on('frameSelect', function(msg){
        socketRoutes.ioFrameSelect(socket,msg.ts);
    });

    socket.on('saveEDL', function(msg){
        socketRoutes.ioSaveEDL(socket,msg);
    });
        
    socket.on('fileSelected', function(msg){
        console.log('fileselected',msg);
        socketRoutes.ioFileSelected(socket,msg);
    });
        
    socket.on('directoryListing', function(msg){
        socket.handshake.session.userdata.count++;
        console.log(socket.handshake.session.userdata);
        socketRoutes.ioDirectoryListing(socket,msg);
    });
        
    socket.on('disconnect', function(){
        console.log('user disconnected');

        delete socket.handshake.session.userdata;
        socket.handshake.session.save();
    });
        
});

app.set('view engine', 'ejs');
app.use(require('morgan')('dev'));
app.set('views', path.join(__dirname, 'views'));

let env = process.env.NODE_ENV || 'development';
if ('development' == env) {
    app.use(express.static(path.join(__dirname, '..','dist','static')));
}
else {
    app.use(express.static(path.join(__dirname, '..','static')));
}


app.disable('view cache');
app.disable('etag');

app.get('/', function (req, res) {
//    res.render('home', { jsInit: JSON.stringify({}) });
    res.render('bundle', { jsInit: JSON.stringify({}) });
});

/*
app.get('/split', function (req,res) { 
    res.render('split', { jsInit: JSON.stringify({}) });
});

app.get('/edlcutter', function (req,res) { 
    res.render('edlcutter', { jsInit: JSON.stringify({}) });
});

app.get('/blank', function (req, res) {
    res.send('');
});

app.get('/help', function (req, res) {
    res.render('help', { jsInit: JSON.stringify({}) });
});

*/

app.get('/image/:ts', function (req, res) {

    let state = req.session.userdata;

    res.setHeader('Content-Type', 'image/jpeg');


    if (state) {
        let tsFile = state.tsFile;

        let accurate = parseInt(req.query.accurate) ? true : false;
        let ts = parseFloat(req.params.ts) || 0;
        if (ts <0) {
            ts = 0; 
        }
        let ts2;


        let args = [];
        if (accurate) {
            // combined seeking, input seeking close to where we want to go and output seeking to the desired spot
            // much slower than only input seeking, but accurate
            if (ts > 3) {
                ts = sec2ts(ts-3);
                ts2 = sec2ts(3);
            }
            else {
                ts2 = sec2ts(ts);
                ts = sec2ts(0);
            }
            console.log(ts,ts2);
            args = ['-hide_banner','-y',
                '-ss',ts,
                '-i',tsFile,
                '-ss',ts2,
                '-frames:v','1',
                '-an',
                '-s','hd480','-q:v','10','-f','image2pipe','-f','mjpeg','-'];
        }
        else {
            // input seeking only, get's closest keyframe to the desired spot
            args = ['-hide_banner','-y',
                '-ss',ts,
                '-i',tsFile,
                '-frames:v','1',
                '-an',
                '-s','hd480','-q:v','10','-f','image2pipe','-f','mjpeg','-'];
        }

        let child = spawn( 'ffmpeg',args);
        child.stdout.pipe(res);

        child.on('exit', (code, signal) => {
            //console.log('exit', code, signal);
        });
                
        req.on('close', function (err){
            if (child) {
                console.log(`request canceled, killing child; pid: ${child.pid} err: ${err}`);
                child.kill();
            }
            else {
                console.log('child does not exist, but i would have killed it if i could...');
            }

        });
    }
    else {
        res.status(440);
        res.send('session expired');
    }
        
});

http.listen(3000, function(){
    console.log('Example app listening on port 3000!');
});
