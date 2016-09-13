/**
 * React component for sending messages to the tethering server
 */
import React from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';

const RECEIVE_URL = "ws://localhost:5001";

class TetherReceiver extends React.Component {

    constructor(props, context) {
        super(props, context);

        this.state = {
            status: "Waiting",
            sessionName: "",
            lastMessage: "",
            errorMessage: ""
        };
    }

    sessionChanged(event) {
        this.setState({ sessionName: event.target.value });
    }

    render() {

        let messageDiv = this.state.lastMessage.length > 0 ?
            <p><strong>Last message: </strong>{this.state.lastMessage}</p> :
            null;

        let errorDiv = this.state.errorMessage.length > 0 ?
            <p><strong>Error: </strong>{this.state.errorMessage}</p> :
            null;

        return (
            <div>
                <h1>Receive tether messages</h1>

                <div className="send-form" style={{ marginBottom: 30 }}>
                    <TextField
                        style={{ width: 500 }}
                        hintText="Enter a session name"
                        floatingLabelText="Session name"
                        onChange={this.sessionChanged.bind(this)}
                    />
                </div>

                <RaisedButton disabled={this.state.sessionName.length === 0 && this.state.status === "Waiting"}
                              label="Tether to session"
                              primary={true}
                              style={{ marginBottom: 40}}
                              onTouchTap={this.tether.bind(this)}
                />

                <br />

                <p><strong>Status:</strong> {this.state.status}...</p>

                <br />
                {messageDiv}
                {errorDiv}

            </div>
        );
    }

    tether(sessionName) {
        this.setState({
            status:"Connecting"
        });

        this.websocket = new WebSocket(RECEIVE_URL);

        this.websocket.onopen = this.registerToSession.bind(this);
        this.websocket.onerror = this.websocketError.bind(this);
        this.websocket.onmessage = this.receiveMessage.bind(this);
    }

    registerToSession() {

        this.setState({
            status: "Connected"
        })

        // Send a message to connect to the session:
        let connectMessage = {
            "openSession" : this.state.sessionName
        }

        this.websocket.send(JSON.stringify(connectMessage));
    }

    websocketError(event) {
        this.setState( {
            errorMsg: "Error connecting to web socket - see console",
            status: "Aborted"
        } )
    }

    receiveMessage(event) {

        console.log("Received message", event);

        let receivedMsg = JSON.parse(event.data);

        if(!receivedMsg.messageType) {
            this.setState({
                errorMsg: "Received an unknown message format",
                status: "Aborted"
            });
            return;
        }

        if(receivedMsg.messageType === "ack") {
            this.setState({
                status: "Listening to " + this.state.sessionName
            });
        }
        else if(receivedMsg.messageType === "tetherMessage") {
            this.setState({
                lastMessage: receivedMsg.message
            });
        }
        else {
            this.setState({
                status: "Unknown message received"
            })
        }
    }
}

export default TetherReceiver;