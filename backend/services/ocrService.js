import Tesseract from "tesseract.js";

/**
 * Perform OCR on an image buffer using Tesseract.js.
 * @param {Buffer} imageBuffer - Raw image bytes
 * @returns {Promise<string>} - Extracted text
 */
export async function extractTextFromImage(imageBuffer) {
  const { data: { text } } = await Tesseract.recognize(imageBuffer, "eng", {
    logger: m => {
      if (m.status === "recognizing text") {
        console.log(`[OCR Progress] ${Math.round(m.progress * 100)}%`);
      }
    }
  });
  return text || "";
}

/**
 * Parse OCR text to extract amount and merchant basic heuristic.
 * @param {string} text - Raw OCR text
 * @returns {Object} - { merchant, amount, rawText }
 */
export function parseOcrText(text) {
  if (!text || !text.trim()) {
    return { merchant: "", amount: "", rawText: "" };
  }

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  // 1. Better Amount Detection
  let amounts = [];
  
  // Pattern 1: Keywords like TOTAL or GRAND TOTAL
  const keywordPatterns = [
    /(?:TOTAL|GRAND TOTAL|NET AMOUNT|BILL AMOUNT|TOTAL DUE)[:\s₹$]*([\d,]+\.?\d{0,2})/i,
    /(?:TOTAL|AMOUNT)[:\s₹$]*([\d,]+\.?\d{0,2})/i
  ];

  for (const pattern of keywordPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const val = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(val)) amounts.push(val);
    }
  }

  // Pattern 2: Currency symbols
  const currencyMatches = text.match(/[₹$]\s?([\d,]+\.\d{2})/g) || [];
  currencyMatches.forEach(m => {
    const val = parseFloat(m.replace(/[₹$\s,]/g, ''));
    if (!isNaN(val)) amounts.push(val);
  });

  // Pattern 3: Decimals mapping to prices
  const decimals = text.match(/\d+[.,]\d{2}/g) || [];
  decimals.forEach(m => {
    const val = parseFloat(m.replace(',', '.'));
    if (!isNaN(val)) amounts.push(val);
  });

  // Fallback Pattern: Any numbers
  if (amounts.length === 0) {
    const integers = text.match(/\d+/g) || [];
    amounts = integers.map(n => parseFloat(n)).filter(a => a > 0);
  }

  // Heuristic: The largest number is usually the total
  const amountVal = amounts.length > 0 ? Math.max(...amounts) : null;
  const amount = amountVal !== null ? amountVal.toString() : "";

  // 2. Better Merchant Detection
  let merchant = "";
  const junkWords = /total|tax|date|cash|change|payment|visa|master|bill|invoice|receipt|welcome|thank|tel|phone|address/i;

  for (let i = 0; i < Math.min(lines.length, 8); i++) {
    const line = lines[i];
    if (line.replace(/[^0-9]/g, "").length / line.length > 0.4) continue;
    if (junkWords.test(line)) continue;
    if (line.length < 3) continue;
    
    merchant = line;
    break;
  }

  // Fallback 1: First line with letters that isn't junk
  if (!merchant) {
    for (const line of lines) {
      if (/[a-zA-Z]{3,}/.test(line) && !junkWords.test(line)) {
        merchant = line;
        break;
      }
    }
  }

  // Fallback 2: First line of the receipt if still nothing
  if (!merchant && lines.length > 0) {
    merchant = lines[0];
  }

  // Fallback 3: "Unknown Store" if we found an amount but still no merchant
  if ((!merchant || merchant.length < 2) && amount) {
    merchant = "Unknown Store";
  }

  return { merchant, amount, rawText: text };
}
