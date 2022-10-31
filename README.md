# Wallclock 

This project consists of a simple server with web interface and a small arduino wallclock as a client.
The server is able to control multiple clients.

## Client

The client is built from a small arduino/microcontroller with a WiFi shield (ESP8266 microcontroller). 
You'll also need a WS2812B LED strip, favorably made of 120 LEDs.

I'm using an ESP8266 with a builtin WiFi shield.
The LED strip of my clock is wrapped around a 3D printed bracket, which I also use to screw the clock to the wall.
I've also took a little piece of wood and screwed it in front of the printed bracket to diffuse the light against the wall.

The wireless settings and details about the server can be configured in the `settings.ino` file.

Used libraries:
* FastLED: [https://www.arduino.cc/reference/en/libraries/fastled/](https://www.arduino.cc/reference/en/libraries/fastled/)
* ESP8266WiFi: [https://github.com/esp8266/Arduino/tree/master/libraries/ESP8266WiFi](https://github.com/esp8266/Arduino/tree/master/libraries/ESP8266WiFi)
* Arduino_JSON: [https://www.arduino.cc/reference/en/libraries/arduino_json/](https://www.arduino.cc/reference/en/libraries/arduino_json/)
* TimeLib: [https://github.com/PaulStoffregen/Time](https://github.com/PaulStoffregen/Time)

Pictures will follow.

## Server

The server is setup inside a docker container.
It's a simple NodeJS server using postgres to store some basic informations about different clocks & settings.

It can be started by going into the `server/` folder and running `docker-compose up`.

## API Documentation Client & Server

Client & Server are communicating via a JSON API.

Example request from Server to client, changing the mode to rainbow.

```json
{
    "mode": "rainbow",
    "on": true,
    "brightness": 10,
    "delay": 20,
    "rotate": true
}
```

Valid fields:

Field | Type | Valid Values | Explanation
--- | --- | --- | ---
`mode` | string | static, rainbow, pulse, fade, sclock, gclock | Mode of the device
`timestamp` | long | e.g. 1667218460 | Timestamp for time synchronization
`brightness` | int | 0 >= x <= 100, e.g. 33, 50 | Brightness of the device (0 => leds are off)
`on` | bool | true, false | Is the device on, if not it will just wait for incoming requests
`color` | string | hexadecimal colors (e.g. #2c75ae) | Color of the device (limited to modes: `static`, `pulse`)
`delay` | int | delay in milliseconds between entering program loop (can be used to slow down effects) (limited to modes: `rainbow`, `pulse`, `fade`)
`showSeconds` | bool | true, false | Show the seconds? (limited to `sclock`)
`randomColor` | bool | true, false | Use random colors? (limited to `pulse`)
`rotate` | bool | true, false | Rotate effect? (limited to `rainbow`)
