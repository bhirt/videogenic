//
// Controls the workflow shared by Split/EDLCutter (FilePicker -> edit -> edit action -> ProgressDialog) + Error Handling
//
// I came up with this pattern myself, but I've since read something that might be appropriate to try
// 
// https://reactjs.org/docs/higher-order-components.html
//

import React from 'react';
import PropTypes from 'prop-types';

import { requestDirectoryListing, requestFileInfo } from './react-app';
import { Button } from 'react-bootstrap';

import ProgressDialog from './ProgressDialog';
import FilePicker from './FilePicker';

const debug = require('../../common/debug')('react:components:WorkflowWrapper');

export default class WorkflowWrapper extends React.Component {

    static propTypes = {
        component : PropTypes.func.isRequired
    }

    constructor(props) {
        super(props);

        // input references for the form will be stored here
        this.form = {};

        this.state = { loaded: false, file: '', 
            progressInfo : { done: true, error: false, msg: '', pct: 0 },
            showFilePicker : false,
            progressDialogTitle: '',
            showProgressDialog : false };
    }

    handleProgressClose() {
        this.setState( { showProgressDialog: false } );
    }

    handleProgressCancel() {
        this.setState( { showProgressDialog: false } );
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

    // <Child> event -- child must call this when a task requiring the progress bar starts
    handleTaskStart(opts) {
        this.setState( { progressDialogTitle: opts.taskName,
                         showProgressDialog : true } );
    }

    // <Child> event -- child must call this when a task requiring the progress bar completes
    handleTaskProgress(progressInfo) {
        this.setState( { progressInfo : progressInfo } );
    }

    // <FilePicker> event
    //
    // called when the user refuses to pick a file by pressing the cancel button
    //
    handleSelectCanceled() {
        this.setState( 
            {
                showFilePicker : false,
                loaded : false 
            });
    }

    // <FilePicker> event
    handleFileSelected(path,file) {
        debug('split:fileSelected: ',path,file);
        let self = this;

        let fileRequest = { 
            file : file,
            path : Array.isArray(path) ? path : [] };

        requestFileInfo( fileRequest ,function(msg) {
            self.childElement = React.createElement(self.props.component, { 
                fileInfo : msg,
                onTaskStart : self.handleTaskStart.bind(self),
                onTaskProgress: self.handleTaskProgress.bind(self) } );

            // set our state so the child element starts getting rendered
            self.setState( { loaded: true } );
        }); 
    } 

    handleOpenFilePicker() {
        this.setState( 
            {
                showFilePicker : true,
                loaded : false 
            });
    }

    render() {
        let self = this;

        let content = null;
        if (this.state.loaded) {
            content = 
<div>
    <div>
        {this.childElement}
    </div>
    <ProgressDialog 
        title={this.state.progressDialogTitle}
        progress={this.state.progressInfo}
        show={this.state.showProgressDialog} 
        onProgressCancel={ () => self.handleProgressCancel() } 
        onProgressClose={ () => self.handleProgressClose() } 
    />
</div>;
        }
        else if (this.state.showFilePicker) {
            content = <FilePicker datasource={requestDirectoryListing} onSelectCanceled={this.handleSelectCanceled.bind(this)} onFileSelected={this.handleFileSelected.bind(this)} />;
        }
        else {
            content = 
<div style={ { padding: '1em', texAlign: 'center'}}>
    <center>
You must select a file to use this feature
        <br />
        <br />
        <Button onClick={this.handleOpenFilePicker.bind(this)}>Choose File</Button>
    </center>
</div>;
        }

        return (
            <div>
                {content}
            </div>
        );
    }
}

