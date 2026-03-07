
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { LeadStatus, Lead, Property, MarketTheme, Brand, AdvisorProfile, EmailMessage, BrandVisualStyles, AppLanguage, PropertyValuationData, ValuationResult } from "../types";
import { settingsStore } from "./settingsService";
import { getAreaData, MARKET_DATA_UPDATED } from "./marketData";

export class GeminiService {
  private getContext(brand?: Brand, profile?: AdvisorProfile) {
    const lang = settingsStore.getLanguage();
    const today = new Date().toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' });
    
    const languageNames: Record<AppLanguage, string> = {
      [AppLanguage.NO]: "Norwegian",
      [AppLanguage.EN]: "English",
      [AppLanguage.ES]: "Spanish",
      [AppLanguage.DE]: "German",
      [AppLanguage.RU]: "Russian",
      [AppLanguage.FR]: "French"
    };

    let brandingContext = "";
    if (brand) {
      const isRealEstate = ['soleada', 'zeneco', 'pinosoecolife'].includes(brand.id);
      const isSaaS = brand.id === 'chatgenius';
      const isPersonal = brand.id === 'freddy';
      const isAgriculture = brand.id === 'donaanna';

      if (isRealEstate) {
        brandingContext = `
          YOU REPRESENT: ${brand.name}.
          COMPANY TYPE: ${brand.type}.
          TONE: ${brand.tone}.
          DESCRIPTION: ${brand.description}.
          SPECIALITY: Spanish real estate on Costa Blanca and Costa Calida.
          SAFETY: Never give legal advice. Refer to lawyers/gestors.
        `;
      } else if (isSaaS) {
        brandingContext = `
          YOU REPRESENT: Chatgenius.pro – a SaaS platform selling AI-powered apps and automation systems.
          TONE: ${brand.tone}.
          FOCUS: Chatbots, AI automation, workflow tools, B2B sales, subscription model.
          SAFETY: Be honest about capabilities; do not overpromise ROI.
        `;
      } else if (isPersonal) {
        brandingContext = `
          YOU REPRESENT: Freddy Bremseth's personal brand – author, investor, real estate expert, AI strategist.
          TONE: ${brand.tone}.
          SERVICES: Books, courses, consulting, keynote speaking, real estate advice, business development, digital marketing.
          FOCUS: Building authority, selling expertise and knowledge products.
        `;
      } else if (isAgriculture) {
        brandingContext = `
          YOU REPRESENT: Donaanna.com – an authentic Spanish olive farm producing premium extra virgin olive oil and table olives.
          TONE: ${brand.tone}.
          FOCUS: Artisan quality, Mediterranean lifestyle, direct-to-consumer sales, farm story, sustainability.
          PRODUCTS: Extra virgin olive oil, table olives, farm experience.
        `;
      } else {
        brandingContext = `
          YOU REPRESENT: ${brand.name}.
          COMPANY TYPE: ${brand.type}.
          TONE: ${brand.tone}.
          DESCRIPTION: ${brand.description}.
        `;
      }
    }

    let profileContext = "";
    if (profile) {
      profileContext = `
        ADVISOR: ${profile.name}.
        EXPERTISE: ${profile.expertise.join(', ')}.
        SIGNATURE: ${profile.signature}.
      `;
    }

    return `
      DATE: ${today}.
      ROLE: Senior advisor and content specialist for ${brand?.name || 'the business'}.
      ${brandingContext}
      ${profileContext}

      LANGUAGE REQUIREMENT:
      - YOU MUST RESPOND EXCLUSIVELY IN: ${languageNames[lang]}.
      - All text, headers, checklists, and calls to action must be in ${languageNames[lang]}.
    `;
  }

  private getClient() {
    const apiKey = settingsStore.getApiKeys().gemini;
    if (!apiKey) throw new Error("Mangler Gemini API-nøkkel. Gå til Innstillinger → AI-nøkler.");
    return new GoogleGenAI({ apiKey });
  }

