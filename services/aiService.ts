
import { GoogleGenerativeAI } from "@google/generative-ai";
import { MarketTheme, Brand, AdvisorProfile } from "../types";
import { settingsStore } from "./settingsService";

const getGenAI = () => {
  const apiKey = settingsStore.getApiKey('gemini');
  if (!apiKey) throw new Error("Mangler Gemini API-nøkkel. Gå til Innstillinger → AI-nøkler.");
  return new GoogleGenerativeAI(apiKey);
};

const getSystemPrompt = (brand: Brand, profile: AdvisorProfile): string => {
  const today = new Date().toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" });

  return `
    DU ER en senior eiendomsrådgiver og markedsanalytiker for ${brand.name}.
    DIN ROLLE: ${profile.name}, ekspert på det spanske eiendomsmarkedet, spesielt Costa Blanca og Costa Calida.
    DATO: ${today}.
    MERKEVARE: ${brand.name} (${brand.type}) - ${brand.description}. TONE: ${brand.tone}.
    
    VIKTIG: Svar alltid på norsk. Vær profesjonell, innsiktsfull og datadrevet.
  `;
};

export const getMarketPulse = async (
  location: string,
  theme: MarketTheme = MarketTheme.GENERAL,
  brand: Brand,
  profile: AdvisorProfile
): Promise<{ text: string; sources: any[] }> => {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const systemInstruction = getSystemPrompt(brand, profile);
  const prompt = `Lag en detaljert markedsanalyse for ${location} med fokus på temaet: ${theme.toUpperCase()}. Inkluder priser, trender, og investeringsmuligheter. Formater svaret som profesjonell markdown.`;

  const result = await model.generateContentStream([systemInstruction, prompt]);
  
  let text = '';
  for await (const chunk of result.stream) {
    text += chunk.text();
  }

  const sources = [
      { title: `Markedsdata for ${location}`, url: `https://www.idealista.com/news/inmobiliario/vivienda/2023/` },
      { title: `Prisutvikling i Spania`, url: `https://www.fotocasa.es/` }
  ];

  return { text, sources };
};

export const generateROIReport = async (
  data: { location: string; price: number; rent: number; expenses: number; yield: string; },
  brand: Brand,
  profile: AdvisorProfile
): Promise<string> => {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const systemInstruction = getSystemPrompt(brand, profile);
    const prompt = `Generer en detaljert investeringsanalyse og avkastningsrapport (ROI) for en eiendom i ${data.location}.
    - Kjøpspris: €${data.price.toLocaleString()}
    - Forventet månedlig leie: €${data.rent.toLocaleString()}
    - Månedlige utgifter: €${data.expenses.toLocaleString()}
    - Brutto direkteavkastning: ${data.yield}%

    Analyser investeringscaset, gi kontekst om markedet, og avslutt med en anbefaling. Formater som profesjonell markdown.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
};

/**
 * Simulerer generering av et markedsføringsbilde.
 * TODO: Erstatt med en ekte bildegenererings-API-kall.
 * Denne funksjonen bruker en placeholder-tjeneste for å returnere et bilde.
 */
export const generateMarketingImage = async (
  prompt: string,
  aspectRatio: string = "16:9"
): Promise<string> => {
  console.log(`Simulerer bildegenerering for prompt: "${prompt}" med format ${aspectRatio}`);
  
  // Simulerer nettverksforsinkelse
  await new Promise(resolve => setTimeout(resolve, 1500));

  const [width, height] = aspectRatio.split(':').map(Number);
  const size = aspectRatio === '1:1' ? '1024x1024' : aspectRatio === '16:9' ? '1920x1080' : '1080x1920';
  
  const imageUrl = `https://placehold.co/${size}/06b6d4/FFFFFF/png?text=${encodeURIComponent(prompt.substring(0, 50))}`;
  
  console.log(`Returnerer placeholder-bilde: ${imageUrl}`);
  return Promise.resolve(imageUrl);
};
