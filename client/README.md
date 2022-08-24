# Client

This is supposed to be deployed on an arduino.

The client will be controller by the server.

## Necessary Configuration

Make sure to configure the following variables before deploying the client to the arduino, you can find the settings in `settings.ino`.
This is necessary so it can connect to the internet and communicate with the server.

```c
// Local wifi settings
char WIFI_SSID[] = "ssid";
char WIFI_PASS[] = "password";

// Authentication token of the arduino configured on the server
char SERVER_ADDR[] = "127.0.0.1";
int  SERVER_PORT   = 8000;
char SERVER_AUTH[] = "token";
```

You can generate the authentication token for an arduino in the web interface of the server.
