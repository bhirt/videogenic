import React from 'react';
import PropTypes from 'prop-types';
import { Alert, Modal, Button, ProgressBar } from 'react-bootstrap';

export default class ProgressDialog extends React.Component {

    render() {
        let message = null;
        let progressBar = null;
        let button = null;

        let showCloseButton = false;
        let showCancelButton = false;

        // always show progress bar, unless we are done or there is an error
        let showProgressBar = !(this.props.progress.error || this.props.progress.done);

        if (this.props.progress.error) {
            showCloseButton = true;
            message = <Alert bsStyle="danger">
                    We ran into a problem -- {this.props.progress.msg}
            </Alert>;
        }
        else if (this.props.progress.done) {
            showCloseButton = true;

            message = <Alert bsStyle="success">
                   The operation is complete! 
            </Alert>;
        }
        else if (this.props.onProgressCancel) {
            // if there is a cancel button callback, display a cancel button
            showCancelButton = true;
        }

        if (showCloseButton) {
            button = <Button onClick={this.props.onProgressClose} bsStyle="primary">Close</Button>;
        }
        else if (showCancelButton) {
            button = <Button onClick={this.props.onProgressCancel} bsStyle="primary">Cancel</Button>;
        }

        if (showProgressBar) {
            progressBar = <ProgressBar active now={Math.round(this.props.progress.pct*100)} />;
        }

        //console.log('progress dialog render');
        //console.log(this.state);

        return (
            <div className="static-modal">
                <Modal show={this.props.show}>
                    <Modal.Header>
                        <Modal.Title>{this.props.title}</Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        {message}
                        {progressBar}
                    </Modal.Body>

                    <Modal.Footer>
                        {button}
                    </Modal.Footer>

                </Modal>
            </div>
        );
    }
}


ProgressDialog.propTypes = {
    title: PropTypes.string.isRequired,
    progress: PropTypes.object.isRequired,
    show: PropTypes.bool.isRequired,
    onProgressClose : PropTypes.func.isRequired,
    onProgressCancel : PropTypes.func
};
