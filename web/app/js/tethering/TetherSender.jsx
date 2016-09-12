/**
 * React component for sending messages to the tethering server
 */
import React from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import $ from 'jquery';

const SEND_URL = "http://localhost:5000/tether";

class TetherSender extends React.Component {

    constructor(props, context) {
        super(props, context);

        this.state = {
            sessionName: "",
            message: "",
            response: ""
        };
    }

    sessionChanged(event) {
        this.setState({ sessionName: event.target.value });
    }

    messageChanged(event) {
        this.setState({ message: event.target.value });
    }

    render() {

        let response = this.state.response.length > 0 ?
            <p><strong>Response:</strong> {this.state.response}</p>
            : null;

        return (
            <div>
                <h1>Send a tether message</h1>

                <div className="send-form" style={{ marginBottom: 30 }}>
                    <TextField
                        style={{ width: 500 }}
                        hintText="Enter a session name"
                        floatingLabelText="Session name"
                        onChange={this.sessionChanged.bind(this)}
                    />
                    <br />
                    <TextField
                        style={{ width: 500 }}
                        hintText="Enter a message"
                        floatingLabelText="Message"
                        onChange={this.messageChanged.bind(this)}
                    />
                </div>

                <RaisedButton disabled={this.state.sessionName.length === 0 ||
                                this.state.message.length === 0}
                              label="Send message"
                              primary={true}
                              style={{}}
                              onTouchTap={this.sendMessage.bind(this)}
                />
                <br/>
                {response}
            </div>
        );
    }

    messsageSendSuccess(data) {
        this.setState({response: "Successfully sent" +
            " message " + JSON.stringify(data)});
        console.log("Success", data);
    }

    messageSendFailure(errMsg) {
        this.setState({response: "Error sending message - check the console"});
    }

    sendMessage() {
        console.log("Message " + this.state.message + " sent to " + this.state.sessionName);

        let toSend = { message: this.state.message, session: this.state.sessionName};

        $.ajax({
            type: "POST",
            url: SEND_URL,
            // The key needs to match your method's input parameter (case-sensitive).
            data: JSON.stringify(toSend),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: this.messsageSendSuccess.bind(this),
            error: this.messageSendFailure.bind(this)
        });
    }
}

export default TetherSender;