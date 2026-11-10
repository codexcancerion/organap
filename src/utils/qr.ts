// Pure vector SVG QR Code Generator for OrGanap tickets and passes (FR-17).
import QRCode from "qrcode";

/**
 * Generate an SVG string representation of a QR code with transparent background.
 */
export async function generateQrSvg(token: string): Promise<string> {
  try {
    return await QRCode.toString(token, {
      type: "svg",
      margin: 1,
      color: {
        dark: "#09090b",
        light: "#00000000",
      },
    });
  } catch (err) {
    console.error("QR Code generation error:", err);

    return "";
  }
}
