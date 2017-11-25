import React from 'react';
import PropTypes from 'prop-types';

import { Tooltip, OverlayTrigger, Button } from 'react-bootstrap';

import clamp from 'lodash/clamp';

import Slider from 'rc-slider';
import './rc-slider.global.css';
import styles from './EDLSlider.less';

const Range = Slider.createSliderWithTooltip(Slider.Range);

import EDL from '../../common/model/EDL';

const saveRangesFromEDL = require('../../common/utils').saveRangesFromEDL;

const sec2ts = require('../../common/utils/sec2ts');

let red = { backgroundColor: 'red' };
let rail = { backgroundColor: 'gray' };

export default class EDLSlider extends React.Component {

    static propTypes = {
        onPreviewRequest: PropTypes.func,
        onRangeStartWillUpdate: PropTypes.func,
        onRangeEndWillUpdate: PropTypes.func,
        edl: PropTypes.object.isRequired,
        duration: PropTypes.number.isRequired,
    }

    constructor(props) {
        super(props);

        this.prevValues = [];
        this.state = {
            sliderDragging : false,
            previewTs : 0
        };
    }

    onChange(values) {
        //console.log('values:',values);
        let idx = 0;

        let changeIndex = -1;
        values.find( v => this.prevValues[++changeIndex] != v );
        //console.log('first change index ',changeIndex);
        //console.log('onChange: current values ',values);
        //console.log('onChange: prev values ',this.prevValues);

        this.prevValues = [...values];

        this.props.edl.list().forEach( ed => {
            let newStart = values[idx++]/100;
            let newEnd = values[idx++]/100;

            if (ed.start != newStart) {
                if (this.props.onRangeStartWillUpdate) {
                    this.props.onRangeStartWillUpdate(ed,newStart);
                }

                //console.log(`edId: ${ed.id} ed.start changed from ${ed.start} to ${newStart}`);
                this.props.edl.update(ed.id,newStart,ed.end,ed.action);
            }
            if (ed.end != newEnd) {
                if (this.props.onRangeEndWillUpdate) {
                    this.props.onRangeEndWillUpdate(ed,newEnd);
                }

                //console.log(`edId: ${ed.id} ed.end changed from ${ed.end} to ${newEnd}`);
                this.props.edl.update(ed.id,ed.start,newEnd,ed.action);
            }
        });
    }

    handleTimelineMouseMove(e) {
        if (this.state.sliderDragging) {
            return;
        }

        let rect = this.divElement.getBoundingClientRect();

        let offsetX = e.pageX - rect.x;

//        console.log(`width: ${rect.width}; offsetX ${e.nativeEvent.offsetX}; clientX ${e.clientX}`);
//        console.log(e.nativeEvent);
//        console.log(this.divElement.getBoundingClientRect());


        let pct = clamp( offsetX / rect.width, 0, 1);
        let previewTs = this.props.duration * pct;

        console.log(`width: ${rect.width}; left ${rect.x}; offsetX ${offsetX} pct ${pct} ts ${previewTs}`);
        //console.log('previewTs ',previewTs);

        this.setState( { previewTs } );

        if (this.props.onPreviewRequest) {
            this.props.onPreviewRequest(this.state.previewTs);
        }


        //console.log(this.state);
    }

    handleRemoveED(ed) {
        //console.log('handle remove ed');

        this.props.edl.remove(ed);
    }

    handleAddED(range) {
        //console.log('handle add ed');
        let thirds = (range[1] - range[0]) / 3;

        this.props.edl.add(range[0]+thirds,range[1]-thirds,EDL.CUT);
    }

    handleMergeED(range) {
        let beforeED = null;
        let afterED = null;

        this.props.edl.list().forEach( ed => {
            if (Math.abs(range[0] - ed.end) < 0.01) {
                beforeED = ed;
            }

            if (Math.abs(range[1] - ed.start) < 0.01) {
                afterED = ed;
            }
        });

        if (beforeED && afterED) {
            //console.log(`beforeED ${JSON.stringify(beforeED)} / afterED: ${JSON.stringify(afterED)}`);
            this.props.edl.merge(beforeED,afterED);
        }
        else {
            throw(`failed to find before and after ed for range ${range}`);
        }
    }


    // <Range> event - when slider starts dragging
    handleRangeBeforeChange() {
        console.log('slider start dragging');
        this.setState( { sliderDragging : true } );
    }

    // <Range> event - when slider stops dragging
    handleRangeAfterChange() {
        console.log('slider stopped dragging');
        this.setState( { sliderDragging : false } );
    }

