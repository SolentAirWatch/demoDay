import paho.mqtt.client as mqtt
import json
import sqlite3
from pprint import pprint # makes data more pretty

# broker = "46.101.13.195" # this is our cloud server used to isolate any issues with opensenors which is more complex
broker = "mqtt.opensensors.io"
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
    # parse the data to the sql database, prob a way to do directly from JSON, this works though
    cursor.execute('''INSERT INTO sniffy(id, timestmp, latitude, longitude, PM10, PM25, PM1)
                  VALUES(?,?,?,?,?,?,?)''', (data["id"], data["time"], data["latitude"], data["longitude"], data["PM10"], data["PM25"], data["PM1"]))
    db.commit()
    
client = mqtt.Client(client_id="6423")
client.username_pw_set("solentairwatch", password="aLmgqJPH")

# set MQTT call back functions
client.on_connect = on_connect
client.on_message = on_message
client.connect(broker) # (address, port, timeout (sec) )

# set up database connection
db = sqlite3.connect(DB_Name)
cursor = db.cursor()
cursor.execute('''
    CREATE TABLE IF NOT EXISTS  sniffy(id TEXT, timestmp TEXT,
                       latitude TEXT, longitude TEXT, PM10 TEXT, PM25 TEXT, PM1 TEXT)
''')

# Blocking call that processes network traffic, dispatches callbacks and
# handles reconnecting.
# Other loop*() functions are available that give a threaded interface and a
# manual interface.
client.loop_forever()
db.close() # this will never be executed because of the forever loop - need some exit logic
