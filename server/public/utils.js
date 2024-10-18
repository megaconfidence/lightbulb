export function rgbToHex(rgb) {
  const hex = rgb
    .map((x) => {
      const h = x.toString(16);
      return h.length === 1 ? "0" + h : h;
    })
    .join("");
  return "#" + hex;
}
export function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}
