import { z } from "zod";
import dotenv from "dotenv";
import { Hono } from "hono";
import * as miio from "miio-api";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { zValidator } from "@hono/zod-validator";

const hex = z.number().nonnegative().lte(255);
const Config = z.object({
  power: z.union([z.literal("on"), z.literal("off")]).optional(),
  brightness: z.number().nonnegative().lte(100).optional(),
  color: z.tuple([hex, hex, hex]).optional(),
});

dotenv.config();
const app = new Hono();

app.use("/*", serveStatic({ root: "./public" }));

app.post("/api", zValidator("json", Config), async (c) => {
  const config = c.req.valid("json");

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

  // const info = await device.call("get_prop", ["power"]);
  // console.log(info);
  return c.json({ data: "success" });
});

const port = Number(process.env.PORT!);
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
