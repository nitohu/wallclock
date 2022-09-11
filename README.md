# Wallclock 

This project consists of a simple server with web interface and a small arduino wallclock as a client.
The server is able to control multiple clients.

## Client

The client requires a small arduino/microcontroller with a WiFi shield. 
You'll also need an WS2812B LED strips, favorably made of 120 LEDs.

I'm using an ESP8266 with a builtin WiFi shield.
The LED strip of my clock is wrapped around a 3D printed bracket, which I also use to screw the clock to the wall.
I've also took a little piece of wood and screwed it in front of the printed bracket to diffuse the light against the wall.

The wireless settings and details about the server can be configured in the `settings.ino` file.

Used libraries:
* FastLED: [https://www.arduino.cc/reference/en/libraries/fastled/](https://www.arduino.cc/reference/en/libraries/fastled/)
* ESP8266WiFi: [https://github.com/esp8266/Arduino/tree/master/libraries/ESP8266WiFi](https://github.com/esp8266/Arduino/tree/master/libraries/ESP8266WiFi)
* Arduino_JSON: [https://www.arduino.cc/reference/en/libraries/arduino_json/](https://www.arduino.cc/reference/en/libraries/arduino_json/)

Pictures will follow.

## Server

The server is setup inside a docker container.
It's a simple NodeJS server using postgres to store some basic informations about different clocks & settings.

It can be started by going into the `server/` folder and running `docker-compose up`.
