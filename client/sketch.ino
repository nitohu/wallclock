#include <FastLED.h>
#include <ESP8266WiFi.h>
#include <Arduino_JSON.h>

#define LED_COUNT   120
#define LED_PIN     14

CRGB leds[LED_COUNT];

/**
 * Settings 
 * 
 */
enum modes {
    MODE_STATIC, MODE_RAINBOW, MODE_PULSE, MODE_FADE,
    MODE_CLOCK_SIMPLE, MODE_CLOCK_GRADIENT
} current_effect;
// Color settings, will not be modified by functions using different colors, will only be overwritten by request/response
unsigned short r = 255, g = 255, b = 255;
short is_on = 1;
// Brightness (0 -> 1)
float brightness = 0.3f;
// Delay in ms (will be configurable)
unsigned long del = 10;
/**
 * Wifi stuff
 */
unsigned int port = 2420;
WiFiClient client;
WiFiServer server(port);
int wifiStatus = WL_IDLE_STATUS;
// If true the initial configuration was received and the server can receive requests
bool cnfg_received = false;

/**
 * Variables manipulated during effects (& might be reset between them)
 * 
 */
// Current colors used in effect, can be manipulated by effects changing colors & reset between changing modes
unsigned short eff_r = r, eff_g = g, eff_b = b;
float eff_brightness = brightness;
// Mode (will be necessary for some effects)
unsigned short m = 0;
short offset = 0;

void process_message(JSONVar msg);
void updateLeds();
void turn_off();
void turn_on();

// Effects
void fade_effect();
void pulse(short cr, short cg, short cb);
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
    current_effect = MODE_STATIC;

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
        receive_msg = true;
    } else if (receive_msg) {
        JSONVar msg_obj = JSON.parse(msg);
        if (JSON.typeof(msg_obj) == "undefined") {
            // Parsing failed
            msg_obj = JSONVar();
            Serial.println("Parsing of message has failed.");
        } else {
            process_message(msg_obj);
            Serial.print("Message: ");
            Serial.println(msg_obj);
        }
        // Reset values
        receive_msg = false;
        msgHeaderDone = false;
        msgNewline = false;
        cnfg_received = true;
        client.stop();
    }
    // Check if request was sent & prepare for reading it's content
    if (cnfg_received && !receive_msg) client = server.available();
    if (cnfg_received && client && !receive_msg) {
        Serial.println("New client connected.");
        String req = client.readStringUntil('\r');
        // Read last \n
        client.read();
        Serial.printf("Request: %s\n", req.c_str());
    }
    
    // Set colors & update LEDs
    switch (current_effect) {
    case MODE_STATIC:
        static_color(r, g, b);
        break;
    case MODE_RAINBOW:
        rainbow(true);
        break;
    case MODE_PULSE:
        pulse(r, g, b);
        break;
    case MODE_FADE:
        fade_effect();
        break;
    case MODE_CLOCK_SIMPLE:
        // TODO: Implement mode
        Serial.println("Not implemented yet");
        current_effect = MODE_STATIC;
        break;
    case MODE_CLOCK_GRADIENT:
        // TODO: Implement mode
        Serial.println("Not implemented yet");
        current_effect = MODE_STATIC;
        break;
    default:
        Serial.println("Warn: no valid mode selected.");
        delay(200);
        break;
    }
    delay(del);
}

void process_message(JSONVar msg) {
    // Switch mode
    if (msg.hasOwnProperty("mode")) {
        const char* mode = (const char*) msg["mode"];
        
        if (strcmp(mode, "static") == 0) {
            current_effect = MODE_STATIC;
            if (msg.hasOwnProperty("color")) {
                // TODO: parse & set color
            }
        } else if (strcmp(mode, "rainbow") == 0) {
            current_effect = MODE_RAINBOW;
            // TODO: Add option if rainbow should be rotated or not
        } else if (strcmp(mode, "pulse") == 0) {
            // Reset effect specific settings
            eff_brightness = 0;
            m = 0;
            current_effect = MODE_PULSE;
            if (msg.hasOwnProperty("color")) {
                // TODO: parse & set color
            }
        } else if (strcmp(mode, "fade") == 0) {
            // Reset effect colors, effect always starts with red
            eff_r = 0; eff_g = 0; eff_b = 0;
            m = 0;
            current_effect = MODE_FADE;
        } else if (strcmp(mode, "sclock") == 0) {
            current_effect = MODE_CLOCK_SIMPLE;
        } else if (strcmp(mode, "gclock") == 0) {
            current_effect = MODE_CLOCK_GRADIENT;
        } else {
            Serial.printf("Unknown mode '%s'\n", mode);
        }
    }
}

