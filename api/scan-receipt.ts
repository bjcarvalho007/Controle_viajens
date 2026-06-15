import { GoogleGenAI, Type } from "@google/genai";

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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("OCR Error: GEMINI_API_KEY is not defined in environment variables.");
    return res.status(500).json({ 
      error: "Chave GEMINI_API_KEY não configurada no servidor Vercel. Por favor, adicione a variável de ambiente GEMINI_API_KEY com sua chave do Google AI Studio nas configurações do projeto da Vercel para habilitar a digitalização automatizada." 
    });
  }

  try {
    const { image, mimeType } = req.body;
    if (!image) return res.status(400).json({ error: "Image data required" });

    const ai = new GoogleGenAI({ 
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const prompt = `Analyze this receipt image and extract the information in JSON format. 
    Be very precise and only extract authentic values written in the invoice/receipt. If a field is not found or unclear, leave it empty or null.
    Translate the extracted texts to Portuguese.
    
    Fields to extract:
    - productName: Clear title of the main expense (e.g., Almoço Executivo, Hospedagem Hotel X, Combustível)
    - vendor: Real name of the commercial establishment / CNPJ name if present
    - amount: Total total cost as a number (float/decimal)
    - date: Date of the expense in YYYY-MM-DD format
    - city: City name where the establishment is located
    - state: UF (2 letters of the Brazilian state, e.g., SP, RJ, MG)
    - category: Recommended category (Alimentação, Combustível, Hospedagem, Pedágio, Manutenção, Ferramentas, Materiais, Emergências, Transporte, Outros)
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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

    const text = response.text;
    if (!text) {
      throw new Error("O modelo da Inteligência Artificial retornou uma resposta vazia.");
    }

    const extractedData = JSON.parse(text);
    return res.status(200).json(extractedData);
  } catch (error: any) {
    console.error("OCR Error in Serverless Function:", error);
    return res.status(500).json({ 
      error: error.message || "Erro interno do servidor ao processar imagem." 
    });
  }
}
