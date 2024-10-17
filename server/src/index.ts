import { z } from "zod";
import dotenv from "dotenv";
import { Hono } from "hono";
import * as miio from "miio-api";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { zValidator } from "@hono/zod-validator";
import { WebSocket } from "ws";

const hex = z.number().nonnegative().lte(255);
const Config = z.object({
  power: z.union([z.literal("on"), z.literal("off")]).optional(),
  brightness: z.number().nonnegative().lte(100).optional(),
  color: z.tuple([hex, hex, hex]).optional(),
});

dotenv.config();

let timeout;
const ws = new WebSocket("ws://localhost:8787");

ws.onmessage = (e) => {
  const msg = JSON.parse(e.data.toString());
  console.log(msg);
  switch (msg.type) {
    case "config":
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => applyConfig(msg.data), 1000);
      break;
    default:
      break;
  }
};

const app = new Hono();

app.use("/*", serveStatic({ root: "./public" }));

app.post("/api", zValidator("json", Config), async (c) => {
  const config = c.req.valid("json");

  if (timeout) clearTimeout(timeout);
  timeout = setTimeout(() => applyConfig(config), 1000);
  // const info = await device.call("get_prop", ["power"]);
  // console.log(info);
  return c.json({ data: "success" });
});

const device = await miio.device({
  address: process.env.DEVICE_ADDRESS!,
  token: process.env.DEVICE_TOKEN!,
});
console.log(await device.call("get_prop", ["power", "bright", "rgb"]));
function getColorArrayFromRGB(rgb) {
  // Extract the red, green, and blue components
  const red = (rgb >> 16) & 0xff; // Extract the first 8 bits (red component)
  const green = (rgb >> 8) & 0xff; // Extract the middle 8 bits (green component)
  const blue = rgb & 0xff; // Extract the last 8 bits (blue component)

  return [red, green, blue];
}

(async () => {
  const [power, brightness, rgb] = await device.call("get_prop", [
    "power",
    "bright",
    "rgb",
  ]);
  const color = getColorArrayFromRGB(rgb);
  const payload = { type: "config", data: { power, brightness, color } };
  ws.send(JSON.stringify(payload));
})();

async function applyConfig(config: z.infer<typeof Config>) {
  Object.keys(config).forEach(async (c) => {
    switch (c) {
      case "power":
        await device.call("set_power", [config[c]]);
        break;
      case "brightness":
        await device.call("set_bright", [config[c]]);
        break;
      case "color":
        const color = config[c]!;
        const rgb = color[0] * 65536 + color[1] * 256 + color[2];
        await device.call("set_rgb", [rgb]);
        break;
      default:
        break;
    }
  });
}

const port = Number(process.env.PORT!);
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
