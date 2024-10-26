import { rgbToHex, hexToRgb } from "./utils.js";

let ws;
const glow = document.getElementById("glow");
const powerSwitch = document.getElementById("power");
const colorPicker = document.getElementById("color");
const rootStyle = document.querySelector(":root").style;
const brightnessSlider = document.getElementById("brightness");

function connectToWebSocket() {
  ws = new WebSocket("ws://localhost:8787");
  ws.onerror = () => {
    console.log("websocket reconnecting...");
    setTimeout(connectToWebSocket, 1000);
  };
  ws.onopen = () => {
    console.log("websocket connected!");
    ws.send(JSON.stringify({ type: "new_client" }));
  };
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    console.log(msg);
    switch (msg.type) {
      case "config":
        updateUi(msg.data);
        break;
      default:
        break;
    }
  };
}

function updateUi(payload) {
  const { power, brightness, color } = payload;
  if (power === "off") {
    glow.style.opacity = 0;
  } else {
    glow.style.opacity = "var(--bulb-opacity)";
  }
  const hex = rgbToHex(color);
  const bColor = power === "on" ? hex : "#ccc";
  const bOpacity = power === "on" ? brightness / 100 : 1;

  colorPicker.value = hex;
  brightnessSlider.value = brightness;
  powerSwitch.checked = power === "on" ? true : false;

  rootStyle.setProperty("--bulb-color", bColor);
  rootStyle.setProperty("--bulb-opacity", bOpacity);
}

function updateBulbState() {
  const power = powerSwitch.checked ? "on" : "off";
  const brightness = brightnessSlider.value;
  const color = hexToRgb(colorPicker.value);

  const payload = {
    power: power,
    color: color,
    brightness: parseInt(brightness),
  };

  updateUi(payload);
  sendToServer(payload);
}

function sendToServer(payload) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: "config", data: payload }));
  }
}

powerSwitch.addEventListener("change", updateBulbState);
brightnessSlider.addEventListener("input", updateBulbState);
colorPicker.addEventListener("input", updateBulbState);

connectToWebSocket();
updateBulbState();
