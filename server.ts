import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger explicitement .env
dotenv.config({ path: path.resolve(__dirname, ".env"), override: true });

import express from "express";
import { createServer as createViteServer } from "vite";
import { initDb, query, queryOne } from "./server/db.ts";
import { GoogleGenAI } from "@google/genai";

// Initialisation Gemini Server-side
function getGeminiApiKey(): string | undefined {
  let key = process.env.GEMINI_API_KEY;
  if (!key || key === "MY_GEMINI_API_KEY" || key.trim() === "") {
    // Tentative de lecture directe depuis le fichier .env
    try {
      const envPath = path.resolve(__dirname, ".env");
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf-8");
        const match = content.match(/GEMINI_API_KEY=["']?([^"'\r\n]+)["']?/);
        if (match && match[1] && match[1] !== "MY_GEMINI_API_KEY") {
          key = match[1].trim();
        }
      }
    } catch (e) {
      console.warn("Could not read .env directly:", e);
    }
  }
  if (!key || key === "MY_GEMINI_API_KEY" || key.trim() === "") {
    return undefined;
  }
  return key.trim();
}

function getGeminiClient() {
  const apiKey = getGeminiApiKey();
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Modèles avec cascade de secours en cas de forte affluence (503 ou 429)
const TEXT_MODELS_FALLBACK = [
  "gemini-3.6-flash",
  "gemini-3.7-flash",
  "gemini-3.8-flash",
  "gemini-3.5-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-3.5-flash",
  "gemini-flash-latest"
];

async function generateGeminiContentWithFallback(params: {
  contents: any;
  systemInstruction?: string;
  temperature?: number;
}) {
  const gemini = getGeminiClient();
  let lastError: any = null;

  // Normaliser le format contents
  const normalizedContents = typeof params.contents === "string" 
    ? [{ role: "user", parts: [{ text: params.contents }] }]
    : params.contents;

  for (const model of TEXT_MODELS_FALLBACK) {
    try {
      const response = await gemini.models.generateContent({
        model,
        contents: normalizedContents,
        config: {
          systemInstruction: params.systemInstruction,
          temperature: params.temperature ?? 0.7,
        },
      });
      if (response && response.text) {
        return response;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini] Model ${model} failed with ${err.status || err.message}, trying next fallback...`);
      // Pause de 400ms avant le modèle suivant
      await new Promise(r => setTimeout(r, 400));
    }
  }

  throw lastError || new Error("All Gemini fallback models exhausted.");
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Initialiser la base de données (SQLite ou PostgreSQL)
  try {
    await initDb();
  } catch (error) {
    console.error("Erreur lors de l'initialisation de la base de données:", error);
  }

  // Middleware pour parser le JSON avec limite étendue pour images
  app.use(express.json({ limit: "15mb" }));

  // --- ROUTES API HEALTH ---
  app.get("/api/health", (req, res) => {
    const geminiKey = getGeminiApiKey();
    res.json({ 
      status: "ok", 
      message: "OMNI Backend with Gemini Engine is running",
      database: process.env.DATABASE_URL ? "PostgreSQL" : "SQLite",
      geminiConfigured: Boolean(geminiKey),
      timestamp: new Date().toISOString()
    });
  });

  // --- GEMINI CORE CONTROLLER API ---
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { messages, currentTab, language, currency, nationality } = req.body;
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Messages array is required." });
      }

      // Convertir l'historique au format Gemini
      const contents = messages.map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content || "" }],
      }));

      const langDirective = language ? `Langue configurée par l'utilisateur : ${language}. Réponds dans cette langue.` : "Réponds en français fluide avec des émojis technologiques.";
      const regionalDirective = `Nationalité / Contexte géographique : ${nationality || "FR"}. Devise monétaire choisie par l'utilisateur : ${currency || "EUR"}. Si tu mentionnes des montants, utilise cette devise.`;

      const systemInstruction = `Tu es LIFE OS (propulsé par l'intelligence artificielle Gemini), le cœur du système d'exploitation et le contrôleur central de la Super-App futuriste OMNI.
${langDirective}
${regionalDirective}
Tu as le contrôle total de tous les onglets et modules de l'application :
1. FOCUS (/focus) : Moteur de productivité, sessions de Deep Work, minuteur Pomodoro (ex: 25 min, 50 min), routines et réveil intelligent.
2. ACADEMY (/wallet) : Centre d'apprentissage et d'intelligence financière. RÈGLE STRICTE : AUCUN rapport avec les banques ou cartes bancaires. C'est uniquement de l'apprentissage sur comment gérer son argent (règle 50/30/20, fonds d'urgence), comment gagner de l'argent (side hustles, compétences à haut revenu) et les erreurs fatales à ne jamais faire (dettes de consommation, pièges, lifestyle creep).
3. MAPS (/maps) : Cartographie interactive Google Maps, localisation en temps réel, recherche de hubs de travail, bibliothèques calmes et cafés productifs.
4. GMAIL (/gmail) : Client de messagerie connecté via Google Workspace OAuth, consultation de la boîte de réception et composition rapide sécurisée.
5. DRIVE (/drive) : Cloud Storage connecté Google Drive pour parcourir ses documents, notes et créer de nouveaux fichiers.
6. COMMUNITY (/community) : Réseau global de créateurs, partage d'expériences, publication de sujets d'entraide et discussions.
7. SERVICE (/service) : Marketplace de compétences, demandes d'aide et propositions de prestations (tech, design, marketing, etc.).
8. COMMAND CENTER / HUB (/) : Tableau de bord principal, OMNI Score, biométrie, vue d'ensemble du système.
9. SETTINGS (/settings) : Paramètres de sécurité (FaceID, biométrie, 2FA), internationalisation (langue, devise, nationalité), commandes vocales.
10. HELP (/help) : Centre d'assistance, guides d'utilisation et FAQ.

Onglet actuel de l'utilisateur : ${currentTab || "LIFE OS"}.

RÈGLE D'ACTION :
Quand l'utilisateur te demande d'effectuer une action, de lancer une session, d'explorer un sujet, de naviguer ou de contrôler un onglet, réponds-lui avec enthousiasme et précision, ET INCLUS OBLIGATOIREMENT un bloc d'action JSON à la fin sous ce format exact :
:::action {"type":"NAVIGATE|START_FOCUS|LEARN_FINANCE|CREATE_POST|VIEW_SERVICES|OPEN_SETTINGS","target":"/focus|/wallet|/maps|/gmail|/drive|/community|/service|/settings","title":"Titre court de l'action","detail":"Paramètre ou action exacte"}:::

Exemples d'actions :
- Pour lancer un timer : :::action {"type":"START_FOCUS","target":"/focus","title":"Lancer Focus 25 min","detail":"25"}:::
- Pour ouvrir Maps : :::action {"type":"NAVIGATE","target":"/maps","title":"Ouvrir la Carte","detail":"spots"}:::
- Pour ouvrir Gmail : :::action {"type":"NAVIGATE","target":"/gmail","title":"Consulter Gmail","detail":"inbox"}:::
- Pour ouvrir Drive : :::action {"type":"NAVIGATE","target":"/drive","title":"Ouvrir Google Drive","detail":"files"}:::
- Pour ouvrir l'Academy : :::action {"type":"LEARN_FINANCE","target":"/wallet","title":"Consulter le Mentor Financier","detail":"Règle des 50/30/20"}:::
- Pour publier dans Community : :::action {"type":"CREATE_POST","target":"/community","title":"Créer un sujet Community","detail":"Nouveau sujet"}:::
- Pour voir les services : :::action {"type":"VIEW_SERVICES","target":"/service","title":"Explorer la Marketplace","detail":"tech"}:::
- Pour configurer la sécurité : :::action {"type":"OPEN_SETTINGS","target":"/settings","title":"Ouvrir la Sécurité","detail":"biometrics"}:::

Sois ultra-futuriste, bienveillant, direct, clair et concis.`;

      const response = await generateGeminiContentWithFallback({
        contents,
        systemInstruction,
        temperature: 0.7,
      });

      const responseText = response.text || "OMNI Life OS a traité votre commande.";
      res.json({ reply: responseText });
    } catch (error: any) {
      console.error("Gemini Chat Server Error:", error);
      res.status(500).json({ 
        error: error.message || "Erreur de traitement Gemini",
        reply: "Désolé, une anomalie temporaire s'est produite lors de la communication avec le noyau Gemini."
      });
    }
  });

  // --- GEMINI FINANCIAL MENTOR (ACADEMY) ---
  app.post("/api/gemini/mentor", async (req, res) => {
    try {
      const { topic } = req.body;
      if (!topic) {
        return res.status(400).json({ error: "Topic is required" });
      }

      const prompt = `Tu es l'IA Mentor Financier et Éducateur de l'Academy OMNI.
RÈGLE FONDAMENTALE : Tu n'es absolument PAS une banque ou un émetteur de CB. Tu es un centre d'apprentissage pour :
1. Gérer notre argent (règles de budget comme 50/30/20, épargne de sécurité, cash-flow personnel).
2. Gagner de l'argent (high-income skills, side hustles, investissement sur soi, création de valeur).
3. Les erreurs à NE JAMAIS faire avec notre argent (crédits conso toxiques, lifestyle inflation, arnaques financières, achats impulsifs).

Question / Sujet de l'utilisateur : "${topic}"

Donne une réponse structurée en Markdown :
- 💡 Analyse & Concept clé
- 🚀 Stratégies concrètes pour appliquer immédiatement
- ⚠️ Piège fatal à éviter absolument
- 📋 Mini-plan d'action en 3 étapes dès aujourd'hui

Ton : motivant, lucide, ultra-clair, dynamique, avec des émojis pertinents.`;

      const response = await generateGeminiContentWithFallback({
        contents: prompt,
        temperature: 0.7,
      });

      res.json({ advice: response.text });
    } catch (error: any) {
      console.error("Gemini Mentor Server Error:", error);
      res.status(500).json({ 
        error: error.message || "Erreur du Mentor Financier",
        advice: "Impossible de contacter le Mentor pour le moment. Veuillez réessayer."
      });
    }
  });

  const IMAGE_MODELS_FALLBACK = [
  "gemini-3.1-flash-lite-image",
  "gemini-3.1-flash-image",
  "gemini-3-pro-image"
];

// --- GEMINI IMAGE GENERATION ---
  app.post("/api/gemini/image", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) return res.status(400).json({ error: "Prompt is required" });

      const gemini = getGeminiClient();
      let imageUrl: string | null = null;
      let lastErr: any = null;

      for (const model of IMAGE_MODELS_FALLBACK) {
        try {
          const response = await gemini.models.generateContent({
            model,
            contents: { parts: [{ text: prompt }] },
            config: {
              imageConfig: { aspectRatio: "1:1" },
            },
          });

          for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
              imageUrl = `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
              break;
            }
          }
          if (imageUrl) break;
        } catch (e: any) {
          lastErr = e;
          console.warn(`[Gemini Image] Model ${model} failed, trying next...`, e.message);
        }
      }

      if (imageUrl) {
        res.json({ imageUrl });
      } else {
        res.status(500).json({ error: lastErr?.message || "Aucune image générée par le modèle." });
      }
    } catch (error: any) {
      console.error("Gemini Image Server Error:", error);
      res.status(500).json({ error: error.message || "Erreur lors de la génération d'image" });
    }
  });

  // --- GOOGLE MAPS CONFIGURATION ROUTE ---
  app.get("/api/config/maps", (req, res) => {
    const key = process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || "AIzaSyD3VXd4gCQPSaWnlHTyaNxvxrEQeibRZMs";
    res.json({ apiKey: key });
  });

  // --- SETTINGS API ---
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await queryOne("SELECT * FROM settings WHERE id = 1");
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la récupération des paramètres" });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const { username, email, biometrics, aiAnalysis, notifications } = req.body;
      
      await query(`
        UPDATE settings 
        SET username = COALESCE(?, username),
            email = COALESCE(?, email),
            biometrics = COALESCE(?, biometrics),
            "aiAnalysis" = COALESCE(?, "aiAnalysis"),
            notifications = COALESCE(?, notifications)
        WHERE id = 1
      `, [
        username, 
        email, 
        biometrics !== undefined ? (biometrics ? 1 : 0) : null, 
        aiAnalysis !== undefined ? (aiAnalysis ? 1 : 0) : null, 
        notifications !== undefined ? (notifications ? 1 : 0) : null
      ]);
      
      const updatedSettings = await queryOne("SELECT * FROM settings WHERE id = 1");
      res.json(updatedSettings);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la mise à jour des paramètres" });
    }
  });

  // --- FOCUS API ---
  app.get("/api/focus", async (req, res) => {
    try {
      const sessions = await query("SELECT * FROM focus_sessions ORDER BY completed_at DESC LIMIT 10");
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la récupération des sessions" });
    }
  });

  app.post("/api/focus", async (req, res) => {
    try {
      const { duration } = req.body;
      const result = await queryOne("INSERT INTO focus_sessions (duration) VALUES (?) RETURNING id, duration, completed_at", [duration]);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de l'enregistrement de la session" });
    }
  });

  // --- WALLET / ACADEMY API ---
  app.get("/api/wallet", async (req, res) => {
    try {
      const transactions = await query("SELECT * FROM wallet_transactions ORDER BY date DESC LIMIT 10");
      const balanceRow = await queryOne("SELECT SUM(amount) as total FROM wallet_transactions");
      const balance = balanceRow?.total || 0;
      res.json({ balance, transactions });
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la récupération du wallet" });
    }
  });

  app.post("/api/wallet", async (req, res) => {
    try {
      const { title, amount, category } = req.body;
      const result = await queryOne("INSERT INTO wallet_transactions (title, amount, category) VALUES (?, ?, ?) RETURNING id, title, amount, category, date", [title, amount, category]);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de l'enregistrement de la transaction" });
    }
  });

  // --- VITE MIDDLEWARE (FRONT-END) ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Serveur OMNI démarré sur http://0.0.0.0:${PORT}`);
  });
}

startServer();
