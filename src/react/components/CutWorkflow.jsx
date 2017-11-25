import React from 'react';

import WorkflowWrapper from './WorkflowWrapper';
import EDLCutter from './EDLCutter';

export default class CutWorkflow extends React.Component {
    render() {
        return <WorkflowWrapper component={EDLCutter} />
    }
}

