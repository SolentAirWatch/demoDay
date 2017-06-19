# data_server

By lack of a better repo name we are calling the various scripts that run on our cloud server 'DataServer'. 

**/mqtt - Python scripts used to subcribe to opensensors topic via MQTT

All Sniffy devices publish to the /org/solentairwatch/sniffy topic on opensensors.io. A server subscribles to the topic and adds this into a SQLITE database.

Addtional topics will be used for other data types, please recommend an improved schemas...
/org/solentairwatch/traffic
/org/solentairwatch/ships
/org/solentairwatch/weather

/demo folder contains old scripts when we used UDP for air quaility demonstrations


