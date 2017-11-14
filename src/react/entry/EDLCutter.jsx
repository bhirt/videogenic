import ReactDOM from 'react-dom';

import WorkflowWrapper from '../components/WorkflowWrapper';
import EDLCutter from '../components/EDLCutter';

ReactDOM.render(
    <WorkflowWrapper component={EDLCutter} />,
    document.getElementById('root')
);
