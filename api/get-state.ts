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
    return res.status(200).json({ state: "SP" }); // Soft fallback in case key is missing for simple state code query
  }

  try {
    const { city } = req.body;
    if (!city) return res.status(400).json({ error: "City name required" });

    const ai = new GoogleGenAI({ 
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const prompt = `Based on the city name "${city}", determine which Brazilian state (UF) it belongs to. 
    Return only the 2-letter UF code. 
    If you are unsure or multiple exist, return the most likely one in Brazil.
    Return the result as a simple JSON object with a field "state".`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            state: { type: Type.STRING }
          },
          required: ["state"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    return res.status(200).json(data);
  } catch (error: any) {
    console.error("Lookup Error:", error);
    return res.status(200).json({ state: "SP" }); // Soft fallback on error for state
  }
}
