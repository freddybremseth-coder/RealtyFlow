
import { GoogleGenAI, Type } from "@google/genai";
import { LeadStatus, Lead, Property, MarketTheme, Brand, AdvisorProfile, EmailMessage, BrandVisualStyles } from "../types";
import { settingsStore } from "./settingsService";

export class GeminiService {
  private getContext(brand?: Brand, profile?: AdvisorProfile) {
    const today = new Date().toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' });
    
    let brandingContext = "";
    if (brand) {
      brandingContext = `
        DU REPRESENTERER: ${brand.name}. 
        SELSKAPSTYPE: ${brand.type}.
        TONE: ${brand.tone}.
        BESKRIVELSE: ${brand.description}.
        REGIONER: Spesialist på Costa Blanca og Costa Calida.
      `;
    }

    let profileContext = "";
    if (profile) {
      profileContext = `
        RÅDGIVER: ${profile.name}.
        EKSPERTISE: ${profile.expertise.join(', ')}.
        SIGNATUR: ${profile.signature}.
      `;
    }

    return `
      DAGENS DATO: ${today}.
      ROLLE: Senior Eiendomsrådgiver, Gründer, Investor og Økonom spesialisert på det spanske boligmarkedet for Zen Eco Homes.
      ${brandingContext}
      ${profileContext}
      
      VIKTIG SIKKERHETSINSTRUKS:
      - Du skal ALDRI titulere deg som "Juridisk Rådgiver".
      - Du skal aldri love juridisk trygghet eller gi definitive juridiske råd.
      - Ved spørsmål om lover, skatt eller kontrakter, skal du alltid henvise kunden til eksterne eksperter som uavhengige advokater eller gestorer.
      - Fokuser på verdiskapning, markedstrender, investeringsmuligheter og livsstil.

      SPRÅK: Profesjonell norsk.
    `;
  }

  private getClient() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  private cleanJson(text: string): string {
    return text.replace(/```json/g, '').replace(/```/g, '').trim();
  }

