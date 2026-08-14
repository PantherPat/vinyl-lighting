/**
 * Hardware communication layer — stubbed for now.
 * Swap the body of sendToLightController with an HTTP POST or MQTT
 * publish to the ESP32 later; nothing else in the codebase needs to change.
 */
function sendToLightController(ledIndices) {
  console.log(`[hardware] Lighting LED indices: [${ledIndices.join(', ')}]`);
}

module.exports = { sendToLightController };
