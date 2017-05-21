-- this is just for reference, the tables are created automatically by
-- server.js if they don't exist.
-- the configuration is in the sensorDataSchema object.

CREATE TABLE if not exists a4 (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	timestamp datetime,
	NO2WE double,
	NO2AE double,
	SO2WE double,
	SO2AE double,
	TEMP double,
	VREF double,
);

CREATE TABLE if not exists bmp (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	timestamp datetime,
	PRES double
	HUMID double
	TEMP double
)

CREATE TABLE if not exists pm (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	timestamp datetime,
	PM10 double,
	PM25_CF1 double,
	PM100_CF1 double,
	PM10_STD double,
	PM25_STD double,
	PM100_STD double,
	gr03um double,
	gr25um double,
	gr50um double,
	gr10um double
)
