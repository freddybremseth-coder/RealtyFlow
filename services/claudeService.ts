
import Anthropic from "@anthropic-ai/sdk";
import {
  Lead,
  Property,
  MarketTheme,
  Brand,
  AdvisorProfile,
  EmailMessage,
  AppLanguage,
  PropertyValuationData,
  ValuationResult,
} from "../types";
import { settingsStore } from "./settingsService";
import { buildMarketDataPrompt, getAreaData, MARKET_DATA_UPDATED } from "./marketData";

export class ClaudeService {
  private getClient() {
    return new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      dangerouslyAllowBrowser: true,
    });
  }

  private getContext(brand?: Brand, profile?: AdvisorProfile): string {
    const lang = settingsStore.getLanguage();
    const today = new Date().toLocaleDateString("nb-NO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const languageNames: Record<AppLanguage, string> = {
      [AppLanguage.NO]: "Norwegian",
      [AppLanguage.EN]: "English",
      [AppLanguage.ES]: "Spanish",
      [AppLanguage.DE]: "German",
      [AppLanguage.RU]: "Russian",
      [AppLanguage.FR]: "French",
    };

    let brandingContext = "";
    if (brand) {
      brandingContext = `
        YOU REPRESENT: ${brand.name}.
        COMPANY TYPE: ${brand.type}.
        TONE: ${brand.tone}.
        DESCRIPTION: ${brand.description}.
        REGIONS: Specialist on Costa Blanca and Costa Calida.
      `;
    }

    let profileContext = "";
    if (profile) {
      profileContext = `
        ADVISOR: ${profile.name}.
        EXPERTISE: ${profile.expertise.join(", ")}.
        SIGNATURE: ${profile.signature}.
      `;
    }

    return `
      DATE: ${today}.
      ROLE: Senior Real Estate Advisor, Founder, Investor and Economist specialized in the Spanish property market.
      ${brandingContext}
      ${profileContext}

      CRITICAL SAFETY INSTRUCTIONS:
      - NEVER title yourself as "Legal Advisor".
      - Never promise legal security or give definitive legal advice.
      - Refer customers to external experts (lawyers/gestors) for legal/tax questions.
      - Focus on value creation, market trends, investment opportunities, and lifestyle.

      LANGUAGE REQUIREMENT:
      - YOU MUST RESPOND EXCLUSIVELY IN: ${languageNames[lang]}.
      - All text, headers, checklists, and calls to action must be in ${languageNames[lang]}.
    `;
  }

  private cleanJson(text: string): string {
    return text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
  }

  private async chat(
    system: string,
    user: string,
    maxTokens = 4096
  ): Promise<string> {
    const client = this.getClient();
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    });
    const block = message.content[0];
    return block.type === "text" ? block.text : "";
  }

  async getMarketPulse(
    location: string,
    theme: MarketTheme = MarketTheme.GENERAL,
    brand?: Brand,
    profile?: AdvisorProfile
  ) {
    const system = this.getContext(brand, profile);
    const prompt = `Create a comprehensive market analysis for ${location}. Theme: ${theme.toUpperCase()}. Include specific info about Costa Blanca and Costa Calida market trends, prices, and investment opportunities. Be analytical, detailed, and use real market knowledge.`;
    const text = await this.chat(system, prompt, 2048);
    return { text, sources: [] };
  }

  async generateViralAd(
    brandId: string,
    objective: string,
    platform: string
  ) {
    const brand = settingsStore.getBrand(brandId);
    const system = this.getContext(brand);
    const prompt = `Create a viral real estate ad for ${brand?.name}. Platform: ${platform}. Objective: ${objective}. Focus on new builds in Costa Blanca/Costa Calida. Headlines must promise safety and solutions.

Return ONLY valid JSON, no markdown or code fences:
{
  "headlines": ["string", "string", "string"],
  "bodyOptions": ["string", "string"],
  "viralityScore": 85,
  "hooks": ["string", "string", "string"]
}`;
    try {
      const text = await this.chat(system, prompt, 1024);
      return JSON.parse(this.cleanJson(text));
    } catch {
      throw new Error("Could not generate ad.");
    }
  }

  async extractLeadsFromContent(content: string) {
    const system =
      "You are a precise data extraction assistant for a real estate CRM. Always respond with valid JSON only.";
    const prompt = `Extract real estate lead information from the following inquiry notes. Look for name, email, phone, budget (in EUR), location, and specific property requirements.

Return ONLY a valid JSON array, no markdown or code fences:
[{"name":"string","email":"string","phone":"string","value":0,"location":"string","summary":"string","personalityType":"string"}]

INQUIRY NOTES:
${content}`;
    try {
      const text = await this.chat(system, prompt, 1024);
      return JSON.parse(this.cleanJson(text));
    } catch {
      return [];
    }
  }

  async extractLeadsFromImage(base64: string, mimeType: string) {
    const client = this.getClient();
    try {
      const message = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mimeType as
                    | "image/jpeg"
                    | "image/png"
                    | "image/gif"
                    | "image/webp",
                  data: base64,
                },
              },
              {
                type: "text",
                text: 'Analyze this image of a real estate lead registration form or business card. Extract all contact details and property interests. Return ONLY a valid JSON array, no markdown:\n[{"name":"string","email":"string","phone":"string","value":0,"location":"string","summary":"string","personalityType":"string"}]',
              },
            ],
          },
        ],
      });
      const block = message.content[0];
      const text = block.type === "text" ? block.text : "[]";
      return JSON.parse(this.cleanJson(text));
    } catch {
      return [];
    }
  }

  async generateZenEcoGuide(brandId: string) {
    const brand = settingsStore.getBrand(brandId);
    const prompt = `Generate a high-end buyer guide for Spanish real estate for ${brand?.name}. Sell safety, quality, and lifestyle.
    Include:
    1. 5 catchy titles (promising solutions to uncertainty).
    2. Table of Contents (Dream to Handover, 5-7 chapters).
    3. Content for each chapter with subheaders, "Pro-tips" boxes (traps to avoid), and a "Viewing Checklist".
    4. "Why New Build/Eco?" section.
    5. Sales text for website with hook, 3 bullet points, and CTA.`;
    return this.chat(this.getContext(brand), prompt, 4096);
  }

  async generateMarketingImage(
    _prompt: string,
    _aspectRatio?: string,
    _baseImage?: string
  ): Promise<string> {
    throw new Error(
      "Bildegenerering krever Gemini API. Legg til en gyldig GEMINI_API_KEY i innstillingene."
    );
  }

  async analyzeEmailThread(emails: EmailMessage[], lead: Lead) {
    const thread = emails
      .map(
        (e) =>
          `${e.isIncoming ? "FROM CLIENT" : "TO CLIENT"} (${e.date}): ${e.body}`
      )
      .join("\n---\n");
    const system = this.getContext();
    const prompt = `Analyze this email thread for real estate lead "${lead.name}".

THREAD:
${thread}

Return ONLY valid JSON, no markdown or code fences:
{
  "summary": "string",
  "sentimentScore": 75,
  "urgencyLevel": "Medium",
  "suggestedAction": "string",
  "suggestedEmailDraft": "string"
}`;
    try {
      const text = await this.chat(system, prompt, 1024);
      return JSON.parse(this.cleanJson(text));
    } catch {
      return null;
    }
  }

  async generateROIReport(
    data: {
      location: string;
      price: number;
      rent: number;
      expenses: number;
      yield: string;
    },
    brand?: Brand,
    profile?: AdvisorProfile
  ) {
    const prompt = `Investment analysis for property in ${data.location}. Purchase price: €${data.price}, Monthly rent: €${data.rent}, Monthly expenses: €${data.expenses}, Gross yield: ${data.yield}%. Provide detailed ROI analysis, market context, and investment recommendation.`;
    return this.chat(this.getContext(brand, profile), prompt, 2048);
  }

  async generateCMSContent(
    contentType: string,
    topic: string,
    brandId: string
  ) {
    const brand = settingsStore.getBrand(brandId);
    return this.chat(
      this.getContext(brand),
      `Generate ${contentType} about: ${topic}.`,
      2048
    );
  }

  async generatePropertyValuation(
    data: PropertyValuationData,
    brandId: string,
    profile: AdvisorProfile
  ): Promise<ValuationResult> {
    const brand = settingsStore.getBrand(brandId);

    const comparablesText =
      data.comparables.length > 0
        ? data.comparables
            .map(
              (c) =>
                `- ${c.title}: €${c.price.toLocaleString()} | ${c.area}m² | €${c.pricePerSqm}/m² | ${c.bedrooms} sov. | Kilde: ${c.source}`
            )
            .join("\n")
        : "Ingen sammenlignbare eiendommer er lagt inn manuelt.";

    const localAreaData = getAreaData(data.municipality);
    const localDataNote = localAreaData
      ? `LOKAL MARKEDSDATA FOR ${data.municipality.toUpperCase()} (oppdatert ${MARKET_DATA_UPDATED}):
– Prisantydning (Idealista): ${localAreaData.askingPricePerSqm.toLocaleString()} €/m²
– Transaksjonspris: ${localAreaData.transactionPricePerSqm.toLocaleString()} €/m²
– Prisvekst siste år: ${localAreaData.yoyChangePct != null ? `+${localAreaData.yoyChangePct}%` : "ikke tilgjengelig"}
– Trend: ${localAreaData.trend}
– Snitt dager på markedet: ${localAreaData.avgDaysOnMarket ?? "ikke tilgjengelig"}
– Region: ${localAreaData.region}
${localAreaData.notes ? `– Merknad: ${localAreaData.notes}` : ""}`
      : `Kommunen "${data.municipality}" er ikke i vår lokale database. Bruk referansetabellen nedenfor.`;

    const prompt = `Du er en Senior Eiendomsrådgiver for ${brand?.name || "Soleada.no"} – et norsk eiendomsmeglerfirma spesialisert på spanske eiendommer på Costa Blanca og Costa Calida.

Du skal lage en KOMPLETT, PROFESJONELL VERDIVURDERING på norsk for følgende eiendom.

═══════════════════════════════════════════
EIENDOMSDATA
═══════════════════════════════════════════
Eier: ${data.ownerName || "Eier"}
Visningsdato: ${data.viewingDate}
Adresse: ${data.streetAddress}, ${data.postalCode} ${data.municipality}, ${data.province}
${data.urbanization ? `Urbanisering: ${data.urbanization}` : ""}

Type: ${data.propertyType}
Byggeår: ${data.yearBuilt || "Ukjent"}
${data.lastRenovated ? `Sist renovert: ${data.lastRenovated}` : ""}
Tilstand: ${data.condition}
Energikarakter: ${data.energyRating}

Boareal: ${data.builtArea} m²
${data.usefulArea ? `Nyttig areal: ${data.usefulArea} m²` : ""}
${data.plotSize ? `Tomtestørrelse: ${data.plotSize} m²` : ""}
${data.terraceSize ? `Terrasse/balkong: ${data.terraceSize} m²` : ""}

Soverom: ${data.bedrooms} | Baderom: ${data.bathrooms}
Basseng: ${data.pool} | Garasje: ${data.garage ? `Ja (${data.parkingSpaces} plass)` : "Nei"}
Heis: ${data.hasLift ? "Ja" : "Nei"} | Klimaanlegg: ${data.hasAirConditioning ? "Ja" : "Nei"}
Solcellepaneler: ${data.hasSolarPanels ? "Ja" : "Nei"}
${data.hasCommunityFees ? `Felleskostnader: €${data.communityFees}/mnd` : ""}
${data.propertyTax ? `IBI (eiendomsskatt): €${data.propertyTax}/år` : ""}

Orientering: ${data.orientation}
Utsikt: ${data.view}

EIERS ØNSKEDE PRIS: ${data.ownerAskingPrice ? `€${data.ownerAskingPrice.toLocaleString()}` : "Ikke oppgitt"}

═══════════════════════════════════════════
MARKEDSDATA FOR OMRÅDET
═══════════════════════════════════════════
Rådgivers oppgitte kvm-pris for ${data.municipality}: ${data.avgPricePerSqmArea ? `€${data.avgPricePerSqmArea}/m²` : "Ikke oppgitt – bruk lokal data"}

${localDataNote}

Sammenlignbare eiendommer:
${comparablesText}

${buildMarketDataPrompt()}

═══════════════════════════════════════════
RÅDGIVERENS NOTATER FRA VISNING
═══════════════════════════════════════════
NOTATER: ${data.agentNotes || "Ingen spesifikke notater."}
STYRKER: ${data.agentStrengths || "Ikke spesifisert."}
SVAKHETER: ${data.agentWeaknesses || "Ikke spesifisert."}

═══════════════════════════════════════════
INSTRUKSJONER
═══════════════════════════════════════════
Generer en KOMPLETT og PROFESJONELL verdivurdering på norsk.
Skriv som en seniorvurdering – profesjonell, varm og overbevisende.

Return ONLY valid JSON (no markdown fences) with these exact fields:
{
  "estimatedLow": number,
  "estimatedMid": number,
  "estimatedHigh": number,
  "recommendedListingPrice": number,
  "pricePerSqm": number,
  "marketPositioning": "string",
  "thankYouLetter": "string (warm personal letter to owner in Norwegian, 150-200 words, from ${profile.name} at ${brand?.name || "Soleada.no"})",
  "propertyDescription": "string (rich professional property description in Norwegian, 200-300 words)",
  "marketAnalysis": "string (market analysis for the area in Norwegian, 200-300 words, with specific price data and trends)",
  "salesStrategy": "string (specific sales strategy for THIS property in Norwegian, 200-300 words)",
  "fullReportMarkdown": "string (complete formatted markdown report in Norwegian with ALL sections: ## 1. Takk for visningen, ## 2. Om eiendommen, ## 3. Markedsanalyse, ## 4. Verdivurdering, ## 5. Vår salgsstrategi, ## 6. Om ${brand?.name || "Soleada.no"}, ## 7. Kommisjon og tilbud, ## 8. Neste steg)"
}`;

    const text = await this.chat(
      this.getContext(brand, profile),
      prompt,
      8192
    );
    const raw = this.cleanJson(text);
    try {
      return JSON.parse(raw) as ValuationResult;
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]) as ValuationResult;
      throw new Error("Kunne ikke tolke AI-responsen. Prøv igjen.");
    }
  }
}

export const gemini = new ClaudeService();
