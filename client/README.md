# Client

This is supposed to be deployed on an arduino.

The client will be controller by the server.

## Necessary Configuration

Make sure to configure the following variables before deploying the client to the arduino. This is necessary so it can connect to the internet and communicate with the server.

```c
// Local wifi settings
#DEFINE wifi_ssid asd
#DEFINE wifi_user asd
#DEFINE wifi_pass asd

// Authentication token of the arduino configured on the server
#DEFINE serv_auth asd
```
