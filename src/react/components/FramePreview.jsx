import React from 'react';
import PropTypes from 'prop-types';

const sec2ts = require('../../common/utils/sec2ts');
const axios = require('axios');

let EventEmitter = require('events');

let currentRequestId = 0;
let lastReceivedRequestId = 0;

class FramePreviewRequest {

    constructor(ts) {
        this.ts = ts;
        this.requestId = ++currentRequestId;
        this.aborted = false;
        this.cancelToken = null;
        this.thenCalled = false;

    }

    abort() {
        //        console.log(`abort() requestId: ${this.requestId} -- ${this.cancelToken} ${this.aborted}`);
        //        console.log(this.cancelToken);
        if (!this.aborted && this.cancelToken) {
            //            console.log(` ----- ${this.cancelToken.cancel}`);
            
            this.cancelToken.cancel(`cancel requestId : ${this.requestId}`);
        }

        this.aborted = true;
    }
}

class FramePreviewManager extends EventEmitter {
    // takes the html id of the image
    constructor() {
        super();

        // controls how much a ts has to change to request a new image, doesn't need 
        // to match the input.  think of it as the output fps.  If it's set to 1, a new image
        // will only be requested everytime the timestamp changes more than a second
        this.fps = 30; 

        this.urlTemplate = '/image/$1';
        this.currentFrameForImg = undefined;
        this.maxActiveRequests = 10;  // should be bigger than the number of concurrent requests the browser supports 
        this.activeImageRequests = [];
    }

    // returns the active request for the supplied timestamp (if any) or false
    activeRequestForFrame(frame) {
        return this.activeImageRequests.find(function(r) {
            return r.frame == frame; 
        });
    }


    // returns true if there is already an active request for a given timestamp
    isRequestActiveForFrame(frame) {
        return this.activeRequestForFrame(frame) ? true : false;
    }

    // aborts all requests before the supplied request.  
    abortRequestsBeforeRequest(request) {
        //        console.log('abortRequestsBeforeRequest');
        this.activeImageRequests.forEach(function(r) {
            if (r.requestId < request.requestId) {
                r.abort();
            }
        });
    }

    // removes the request from the active requests queue
    removeRequest(request) {
        let index = this.activeImageRequests.indexOf(request);
        if (index > -1) {
            this.activeImageRequests.splice(index,1); 
        }
        else {
            throw('failed to find index for request object');
        }
    }

    abortedIds() {
        let ids = [];
        this.activeImageRequests.forEach( (r) => {
            if (r.aborted) {
                ids.push(r.requestId); 
            } 
        } );
        return ids;
    }

    activeIds() {
        let ids = [];
        this.activeImageRequests.forEach( (r) => {
            if (!r.aborted) {
                ids.push(r.requestId); 
            } 
        } );
        return ids;
    }

    numThenCalled() {
        let num = 0;

        this.activeImageRequests.forEach( (r) => {
            if (r.thenCalled) {
                num++; 
            } 
        } );

        return num;
    }

    numAbortedRequests() {
        let numAborted = 0;

        this.activeImageRequests.forEach( (r) => {
            if (r.aborted) {
                numAborted++; 
            } 
        } );

        return numAborted;
    }

