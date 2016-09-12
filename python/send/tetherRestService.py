from __future__ import print_function
from flask import Flask, jsonify, request, abort
from messageSender import MessageSender

app = Flask(__name__)

connectedToRMQ = False;

try:
    sender = MessageSender()
    connectedToRMQ = True
except Exception, exp:
    print("Problem connecting to RMQ: %s" % exp)

@app.route('/')
def index():
    return "Hello, World!"

@app.route('/tether', methods=['POST'])
def create_task():
    if not request.json or not 'session' in request.json or not 'message' in request.json:
        abort(400)
    if not connectedToRMQ:
        abort(500)
    tetherRequest = {
        'session': request.json['session'],
        'message': request.json['message']
    }
    print("Tether request received", tetherRequest);

    try:
        sender.sendMessage(tetherRequest);
    except Exception, exp:
        print("Problem sending message %s %s" % (tetherRequest['message'], exp))
        abort(500);

    return jsonify({'tetherRequest': tetherRequest}), 201

@app.after_request
def addCorsHeaders(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
    return response

if __name__ == '__main__':
    app.run(debug=True)