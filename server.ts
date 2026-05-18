import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API: Scan Receipt OCR
  app.post("/api/scan-receipt", async (req, res) => {
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
      res.json(extractedData);
    } catch (error: any) {
      console.error("OCR Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API: Get State from City
  app.post("/api/get-state", async (req, res) => {
    try {
      const { city } = req.body;
      if (!city) return res.status(400).json({ error: "City name required" });

      const prompt = `Based on the city name "${city}", determine which Brazilian state (UF) it belongs to. 
      Return only the 2-letter UF code. 
      If you are unsure or multiple exist, return the most likely one in Brazil.
      Return the result as a simple JSON object with a field "state".`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
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
      res.json(data);
    } catch (error: any) {
      console.error("Lookup Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
