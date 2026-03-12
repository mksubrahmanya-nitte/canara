import { extractTextFromImage, parseOcrText } from "../services/ocrService.js";

/**
 * POST /api/ocr/scan
 * Accepts a multipart image upload, runs Tesseract OCR,
 * and extracts merchant and amount.
 *
 * Field name: "image" or "receipt"
 */
export const scanReceipt = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file uploaded. Use field name 'image' or 'receipt'." });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp", "image/tiff"];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(415).json({
        message: `Unsupported file type: ${req.file.mimetype}. Allowed: jpeg, png, webp, gif, bmp, tiff.`,
      });
    }

    const rawText = await extractTextFromImage(req.file.buffer);
    console.log("[OCR] Raw Text:", rawText);

    if (!rawText || !rawText.trim()) {
      return res.status(200).json({ merchant: "", amount: "", rawText: "", message: "No text detected in the image." });
    }

    const parsed = parseOcrText(rawText);
    return res.status(200).json(parsed);

  } catch (error) {
    console.error("[OCR] Error:", error.message);
    return res.status(500).json({ message: "OCR processing failed.", error: error.message });
  }
};
