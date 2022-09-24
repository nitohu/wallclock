#include <FastLED.h>
#include <ESP8266WiFi.h>
#include <Arduino_JSON.h>
#include <TimeLib.h>

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
bool is_on = true;
// Brightness (0 -> 1)
double brightness = 0.3;
// Delay in ms (rainbow, pulse, fade config)
unsigned long del = 10;
// Clock config
bool showSeconds = true;
// Pulse config
bool random_color = false;
/**
 * Wifi stuff
 */
const unsigned int port = 2420;
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
double eff_brightness = brightness;
// Mode (will be necessary for some effects)
unsigned short m = 0;
short offset = 0;

void process_message(JSONVar msg);
void updateLeds();
void turn_off();
void turn_on();
int getHoursLED();
int getMinutesLED();
int getSecondsLED();

// Effects
void fade_effect();
void pulse(short cr, short cg, short cb);
void rainbow(bool rotate);
void static_color(short cr, short cg, short cb);
void clock_simple();
void clock_gradient();
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
        clock_simple();
        break;
    case MODE_CLOCK_GRADIENT:
        clock_gradient();
        break;
    default:
        Serial.println("Warn: no valid mode selected.");
        delay(200);
        break;
    }
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
    // Change color
    // Currently string must start with # and must have a length of 7 characters (e.g. #00ff00)
    if (msg.hasOwnProperty("color")) {
        const char* color = (const char*) msg["color"];
        // Parse hex string into RGB values
        if (*color == '#' && strlen(color) == 7) {
            char hex_red[3], hex_green[3], hex_blue[3];
            // Split color string into it's component (r/g/b) strings
            for (short i = 1; i < strlen(color); i++) {
                if ((i-1) < 2) hex_red[i-1] = *(color+i);
                else if ((i-1) < 4) hex_green[i-3] = *(color+i);
                else hex_blue[i-5] = *(color+i);
            }
            // Add string termination to char arrays (prevent overflow)
            hex_red[2] = '\0';
            hex_green[2] = '\0';
            hex_blue[2] = '\0';
            // Convert hex values into decimal
            r = (int) strtol(hex_red, nullptr, 16);
            g = (int) strtol(hex_green, nullptr, 16);
            b = (int) strtol(hex_blue, nullptr, 16);
        } else {
            Serial.printf("Error: No valid color format received, need hex: %s (%d)\n", color, strlen(color));
        }
    }
    // Set time
    if (msg.hasOwnProperty("timestamp")) {
        time_t t = (long) msg["timestamp"];
        setTime(t);
    }
    // Change brightness
    if (msg.hasOwnProperty("brightness")) {
        int br = (int) msg["brightness"];
        if (br > 100) br = 100;
        else if (br < 0) br = 0;
        brightness = br / 100.0;
    }
    // Set on/off
    if (msg.hasOwnProperty("on")) {
        is_on = (bool) msg["on"];
    }
    // TODO: Change delay
    if (msg.hasOwnProperty("delay")) {
        int d = (int) msg["delay"];
        if (d > 50) d = 50;
        else if (d < 0) d = 0;
        del = d;
    }
}

void turn_off() {
    is_on = false;
}

void turn_on() {
    is_on = true;
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

int getHoursLED() {
    // TODO: Remove addition when timezone can be set server side
    int ch = (hourFormat12() + 2) % 12;
    return (LED_COUNT / 12) * ch + ((float)LED_COUNT / 12 / 60) * minute();
}

int getMinutesLED() {
    return (LED_COUNT / 60) * minute();
}

int getSecondsLED() {
    return (LED_COUNT / 60) * second();
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
    if (!receive_msg) delay(del);
}

// Pulses specified color
void pulse(short cr, short cg, short cb) {
    if (m > 1) m = 0;
    // LED gets brighter
    if (m == 0) {
        eff_brightness += 0.01;
        if (eff_brightness >= 0.99) {
            m = 1;
            if (!receive_msg) delay(del*0.25);
        }
    }
    // LED gets darker
    else {
        eff_brightness -= 0.01;
        if (eff_brightness <= 0.01) {
            m = 0;
            if (!receive_msg) delay(del*0.25);
        }
    }
    eff_r = cr * eff_brightness;
    eff_g = cg * eff_brightness;
    eff_b = cb * eff_brightness;
    updateLeds();
    if (!receive_msg) delay(del);
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
    if (!receive_msg) delay(del);
}

// Shows specified color
void static_color(short cr, short cg, short cb) {
    // FIXME: Colors are not represented properly (maybe need to switch to HSV)
    eff_r = cr;
    eff_g = cg;
    eff_b = cb;

    updateLeds();
}

// Simple clock effect, currently red for hour, green for minute and blue for second
void clock_simple() {
    if (!is_on) {
        updateLeds();
        return;
    }
    // Problem: Due to the delay between server taking timestamp & client receiving the request the time will be a little bit in the past
    int h_led = getHoursLED(), m_led = getMinutesLED(), s_led = getSecondsLED();
    for (int i = 0; i < LED_COUNT; i++) {
        // hour
        if (i == h_led || i == (h_led+1)) {
            leds[i] = CRGB(255*brightness, 0, 0);
        }
        // minute
        else if (i == m_led || i == (m_led+1)) {
            leds[i] = CRGB(0, 255*brightness, 0);
        }
        // second
        else if (i == s_led || i == (s_led+1)) {
            leds[i] = CRGB(0, 0, 255*brightness);
        }
        // everything else off
        else leds[i] = CRGB(0, 0, 0);
    }
    FastLED.show();
}

// Gradient clock effects, draws a gradient from minute -> hour (green) & hour -> minute (red)
void clock_gradient() {
    if (!is_on) {
        updateLeds();
        return;
    }
    int ch = getHoursLED(), cm = getMinutesLED();
    // Draw from hour to minute
    for (int i = ch; i < (LED_COUNT*2) && (i%LED_COUNT) != cm; i++) {
        leds[i%LED_COUNT] = CRGB(255, 0, 0);
    }
    // Draw from minute to hour
    for (int i = cm; i < (LED_COUNT*2) && (i%LED_COUNT) != ch; i++) {
        leds[i%LED_COUNT] = CRGB(0, 255, 0);
    }
    FastLED.show();
}

void white() {
    eff_r = 255;
    eff_g = 255;
    eff_b = 255;

    updateLeds();
}
