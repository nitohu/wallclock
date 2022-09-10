#include <FastLED.h>
#include <ESP8266WiFi.h>

#define LED_COUNT   120
#define LED_PIN     14

CRGB leds[LED_COUNT];

// Color
unsigned short r = 0, g = 0, b = 0;
// Mode (will be necessary for some effects)
unsigned short m = 0;
// Effect Brightness (will be necessary for pulse effect)
float eff_b = 0.0f;
short is_on = 1;
// Brightness (0 -> 1)
float brightness = 0.3f;
short offset = 0;
// Delay in ms (will be configurable)
unsigned long del = 10;
// Wifi stuff
unsigned int port = 2420;
WiFiClient client;
WiFiServer server(port);
int wifiStatus = WL_IDLE_STATUS;
// If true the initial configuration was received and the server can receive requests
bool cnfg_received = false;

void updateLeds();
void turn_off();
void turn_on();

// Effects
void fade_effect();
void pulse();
void rainbow(bool rotate);
void static_color(short cr, short cg, short cb);
void white();

void setup() {
    Serial.begin(9600);
    Serial.println("Initializing led stripe...");

    if (WiFi.status() == WL_NO_SHIELD) {
        Serial.println("Error: No WiFi shield detected.");
    }

    // GRB -> activate rgb mode
    FastLED.addLeds<WS2812B, LED_PIN, GRB>(leds, LED_COUNT);

    // Try to connect to wifi
    while (wifiStatus != WL_CONNECTED) {
        Serial.printf("Try to connect to %s\n", WIFI_SSID);
        // Try to connect
        wifiStatus = WiFi.begin(WIFI_SSID, WIFI_PASS);
        if (wifiStatus == WL_CONNECTED) Serial.println("Connection success!");
        else if (wifiStatus == WL_CONNECT_FAILED) { 
            Serial.println("Connection failed for some reason.");
            // Don't spam the router with requests
            while (true) {}
        } else delay(5000);
    }
    /* Connection success */

    // Get initial configuration
    if (client.connect(SERVER_ADDR, SERVER_PORT)) {
        Serial.println("Connected to server!");
        char tmsg[300];
        sprintf(tmsg, "{\"token\": \"%s\"}", SERVER_AUTH);
        client.printf("POST /api/config HTTP/1.1\r\nHost: %s:%d\r\nContent-Length: %d\r\nContent-Type: application/json\r\nConnection: close\r\n\r\n", SERVER_ADDR, SERVER_PORT, strlen(tmsg));
        client.printf("%s\r\n\r\n", tmsg);
    } else {
        Serial.printf("Error while connecting to %s:%d\n", SERVER_ADDR, SERVER_PORT);
        // Make sure client is able to receive requests in the future if server is back
        cnfg_received = true;
        client.stop();
    }

    // Create Server
    server.begin();
    Serial.printf("Listening on %s:%d\n", WiFi.localIP().toString().c_str(), port);
}

/**
 * Variables for handling API response
 * 
 */
// If true we are currently receiving a request/response
bool receive_msg = false;
bool msgNewline = false;
bool msgHeaderDone = false;
String msg = "";
void loop() {
    // Check if response/request was sent & read it's body
    if (client.available()) {
        // Reset msg variable if we start receiving request
        if (!receive_msg) msg = "";
        char c = client.read();
        // Add character to message if body of response was reached
        if (msgHeaderDone) msg += c;
        // If not, check if body of response was reached
        else if (msgNewline && c == '\n') msgHeaderDone = true;
        // If not, check if the current character is a newline
        else if (c == '\n') msgNewline = true;
        // If not, make sure the current character is not identified as newline in the next round
        // Ignore carriage return character (ascii: 13)
        else if ((int)c != 13) msgNewline = false;
        Serial.print(c);
        receive_msg = true;
    } else if (receive_msg) {
        Serial.print("\nFull message: ");
        Serial.println(msg);
        // Reset values
        receive_msg = false;
        msgHeaderDone = false;
        msgNewline = false;
        cnfg_received = true;
        client.stop();
    }
    // Check if request was sent
    if (cnfg_received && !receive_msg) client = server.available();
    else if (cnfg_received && client && !receive_msg) {
        Serial.println("New client connected.");
        String req = client.readStringUntil('\r');
        // Read last \n
        client.read();
        Serial.printf("Request: %s\n", req.c_str());
        // TODO: Handle request to switch mode
    }
    // Set colors & update LEDs
    // rainbow(true);
    // static_color(192, 57, 43);
    pulse(0, 255, 0);
    delay(del);
}

// Helper function for static effects
void updateLeds() {
    for (int i = 0; i < LED_COUNT; i++) {
        int rb = 0, gb = 0, bb = 0;
        if (is_on) {
            rb = r*brightness;
            gb = g*brightness;
            bb = b*brightness;
        }
        leds[i] = CRGB(rb, gb, bb);
    }
    FastLED.show();
}

void turn_off() {
    is_on = 0;
}

void turn_on() {
    is_on = 1;
}

/**
 * Effects
 */

void fade_effect() {
    if (m > 2) m = 0;
    if (m == 0) {
        r++;
        if (b > 0) b--;
        if (r >= 255) {
            m++;
            // Always make sure next number can be incremented
            g = 0;
        }
    }
    if (m == 1) {
        g++;
        if (r > 0) r--;
        if (g >= 255) {
            m++;
            b = 0;
        }
    }
    if (m == 2) {
        b++;
        if (g > 0) g--;
        if (b >= 255) {
            m = 0;
            r = 0;
        }
    }

    updateLeds();
}

void pulse(short cr, short cg, short cb) {
    if (m > 1) m = 0;
    // LED gets brighter
    if (m == 0) {
        eff_b += 0.01f;
        if (eff_b >= 0.99f) {
            m = 1;
            delay(100);
        }
    }
    // LED gets darker
    else {
        eff_b -= 0.01f;
        if (eff_b <= 0.01f) {
            m = 0;
            delay(100);
        }
    }
    r = cr * eff_b;
    g = cg * eff_b;
    b = cb * eff_b;
    updateLeds();
}

void rainbow(bool rotate) {
    if (!is_on) {
        updateLeds();
        return;
    }
    short factor = 255 / (LED_COUNT / 3);
    // If LED_COUNT is e.g. 120 factor will be 6, if r is set to 255 it'll never go fully down to zero (6 * 40 = 240)
    r = factor * ( LED_COUNT / 3 );
    g = 0;
    b = 0;
    for (int i = 0; i < LED_COUNT; i++) {
        // First third
        if (i < (LED_COUNT/3)) {
            r -= factor;
            g += factor;
        } else if (i < (LED_COUNT/3)*2) {
            g -= factor;
            b += factor;
        } else {
            b -= factor;
            r += factor;
        }
        if (i+offset < LED_COUNT)
            leds[i+offset] = CRGB(r*brightness, g*brightness, b*brightness);
        else
            leds[i+offset-LED_COUNT] = CRGB(r*brightness, g*brightness, b*brightness);
    }
    if (rotate) offset++;
    if (offset >= LED_COUNT) offset = 0;
    FastLED.show();
}

void static_color(short cr, short cg, short cb) {
    // FIXME: Colors are not represented properly (maybe need to switch to HSV)
    r = cr;
    g = cb;
    b = cb;

    updateLeds();
}

void white() {
    r = 255;
    g = 255;
    b = 255;

    updateLeds();
}
