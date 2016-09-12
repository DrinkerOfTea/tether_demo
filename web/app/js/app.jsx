//Access your JavaScript here!!!

import React from 'react';
import ReactDOM from 'react-dom';
import TetherApp from './tethering/TetherApp';
import Homepage from './tethering/Homepage';
import TetherSender from './tethering/TetherSender';
import TetherReceiver from './tethering/TetherReceiver';
import PageNotFound from './tethering/PageNotFound';
import injectTapEventPlugin from 'react-tap-event-plugin';
import { Router, Route, IndexRoute, Link, hashHistory } from 'react-router';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import {indigo500} from 'material-ui/styles/colors';

// Needed for onTouchTap
injectTapEventPlugin();

/**
 * Theme styling for the app
 */
const muiTheme = getMuiTheme({
    palette: {
        primary1Color: indigo500
    }
});

ReactDOM.render(
    <MuiThemeProvider muiTheme={muiTheme}>
        <Router history={hashHistory} >
            <Route path="/" component={TetherApp} >
                <IndexRoute component={Homepage} />
                <Route path="send" component={TetherSender} />
                <Route path="receive" component={TetherReceiver} />
                <Route path="*" component={PageNotFound} />
            </Route>
        </Router>
    </MuiThemeProvider>,
    document.getElementById("app")
);