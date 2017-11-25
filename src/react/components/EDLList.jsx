import React from 'react';
import PropTypes from 'prop-types';

const sprintf = require('sprintf-js').sprintf;

const finalSplicePointsFromEDL = require('../../common/utils').finalSplicePointsFromEDL;
const utils = require('../../common/utils');
const sec2ts = require('../../common/utils/sec2ts');

import styles from './EDLList.less';

class EDLSpliceInfoItem extends React.Component {

    render() {
        return (
            <div>Splice #{this.props.number}
                <span className={styles.value}>{utils.shortDurationDescription(this.props.slice)}</span>
            </div>);
    }
}
EDLSpliceInfoItem.propTypes = {
    slice: PropTypes.number.isRequired,
    number: PropTypes.number.isRequired,
};

class EDLSpliceInfo extends React.Component {

    render() {
        this.splices = finalSplicePointsFromEDL(this.props.edl,this.props.duration);
        let num = 1;
        return (
            <div className={styles.splices}>
                <h2>Splice Points</h2>
                {this.splices.map( s => <EDLSpliceInfoItem key={num} number={num++} slice={s} /> )}
            </div>
        );
    }
}
EDLSpliceInfo.propTypes = {
    revision: PropTypes.number.isRequired,
    edl: PropTypes.object.isRequired,
    duration: PropTypes.number.isRequired,
};

class EDLEditLink extends React.Component {



    handleStartLinkClicked(ed) {
        console.log('start',ed);
        this.props.onTimestampClick('start',ed);
    }

    handleEndLinkClicked(ed) {
        console.log('end',ed);
        this.props.onTimestampClick('end',ed);
    }

    render() {
        let duration = sprintf('%0.1f min',(this.props.ed.end - this.props.ed.start) / 60.0 );

        return (
            <li key={this.props.ed.id}>{this.props.edl.actionName(this.props.ed)} : 
                <a href="#" onClick={this.handleStartLinkClicked.bind(this,this.props.ed)}>{sec2ts(this.props.ed.start)}</a> - 
                <a href="#" onClick={this.handleEndLinkClicked.bind(this,this.props.ed)}>{sec2ts(this.props.ed.end)}</a> ({duration})  
            </li>
        );
    }
}

EDLEditLink.propTypes = {
    onTimestampClick : PropTypes.func.isRequired,
    ed: PropTypes.object.isRequired,
    edl: PropTypes.object.isRequired
};

class EDLEditLinks extends React.Component {

    render() {
        return (
            <div>
                <h2>EDL</h2>
                <ol>
                    {this.props.edl.list().map( ed => <EDLEditLink onTimestampClick={this.props.onTimestampClick} key={ed.id} edl={this.props.edl} ed={ed} /> )}
                </ol>
            </div>
        );
    }
}
EDLEditLinks.propTypes = {
    onTimestampClick : PropTypes.func.isRequired,
    revision: PropTypes.number.isRequired,
    edl: PropTypes.object.isRequired
};

class EDLLengthInfo extends React.Component {
    render() {
        return (<div className={styles.notes}>
Video length <span className={styles.value}>{utils.shortDurationDescription(this.props.duration)}</span>
            <br />
Cut length <span className={styles.value}>{utils.shortDurationDescription(this.props.cutTime)}</span>
            <br />
Video length after cut <span className={styles.value}>{utils.shortDurationDescription(this.props.duration - this.props.cutTime)}</span>
        </div>);
    }
}
EDLLengthInfo.propTypes = {
    revision: PropTypes.number.isRequired,
    cutTime: PropTypes.number.isRequired,
    duration: PropTypes.number.isRequired,
};

export default class EDLList extends React.Component {

    render() {
        return (
            <div>
                <EDLEditLinks revision={this.props.revision} edl={this.props.edl} onTimestampClick={this.props.onTimestampClick} />
                <hr />
                <EDLSpliceInfo revision={this.props.revision} duration={this.props.duration} edl={this.props.edl} />
                <hr />
                <EDLLengthInfo revision={this.props.revision} duration={this.props.duration} cutTime={this.props.edl.cutTime()} />
            </div>);
    }
}

EDLList.propTypes = {
    onTimestampClick: PropTypes.func.isRequired,
    revision: PropTypes.number.isRequired,
    edl: PropTypes.object.isRequired,
    duration: PropTypes.number.isRequired
};