  async getMarketPulse(location: string, theme: MarketTheme = MarketTheme.GENERAL, brand?: Brand, profile?: AdvisorProfile) {
    const ai = this.getClient();
    const prompt = `Lag en omfattende markedsanalyse for ${location}. Tema: ${theme.toUpperCase()}. Inkluder spesifikk info om Costa Blanca og Costa Calida hvis relevant. Analyser markedet fra et investor- og rådgiverperspektiv.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { 
        systemInstruction: this.getContext(brand, profile),
        tools: [{ googleSearch: {} }] 
      },
    });

    return { 
      text: response.text || '', 
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => ({
        title: c.web?.title || 'Kilde',
        url: c.web?.uri || '#'
      })) || []
    };
  }

  async generateViralAd(brandId: string, objective: string, platform: string) {
    const ai = this.getClient();
    const brand = settingsStore.getBrand(brandId);
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Lag viral annonse for ${brand?.name}. Plattform: ${platform}. Mål: ${objective}. Fokus på nybygg i Costa Blanca og Costa Calida. Returner JSON med overskrifter, hovedtekst og strategiske knagger. Inkluder minst 5 overskrifter som lover trygghet og løsninger gjennom profesjonell rådgivning.`,
        config: {
          systemInstruction: this.getContext(brand),
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              headlines: { type: Type.ARRAY, items: { type: Type.STRING } },
              bodyOptions: { type: Type.ARRAY, items: { type: Type.STRING } },
              viralityScore: { type: Type.NUMBER },
              hooks: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["headlines", "bodyOptions", "viralityScore", "hooks"]
          }
        }
      });
      
      const cleaned = this.cleanJson(response.text || '{}');
      return JSON.parse(cleaned);
    } catch (err) {
      console.error("Ad Generation Error:", err);
      throw new Error("Kunne ikke generere annonse.");
    }
  }

  // Updated with detailed prompt for Zen Eco Guide as requested by the user
  async generateZenEcoGuide(brandId: string) {
    const ai = this.getClient();
    const brand = settingsStore.getBrand(brandId);
    const prompt = `Du er en ekspert på det spanske boligmarkedet og en topp tekstforfatter for "Zen Eco Homes". Vi selger trygghet, kvalitet og livsstil til nordmenn. 
    Jeg trenger at du genererer følgende 4 deler:

    DEL 1: 5 forslag til fengende titler. Titlene må love en løsning på usikkerhet (f.eks "Veien til trygg boligdrøm...").
    
    DEL 2: Innholdsfortegnelse og Struktur. Lag en logisk rekkefølge fra "Drømmen" til "Nøkkeloverlevering". Foreslå 5-7 hovedkapitler.
    
    DEL 3: Selve innholdet (Kapittel for kapittel). Skriv utkast til teksten for hvert kapittel. Bruk underoverskrifter. Lag "Pro-tips" bokser (basert på typiske feller i det spanske markedet). Lag en "Sjekkliste for visning". Inkluder en seksjon om "Hvorfor Nybygg/Eco?" (basert på Zen Eco profil).
    
    DEL 4: Salgstekst til nettsiden. Skriv en kort, overbevisende tekst som skal stå på nettsiden for å få folk til å laste ned guiden. Inkluder en "Hook" (Hvorfor trenger de denne?), 3 punktlister med hva de lærer, og en tydelig Call to Action.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: this.getContext(brand),
      }
    });
    return response.text || '';
  }

  async generateMarketingImage(prompt: string, aspectRatio: "1:1" | "16:9" | "9:16" = "16:9", baseImage?: string) {
    const ai = this.getClient();
    
    const parts: any[] = [];
    
    if (baseImage) {
      // Modify existing image using instructions for editing with gemini-2.5-flash-image
      parts.push({
        inlineData: {
          data: baseImage.includes(',') ? baseImage.split(',')[1] : baseImage,
          mimeType: 'image/png'
        }
      });
      parts.push({ text: `Modify the provided image based on this instruction: ${prompt}. Keep the overall luxury Mediterranean real estate style.` });
    } else {
      // Generate new image from scratch using gemini-2.5-flash-image
      const enhancedPrompt = `High-end architectural photography, luxury new build real estate in Costa Blanca or Costa Calida Spain, Mediterranean style, sun-drenched, professional lighting, 8k resolution. Subject: ${prompt}`;
      parts.push({ text: enhancedPrompt });
    }
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: { imageConfig: { aspectRatio } }
      });
      
      const responseParts = response.candidates?.[0]?.content?.parts || [];
      for (const part of responseParts) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
      throw new Error("Modellen returnerte ikke et bilde.");
    } catch (err: any) {
      console.error("Gemini Image Error:", err);
      throw new Error(err.message || "Bildegenerering feilet.");
    }
  }

  async analyzeEmailThread(emails: EmailMessage[], lead: Lead) {
    const ai = this.getClient();
    const thread = emails.map(e => `${e.isIncoming ? 'FRA KUNDE' : 'TIL KUNDE'} (${e.date}): ${e.body}`).join('\n---\n');
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: `Analyser denne e-post tråden for lead "${lead.name}". \n\nTRÅD:\n${thread}`,
        config: {
          systemInstruction: "Analyser kundens behov og foreslå neste handling. Returner JSON.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              sentimentScore: { type: Type.NUMBER },
              urgencyLevel: { type: Type.STRING },
              suggestedAction: { type: Type.STRING },
              suggestedEmailDraft: { type: Type.STRING }
            },
            required: ["summary", "sentimentScore", "urgencyLevel", "suggestedAction", "suggestedEmailDraft"]
          }
        }
      });
      const cleaned = this.cleanJson(response.text || '{}');
      return JSON.parse(cleaned);
    } catch (err) {
      console.error("Email Analysis Error:", err);
      return null;
    }
  }

  async generateROIReport(data: { location: string; price: number; rent: number; expenses: number; yield: string }, brand?: Brand, profile?: AdvisorProfile) {
    const ai = this.getClient();
    const prompt = `Generer en omfattende investeringsanalyse for en eiendom i ${data.location}. Finansielle data: Pris €${data.price}, Yield ${data.yield}%.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { 
        systemInstruction: this.getContext(brand, profile)
      },
    });

    return response.text || '';
  }

  async extractLeadsFromContent(content: string) {
    const ai = this.getClient();
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyser følgende tekst og trekk ut lead-informasjon: \n\n${content}`,
        config: {
          systemInstruction: "Trekk ut lead-detaljer. Returner JSON array.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                email: { type: Type.STRING },
                phone: { type: Type.STRING },
                value: { type: Type.NUMBER },
                location: { type: Type.STRING },
                summary: { type: Type.STRING },
                personalityType: { type: Type.STRING },
                imageUrl: { type: Type.STRING }
              }
            }
          }
        }
      });
      const cleaned = this.cleanJson(response.text || '[]');
      return JSON.parse(cleaned);
    } catch (e) {
      return [];
    }
  }

  async extractLeadsFromImage(base64: string, mimeType: string) {
    const ai = this.getClient();
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            { inlineData: { data: base64, mimeType } },
            { text: "Analyser dette skjemaet og trekk ut lead-informasjon." }
          ]
        },
        config: {
          systemInstruction: "Digitaliser lead-skjemaer. Returner JSON array.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                email: { type: Type.STRING },
                phone: { type: Type.STRING },
                value: { type: Type.NUMBER },
                location: { type: Type.STRING },
                summary: { type: Type.STRING }
              }
            }
          }
        }
      });
      const cleaned = this.cleanJson(response.text || '[]');
      return JSON.parse(cleaned);
    } catch (e) {
      return [];
    }
  }

  async generateCMSContent(contentType: string, topic: string, brandId: string) {
    const ai = this.getClient();
    const brand = settingsStore.getBrand(brandId);
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generer ${contentType} om: ${topic}.`,
      config: {
        systemInstruction: this.getContext(brand),
      }
    });
    return response.text || '';
  }

  async analyzeBrandIdentity(website: string, logoBase64?: string): Promise<BrandVisualStyles> {
    const ai = this.getClient();
    const parts: any[] = [{ text: `Analyser visuell identitet for: ${website}.` }];
    if (logoBase64) parts.push({ inlineData: { data: logoBase64.split(',')[1] || logoBase64, mimeType: 'image/png' } });

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts },
        config: {
          systemInstruction: "Analyser visuelle elementer. Returner JSON.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              primaryColor: { type: Type.STRING },
              secondaryColor: { type: Type.STRING },
              fontHeading: { type: Type.STRING },
              fontBody: { type: Type.STRING }
            },
            required: ["primaryColor", "secondaryColor", "fontHeading", "fontBody"]
          }
        }
      });
      const cleaned = this.cleanJson(response.text || '{}');
      return JSON.parse(cleaned) as BrandVisualStyles;
    } catch (e) {
      return { primaryColor: '#06b6d4', secondaryColor: '#f97316', fontHeading: 'Space Mono', fontBody: 'Inter' };
    }
  }
}

export const gemini = new GeminiService();
