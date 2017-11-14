import React from 'react';
import PropTypes from 'prop-types';

// Create a component named MessageComponent
export default class Test extends React.Component {

    render() {
        return (
            <div> -- {this.props.message} --</div>
        );
    }
}

Test.propTypes = {
    message: PropTypes.string.isRequired
};