void turn_off() {
    is_on = 0;
}

void turn_on() {
    is_on = 1;
}

// Helper function for static effects
void updateLeds() {
    for (int i = 0; i < LED_COUNT; i++) {
        int rb = 0, gb = 0, bb = 0;
        if (is_on) {
            rb = eff_r*brightness;
            gb = eff_g*brightness;
            bb = eff_b*brightness;
        }
        leds[i] = CRGB(rb, gb, bb);
    }
    FastLED.show();
}

/**
 * Effects
 */
// Cycles through red / green / blue
void fade_effect() {
    if (m > 2) m = 0;
    if (m == 0) {
        eff_r++;
        if (eff_b > 0) eff_b--;
        if (eff_r >= 255) {
            m++;
            // Always make sure next number can be incremented
            eff_g = 0;
        }
    }
    if (m == 1) {
        eff_g++;
        if (eff_r > 0) eff_r--;
        if (eff_g >= 255) {
            m++;
            eff_b = 0;
        }
    }
    if (m == 2) {
        eff_b++;
        if (eff_g > 0) eff_g--;
        if (eff_b >= 255) {
            m = 0;
            eff_r = 0;
        }
    }

    updateLeds();
}

// Pulses specified color
void pulse(short cr, short cg, short cb) {
    if (m > 1) m = 0;
    // LED gets brighter
    if (m == 0) {
        eff_brightness += 0.01f;
        if (eff_brightness >= 0.99f) {
            m = 1;
            delay(100);
        }
    }
    // LED gets darker
    else {
        eff_brightness -= 0.01f;
        if (eff_brightness <= 0.01f) {
            m = 0;
            delay(100);
        }
    }
    eff_r = cr * eff_brightness;
    eff_g = cg * eff_brightness;
    eff_b = cb * eff_brightness;
    updateLeds();
}

// Rainbow effect
void rainbow(bool rotate) {
    if (!is_on) {
        updateLeds();
        return;
    }
    short factor = 255 / (LED_COUNT / 3);
    // If LED_COUNT is e.g. 120 factor will be 6, if r is set to 255 it'll never go fully down to zero (6 * 40 = 240)
    eff_r = factor * ( LED_COUNT / 3 );
    eff_g = 0;
    eff_b = 0;
    for (int i = 0; i < LED_COUNT; i++) {
        // First third
        if (i < (LED_COUNT/3)) {
            eff_r -= factor;
            eff_g += factor;
        } else if (i < (LED_COUNT/3)*2) {
            eff_g -= factor;
            eff_b += factor;
        } else {
            eff_b -= factor;
            eff_r += factor;
        }
        if (i+offset < LED_COUNT)
            leds[i+offset] = CRGB(eff_r*brightness, eff_g*brightness, eff_b*brightness);
        else
            leds[i+offset-LED_COUNT] = CRGB(eff_r*brightness, eff_g*brightness, eff_b*brightness);
    }
    if (rotate) offset++;
    if (offset >= LED_COUNT) offset = 0;
    FastLED.show();
}

// Shows specified color
void static_color(short cr, short cg, short cb) {
    // FIXME: Colors are not represented properly (maybe need to switch to HSV)
    eff_r = cr;
    eff_g = cb;
    eff_b = cb;

    updateLeds();
}

void white() {
    eff_r = 255;
    eff_g = 255;
    eff_b = 255;

    updateLeds();
}
