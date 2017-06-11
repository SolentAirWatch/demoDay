#    A script to send dummy Sniffy data to the MQTT broker - tested on python 3

import paho.mqtt.client as mqtt
import numpy as np
import json
import time
import datetime


# dont run for too long as the time index is unbound - memory leaks ahoy!!!
broker = "mqtt.opensensors.io"  # "46.101.13.195"     # test broker
topic = "/orgs/solentairwatch/sniffy"
monitorID1 = '0'  # id 0 is reserved for test
monitorID2 = '1'  # id 0 is reserved for test
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
    x1 = 20 + (100 * np.sin(2 * np.pi * t * 0.1))  # generate a sinewave
    x2 = 20 + (100 * np.sin(2 * np.pi * t * 0.01))  # generate a sinewave
    t = t + ts  # time update
    time.sleep(1)
    message1 = {
            'id': monitorID1,
            'cityName': "Southampton",
            'stationName': "Common#1",
            'latitude': monitorLocation[0],
            'longitude': monitorLocation[1],
# 'pollutants': [
            'PM10': 0,
            'PM1': 0,
            'PM25': x1,
            'time': str(datetime.datetime.now()),
            'averaging': 0
        }
    message2 = {
            'id': monitorID2,
            'cityName': "Southampton",
            'stationName': "Common#1",
            'latitude': monitorLocation[0],
            'longitude': monitorLocation[1],
# 'pollutants': [
            'PM10': 0,
            'PM1': 0,
            'PM25': x2,
            'time': str(datetime.datetime.now()),
            'averaging': 0
        }
    client.publish(topic, payload=json.dumps(message1), qos=0, retain=False)
    client.publish(topic, payload=json.dumps(message2), qos=0, retain=False)
    client.loop()
# print(json.dumps(message))
