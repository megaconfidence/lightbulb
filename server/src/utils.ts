export function bytesToRgb(rgb: number) {
  const red = (rgb >> 16) & 0xff;
  const green = (rgb >> 8) & 0xff;
  const blue = rgb & 0xff;
  return [red, green, blue];
}
