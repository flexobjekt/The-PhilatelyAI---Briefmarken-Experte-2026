
import { GoogleGenAI, Type } from "@google/genai";
import { Stamp } from "../types";

export const analyzeStamp = async (
  base64Image: string, 
  existingData?: Partial<Stamp>, 
  options?: { keywords?: string; qualityHint?: string; deepAnalysis?: boolean }
): Promise<Partial<Stamp>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';
  
  let contextParts = [];

  if (existingData?.expertStatus === 'appraised') {
    contextParts.push(`
    WICHTIGER KONTEXT: Diese Briefmarke wurde bereits von einem Experten begutachtet.
    Experten-Wert: ${existingData.expertValuation}
    Experten-Note: ${existingData.expertNote}
    DEINE AUFGABE: Nutze diese Informationen als primäre Basis.`);
  }

  if (options?.keywords) {
    contextParts.push(`NUTZER-HINWEIS: "${options.keywords}".`);
  }

  let prompt = `Analysiere diese Briefmarke professionell. Nutze weltweite Datenbanken (Michel, Scott, etc.).
  ${contextParts.join('\n\n')}
  
  IDENTIFIZIERUNG: Land, Jahr, Name, Katalognummer (falls möglich).
  ZUSTAND: Nutze Fachbegriffe (Luxus, Kabinett, MNH, MH, gestempelt). Prüfe Zähnung, Zentrierung und Stempelqualität.
  WERT: Realistischer Marktpreis in Euro.
  HISTORIE: Kontext und philatelistische Bedeutung.`;

  if (options?.deepAnalysis) {
    prompt += `
    FÜHRE EINE TIEFEN-ANALYSE DURCH:
    1. printingMethod: Druckverfahren (z.B. Stichtiefdruck, Offset).
    2. paperType: Papiermerkmale (Wasserzeichen, Seidenfäden, Kreide).
    3. cancellationType: Stempelform (Einkreis, Brückenstempel, etc.).`;
  }

  prompt += `\n\nAntworte strikt im JSON-Format gemäß dem Schema. Falls ein technisches Detail nicht eindeutig identifizierbar ist, lasse das Feld weg oder setze es auf einen leeren String.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image.split(',')[1] || base64Image,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            origin: { type: Type.STRING },
            year: { type: Type.STRING },
            estimatedValue: { type: Type.STRING },
            rarity: { type: Type.STRING },
            condition: { type: Type.STRING },
            description: { type: Type.STRING },
            historicalContext: { type: Type.STRING },
            printingMethod: { type: Type.STRING },
            paperType: { type: Type.STRING },
            cancellationType: { type: Type.STRING },
          },
          required: ["name", "origin", "year", "estimatedValue", "rarity", "condition", "description"],
        },
      },
    });

    const rawText = response.text;
    if (!rawText) {
      throw new Error("Die KI hat keine lesbaren Daten zurückgegeben.");
    }

    // Robust extraction of JSON from the response text
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : rawText;
    
    let parsedData: any;
    try {
      parsedData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, "Raw Text:", rawText);
      throw new Error("Das KI-Ergebnis konnte nicht verarbeitet werden.");
    }

    // Clean and normalize the data structure
    const normalizedData: Partial<Stamp> = {
      name: String(parsedData.name || 'Unbekannte Marke'),
      origin: String(parsedData.origin || 'Unbekannt'),
      year: String(parsedData.year || 'N/A'),
      estimatedValue: String(parsedData.estimatedValue || '0.00 €'),
      rarity: String(parsedData.rarity || 'Nicht klassifiziert'),
      condition: String(parsedData.condition || 'Zustand unklar'),
      description: String(parsedData.description || ''),
      historicalContext: parsedData.historicalContext ? String(parsedData.historicalContext) : undefined,
      printingMethod: parsedData.printingMethod ? String(parsedData.printingMethod) : undefined,
      paperType: parsedData.paperType ? String(parsedData.paperType) : undefined,
      cancellationType: parsedData.cancellationType ? String(parsedData.cancellationType) : undefined,
    };

    return normalizedData;
  } catch (error) {
    console.error("PhilatelyAI Analysis Error:", error);
    if (error instanceof Error && error.message.includes("SAFETY")) {
      throw new Error("Die Analyse wurde aufgrund von Sicherheitsrichtlinien blockiert. Bitte stellen Sie sicher, dass das Bild nur eine Briefmarke zeigt.");
    }
    throw new Error(error instanceof Error ? error.message : "Analyse fehlgeschlagen. Bitte Bildqualität prüfen.");
  }
};
