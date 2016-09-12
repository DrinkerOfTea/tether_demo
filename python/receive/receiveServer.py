from __future__ import print_function
from websocketSession import TetherReceptionSession
from autobahn.twisted.websocket import WebSocketServerProtocol, WebSocketServerFactory
import sys
from twisted.python import log
from twisted.internet import reactor
import pika

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

        # Store RMQ queues for each sessionName:
        self.rmqQueues = {}

        # Open a channel to RabbitMQ and create an exchange:
        self.rmqConnection = pika.BlockingConnection(pika.ConnectionParameters(host="localhost"))
        self.rmqChannel = self.rmqConnection.channel()
        self.rmqChannel.exchange_declare(exchange="tether", type="direct")

        # Run a web socket server
        self.protocol = TetherReceptionSession
        reactor.listenTCP(5001, self)
        reactor.run()

    def register_tether_session(self, sessionName, session):
        """Register a session to listen to messages for a particular session name"""

        if not self.sessionsByName.has_key(sessionName):
            self.sessionsByName[sessionName] = []

            # Create a new RabbitMQ queue for the message
            queueResult = self.rmqChannel.queue_declare(exclusive=True)
            queueName = queueResult.method.queue
            # Store queue (so it can be removed when all sessions closed
            self.rmqQueues[sessionName] = queueName
            # Bind to the queue:
            self.rmqChannel.queue_bind(exchange="tether", queue=queueName, routing_key=sessionName)

            # Consume from the queue:
            def callback(ch, method, properties, body):
                print("Received message from RMQ %r:%r" % (method.routing_key, body))
                self.distribute_message(method.routing_key, body)

            self.rmqChannel.basic_consume(callback, queue=queueName, no_ack=True)
            print("Set up new queue %s for %s" % (queueName, sessionName) )

            self.rmqChannel.start_consuming()

        self.sessionsByName[sessionName].append(session)

        print("Registered a tether session with new client for %s" % sessionName)
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

    def remove_session(self, sessionName):
        """Close a session with given name, including closing the RMQ queue"""
        self.sessionsByName.pop(sessionName, None)
        queueName = self.rmqQueues[sessionName]
        self.rmqChannel.queue_delete(queue=queueName)

    def distribute_message(self, session_name, body):
        # Find all clients for the session name and send the message to them:
        sessions = self.sessionsByName[session_name]
        print("Distributing message %s:%s to %s" % (session_name, body, sessions))
        if not sessions is None:
            for session in sessions:
                print("Sending to session")
                session.send(body)

# Start a new server
if __name__ == '__main__':
     ReceiveServer()