#include <FastLED.h>
#include <ESP8266WiFi.h>

#define LED_COUNT   120
#define LED_PIN     14

CRGB leds[LED_COUNT];

// Color
unsigned short r = 0, g = 0, b = 0;
// Mode (will be necessary for some effects)
short m = 0;
short is_on = 1;
// Brightness (0 -> 1)
float brightness = 0.3f;
// Delay in ms (will be configurable)
unsigned long del = 10;
// Wifi stuff
WiFiClient client;
int wifiStatus = WL_IDLE_STATUS;

void updateLeds();

// Effects
void fade_effect();
void turn_off();
void turn_on();
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
        Serial.print("Try to connect to ");
        Serial.print(WIFI_SSID);
        Serial.println();
        // Try to connect
        wifiStatus = WiFi.begin(WIFI_SSID, WIFI_PASS);
        if (wifiStatus == WL_CONNECTED) Serial.println("Connection success!");
        else if (wifiStatus == WL_CONNECT_FAILED) { 
            Serial.println("Connection failed for some reason.");
            // Don't spam the router with requests
            while (true) {}
        } else delay(5000);
    }
}

void loop() {
    /* Connection success */
    // Set colors
    fade_effect();
    // Update LED
    updateLeds();
    delay(del);
}

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

void fade_effect() {
    if (m < 0 || m > 2) m = 0;
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
}

void turn_off() {
    is_on = 0;
}

void turn_on() {
    is_on = 1;
}

void white() {
    r = 255;
    g = 255;
    b = 255;
}
