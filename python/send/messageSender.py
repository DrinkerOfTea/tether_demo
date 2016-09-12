import pika

class MessageSender(object):

    """Class which can send messages to a REST API"""

    def __init__(self):
        pass

    def sendMessage(self, tetherRequest):
        """Send a message"""

        #Send message to RMQ queue
        sessionName = tetherRequest["session"];
        message = tetherRequest["message"];

        if(len(message) > 0 and len(sessionName) > 0):
            connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'));
            channel = connection.channel();
            channel.exchange_declare(exchange="tether", type="direct")
            channel.basic_publish(exchange="tether", routing_key=sessionName, body=message)
            connection.close()
            print("Sent tether request to RMQ: " + tetherRequest['session'] + ", " + tetherRequest['message'])
