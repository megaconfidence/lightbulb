const bulb = document.getElementById("bulb");
const powerSwitch = document.getElementById("power");
const brightnessSlider = document.getElementById("brightness");
const colorPicker = document.getElementById("color");

let ws;
function connectToWebSocket() {
  ws = new WebSocket("ws://localhost:8787");
  ws.onerror = () => {
    console.log("websocket reconnecting...");
    setTimeout(connectToWebSocket, 1000);
  };
  ws.onopen = () => {
    ws.send(JSON.stringify({ type: "new_client" }));
  };
}
connectToWebSocket();

ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  console.log(msg);
  switch (msg.type) {
    case "config":
      hangleUiSync(msg.data);
      break;
    default:
      break;
  }
};

function hangleUiSync(payload) {
  const { power, brightness, color } = payload;
  powerSwitch.checked = power === "on" ? true : false;
  brightnessSlider.value = brightness;
  colorPicker.value = rgbToHex(color);
  updateBulbUi(payload);
}

function updateBulbState() {
  const power = powerSwitch.checked ? "on" : "off";
  const brightness = brightnessSlider.value;
  const color = hexToRgb(colorPicker.value);

  // Prepare payload for API
  const payload = {
    power: power,
    brightness: parseInt(brightness),
    color: color,
  };

  updateBulbUi(payload);
  sendToApi(payload);
}
function updateBulbUi({ power, color, brightness }) {
  bulb.style.backgroundColor = power === "on" ? rgbToHex(color) : "#ccc";
  bulb.style.opacity = power === "on" ? brightness / 100 : 0.5;
}
function rgbToHex(rgb) {
  const hex = rgb
    .map((x) => {
      const h = x.toString(16);
      return h.length === 1 ? "0" + h : h;
    })
    .join("");
  return "#" + hex;
}
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function sendToApi(payload) {
  console.log("Sending to API:", payload);
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: "config", data: payload }));
  }
}

// Add event listeners
powerSwitch.addEventListener("change", updateBulbState);
brightnessSlider.addEventListener("input", updateBulbState);
colorPicker.addEventListener("input", updateBulbState);

// Initial update
updateBulbState();
