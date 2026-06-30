const SHAPE_MAP = {
  br: 'Round',
  rb: 'Round',
  brilliant: 'Round',
  round: 'Round',
  princess: 'Princess',
  cushion: 'Cushion',
  emerald: 'Emerald',
  radiant: 'Radiant',
  pear: 'Pear',
  oval: 'Oval',
  marquise: 'Marquise',
  asscher: 'Asscher',
  heart: 'Heart'
};

const CLARITIES = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1', 'I2', 'I3', 'VVS', 'VS', 'SI'];
const CUTS = ['excellent', 'very good', 'good', 'fair', 'poor'];

export const parseFreeText = (text) => {
  const result = {
    title: '',
    size: '',
    shape: '',
    buyPrice: '',
    sellPrice: '',
    color: '',
    note: text,
    customer: '',
    seller: '',
    cut: '',
    clarity: '',
    certNumber: ''
  };

  // Extract Carat (Size) - handles ct, carat, karat, k
  const sizeMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:ct|carat|karat|k)s?\b/i);
  if (sizeMatch) {
    result.size = sizeMatch[1];
  }

  // Extract Shape
  for (const [key, val] of Object.entries(SHAPE_MAP)) {
    if (text.match(new RegExp(`\\b${key}\\b`, 'i'))) {
      result.shape = val;
      break;
    }
  }

  // Extract Color and Clarity combo (e.g. "I VS", "D VVS1")
  // This is safer than just looking for standalone letters like "I" which are often pronouns.
  const colorClarityMatch = text.match(/\b([D-Z])\s*(VVS1|VVS2|VS1|VS2|SI1|SI2|I1|I2|I3|FL|IF|VVS|VS|SI)\b/i);
  if (colorClarityMatch) {
    result.color = colorClarityMatch[1].toUpperCase();
    result.clarity = colorClarityMatch[2].toUpperCase();
  } else {
    // Try explicit "D color"
    const colorMatch = text.match(/\b([D-Z])\b\s*color/i) || text.match(/color\s*\b([D-Z])\b/i);
    if (colorMatch) {
      result.color = colorMatch[1].toUpperCase();
    }
    
    // Try explicit clarity
    for (const clarity of CLARITIES) {
      if (text.match(new RegExp(`\\b${clarity}\\b`, 'i'))) {
        result.clarity = clarity.toUpperCase();
        break;
      }
    }
  }

  // Extract Cut
  for (const cut of CUTS) {
    if (text.match(new RegExp(`\\b${cut}\\b`, 'i'))) {
      result.cut = cut.charAt(0).toUpperCase() + cut.slice(1);
      break;
    }
  }

  // Extract Prices
  const priceMatches = [...text.matchAll(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)k?/gi)];
  const buyMatch = text.match(/buy(?:ing| from)?.*?(?:for)?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
  const sellMatch = text.match(/sell(?:ing| to)?.*?(?:for)?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i);

  if (buyMatch) result.buyPrice = buyMatch[1];
  if (sellMatch) result.sellPrice = sellMatch[1];
  
  if (!result.buyPrice && !result.sellPrice && priceMatches.length > 0) {
    result.buyPrice = priceMatches[0][1];
  }
  if (!result.sellPrice && priceMatches.length > 1) {
      result.sellPrice = priceMatches[1][1];
  }

  // Extract Seller (from [Name])
  const fromMatches = [...text.matchAll(/from\s+([A-Za-z]{2,})/gi)];
  for (const match of fromMatches) {
      const name = match[1].toLowerCase();
      if (!['for', 'me', 'us', 'the', 'a', 'an'].includes(name)) {
          result.seller = match[1].charAt(0).toUpperCase() + match[1].slice(1);
          break;
      }
  }
  
  // Extract Customer (to [Name] or for [Name])
  const toMatches = [...text.matchAll(/(?:to|for)\s+([A-Za-z]{2,})/gi)];
  for (const match of toMatches) {
      const name = match[1].toLowerCase();
      if (!['sale', 'sell', 'me', 'us', 'it', 'the', 'a', 'get', 'buy', 'find', 'make', 'do', 'be', 'have'].includes(name)) {
          result.customer = match[1].charAt(0).toUpperCase() + match[1].slice(1);
          break;
      }
  }

  // Extract Certificate
  const certMatch = text.match(/(?:GIA|IGI|HRD)?\s*(?:cert(?:ificate)?|#)\s*[:]?\s*(\d+)/i) || text.match(/\b(GIA\s*\d+)\b/i);
  if (certMatch) {
    result.certNumber = certMatch[1];
  }

  // Generate a smart title
  const generatedTitle = [
    result.size ? `${result.size}ct` : '',
    result.shape,
    result.color,
    result.clarity,
    result.cut ? `${result.cut} Cut` : ''
  ].filter(Boolean).join(' ');

  result.title = generatedTitle || 'New Diamond Task';

  return result;
};

export const parseFreeTextWithGemini = async (text, apiKey) => {
  const prompt = `You are an expert diamond industry assistant. I will give you a free-text input describing a task involving one or more diamonds.
Extract all diamonds mentioned into a JSON array of objects.
Each object should have these string fields (leave empty string if not found, DO NOT invent values):
- size (e.g. "1.5-2.0", "1")
- shape (e.g. "Round", "Oval")
- color (e.g. "D-F", "I")
- clarity (e.g. "VS1", "VS")
- cut (e.g. "Excellent")
- buyPrice (just the number/range as string)
- sellPrice
- seller (often after "from")
- customer (often after "for" or "to")
- certNumber

Input: "${text}"

Return ONLY a valid JSON array. Do not include markdown blocks like \`\`\`json. E.g.
[
  { "size": "1", "shape": "Round", "color": "D", "clarity": "VS1", "cut": "", "buyPrice": "5000", "sellPrice": "", "seller": "John", "customer": "Guy", "certNumber": "" }
]`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });
  
  if (!response.ok) {
    const errText = await response.text();
    console.error("Gemini API Error details:", errText);
    throw new Error('API request failed');
  }

  const data = await response.json();
  let jsonText = data.candidates[0].content.parts[0].text;
  
  // Clean up markdown if the model included it anyway
  jsonText = jsonText.replace(/```json/gi, '').replace(/```/g, '').trim();
  
  return JSON.parse(jsonText);
};
