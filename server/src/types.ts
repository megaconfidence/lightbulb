import { z } from "zod";
import * as miio from "miio-api";

const zHex = z.number().nonnegative().lte(255);
export const zConfig = z.object({
  power: z.union([z.literal("on"), z.literal("off")]).optional(),
  brightness: z.number().nonnegative().lte(100).optional(),
  color: z.tuple([zHex, zHex, zHex]).optional(),
});

export type Config = z.infer<typeof zConfig>;
export type Device = miio.Device;
