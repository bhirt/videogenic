import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

import { ButtonGroup, Button } from 'react-bootstrap';

import { socket, cutVideo } from './react-app';

import FramePreview from './FramePreview';
import EDLSlider from './EDLSlider';
import EDLList from './EDLList';
import FrameSelectDialog from './FrameSelectDialog';
import WorkflowWrapper from './WorkflowWrapper';

import EDL from '../../common/model/EDL';

export default class EDLCutter extends React.Component {
    static propTypes = {
        fileInfo : PropTypes.object.isRequired,
        onTaskStart : PropTypes.func.isRequired,
        onTaskProgress : PropTypes.func.isRequired
    }

    constructor(props) {
        super(props);

        this.state = { 
            revision: 0,
            selectFrame : { ed: null, position: 'start' },
            previewTs: 0,
        };
    }

    // EDL event -- happens when the edl is updated; update edl revision so comonents that depend on edl can re-render
    edlUpdated() {
        console.log(`edl updated, revision ${this.edl.revision}`);
        this.setState( { revision : this.edl.revision } );
    }

    componentWillMount() {
        console.log('la da da da da');

        // create edl from raw data
        this.edl = new EDL();
        this.props.fileInfo.edl.forEach( ed => this.edl.add(ed[0],ed[1],ed[2]) );


        // listen to edl update events
        this.edlUpdatePromise = this.edlUpdated.bind(this);
        this.edl.on('updated',this.edlUpdatePromise);

    }

    componentWillUnmount() {
        console.log('link:didUnmount');

        if (this.edl && this.edlUpdatePromise) {
            console.log('have edl, unsubscribing to edl update event');
            this.edl.off('updated',this.edlUpdatePromise);
        }
    }


    // Window event -- when the windo is resized
    handleWindowResize() {
    }

    // EDLSlider event -- happens when the user hovers over the timeline
    handlePreviewTs(previewTs) {
        this.setState( { previewTs } );
    }

    // EDLSlider event -- happens when the handle currently being dragged changes...
    handleRangeValueWillUpdate(ed,newValue) {
        this.setState( { previewTs : newValue } );
    }

    // EDLList event -- happens when one ef the timestamp links for an ED is clicked
    handleEDTimestampClick(position,ed) {
        console.log(`EDLCutter:handleFrameSelect ${position} ${ed}`);
        this.setState( { selectFrame : { ed: ed, position: position } } );
    }

    // FrameSelectDialog -- happens after the closed button is clicked and the dialog becomes invisible
    handleFrameSelectDialogClosed() {
        console.log('setting select frame ed to null');
        this.setState( { selectFrame : { ed: null, position: 'start' } } );
    }

    // Button event from own component -- happens when the 'Cut Video' button is clicked
    handleCutVideo() {
        let self = this;

        // send event to parent that our task is starting
        self.props.onTaskStart();

        let msg = { edl : this.edl.rawData() };

        cutVideo( msg,function(progress) {
            // send event to parent that our progress has updated
            self.props.onTaskProgress(progress);
        });
    }

    // Button event from own component -- happens when the 'Save EDL' button is clicked
    handleSaveEDL() {
        console.log('save EDL not implemented yet');
    }

    render() {
        return (<div style={ { padding: '0 1em' } }>
            <h1>{this.props.fileInfo.file}</h1>
            <FramePreview 
                ts={this.state.previewTs} />

            <EDLSlider 
                onPreviewRequest={this.handlePreviewTs.bind(this)} 
                onRangeEndWillUpdate={this.handleRangeValueWillUpdate.bind(this)} 
                onRangeStartWillUpdate={this.handleRangeValueWillUpdate.bind(this)} 
                edl={this.edl} 
                duration={this.props.fileInfo.duration} />

            <EDLList 
                revision={this.state.revision} edl={this.edl} duration={this.props.fileInfo.duration} onTimestampClick={this.handleEDTimestampClick.bind(this)}/>

            <FrameSelectDialog 
                revision={this.state.revision}
                edl={this.edl} 
                ed={this.state.selectFrame.ed} 
                socket={socket} 
                position={this.state.selectFrame.position} 
                onDialogDidClose={this.handleFrameSelectDialogClosed.bind(this)}/>

            <div style={ { paddingTop: '2em', textAlign:'center'} }>
                <ButtonGroup>
                    <Button onClick={this.handleSaveEDL.bind(this)}>Save EDL</Button>
                    <Button onClick={this.handleCutVideo.bind(this)}>Cut Video</Button>
                </ButtonGroup>
            </div>
        </div>);
    }
}

// Render an instance of MessageComponent into document.body
ReactDOM.render(
    <WorkflowWrapper component={EDLCutter} />,
    document.getElementById('root')
);
