#    A script to send dummy Sniffy data to the MQTT broker

import paho.mqtt.client as mqtt
import numpy as np
import json
import time
import datetime


# dont run for too long as the time index is unbound - memory leaks ahoy!!!
broker = "mqtt.opensensors.io"  # "46.101.13.195"     # test broker
topic = "/orgs/solentairwatch/sniffy"
monitorID = 'SOTON0000'  # id 0 is reserved for test
monitorLocation = [50.9262, -1.4092]
global t
global ts


def on_connect(client, userdata, rc):
    print("Connected with result code "+str(rc))
    # do nothing we're connected
    pass


def on_publish(client, userdata, mid):
    print(mid)
    print('published a message')
    pass


def on_disconnect(client, userdata, rc):
    # need some ability to error log and reconnect
    print('disconected with code' + str(rc))

client = mqtt.Client(client_id="6435")
client.username_pw_set("solentairwatch", password="IFwwJ6vO")

# set MQTT call back functions
client.on_connect = on_connect
client.on_publish = on_publish
client.connect(broker)  # (address, port, timeout (sec) )
t = 0
ts = 1
client.loop()

while True:
    x = 20 + (20 * np.sin(2 * np.pi * t * 0.01))  # generate a sinewave
    t = t + ts  # time update
    time.sleep(1)
    message = {
            'id': monitorID,
            'cityName': "Southampton",
            'stationName': "Common#1",
            'latitude': monitorLocation[0],
            'longitude': monitorLocation[1],
# 'pollutants': [
            'PM10': 0,
            'PM1': 0,
            'PM25': x,
            'time': str(datetime.datetime.now()),
            'averaging': 0
        }
    client.publish(topic, payload=json.dumps(message), qos=0, retain=False)
    client.loop()
# print(json.dumps(message))
