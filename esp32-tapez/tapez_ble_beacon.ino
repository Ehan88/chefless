/*
 * TAPEZ ESP32 BLE Beacon
 * ───────────────────────
 * Broadcasts a BLE advertising packet containing:
 *   - Table ID
 *   - Cafe URL (so phone can open menu)
 *
 * Config:
 *   - Change TABLE_ID and CAFE_URL below
 *   - Adjust TX_POWER for range control
 *
 * Hardware: ESP32-WROOM (built-in BLE)
 * IDE: Arduino IDE with ESP32 board package
 *
 * Install:
 *   1. Arduino IDE → Preferences → Board Manager URLs:
 *      https://dl.espressif.com/dl/package_esp32_index.json
 *   2. Board Manager → search "esp32" → install
 *   3. Select board: "ESP32 Dev Module"
 *   4. Upload this sketch
 */

#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLEAdvertising.h>

// ═══════════════════════════════════════════════════════════
// CONFIGURE THESE
// ═══════════════════════════════════════════════════════════

// Table number (1, 2, 3, etc.)
#define TABLE_ID 1

// Your Chefless/Tapez menu URL
// Customers will be directed here
#define CAFE_URL "https://chefless-git-main-atme55.vercel.app/table/1"

// BLE device name (shown in scan)
#define DEVICE_NAME "Tapez-T1"

// Advertising interval (in ms, lower = more responsive, more battery)
#define ADV_INTERVAL_MS 100

// TX Power levels:
//   -20 dBm → ~1-2m  (single table, precise)
//   -12 dBm → ~3-5m  (small table area)
//   -4 dBm  → ~5-10m (large area)
//   0 dBm   → ~10-15m (venue-wide)
#define TX_POWER_DBm -12

// ═══════════════════════════════════════════════════════════
// CUSTOM SERVICE UUID (Tapez proprietary)
// ═══════════════════════════════════════════════════════════

// Custom 128-bit UUID for Tapez service
// Generated unique UUID - phones will filter for this
#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define TABLE_CHAR_UUID     "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define URL_CHAR_UUID       "a81b07ea-f5b6-8846-e136-3e48b5fe014b"

BLEServer *pServer = NULL;
bool deviceConnected = false;
bool oldDeviceConnected = false;

// ═══════════════════════════════════════════════════════════
// SERVER CALLBACKS
// ═══════════════════════════════════════════════════════════

class MyServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    deviceConnected = true;
    Serial.println("📱 Phone connected");
  }

  void onDisconnect(BLEServer* pServer) {
    deviceConnected = false;
    Serial.println("📱 Phone disconnected");
  }
};

// ═══════════════════════════════════════════════════════════
// SETUP
// ═══════════════════════════════════════════════════════════

void setup() {
  Serial.begin(115200);
  Serial.println("\n═══════════════════════════════════════");
  Serial.println("  TAPEZ BLE Beacon");
  Serial.println("═══════════════════════════════════════");
  Serial.printf("  Table:   #%d\n", TABLE_ID);
  Serial.printf("  URL:     %s\n", CAFE_URL);
  Serial.printf("  TX Power: %d dBm\n", TX_POWER_DBm);
  Serial.println("═══════════════════════════════════════\n");

  // ─── Initialize BLE ──────────────────────────────────
  BLEDevice::init(DEVICE_NAME);
  BLEDevice::setPower(TX_POWER_DBm);

  // ─── Create Server ───────────────────────────────────
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  // ─── Create Service ──────────────────────────────────
  BLEService *pService = pServer->createService(SERVICE_UUID);

  // ─── Table ID Characteristic ─────────────────────────
  BLECharacteristic *tableChar = pService->createCharacteristic(
    TABLE_CHAR_UUID,
    BLECharacteristic::PROPERTY_READ
  );
  String tableStr = String(TABLE_ID);
  tableChar->setValue(tableStr.c_str());

  // ─── URL Characteristic ──────────────────────────────
  BLECharacteristic *urlChar = pService->createCharacteristic(
    URL_CHAR_UUID,
    BLECharacteristic::PROPERTY_READ
  );
  urlChar->setValue(CAFE_URL);

  // ─── Start Service ───────────────────────────────────
  pService->start();

  // ─── Configure Advertising ───────────────────────────
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);

  // iPhone compatibility — needed for iOS to show the device
  pAdvertising->setMinPreferred(0x06);
  pAdvertising->setMinPreferred(0x12);

  // Set advertising interval
  pAdvertising->setMinInterval(ADV_INTERVAL_MS * 1000 / 625); // Convert ms to 0.625ms units
  pAdvertising->setMaxInterval(ADV_INTERVAL_MS * 1000 / 625);

  // Also set scan response data (shows in scan results)
  BLEAdvertisementData scanData;
  scanData.setName(DEVICE_NAME);
  scanData.setManufacturerData(String("Tapez:T" + String(TABLE_ID)).c_str());
  pAdvertising->setScanResponseData(scanData);

  // Start advertising
  BLEDevice::startAdvertising();
  Serial.println("📡 BLE advertising started");
  Serial.printf("📡 Device: %s\n", DEVICE_NAME);
  Serial.printf("📡 Waiting for connections...\n");
}

// ═══════════════════════════════════════════════════════════
// LOOP
// ═══════════════════════════════════════════════════════════

void loop() {
  // Handle connection/disconnection events
  if (!deviceConnected && oldDeviceConnected) {
    // Give the BLE stack time, then restart advertising
    delay(500);
    pServer->startAdvertising();
    Serial.println("📡 Restarted advertising");
    oldDeviceConnected = deviceConnected;
  }

  if (deviceConnected && !oldDeviceConnected) {
    oldDeviceConnected = deviceConnected;
  }

  // Small delay to reduce CPU usage
  delay(100);
}
