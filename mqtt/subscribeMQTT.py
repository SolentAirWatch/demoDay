import paho.mqtt.client as mqtt
import json
import sqlite3
from pprint import pprint # makes data more pretty

broker = "46.101.13.195"
# broker = "mqtt.opensensors.io"
DB_Name =  "airwatchData.db"
global cursor

## this section is based on code from https://eclipse.org/paho/clients/python

# The callback for when the client receives a CONNACK response from the server.
def on_connect(client, userdata, rc):
    print("Connected with result code "+str(rc))
    # Subscribing in on_connect() means that if we lose the connection and
    # reconnect then subscriptions will be renewed.
    client.subscribe("/orgs/solentairwatch/sniffy", qos=0)
    
# The callback for when a PUBLISH message is received from the server.
def on_message(client, userdata, msg):
    data = json.loads(msg.payload.decode('utf-8'))
    pprint(data)
    # parse the data to the sql database
    cursor.execute('''INSERT INTO users(sid, timestmp, latitude, longitude, PM10, PM25, PM1)
                  VALUES(?,?,?,?,?,?,?)''', (data["id"], data["time"], data["latitude"], data["longitude"], data["PM10"], data["PM2.5"], data["PM1"], ))
    db.commit()
    
client = mqtt.Client(client_id="6423")
db = sqlite3.connect(DB_Name)

cursor = db.cursor()

#client.username_pw_set("solentairwatch", password="xxxx")

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


db.close() # this will never be executed because of the forever loop - need some exit logic
