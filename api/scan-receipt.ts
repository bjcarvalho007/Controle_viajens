import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { image, mimeType } = req.body;
    if (!image) return res.status(400).json({ error: "Image data required" });

    const prompt = `Analyze this receipt image and extract the information in JSON format. 
    Be precise. If a field is not found, leave it empty.
    Translate everything to Portuguese.
    
    Fields to extract:
    - productName: Clear title of the main expense (e.g., Almoço Executivo, Hospedagem Hotel X)
    - vendor: Name of the commercial establishment
    - amount: Total total as a number (float)
    - date: Date in YYYY-MM-DD format
    - city: City name
    - state: UF (2 letters)
    - category: Recommended category (Alimentação, Combustível, Hospedagem, Pedágio, Manutenção, Ferramentas, Materiais, Emergências, Transporte, Outros)
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: image, mimeType: mimeType || "image/jpeg" } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            productName: { type: Type.STRING },
            vendor: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            date: { type: Type.STRING },
            city: { type: Type.STRING },
            state: { type: Type.STRING },
            category: { type: Type.STRING }
          }
        }
      }
    });

    const extractedData = JSON.parse(response.text || "{}");
    return res.status(200).json(extractedData);
  } catch (error: any) {
    console.error("OCR Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
