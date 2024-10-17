const bulb = document.getElementById("bulb");
const powerSwitch = document.getElementById("power");
const brightnessSlider = document.getElementById("brightness");
const colorPicker = document.getElementById("color");

function updateBulbState() {
  const power = powerSwitch.checked ? "on" : "off";
  const brightness = brightnessSlider.value;
  const color = hexToRgb(colorPicker.value);

  // Update bulb appearance
  bulb.style.backgroundColor = power === "on" ? colorPicker.value : "#ccc";
  bulb.style.opacity = power === "on" ? brightness / 100 : 0.5;

  // Prepare payload for API
  const payload = {
    power: power,
    brightness: parseInt(brightness),
    color: color,
  };

  // Send payload to API
  sendToApi(payload);
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function sendToApi(payload) {
  console.log("Sending to API:", payload);
  fetch("/api", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
    .then((response) => response.json())
    .then((data) => console.log("Success:", data))
    .catch((error) => console.error("Error:", error));
}

// Add event listeners
powerSwitch.addEventListener("change", updateBulbState);
brightnessSlider.addEventListener("input", updateBulbState);
colorPicker.addEventListener("input", updateBulbState);

// Initial update
updateBulbState();
