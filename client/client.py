import time
import csv
import socket
import json
import datetime
import random

Vref = 3.3 # ADC reference voltage
Fs = 10.0 # sample rate in Hz
ADCbits = 10.0 # bits on ADC


PORT = 33333;
HOST = '127.0.0.1'

message = {'$timestamp': str(datetime.datetime.now()), '$NO2WE': random.random(), '$NO2AE': random.random(), '$SO2WE': random.random(), '$SO2AE': random.random(), '$TEMP': random.random(), '$VREF': random.random(), '$PRES': random.random()};
message=json.dumps(message)

sock = socket.socket(socket.AF_INET, # Internet
                      socket.SOCK_DGRAM) # UDP
sock.sendto(message, (HOST, PORT))
