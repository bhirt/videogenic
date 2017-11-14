import React from 'react';
import PropTypes from 'prop-types';
import { ButtonGroup, MenuItem, DropdownButton, Button, Modal } from 'react-bootstrap';

const sec2ts = require('../../common/utils/sec2ts');


class FrameSelectImage extends React.Component {
    static propTypes = {
        className : PropTypes.string,
        onFrameClick : PropTypes.func.isRequired,
        img : PropTypes.object.isRequired
    }

    handleOnClick() {
        this.props.onFrameClick(this.props.img);
    }

    render () {
        return ( 
            <div className={this.props.className}>
                <img onClick={this.handleOnClick.bind(this)} src={this.props.img.src} />
            </div> );
    }
}

export default class FrameSelectDialog extends React.Component {

    static propTypes = {
        revision: PropTypes.number.isRequired,
        onDialogDidClose : PropTypes.func.isRequired,
        socket : PropTypes.object.isRequired,
        position : PropTypes.string,
        ed : PropTypes.object,
        edl : PropTypes.object.isRequired
    }

    constructor(props) {
        super(props);

        this.state = { show : false,
            thumbnails : [] };
    }

    componentWillMount() {
        //        console.log('FrameSelectDialog: component will mount');

        this.handleThumbnailReceivedPromise = this.handleThumbnailReceived.bind(this);
        this.props.socket.on('frameSelect', this.handleThumbnailReceivedPromise);
    }

    componentWillUnmount() {
        //        console.log('component will unmount');

        this.props.socket.off('frameSelect', this.handleThumbnailReceived);
        this.handleThumbnailReceived = null;
    }

    // when ed and position props are received, clear existing thumbnails, make the dialog visible and send a request to the 
    // server for thumbnails.  If the dialog is already visible, nothing happens.
    componentWillReceiveProps(nextProps) {
        let ed = nextProps.ed;
        let position = nextProps.position;
        if (ed && position && !this.state.show) {
            //            console.log('willReceiveProps, socket.emit(frameSelect)');

            this.setState( { show: true, thumbnails: [] });

            let ts = position == 'start' ? ed.start : ed.end;

            this.props.socket.emit('frameSelect',{ ts: ts } );

        }
    }

    handleImageClick(img) {
        //        console.log('image clicked');
        //        console.log(img);

        let ed = this.props.ed;
        let start = this.props.position == 'start' ? img.ts : ed.start;
        let end = this.props.position == 'end' ? img.ts : ed.end;

        this.props.edl.update(ed.id,start,end,ed.action);
    }

    handleCloseSelected() {
        this.setState( { show: false } );

        if (this.props.onDialogDidClose) {
            this.props.onDialogDidClose();
        }
    }

    setEdAndPosition(ed,position) {
        console.log(`set ed and position ${ed.id} ${position}`);
    }

    handleNextED() {
    }

    handlePrevED() {
    }

    // Socket.io 'frameSelect' event 
    //   { id : 1, ts : 234.34, src : 'data:image/jpeg;base64Aaeusnhaeou...' } 
    handleThumbnailReceived(img) {
        this.setState( { thumbnails : [...this.state.thumbnails,img] } );
    }

    render() {
        let self = this;

        let content = null;

        
        if (this.props.ed && this.props.position) {
            console.log(`render() numThumbs=${this.state.thumbnails.length}`);

            let dropdownButtonName = '';
            if (this.props.position == 'start') {
                dropdownButtonName = sec2ts(this.props.ed.start) + ' (start)';
            }
            else {
                dropdownButtonName = sec2ts(this.props.ed.end) + ' (end)';
            }

            let menuItems = []; 
            let num = 1;
            this.props.edl.list().forEach( ed => {
                menuItems.push(<MenuItem onClick={ () => self.setEdAndPosition(ed,'start')}>#{num} {sec2ts(ed.start)} (start)</MenuItem>);
                menuItems.push(<MenuItem onClick={ () => self.setEdAndPosition(ed,'end')}>#{num++} {sec2ts(ed.end)} (end)</MenuItem>);
            });
            console.log('modal()');
            let thumbs = this.state.thumbnails.map( img => {
                let edValue = this.props.position == 'start' ? this.props.ed.start : this.props.ed.end;
                let className = Math.abs(edValue - img.ts) < 0.015 ? 'active' : '';

                //                console.log(`value = ${edValue} ; img.ts = ${img.ts} ; diff = ${Math.abs(edValue - img.ts)} ; className=${className}`);
                return <FrameSelectImage key={img.id} selectedTs={this.state.selectedTs} onFrameClick={this.handleImageClick.bind(this)} img={img} className={className} />;
            });
            content = (
                <Modal show={this.state.show} dialogClassName="frameSelectModal">
                    <Modal.Header>
                        <Modal.Title style={ { float: 'right' }} >Select Frame for ED</Modal.Title>
                        <ButtonGroup>
                            <Button onClick={this.handlePrevED.bind(this)}>&lt;</Button>
                            <Button onClick={this.handleNextED.bind(this)}>&gt;</Button>
                            <DropdownButton title={dropdownButtonName} id="bg-nested-dropdown">
                                {menuItems}
                            </DropdownButton>
                        </ButtonGroup>
                    </Modal.Header>
                    <Modal.Body style={ { height : '75vh' } }>
                        <p>Select a frame to make it the new keyframe.   The keyframe is highligted.</p>
                        <div className="frameSelectContainer">
                            {thumbs}
                        </div>
                    </Modal.Body>
                    <Modal.Footer>


                        <Button onClick={this.handleCloseSelected.bind(this)} bsStyle="primary">Close</Button>
                    </Modal.Footer>
                </Modal>);
        }

        return content; 
    }
}

