from __future__ import print_function
from websocketSession import TetherReceptionSession
from autobahn.twisted.websocket import WebSocketServerProtocol, WebSocketServerFactory
import sys
from twisted.python import log
from twisted.internet import defer, reactor, protocol, task
import pika
from pika.adapters import twisted_connection

class ReceiveServer(WebSocketServerFactory):
    """Web socket server for receiving tethering messages from Rabbit MQ and sending them
    to registered clients"""

    def __init__(self):
        """Set up a new web sockets factory and listen for connections"""

        # Initialise superclass
        super(self.__class__, self).__init__()

        log.startLogging(sys.stdout)

        # Store sessions according to what sessionName they are against:
        self.sessionsByName = {}

        # Store queues for each session
        self.sessionQueues = {}

        # Run a web socket server to listen for web app clients requesting to join sessions
        self.protocol = TetherReceptionSession
        reactor.listenTCP(5001, self)

        # Run a TCP server to connect to Rabbit MQ
        parameters = pika.ConnectionParameters()
        client_creator = protocol.ClientCreator(reactor, twisted_connection.TwistedProtocolConnection, parameters)
        d = client_creator.connectTCP('localhost', 5672)
        d.addCallback(lambda protocol : protocol.ready)
        d.addCallback(self.listen_to_rmq)

        #Run the Reactor server, listening to both client requests and RMQ
        reactor.run()

    def register_tether_session(self, session_name, session):
        """Register a session to listen to messages for a particular session name"""

        if not self.sessionsByName.has_key(session_name):
            print("Creating new session name %s" % session_name)
            self.sessionsByName[session_name] = []
            self.listen_to_queue(session_name)

        self.sessionsByName[session_name].append(session)

        print("Registered a tether session with new client for %s" % session_name)
        print("Current sessions: %s" % self.sessionsByName)

    def close_session(self, session):
        # Remove the session from the registered sessions (if it is there):
        for sessionName, sessions in self.sessionsByName.iteritems():
            if session in sessions:
                sessions.remove(session)
                # Remove the session if there are no clients left for it
                if len(sessions) == 0:
                    self.remove_session(sessionName)
                print("Unregistered a tether session with a client for session %s" % sessionName)

    def remove_session(self, session_name):
        """Close a session with given name, including closing the RMQ queue"""
        self.sessionsByName.pop(session_name, None)
        # Close the queue
        self.channel.queue_delete(queue=self.sessionQueues[session_name])
        self.sessionQueues.pop(session_name, None)

    def distribute_message(self, session_name, body):
        # Find all clients for the session name and send the message to them:
        sessions = self.sessionsByName[session_name]
        print("Distributing message %s:%s to %s" % (session_name, body, sessions))
        if not sessions is None:
            for session in sessions:
                print("Sending to session")
                session.send(body)

    def set_message_listener(self, message_listener):
        """Add a message listener, which can listen for messages for particular sessions"""
        self.messageListener = message_listener

    @defer.inlineCallbacks
    def listen_to_rmq(self, connection):
        print("Listening to RMQ")
        self.channel = yield connection.channel()
        self.exchange = yield self.channel.exchange_declare(exchange="tether", type="direct")

    @defer.inlineCallbacks
    def listen_to_queue(self, session_name):
        """Listen for messages with routingKey=sessionName for a new session"""
        queue = yield self.channel.queue_declare(exclusive=True)
        queue_name = queue.method.queue
        self.sessionQueues[session_name] = queue_name
        yield self.channel.queue_bind(exchange="tether", queue=queue_name, routing_key=session_name)
        yield self.channel.basic_qos(prefetch_count=1)
        queue_object, consumer_tag = yield self.channel.basic_consume(queue=queue_name, no_ack=False)
        l = task.LoopingCall(self.receive_from_rmq, queue_object)
        l.start(0.01)
        print("Started listening for messages with routing key %s" % session_name)

    @defer.inlineCallbacks
    def receive_from_rmq(self, queue_object):
        ch, method, properties, body = yield queue_object.get()

        session_name = method.routing_key

        if body:
            print("Message received from RMQ: %s : %s" % (session_name, body))
            self.distribute_message(session_name, body)

        yield ch.basic_ack(delivery_tag=method.delivery_tag)

# Start a new server
if __name__ == '__main__':
     receiveServer = ReceiveServer()