    tipFormatter(value) {
        //console.log('tipFormatter ',value);
        return sec2ts(value/100);
    }

    render() {
        let self = this;

        //console.log('EDLSlider:render()');

        // takes a timestamp and returns a css percent value based on duration and width
        function _ts2pct(ts) {
            //return Math.floor( (ts / self.props.duration) * self.state.width) + 'px';
            return (ts / self.props.duration) * 100 + '%';
        }

        let track = [];
        let values = [];
        this.props.edl.list().forEach( (ed) => {
            track.push(red,rail);
            values.push(Math.floor(ed.start*100),Math.floor(ed.end*100)); 
        });
        track.pop(); // remove extra rail style

        // rc-slider doesn't allow fractional values so we will *= 100 and /= 100
        let max = Math.floor(this.props.duration * 100);


        //console.log(`max: ${max} ; values: ${values}`);
        
        let hashmarks = [];
        let startTs = 0;
        while (startTs < this.props.duration) {
            let className = startTs % 300 ? styles.minuteHash : styles.fiveMinuteHash;
            hashmarks.push(<div key={startTs} className={className} style={ { left : _ts2pct(startTs) }}></div>);
            startTs += 60;
        }

        let buttons = [];

        // delete buttons  for existing ED
        const removeTooltip = (<Tooltip id="removeTooltip">Remove from the EDL</Tooltip>);
        this.props.edl.list().forEach( (ed) => {
            buttons.push(
                <div key={ed.id} style={ { textAlign: 'center', top: '5px',position: 'absolute', left : _ts2pct(ed.start), width : _ts2pct(ed.end-ed.start), backgroundColor: 'transparent' } }>
                    <OverlayTrigger placement="bottom" overlay={removeTooltip}>


                        <Button onClick={this.handleRemoveED.bind(this,ed)} bsSize="xsmall">-</Button>
                    </OverlayTrigger>
                </div>);
        });

        // add buttons  for gaps between ED
        let saves = saveRangesFromEDL(this.props.edl,this.props.duration);
        let idx = 0;
        const addTooltip = (<Tooltip id="removeTooltip">Add a new range between these two</Tooltip>);
        const mergeTooltip = (<Tooltip id="removeTooltip">Merge these two ranges into one</Tooltip>);
        saves.ranges.forEach( r => {
            let key = `${r[0]}:${r[1]}`;
            let dur = r[1] - r[0];

            // don't add button if the gap is smaller than 1 minute.  
            if (dur >=60 ) {
                buttons.push(
                    <div key={key} style={ { textAlign: 'center', top: '5px',position: 'absolute', left : _ts2pct(r[0]), width : _ts2pct(dur), backgroundColor: 'transparent' } }>
                        <OverlayTrigger placement="bottom" overlay={addTooltip}>
                            <Button onClick={this.handleAddED.bind(this,r)} bsSize="xsmall">+</Button>
                        </OverlayTrigger>
                    </div>);
            }
            else if (r[0] >= 60 && r[1] <= this.props.duration - 60) {
                buttons.push(
                    <div key={key} style={ { textAlign: 'center', top: '5px',position: 'absolute', left : _ts2pct(r[0]), width : _ts2pct(dur), backgroundColor: 'transparent' } }>
                        <OverlayTrigger placement="bottom" overlay={mergeTooltip}>
                            <Button onClick={this.handleMergeED.bind(this,r)} bsSize="xsmall">&gt;&lt;</Button>
                        </OverlayTrigger>
                    </div>);
            }
    
            idx++;
        });

        //console.log('EDLSlider:saves',saves);
        //console.log('EDLSlider:values',values);
        //console.log('EDLSlider:edl',this.props.edl);


        let rangeKey = 'range-' + this.props.edl.numED();

        return (
            <div>
                <Range 
                    key={rangeKey}
                    min={0} 
                    max={max} 
                    tipFormatter={ ts => sec2ts(ts/100) }
                    onBeforeChange={this.handleRangeBeforeChange.bind(this)}
                    onAfterChange={this.handleRangeAfterChange.bind(this)}
                    onChange={this.onChange.bind(this)} 
                    //                count={this.props.edl.numED()} 
                    railStyle={rail} 
                    trackStyle={track} 
                    allowCross={false} 
                    defaultValue={[...values]}
                />

                <div  key="timeline" 
                    className={styles.timeline}
                    onMouseMove={this.handleTimelineMouseMove.bind(this)} 
                    ref={ (e) => this.divElement = e}
                >
                    {hashmarks}
                    {buttons}
                </div>
            </div>
        );
    }

}

