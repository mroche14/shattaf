
import { GoogleGenAI } from "@google/genai";

export async function askConsultant(question: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const systemInstruction = `
    Tu es le Concierge IA pour "Oasis Shattaf", une entreprise de Shattafs (douchettes de toilette) de luxe en Guadeloupe.
    Ton ton est professionnel, sophistiqué et pédagogique.
    Le fondateur a vécu 5 ans à Dubaï et souhaite apporter ce standard d'hygiène en Guadeloupe.
    Argument principal : Utiliser uniquement du papier toilette est un manque d'hygiène (comme essayer de nettoyer une tache de chocolat sur un tapis avec du papier sec vs de l'eau).
    Positionne le Shattaf comme l'expérience "douche fraîche" sans l'inconvénient d'une douche complète.
    Points forts : Luxe, moderne, installation complète gérée par nous.
    Réponds aux questions sur l'hygiène, l'installation (c'est facile mais on le fait pour vous) et pourquoi Oasis Shattaf est supérieur aux marques génériques.
    Tes réponses doivent être concises, élégantes et exclusivement en français.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: question,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Erreur Concierge :", error);
    return "Je m'excuse, mon réseau est momentanément saturé. Veuillez réessayer dans un instant ou contacter notre équipe directement.";
  }
}
