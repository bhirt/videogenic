import React from 'react';
import PropTypes from 'prop-types';
import { Button, Modal } from 'react-bootstrap';

import FileList from './FileList';

export default class FilePicker extends React.Component {
    constructor(props) {
        super(props);
        this.state = { listings: [] };
    }

    listingWithPath(path) {

        function pathsEqual(p1,p2) {
            return p1.length==p2.length && p1.every((v,i)=> v === p2[i]);
        }


        return this.state.listings.find( (l) => pathsEqual(l.path,path) );
    }

    buildListingsState(listing) {
        let newListings = [];



        let idx = 0;
        let tmpPath = [];
        let tmpListing = [];
        do {
            tmpListing = this.listingWithPath(tmpPath);

            if (tmpListing) {
                tmpPath.push(listing.path[idx++]);
                newListings.push(tmpListing);
            }
        } while (tmpListing && idx < listing.path.length);

        // add new listing 
        newListings.push( { path: listing.path, items : listing.items } );

        this.setState({ listings : newListings } );
    }

    componentDidMount() {
        let self = this;
        this.props.datasource( null, function(msg) {
            self.buildListingsState(msg);
        });
        
    }

    // <Button> event
    handleSelectCanceled() {
        console.log('select canceled');
        if (this.props.onSelectCanceled) {
            this.props.onSelectCanceled();
        }

    }

    // <FileList> event
    handleFileSelected(path,file) {
        this.props.onFileSelected(path,file);

    }

    // <FileList> event
    handleDirectorySelected(path) {
        let self = this;

        this.props.datasource( path, function(listing) {
            self.buildListingsState(listing);
        });
    }

    render() {
        let self = this;
        let fileList;

        // datasaurce returns data async, it won't be around on the first render and possible later renders as well
        fileList = this.state.listings.map(function(listing) {
            let active = listing == self.state.listings[self.state.listings.length-1] ? true : false;

            // build a unique key for the FileList component
            let key = 'path:' + listing.path.join('/');

            return <FileList active={active} key={key} onFileSelected={self.handleFileSelected.bind(self)} onDirectorySelected={self.handleDirectorySelected.bind(self)} listing={listing} />;
        });

        return (
            <Modal show={true}>
                <Modal.Header>
                    <Modal.Title>Select file</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <div id="fileBrowserContainer">
                        {fileList}
                    </div>
                </Modal.Body>

                <Modal.Footer>
                    <Button onClick={this.handleSelectCanceled.bind(this)} bsStyle="primary">Cancel</Button>
                </Modal.Footer>

            </Modal>
        );
    }
}

FilePicker.propTypes = {
    datasource: PropTypes.func.isRequired,
    onSelectCanceled: PropTypes.func,
    onFileSelected: PropTypes.func.isRequired
};
