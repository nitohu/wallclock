#include <FastLED.h>

#define LED_COUNT   120
#define LED_PIN     14

CRGB leds[LED_COUNT];

// Color
unsigned short r, g, b;
// Mode (will be necessary for some effects)
int m = 0;
// Brightness (0 -> 1)
float brightness = 1.0f;
// Delay in ms (will be configurable)
unsigned long del = 10;

void fade_effect() {
    if (m < 0 || m > 2) m = 0;
    if (m == 0) {
        r++;
        if (b > 0) b--;
        if (r >= 255) m++;
    }
    if (m == 1) {
        g++;
        if (r > 0) r--;
        if (g >= 255) m++;
    }
    if (m == 2) {
        b++;
        if (g > 0) g--;
        if (b >= 255) m = 0;
    }
    delay(del);
}

void setup() {
    Serial.begin(9600);
    Serial.println("Initializing led stripe...");
    r = 0; b = 0; g = 0;

    // GRB -> activate rgb mode
    FastLED.addLeds<WS2812B, LED_PIN, GRB>(leds, LED_COUNT);
}

void loop() {
    // Set colors
    fade_effect();
    // Update LED
    for (int i = 0; i < LED_COUNT; i++) {
        int rb = r*brightness;
        int gb = g*brightness;
        int bb = b*brightness;
        leds[i] = CRGB(rb, gb, bb);
    }
    FastLED.show();
}
