import React from 'react';

import { Link } from 'react-router-dom'

export default class Home extends React.Component {

    render() {
        return (
<div style={{ padding: "3em 2em"} }>

<ul>
  <li>
    <Link to="/">Home</Link> -- this page
  </li>
  <li>
    <Link to="/split">Splitter</Link> -- split a video into two parts
  </li>
  <li>
    <Link to="/cut">Cutter</Link> -- load/edit/save edl and create a cut video based on the edl
  </li>
  <li>
    <Link to="/help">Help</Link> -- lots of information about the application, history, roadmaps, etc.
  </li>
</ul>


</div>);
    }
}