    // requests the frame at the supplied timestamp
    requestFrameAtTimestamp(ts) {
        let self = this;

        // not an exact frame, just an approximation to help prevent 
        // fetching duplicate images with too high of a granularity
        let frame = Math.floor(ts * this.fps);

        //      console.log(ts,frame);

        // don't request something already displayed on the screen :0
        if (this.currentFrameForImg == frame) {
            //          console.log(`ts ${ts} / from ${frame} - already visible on screen`)
            return;
        }

        // don't request something already in the queue
        if (this.isRequestActiveForFrame(frame)) {
            //          console.log(`request already active for ts ${ts} frame ${frame}`)
            return;
        }

        //      console.log(`requesting frame at ${ts}`)

        // if the request queue is full, cancel the most recent request.
        // the abort handler will make sure it's removed from the active requests list
        // 
        // the most recent request is choosen since it will take the longest to complete
        // and most likely hasn't been sent to the server yet.
        let idx = self.activeImageRequests.length;
        while (idx >= self.maxActiveRequests) {
            let request = self.activeImageRequests[--idx];
            request.abort();
        }

        let url = self.urlTemplate.replace('$1',ts);

        let CancelToken = axios.CancelToken;
        let source = CancelToken.source();
        let request = new FramePreviewRequest(ts);
        request.frame = frame;
        request.cancelToken = source;

        self.activeImageRequests.push(request);
        //        console.log(`added active request id=${request.requestId} numRequests=${self.activeImageRequests.length} numAborted=${self.numAbortedRequests()} thenCalled=${self.numThenCalled()} activeIds=${self.activeIds().join(',')} abortedIds=${self.abortedIds().join(',')}`);

        //            mimeType: 'text/plain; charset=x-user-defined',
        axios.get(url, {
            responseType: 'arraybuffer',
            cancelToken: source.token
        })
            .then(function (response) {
                //                console.log(`axios.then() requestId: ${request.requestId}`);
                request.thenCalled = true;
                self.removeRequest(request);

                if (request.requestId > lastReceivedRequestId) {
                    //  in order frame received
                    lastReceivedRequestId = request.requestId;

                    self.abortRequestsBeforeRequest(request);
                    self.currentFrameForImg = request.ts;

                    if (response.data && response.data.byteLength) {
                        let dataURL='data:image/jpeg;base64,' + new Buffer(response.data, 'binary').toString('base64');
                        self.emit('imageReady',dataURL );
                    }
                }
                else {
                    //  out of order frame received
                }
            })
            .catch(function (error) {
                //                console.log(`axios.catch() requestId: ${request.requestId}`);
                self.removeRequest(request);

                //                if (axios.isCancel(error)) {
                //                    console.log('Request canceled', error.message);
                //                }                
                //                console.log('error');
                //                console.log(error.response);
                //                console.log(error);
                //                console.log(`axios failed for requestId: ${request.requestId} ts: ${request.ts}`);
                //                self.removeRequestWithId(request.requestId);
                let textStatus = 'Unknown';
                let errorThrown = 'something';

                if (error.response) {
                    if (error.response.status == 440) {
                        self.emit('sessionExpiredError',{ 'status' : textStatus, 'error' : errorThrown });
                    }

                    else if (textStatus == 'abort') {
                    // almost certainly active image queue was canceled, silently ignore
                    }
                    else { 
                        self.emit('unhandledError',{ 'status' : textStatus, 'error' : errorThrown } );
                    }
                }
                else {
                    //console.log('error missing response property');
                    //console.log(error);
                }
            });
 
    }
}


// Create a component named MessageComponent
export default class FramePreview extends React.Component {

    constructor(props) {
        super(props);
        this.state = { imageURI : 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' };
    }

    componentDidMount() {
        this.listenerImageReady = this.handleImageReady.bind(this);

        this.imageManager = new FramePreviewManager();
        this.imageManager.on('imageReady', this.listenerImageReady);

        this.setState( { imageURI : '/image/' + this.props.ts });
    }

    componentWillUnmount() {
        console.log('componentWillUnmount');

        this.imageManager.removeListener('imageReady',this.listenerImageReady);
        this.listenerImageReady = null;
    }

    componentWillReceiveProps(nextProps) {
        //        this.setState( { imageURI : '/image/' + nextProps.ts });
        this.imageManager.requestFrameAtTimestamp(nextProps.ts);
    }

    handleImageReady(imageURI) {
        this.setState( { imageURI : imageURI });
    }

    render() {
        return (
            <div id="thumbnail-container">
                <img id="thumbnail" src={this.state.imageURI} />
                <div style={ { 'textAlign': 'left', top:0, 'width' : '100%', position: 'absolute'} }> <span id="thumbnail-timestamp">{sec2ts(this.props.ts)}</span></div>
            </div>
        );
    }
}

FramePreview.propTypes = {
    onError: PropTypes.func,
    ts: PropTypes.number.isRequired
};
