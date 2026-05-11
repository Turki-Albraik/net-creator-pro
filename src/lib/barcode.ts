import JsBarcode from "jsbarcode";

export function generateBarcodeDataUrl(
  value: string,
  opts: { dark?: string; light?: string; height?: number; width?: number; displayValue?: boolean } = {}
): string {
  const canvas = document.createElement("canvas");
  JsBarcode(canvas, value, {
    format: "CODE128",
    lineColor: opts.dark ?? "#0B1F17",
    background: opts.light ?? "#F4E9B8",
    height: opts.height ?? 70,
    width: opts.width ?? 2,
    margin: 8,
    displayValue: opts.displayValue ?? true,
    fontSize: 14,
    font: "monospace",
    textMargin: 4,
  });
  return canvas.toDataURL("image/png");
}
