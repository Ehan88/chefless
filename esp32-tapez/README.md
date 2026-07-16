# Tapez ESP32 Setup Guide
## What You Need

- ESP32-WROOM development board (~$5)
- NFC stickers (NTAG213, ~$0.50 each)
- Optional: PN532 NFC reader/writer module (for writing stickers)
- USB cable (micro-USB or USB-C depending on board)
- Arduino IDE

## 1. Install Arduino IDE + ESP32 Board

1. Download Arduino IDE from https://www.arduino.cc/en/software
2. Go to **File → Preferences → Additional Board Manager URLs**
3. Add: `https://dl.espressif.com/dl/package_esp32_index.json`
4. Go to **Tools → Board → Board Manager**
5. Search "esp32" → Install **esp32 by Espressif Systems**
6. Install library: **Tools → Manage Libraries → search "Adafruit PN532"**

## 2. Flash the BLE Beacon

1. Open `tapez_ble_beacon.ino`
2. Change `TABLE_ID` (1, 2, 3, etc.)
3. Change `CAFE_URL` to your menu URL
4. Connect ESP32 via USB
5. Select board: **Tools → Board → ESP32 Dev Module**
6. Select port: **Tools → Port → COMx**
7. Click **Upload**

The ESP32 will start broadcasting immediately. Each table gets its own ESP32.

## 3. Write NFC Tags

1. Connect PN532 module to ESP32 (I2C wiring below)
2. Open `tapez_nfc_writer.ino`
3. Change `TABLE_ID` and `MENU_URL`
4. Upload
5. Hold NFC sticker against PN532 reader
6. Serial Monitor will confirm write

### PN532 Wiring (I2C)

| PN532 | ESP32 |
|-------|-------|
| SDA   | GPIO 21 |
| SCL   | GPIO 22 |
| VCC   | 3.3V |
| GND   | GND |

## 4. Range Tuning

In `tapez_ble_beacon.ino`, change `TX_POWER_DBm`:

| Power | Range | Use |
|-------|-------|-----|
| -20 dBm | 1-2m | Small table |
| -12 dBm | 3-5m | **Default — most cafes** |
| -4 dBm | 5-10m | Large tables |
| 0 dBm | 10-15m | Venue-wide |

## 5. URLs to Program

| Table | URL |
|-------|-----|
| 1 | `https://chefless-git-main-atme55.vercel.app/table/1` |
| 2 | `https://chefless-git-main-atme55.vercel.app/table/2` |
| ... | ... |
| 10 | `https://chefless-git-main-atme55.vercel.app/table/10` |

## BOM (Bill of Materials)

| Item | Cost | Qty (10 tables) |
|------|------|-----------------|
| ESP32-WROOM | $2-3 | 10 |
| NFC Stickers (NTAG213) | $0.50 | 10 |
| Micro USB cables | $1 | 10 |
| 3D printed case | $1-2 | 10 |
| **Total** | **~$50** | **10 tables** |

Retail: $25/device × 10 = $250 + $15-25/month subscription
