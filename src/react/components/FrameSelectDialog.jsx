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
        onDialogDidClose : PropTypes.func.isRequired,
        socket : PropTypes.object.isRequired,
        position : PropTypes.string,
        ed : PropTypes.object,
        edl : PropTypes.object.isRequired
    }

    constructor(props) {
        super(props);

        this.state = { show : false,
            ed : null,
            position : null,
            thumbnails : [] };
    }

    componentWillMount() {
        console.log('FrameSelectDialog: component will mount');

        this.handleThumbnailReceivedPromise = this.handleThumbnailReceived.bind(this);
        this.props.socket.on('frameSelect', this.handleThumbnailReceivedPromise);
    }

    componentWillUnmount() {
        console.log('FrameSelectDialog: component will unmount');

        this.props.socket.off('frameSelect', this.handleThumbnailReceived);
        this.handleThumbnailReceived = null;
    }

    // when ed and position props are received, clear existing thumbnails, make the dialog visible and send a request to the 
    // server for thumbnails.  If the dialog is already visible, nothing happens.
    componentWillReceiveProps(nextProps) {
        let ed = nextProps.ed;
        let position = nextProps.position;

        // ignore any props if the dialog is already visible.
        if (this.state.show) {
            return;
        }

        if (ed && position) {
            console.log('FrameSelectDialog: will receive props; request thumbnails');
            this.setState( { show: true } );
            this.setSelectedED(ed,position);
        }
/*        else {
            console.log('FrameSelectDialog: will receive props');
            console.log('FrameSelectDialog: ed',ed);
            console.log('FrameSelectDialog: position',position);
            this.setState( { ed : ed, position : position } );

        } */
    }

    // sets the state for the supplied ED and position. resets the thumbnails to an empty array and 
    // sends a request to the datasource for the relevent thumbnails.
    setSelectedED(ed,position) {
        this.setState( { ed : ed, position: position, thumbnails: [] }, () => { this.requestThumbnails() } );
    }

    // sets the position for the current ed.  resets thumbnails and requests thumbnails from the datasource
    // convience method for setSelectedEd(this.state.ed,position)
    setSelectedPosition(position) {
        this.setSelectedED(this.state.ed,position);
    }

    // requests frames for the selected ed & position
    requestThumbnails() {
        let position = this.state.position;
        let ed = this.state.ed;
        let ts = position == 'start' ? ed.start : ed.end;
        console.log(`request thumbnails ts ${ts}`);
        this.props.socket.emit('frameSelect',{ ts: ts } );
    }

    handleImageClick(img) {
        //        console.log('image clicked');
        //        console.log(img);

        let ed = this.state.ed;
        let start = this.state.position == 'start' ? img.ts : ed.start;
        let end = this.state.position == 'end' ? img.ts : ed.end;
        console.log('imageClick');
        console.log('ed');
        console.log(ed);
        console.log('start');
        console.log(start);
        console.log('end');
        console.log(end);

        this.props.edl.update(ed.id,start,end,ed.action);
    }

    handleCloseSelected() {
        this.setState( { show: false } );

        if (this.props.onDialogDidClose) {
            this.props.onDialogDidClose();
        }
    }

    // MenuItem event -- called when one of the dropdown of menu items 
    // containing the edit timestamp is clicked
    handleMenuEDAndPositionClicked(ed,position) {
        this.setSelectedED(ed,position);
        console.log(`set ed and position ${ed.id} ${position}`);
    }

    handleNextED() {
        let nextEd = this.props.edl.edAfter(this.state.ed);
        if (this.state.position == 'end') {
            if (nextEd) {
                this.setSelectedED(nextEd,'start');
            }
            else {
                console.log('there is no next ed');
            }
        }   
        else {
            this.setSelectedPosition('end');
        }
    }

    handlePrevED() {
        if (this.state.position == 'start') {
            let prevEd = this.props.edl.edBefore(this.state.ed);
            if (prevEd) {
                this.setSelectedED(prevEd,'end');
            }
            else {
                console.log('there is no prev ed');
            }
        }   
        else {
            this.setSelectedPosition('start');
        }
    }

    // Socket.io 'frameSelect' event 
    //   { id : 1, ts : 234.34, src : 'data:image/jpeg;base64Aaeusnhaeou...' } 
    handleThumbnailReceived(img) {
        this.setState( { thumbnails : [...this.state.thumbnails,img] } );
    }

    render() {
        let self = this;

        let content = null;

        
        if (this.state.ed && this.state.position) {
            //console.log(`render() numThumbs=${this.state.thumbnails.length}`);

            let dropdownButtonName = '';
            if (this.state.position == 'start') {
                dropdownButtonName = sec2ts(this.state.ed.start) + ' (start)';
            }
            else {
                dropdownButtonName = sec2ts(this.state.ed.end) + ' (end)';
            }

            let menuItems = []; 
            let num = 1;
            let key = 1;
//            const style = { paddingRight: '1em', float : 'right' };
            const style = {}; //{ float : 'right' };
            this.props.edl.list().forEach( ed => {
                menuItems.push(<MenuItem key={key++} onClick={ () => self.handleMenuEDAndPositionClicked(ed,'start')}>#{num} {sec2ts(ed.start)} <span style={style}>(start of cut)</span></MenuItem>);
                menuItems.push(<MenuItem key={key++} onClick={ () => self.handleMenuEDAndPositionClicked(ed,'end')}>#{num++} {sec2ts(ed.end)} <span style={style}>(end of cut)</span></MenuItem>);
            });
            //console.log('modal()');
            let thumbs = this.state.thumbnails.map( img => {
                let edValue = this.state.position == 'start' ? this.state.ed.start : this.state.ed.end;
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