  private cleanJson(text: string): string {
    return text.replace(/```json/g, '').replace(/```/g, '').trim();
  }

  async getMarketPulse(location: string, theme: MarketTheme = MarketTheme.GENERAL, brand?: Brand, profile?: AdvisorProfile) {
    const ai = this.getClient();
    
    const prompt = `
      INSTRUCTIONS FOR MARKET PULSE REPORT:
      You are a professional real estate analyst. Your task is to generate a highly accurate and well-sourced market pulse report for ${location}, with a special focus on Costa Blanca and Costa Calida. The theme is ${theme.toUpperCase()}.

      CRITICAL REQUIREMENTS:
      1.  **SOURCE HIERARCHY:** You MUST prioritize information from the most reliable sources in this specific order:
          a.  **Official Statistics:** Instituto Nacional de Estadística (INE), Registradores de España.
          b.  **Major Real Estate Portals:** Price reports from Idealista.com, Fotocasa.es.
          c.  **Reputable Financial News:** Expansión, Cinco Días, El Economista (for Spanish news), Bloomberg, Reuters (for international context).
          d.  **Bank Reports:** CaixaBank Research, BBVA Research, etc.

      2.  **DATA-DRIVEN ANALYSIS:** The report must be built on hard data. Focus on:
          - Average price per square meter (€/m²).
          - Year-over-year (YoY) and quarter-over-quarter (QoQ) price changes.
          - Sales volume trends.
          - Average time on market.
          - Future market outlook based on expert opinions from your sources.

      3.  **STRUCTURE:**
          - **Executive Summary:** Start with a 2-3 sentence summary of the current market state.
          - **Key Data Points:** A bulleted list of the most important metrics (price, sales volume, etc.) with the source cited for each point.
          - **Market Trend Analysis:** A paragraph explaining the *meaning* behind the data. Is the market heating up, cooling down? Why?
          - **Outlook:** A brief forward-looking statement.

      4.  **CITE EVERYTHING:** Every specific data point must be traceable to its source. Your analysis MUST be based on what the Google Search tool finds and returns. Never invent data.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: { 
        systemInstruction: this.getContext(brand, profile),
        tools: [{ googleSearch: {} }] 
      },
    });

    return { 
      text: response.text || '', 
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => ({
        title: c.web?.title || 'Source',
        url: c.web?.uri || '#'
      })) || []
    };
  }

  async generateViralAd(brandId: string, objective: string, platform: string) {
    const ai = this.getClient();
    const brand = settingsStore.getBrand(brandId);
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Create viral ad for ${brand?.name}. Platform: ${platform}. Objective: ${objective}. Focus on new builds in Costa Blanca/Costa Calida. Return JSON with headlines, body text, and strategic hooks. Headlines must promise safety and solutions.`,
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
      throw new Error("Could not generate ad.");
    }
  }

  // Fix: Added extractLeadsFromContent to handle lead data extraction from text notes
  async extractLeadsFromContent(content: string) {
    const ai = this.getClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Extract real estate lead information from the following inquiry notes. Look for name, email, phone, budget (in EUR), location, and specific property requirements. \n\nINQUIRY NOTES:\n${content}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              email: { type: Type.STRING },
              phone: { type: Type.STRING },
              value: { type: Type.NUMBER, description: "Budget value in EUR" },
              location: { type: Type.STRING },
              summary: { type: Type.STRING },
              personalityType: { type: Type.STRING },
            },
            required: ["name"]
          }
        }
      }
    });
    try {
      const cleaned = this.cleanJson(response.text || '[]');
      return JSON.parse(cleaned);
    } catch (err) {
      console.error("Content Lead Extraction Error:", err);
      return [];
    }
  }

  // Fix: Added extractLeadsFromImage to handle lead data extraction from form/business card images
  async extractLeadsFromImage(base64: string, mimeType: string) {
    const ai = this.getClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: {
        parts: [
          { inlineData: { data: base64, mimeType } },
          { text: "Analyze this image of a real estate lead registration form or business card. Extract all contact details and property interests into a structured JSON array of leads." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              email: { type: Type.STRING },
              phone: { type: Type.STRING },
              value: { type: Type.NUMBER, description: "Budget value in EUR if found" },
              location: { type: Type.STRING },
              summary: { type: Type.STRING },
              personalityType: { type: Type.STRING },
            },
            required: ["name"]
          }
        }
      }
    });
    try {
      const cleaned = this.cleanJson(response.text || '[]');
      return JSON.parse(cleaned);
    } catch (err) {
      console.error("Image Lead Extraction Error:", err);
      return [];
    }
  }

  async generateZenEcoGuide(brandId: string) {
    const ai = this.getClient();
    const brand = settingsStore.getBrand(brandId);
    const prompt = `Generate a high-end buyer guide for Spanish real estate. Sell safety, quality, and lifestyle. 
    Include:
    1. 5 catchy titles (promising solutions to uncertainty).
    2. Table of Contents (Dream to Handover, 5-7 chapters).
    3. Content for each chapter with subheaders, "Pro-tips" boxes (traps to avoid), and a "Viewing Checklist".
    4. "Why New Build/Eco?" section.
    5. Sales text for website with hook, 3 bullet points, and CTA.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        systemInstruction: this.getContext(brand),
      }
    });
    return response.text || '';
  }

  async generateMarketingImage(prompt: string, _aspectRatio: "1:1" | "16:9" | "9:16" = "16:9", baseImage?: string) {
    const ai = this.getClient();

    const enhancedPrompt = baseImage
      ? `Edit this real estate image: ${prompt}. Keep luxury Mediterranean coastal style.`
      : `Luxury real estate marketing photo. Costa Blanca Spain. ${prompt}. Photorealistic, golden hour, 4K quality, professional architectural photography.`;

    const parts: any[] = [];
    if (baseImage) {
      parts.push({
        inlineData: {
          data: baseImage.includes(',') ? baseImage.split(',')[1] : baseImage,
          mimeType: 'image/jpeg'
        }
      });
    }
    parts.push({ text: enhancedPrompt });

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-preview-image-generation',
        contents: [{ role: 'user', parts }],
        config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        }
      });

      const responseParts = response.candidates?.[0]?.content?.parts || [];
      for (const part of responseParts) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          return `data:${mime};base64,${part.inlineData.data}`;
        }
      }
      throw new Error("Ingen bilde ble returnert. Prøv en annen beskrivelse.");
    } catch (err: any) {
      throw new Error(err.message || "Bildegenerering feilet.");
    }
  }

  async analyzeEmailThread(emails: EmailMessage[], lead: Lead) {
    const ai = this.getClient();
    const thread = emails.map(e => `${e.isIncoming ? 'FROM CLIENT' : 'TO CLIENT'} (${e.date}): ${e.body}`).join('\n---\n');
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Analyze email thread for "${lead.name}". \n\nTHREAD:\n${thread}`,
        config: {
          systemInstruction: this.getContext(),
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
      return null;
    }
  }

  async generateROIReport(data: { location: string; price: number; rent: number; expenses: number; yield: string }, brand?: Brand, profile?: AdvisorProfile) {
    const ai = this.getClient();
    const prompt = `Investment analysis for ${data.location}. Data: Price €${data.price}, Yield ${data.yield}%.`;
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: { systemInstruction: this.getContext(brand, profile) },
    });
    return response.text || '';
  }

  async generateCMSContent(contentType: string, topic: string, brandId: string) {
    const ai = this.getClient();
    const brand = settingsStore.getBrand(brandId);
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Skriv ${contentType} om: ${topic}.\n\nOBLIGATORISKE FORMATERINGSKRAV:\n- Bruk IKKE markdown-formatering. Ingen **, *, #, ##, ___, ---, eller andre markdown-tegn.\n- Norsk setningskapitalisering: stor bokstav KUN i starten av setninger, og for egennavn/stedsnavn (f.eks. Spania, Benidorm, Middelhavet, Costa Blanca). IKKE tittelkapitalisering.\n- Skriv overskrifter som vanlige setninger med stor bokstav kun i starten.\n- Skill avsnitt med tom linje. Bruk ikke punktlister med stjerner eller bindestrek.`,
      config: { systemInstruction: this.getContext(brand) },
    });
    return response.text || '';
  }

  async generatePropertyValuation(data: PropertyValuationData, brandId: string, profile: AdvisorProfile): Promise<ValuationResult> {
    const ai = this.getClient();
    const brand = settingsStore.getBrand(brandId);

    const comparablesText = data.comparables.length > 0
      ? data.comparables.map(c =>
          `- ${c.title}: €${c.price.toLocaleString()} | ${c.area}m² | €${c.pricePerSqm}/m² | ${c.bedrooms} sov. | Kilde: ${c.source}`
        ).join('\n')
      : 'Ingen sammenlignbare eiendommer er lagt inn manuelt.';

    const localAreaData = getAreaData(data.municipality);
    const localDataNote = localAreaData
      ? `LOKAL MARKEDSDATA FOR ${data.municipality.toUpperCase()} (fra RealtyFlow-database, oppdatert ${MARKET_DATA_UPDATED}):\n– Prisantydning (Idealista): ${localAreaData.askingPricePerSqm.toLocaleString()} €/m²\n– Transaksjonspris (faktisk betalt): ${localAreaData.transactionPricePerSqm.toLocaleString()} €/m²\n– Prisvekst siste år: ${localAreaData.yoyChangePct != null ? `+${localAreaData.yoyChangePct}%` : 'ikke tilgjengelig'}\n– Trend: ${localAreaData.trend}\n– Snitt dager på markedet: ${localAreaData.avgDaysOnMarket ?? 'ikke tilgjengelig'}\n– Region: ${localAreaData.region}\n${localAreaData.notes ? `– Merknad: ${localAreaData.notes}` : ''}`
      : `Kommunen "${data.municipality}" er ikke i vår lokale database. Bruk Google Search for ferske data.`;

    const prompt = `
Du skal nå lage en KOMPLETT, PROFESJONELL VERDIVURDERING på norsk for følgende eiendom.
Din rolle er Senior Eiendomsrådgiver for ${brand.name}.

═══════════════════════════════════════════
EIENDOMSDATA
═══════════════════════════════════════════
Eier: ${data.ownerName || 'Eier'}
Visningsdato: ${data.viewingDate}
Adresse: ${data.streetAddress}, ${data.postalCode} ${data.municipality}, ${data.province}
${data.urbanization ? `Urbanisering: ${data.urbanization}` : ''}

Type: ${data.propertyType}
Byggeår: ${data.yearBuilt || 'Ukjent'}
${data.lastRenovated ? `Sist renovert: ${data.lastRenovated}` : ''}
Tilstand: ${data.condition}

Boareal: ${data.builtArea} m²
Soverom: ${data.bedrooms} | Baderom: ${data.bathrooms}

Kvaliteter:
- Utsikt: ${data.view}
- Orientering: ${data.orientation}
- Basseng: ${data.pool}
- Garasje: ${data.garage ? `Ja (${data.parkingSpaces} plass)` : 'Nei'}
- Heis: ${data.hasLift ? 'Ja' : 'Nei'}

EIERS ØNSKEDE PRIS: ${data.ownerAskingPrice ? `€${data.ownerAskingPrice.toLocaleString()}` : 'Ikke oppgitt'}

═══════════════════════════════════════════
RÅDGIVERENS NOTATER FRA VISNING
═══════════════════════════════════════════
STYRKER: ${data.agentStrengths || 'Ikke spesifisert.'}
SVAKHETER: ${data.agentWeaknesses || 'Ikke spesifisert.'}
NOTATER: ${data.agentNotes || 'Ingen spesifikke notater.'}

═══════════════════════════════════════════
INSTRUKSJONER FOR VERDIVURDERING
═══════════════════════════════════════════
Din oppgave er å lage en nøyaktig og datadrevet verdivurdering. Følg disse stegene:

1.  **FINN BASISPRIS:**
    - Bruk Google Search til å finne den gjennomsnittlige kvadratmeterprisen for en ${data.propertyType} i ${data.municipality}.
    - **Søk spesifikt etter "precio metro cuadrado ${data.propertyType} ${data.municipality} idealista informe de precios".**
    - Denne prisen fra Idealistas prisrapport er ditt viktigste utgangspunkt (basispris).

2.  **JUSTER FOR EGENSKAPER:**
    - Juster basisprisen opp eller ned basert på eiendommens unike egenskaper:
    - **Areal-korrigering:** Prisen per kvadratmeter er ofte *lavere* for store eiendommer og *høyere* for små eiendommer sammenlignet med gjennomsnittet i området. Du MÅ korrigere for dette avviket.
    - **Tilstand & Alder:** Nyere og totalrenoverte eiendommer har høyere verdi. Eldre eiendommer i dårlig stand trekker ned.
    - **Kvaliteter:** Utsikt, orientering, basseng, heis, garasje, og energinivå er viktige faktorer.
    - **Styrker/Svakheter:** Bruk rådgiverens notater aktivt for å finjustere.

3.  **BRUK REFERANSER (valgfritt):**
    - Rådgiveren har lagt inn følgende referansepunkter. Bruk dem kun til å validere din vurdering, men la Idealista-basisprisen være førende.
    - Manuelle referanser:
      ${comparablesText}
    - Intern database:
      ${localDataNote}

4.  **KONKLUDER OG SKRIV RAPPORT:**
    - Basert på din analyse, fastsett et prisestimat (lav, midt, høy) og en anbefalt prisantydning.
    - Generer en KOMPLETT og PROFESJONELL verdivurderingsrapport på norsk.
    - Skriv som en seniorrådgiver – analytisk, presis, varm og overbevisende.

═══════════════════════════════════════════
INSTRUKSJONER FOR JSON-OUTPUT
═══════════════════════════════════════════
Return ONLY valid JSON (no markdown fences) with these exact fields:
{
  "estimatedLow": number (EUR),
  "estimatedMid": number (EUR),
  "estimatedHigh": number (EUR),
  "recommendedListingPrice": number (EUR),
  "pricePerSqm": number (EUR/m²),
  "marketPositioning": "string (1-2 sentences on how to position in market)",
  "thankYouLetter": "string (warm personal letter to owner in Norwegian, 150-200 words, from ${profile.name} at ${brand.name}, referencing visit date and specific property)",
  "propertyDescription": "string (rich professional property description in Norwegian, 200-300 words, highlighting best features from agent notes)",
  "marketAnalysis": "string (market analysis for the area in Norwegian, 200-300 words, with specific price data from Idealista, trends, and your adjustments)",
  "salesStrategy": "string (specific sales strategy for THIS property in Norwegian, 200-300 words, who the target buyer is, which channels, timing)",
  "fullReportMarkdown": "string (complete formatted markdown report in Norwegian with ALL sections: ## 1. Takk for visningen, ## 2. Om eiendommen, ## 3. Markedsanalyse, ## 4. Verdivurdering, ## 5. Vår salgsstrategi, ## 6. Om ${brand.name}, ## 7. Kommisjon og tilbud, ## 8. Neste steg)"
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        systemInstruction: this.getContext(brand, profile),
        tools: [{ googleSearch: {} }],
      },
    });

    const raw = this.cleanJson(response.text || '{}');
    try {
      return JSON.parse(raw) as ValuationResult;
    } catch {
      // Fallback: extract JSON block manually
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]) as ValuationResult;
      throw new Error('Kunne ikke tolke AI-responsen. Prøv igjen.');
    }
  }
}

export const gemini = new GeminiService();
