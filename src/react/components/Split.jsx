import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

import Slider from 'rc-slider';
import './rc-slider.global.css';

import { Button,  FormGroup, FormControl, ControlLabel, HelpBlock } from 'react-bootstrap';

import { sprintf } from 'sprintf-js';

import { splitVideo } from './react-app';
import EDLTimeline from './EDLTimeline';
import FramePreview from './FramePreview';

import styles from './Split.less';

const scanner = require('../../common/utils/filenameScanner');


export default class Split extends React.Component {

    static propTypes = {
        fileInfo : PropTypes.object.isRequired,
        onTaskStart : PropTypes.func.isRequired,
        onTaskProgress : PropTypes.func.isRequired
    }

    constructor(props) {
        super(props);

        // input references for the form will be stored here
        this.form = {};

        this.state = { 
            currentTs: 0, 
            filename1 : '',
            filename2 : ''
        };
    }

    handleSliderChange(newValue) {
        this.setState( { currentTs: newValue } );
    }

    componentDidMount() {
        let self = this;

        let fileInfo = this.props.fileInfo;

        console.log('--fileInfo--');
        //        console.log(path);
        //        console.log(file);
        console.log(fileInfo);

        // create default file names
        let part1 = fileInfo.file.replace('.ts',' - Part 1.ts');
        let part2 = fileInfo.file.replace('.ts',' - Part 2.ts');

        // try to guess metadata from the file name.  Plex uses 'show - (year) - S00E00 - title' for TV file names
        // and for multi part shows, the tilse are joined together with a semicolon.  
        // for example:  'PAW Patrol (2013) - S01E02 - Pup Pup Boogie; Pups in a Fog.ts'
        let metadata = scanner(fileInfo.file);

        // if we have the proper metadata, make smarter filenames
        if (metadata && metadata.title && metadata.show && metadata.year && metadata.season && metadata.episode) {
            let titles = metadata.title.split(';');
            console.log('titles');
            console.log(titles);

            if (titles.length == 2) {
                part1 = sprintf('%s (%s) - S%02dE%02d - %s.ts',metadata.show,metadata.year,metadata.season,metadata.episode,titles[0].trim());
                part2 = sprintf('%s (%s) - S%02dE%02d - %s.ts',metadata.show,metadata.year,metadata.season,metadata.episode,titles[1].trim());
            }
        }

        self.setState( { 
            filename1 : part1,
            filename2 : part2
        } );

    } 


    handleSplitVideo() {
    
        let self = this;

        // send event to parent that our task is starting
        self.props.onTaskStart( { taskName : 'Split Video' } );

        let msg = { 'filename1' : this.state.filename1, 'filename2' : this.state.filename2, 'ts' : self.state.currentTs };
        splitVideo( msg,function(progress) {
            // send event to parent that our progress has updated
            self.props.onTaskProgress(progress);
        });
    }

    handleFilenameChange(inputName) {
        // get the value for the form input refs
        let value = this.form[inputName].value;

        // create a new state object
        let newState = {};
        newState[inputName] = value;

        // Set the new component state
        this.setState( newState );
    }   

    render() {
        let self = this;

        return (<div>
            <h1>{this.props.fileInfo.file}</h1>
            <div>
                <div className={styles.preview}>
                    <FramePreview ts={this.state.currentTs} />
                </div>
                <div className={styles.inputs}>
                    <form>
                        <FormGroup>
                            <ControlLabel>Part 1</ControlLabel>
                            <FormControl
                                type="text"
                                inputRef={ element => this.form.filename1 = element }
                                value={this.state.filename1}
                                placeholder="Enter file name for part 1"
                                onChange={ () => this.handleFilenameChange('filename1') }
                            />
                            <ControlLabel>Part 2</ControlLabel>
                            <FormControl
                                type="text"
                                inputRef={ element => this.form.filename2 = element }
                                value={this.state.filename2}
                                placeholder="Enter file name for part 1"
                                onChange={ () => this.handleFilenameChange('filename2') }
                            />
                            <HelpBlock>Files will be written to the same directory as the original. Using the two supplied names. The EDL from the original file will be split into two EDLs based on the selected time split.</HelpBlock>

                            <Button 
                                onClick={ (m)=> self.handleSplitVideo(m) }
                                bsStyle="primary">
            Split Video
                            </Button>
                        </FormGroup>
                    </form>


                </div>
            </div>
            <div className={styles.timeline}>
                <br />
                <EDLTimeline duration={this.props.fileInfo.duration} edl={this.props.fileInfo.edl} />
                <br />
                <Slider max={Math.floor(this.props.fileInfo.duration * 100)} onChange={ (newValue) => self.handleSliderChange(newValue/100) } />
                <br />
            </div>
        </div>);
    }
}
