import dotenv from "dotenv";
import * as miio from "miio-api";
import { bytesToRgb } from "./utils";
import { Config, Device } from "./types";

dotenv.config();

export async function getDevice() {
  const device = await miio.device({
    address: process.env.DEVICE_ADDRESS!,
    token: process.env.DEVICE_TOKEN!,
  });
  return device;
}

export async function getDeviceState(device: Device) {
  const props = ["power", "bright", "rgb"];
  const [power, brightness, rgb]: any = await device.call("get_prop", props);
  const color = bytesToRgb(rgb);
  return { power, brightness, color };
}

export async function applyConfigToDevice(device: Device, config: Config) {
  Object.keys(config).forEach(async (c) => {
    switch (c) {
      case "power":
        await device.call("set_power", [config[c]]);
        break;
      case "brightness":
        const brightness = config[c]! > 0 ? config[c] : 1;
        await device.call("set_bright", [brightness]);
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
