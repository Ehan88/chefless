/*
 * TAPEZ NFC Tag Writer
 * ────────────────────
 * Writes a URL to an NFC sticker using ESP32 + PN532 NFC module.
 *
 * Hardware:
 *   - ESP32-WROOM
 *   - PN532 NFC module (connected via I2C)
 *
 * Wiring:
 *   PN532 → ESP32
 *   SDA   → GPIO 21
 *   SCL   → GPIO 22
 *   VCC   → 3.3V
 *   GND   → GND
 *
 * Install libraries:
 *   Arduino IDE → Library Manager → search "Adafruit PN532"
 *
 * Usage:
 *   1. Configure TABLE_ID and MENU_URL below
 *   2. Upload to ESP32
 *   3. Open Serial Monitor (115200 baud)
 *   4. Place NFC sticker on PN532 reader
 *   5. It writes the URL automatically
 */

#include <Wire.h>
#include <Adafruit_PN532.h>

// ═══════════════════════════════════════════════════════════
// CONFIGURE THESE
// ═══════════════════════════════════════════════════════════

#define TABLE_ID 1
#define MENU_URL "https://chefless-git-main-atme55.vercel.app/table/1"

// PN532 I2C pins
#define PN532_SDA 21
#define PN532_SCL 22

// ═══════════════════════════════════════════════════════════

Adafruit_PN532 nfc(PN532_SDA, PN532_SCL);

void setup() {
  Serial.begin(115200);
  Serial.println("\n═══════════════════════════════════════");
  Serial.println("  TAPEZ NFC Tag Writer");
  Serial.println("═══════════════════════════════════════");
  Serial.printf("  Table: #%d\n", TABLE_ID);
  Serial.printf("  URL:   %s\n", MENU_URL);
  Serial.println("═══════════════════════════════════════\n");

  nfc.begin();

  uint32_t versiondata = nfc.getFirmwareVersion();
  if (!versiondata) {
    Serial.println("❌ Didn't find PN532 board. Check wiring!");
    while (1) { delay(1000); }
  }

  Serial.printf("✅ PN532 firmware: %d.%d\n", (versiondata >> 16) & 0xFF, (versiondata >> 8) & 0xFF);
  nfc.SAMConfig();
  Serial.println("📡 Waiting for NFC tag...\n");
}

void loop() {
  uint8_t uid[] = { 0, 0, 0, 0, 0, 0, 0 };
  uint8_t uidLength;

  // Wait for an NFC tag
  if (nfc.readPassiveTargetID(PN532_PICC_ISO14443A, uid, &uidLength, 1000)) {
    Serial.println("\n🏷️  NFC tag detected!");

    // Build NDEF message with URL
    uint8_t ndefMessage[256];
    uint16_t ndefLen = buildNdefUri(MENU_URL, ndefMessage);

    Serial.printf("📝 Writing URL: %s\n", MENU_URL);

    if (nfc.ntag2xx_WritePage(4, ndefMessage)) {
      Serial.println("✅ Tag written successfully!");
      Serial.printf("   Table #%d → %s\n", TABLE_ID, MENU_URL);
    } else {
      Serial.println("❌ Write failed. Try another tag.");
    }

    delay(2000);
  }
}

/*
 * Build an NDEF URI record
 * Format: [header] [length] [type] [URI identifier] [URI string]
 *
 * URI prefix codes:
 *   0x00 = no prefix
 *   0x01 = http://www.
 *   0x02 = https://www.
 *   0x03 = http://
 *   0x04 = https://
 */
uint16_t buildNdefUri(const char* url, uint8_t* buffer) {
  // Determine URI prefix
  uint8_t prefixCode = 0;
  const char* urlBody = url;

  if (strncmp(url, "https://", 8) == 0) {
    prefixCode = 0x04;
    urlBody = url + 8;
  } else if (strncmp(url, "http://", 7) == 0) {
    prefixCode = 0x03;
    urlBody = url + 7;
  } else if (strncmp(url, "https://www.", 12) == 0) {
    prefixCode = 0x02;
    urlBody = url + 12;
  } else if (strncmp(url, "http://www.", 11) == 0) {
    prefixCode = 0x01;
    urlBody = url + 11;
  }

  uint8_t urlLen = strlen(urlBody);

  // NDEF Message
  // Record header: MB=1, ME=1, CF=0, SR=1, IL=0, TNF=0x01 (NFC Forum well-known)
  uint8_t header = 0xD1; // MB=1, ME=1, SR=1, TNF=0x01

  // Record type: 'U' (URI)
  uint8_t type = 0x55;
  uint8_t typeLen = 0x01;

  // Payload: URI identifier code + URI string
  uint8_t payloadLen = 1 + urlLen; // prefix code + URL

  // Build buffer
  uint16_t idx = 0;
  buffer[idx++] = header;   // Record header
  buffer[idx++] = typeLen;  // Type length (1)
  buffer[idx++] = payloadLen; // Payload length
  buffer[idx++] = type;     // Type: 'U'
  buffer[idx++] = prefixCode; // URI prefix
  memcpy(buffer + idx, urlBody, urlLen);
  idx += urlLen;

  return idx;
}
