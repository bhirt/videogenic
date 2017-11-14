import React from 'react';
import PropTypes from 'prop-types';

export default class EDLTimeline extends React.Component {


    divForED(ed) {
        let edDuration = ed[1] - ed[0];
        let left = (ed[0] / this.props.duration) * 100;
        let width = (edDuration / this.props.duration) * 100;
        let key = left + ':' + width;
        console.log(`key is ${key}`);

        let style = { 'top': '0px', 
            'height': '100%', 
            'backgroundColor': 'red', 
            'position':'absolute', 
            'left': `${left}%`,
            'width': `${width}%` };
        return <div key={key} style={style}></div>;
    }

    render() {
        let self = this;
        return this.props.edl.length ? (
            <div style={ { backgroundColor: 'pink', height: '10px', position : 'relative' } }>
                {this.props.edl.map(function(ed){
                    return self.divForED(ed);
                })}
            </div>
        ) : (<div></div>);
    }
}

EDLTimeline.propTypes = {
    edl: PropTypes.array.isRequired,
    duration: PropTypes.number.isRequired
};
