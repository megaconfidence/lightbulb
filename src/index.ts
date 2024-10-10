import { serve } from "@hono/node-server";
import dotenv from "dotenv";
import { Hono } from "hono";
import * as miio from "miio-api";
import { serveStatic } from "@hono/node-server/serve-static";

interface Config {
  power: "on" | "off";
  brightness: number;
  color: [number, number, number];
}

dotenv.config();
const app = new Hono();

app.use("/*", serveStatic({ root: "./public" }));
app.post("/api", async (c) => {
  const config: Config = await c.req.json();

  const device = await miio.device({
    address: process.env.DEVICE_ADDRESS!,
    token: process.env.DEVICE_TOKEN!,
  });

  Object.keys(config).forEach(async (c) => {
    switch (c) {
      case "power":
        await device.call("set_power", [config[c]]);
        break;
      case "brightness":
        await device.call("set_bright", [config[c]]);
        break;
      case "color":
        const color = config[c];
        const rgb = color[0] * 65536 + color[1] * 256 + color[2];
        await device.call("set_rgb", [rgb]);
        break;
      default:
        break;
    }
  });

  const info = await device.call("get_prop", ["power"]);
  console.log(info);
  return c.json({ bool: true });
});

const port = Number(process.env.PORT!);
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
