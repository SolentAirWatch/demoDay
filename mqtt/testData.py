import paho.mqtt.client as mqtt
import numpy as np
import json
import time
import datetime

## dont run for too long as the time index is unbound - memory leaks ahoy!!!

#client.username_pw_set("solentairwatch", password="YfLNeHZF")
broker = "mqtt.opensensors.io"
topic = "/orgs/solentairwatch/sniffy"
# broker  = "46.101.13.195" # test broker
monitorID = 1
monitorLocation = [50.9262, -1.4092]
global t
global ts

def on_connect(client, userdata, rc):
    print("Connected with result code "+str(rc))
    # Subscribing in on_connect() means that if we lose the connection and
    # reconnect then subscriptions will be renewed.
    pass
#          ]
#       }


def on_publish(client, userdata, mid):
    print(mid)
    print('published a message')   	
    pass
        
def on_disconnect(client, userdata, rc):
    print('disconected with code' +str(rc))
        
client = mqtt.Client(client_id="6435")
client.username_pw_set("solentairwatch", password="IFwwJ6vO")

# set MQTT call back functions
client.on_connect = on_connect
client.on_publish = on_publish
client.connect(broker) # (address, port, timeout (sec) )
t = 0
ts = 1
client.loop()

while True:
    x = np.random.randn()#20 + (20*np.sin(2*np.pi*t*0.01)) # generate a 0.01Hz sinewave between 0 and 40
    time.sleep(1)
    message = {
            'id': 'SOTON0001',
            'cityName': "Southampton",
            'stationName': "Common#1",
            'latitude': monitorLocation[0],
            'longitude': monitorLocation[1],
#          'pollutants': [
            'PM10': 0,
            'PM1': 0,
            'PM25': x,
            'time': str(datetime.datetime.now()),
            'averaging': 0
        }
    client.publish(topic, payload=json.dumps(message), qos=0, retain=False)
    client.loop()
#print(json.dumps(message))
     
    
