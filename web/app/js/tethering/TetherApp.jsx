/**
 * Tethering demo app shell page with toolbar contents put in by React Router
 */

import React from 'react';
import AppBar from 'material-ui/AppBar';
import FlatButton from 'material-ui/FlatButton';
import IconButton from 'material-ui/IconButton';
import { Link } from 'react-router';
import Home from 'material-ui/svg-icons/action/home';

class TetherApp extends React.Component {

    constructor(props, context) {
        super(props, context);

        this.state = {};
    }

    render() {

        const buttonStyle = {
            color: this.context.muiTheme.palette.alternateTextColor
        };

        const buttonPanel = <span style={{
                                display: "flex",
                                alignItems: "center",
                                marginTop: 5
                            }}>
                                <FlatButton label="Send messages"
                                            style={buttonStyle}
                                            containerElement={ <Link to="/send" /> }
                                />
                                <FlatButton label="Receive messages"
                                            style={buttonStyle}
                                            containerElement={ <Link to="/receive" /> }/>
                            </span>;

        return (
            <div>
                <AppBar title="Tethering demo"
                        iconElementLeft={<IconButton containerElement={ <Link to="/" /> }><Home /></IconButton>}
                        iconElementRight={buttonPanel}
                        />
                {this.props.children}
            </div>
        );
    }
}

TetherApp.contextTypes = {
    muiTheme: React.PropTypes.object.isRequired,
};

export default TetherApp;