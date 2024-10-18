import { Hono } from "hono";
import { WebSocket } from "ws";
import { zConfig } from "./types";
import { serve } from "@hono/node-server";
import { zValidator } from "@hono/zod-validator";
import { serveStatic } from "@hono/node-server/serve-static";
import { applyConfigToDevice, getDevice, getDeviceState } from "./device";

let timeout: NodeJS.Timeout;
const device = await getDevice();
const port = Number(process.env.PORT!);

function connectToWebSocket() {
  const ws = new WebSocket("ws://localhost:8787");

  ws.onerror = () => {
    console.log("websocket reconnecting...");
    setTimeout(connectToWebSocket, 1000);
  };
  ws.onopen = () => {
    console.log("websocket connected!");
  };
  ws.onmessage = async (e) => {
    const msg = JSON.parse(e.data.toString());
    console.log(msg);
    switch (msg.type) {
      case "config":
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => applyConfigToDevice(device, msg.data), 1000);
        break;
      case "new_client":
        const data = await getDeviceState(device);
        return ws.send(JSON.stringify({ type: "config", data }));
      default:
        break;
    }
  };
}
connectToWebSocket();

const app = new Hono();

app.use("/*", serveStatic({ root: "./public" }));

app.get("/config", async (c) => {
  const data = await getDeviceState(device);
  return c.json({ data });
});

app.post("/config", zValidator("json", zConfig), async (c) => {
  const config = c.req.valid("json");
  if (timeout) clearTimeout(timeout);
  timeout = setTimeout(() => applyConfigToDevice(device, config), 1000);
  return c.json({ data: "success" });
});

serve({ fetch: app.fetch, port });
console.log(`Server is running on port ${port}`);
