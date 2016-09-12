from __future__ import print_function
from autobahn.twisted.websocket import WebSocketServerProtocol
import json

class TetherReceptionSession(WebSocketServerProtocol):
    """Session which manages a web socket connection to a client via a web
    socket"""
    
    def onConnect(self, request):
        print("Client connecting: {}".format(request.peer))

    def onOpen(self):
        print("Connection open")

    def onMessage(self, payload, isBinary):
        msg = json.loads(payload.decode('utf8'))

        print("Message received from client: %s" % msg);

        if "openSession" in msg.keys():
            sessionName = msg["openSession"]
            print("Setting up new session with client for %s" % sessionName)

            # Remember this client wants to receive messages for the given session
            self.factory.register_tether_session(sessionName, self);

            # Return an acknwoledgment message
            ackMsg = { "messageType": "ack" }
            self.sendMessage(json.dumps(ackMsg, ensure_ascii=False).encode('utf-8'), False)

    def onClose(self, wasClean, code, reason):
        print("Session with client closed: %s, %s" % (code, reason));
        self.factory.close_session(self)

    def send(self, messageBody):
        msg = { "messageType": "tetherMessage", "message": messageBody }
        self.sendMessage(json.dumps(msg, ensure_ascii=False).encode('utf-8'), False)
        print("Sending message to client: %s" % messageBody)