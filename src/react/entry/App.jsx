import React from 'react'
import ReactDOM from 'react-dom';
import { BrowserRouter, Route, Switch } from 'react-router-dom'

import Navigation from '../components/Navigation';
import Home from '../components/Home';
import Help from '../components/Help';
import Footer from '../components/Footer';
import SplitWorkflow from '../components/SplitWorkflow';
import CutWorkflow from '../components/CutWorkflow';

ReactDOM.render((
    <BrowserRouter>
        <div>
            <Navigation />
            <Switch>
                <Route exact path="/" component={Home}/>
                <Route path="/split" component={SplitWorkflow}/>
                <Route path="/cut" component={CutWorkflow}/>
                <Route path="/help" component={Help}/>
            </Switch>
            <Footer />
        </div>
    </BrowserRouter>
    ), document.getElementById('root')
);

