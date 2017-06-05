import paho.mqtt.client as mqtt
import numpy as np
import json
import time
import datetime

broker = "46.101.13.195"
# broker = "mqtt.opensensors.io"
# pwd = "xxxx"
# username = "solentairwatch" 

## this section is based on code from https://eclipse.org/paho/clients/python

# The callback for when the client receives a CONNACK response from the server.
def on_connect(client, userdata, rc):
    print("Connected with result code "+str(rc))
    # Subscribing in on_connect() means that if we lose the connection and
    # reconnect then subscriptions will be renewed.
    client.subscribe("/orgs/solentairwatch/sniffy", qos=1)

# The callback for when a PUBLISH message is received from the server.
def on_message(client, userdata, msg):
    print(msg.topic+" "+str(msg.payload))

client = mqtt.Client(client_id="6423")
# client.username_pw_set(username, password=pwd)

# set call back functions
client.on_connect = on_connect
client.on_message = on_message

# (address, port, timeout (sec) )
client.connect(broker)

# Blocking call that processes network traffic, dispatches callbacks and
# handles reconnecting.
# Other loop*() functions are available that give a threaded interface and a
# manual interface.
client.loop_forever()





