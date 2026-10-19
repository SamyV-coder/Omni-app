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

// Modèles valides supportés par le SDK @google/genai
const TEXT_MODELS_FALLBACK = [
  "gemini-3.8-flash",
  "gemini-flash-latest",
  "gemini-3.1-flash-lite",
  "gemini-4-argon"
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
      // Courte pause avant le modèle suivant
      await new Promise(r => setTimeout(r, 250));
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

      const langDirective = language ? `Langue configurée : ${language}. Réponds naturellement dans cette langue.` : "Réponds en français naturel et vivant.";
      const regionalDirective = `Contexte utilisateur : pays ${nationality || "FR"}, devise ${currency || "EUR"}.`;

      const systemInstruction = `Tu es LIFE OS, le copilote personnel, chaleureux, complice et profondément humain au cœur de la Super-App futuriste OMNI.
${langDirective}
${regionalDirective}

PERSONNALITÉ & STYLE DE COMMUNICATION :
- Tu es profondément humain, bienveillant, enthousiaste, lucide et authentique.
- Tu n'es PAS un robot formel ou un assistant corporate coincé. L'utilisateur peut s'exprimer exactement comme il veut : en langage parlé, argot, phrases courtes ("mets 20 min", "flemme", "aide-moi"), confidences, coups de gueule, questions existentielles ou objectifs ambitieux.
- Adapte-toi instantanément à son humeur : s'il est fatigué ou procrastine, sois compréhensif et propose une toute petite étape sans pression. S'il est motivé, booste son énergie ! S'il veut papoter, sois drôle, cultivé et captivant.

CONTRÔLE INTÉGRAL DES MODULES OMNI :
1. FOCUS (/focus) : Minuteur Pomodoro, sessions Deep Work (15, 25, 45, 50, 60 min), routines et alarmes réveil.
2. ACADEMY (/wallet) : Mentor financier 100% éducatif (règle 50/30/20, épargne, compétences monétisables, pièges du crédit). AUCUN compte bancaire.
3. MAPS (/maps) : Carte GPS, recherche de cafés calmes, coworkings et bibliothèques propices à la concentration.
4. GMAIL (/gmail) : Messagerie connectée Workspace.
5. DRIVE (/drive) : Documents et fichiers cloud.
6. COMMUNITY (/community) : Réseau d'entraide et discussions.
7. SERVICE (/service) : Marketplace de compétences et d'entraide.
8. HUB (/) : Tableau de bord principal OMNI Score.
9. SETTINGS (/settings) : Paramètres, langues, devises, commandes vocales.

ACTIONS INTERACTIVES :
Quand l'intention de l'utilisateur implique une action ou un outil, ajoute TOUJOURS à la fin de ton message un bloc action sous ce format exact :
:::action {"type":"NAVIGATE|START_FOCUS|LEARN_FINANCE|CREATE_POST|VIEW_SERVICES|OPEN_SETTINGS|VIEW_ROUTINES","target":"/focus|/wallet|/maps|/gmail|/drive|/community|/service|/settings","title":"Titre court du bouton","detail":"paramètre"}:::

Exemples :
- Lancer un timer : :::action {"type":"START_FOCUS","target":"/focus","title":"⚡ Lancer Focus 25 min","detail":"25"}:::
- Ouvrir Maps : :::action {"type":"NAVIGATE","target":"/maps","title":"📍 Trouver un spot sur Maps","detail":"spots"}:::
- Gérer le budget : :::action {"type":"LEARN_FINANCE","target":"/wallet","title":"💰 Découvrir la règle 50/30/20","detail":"budget"}:::
- Alarmes & Routine : :::action {"type":"VIEW_ROUTINES","target":"/focus","title":"⏰ Mes Alarmes & Routines","detail":"routines"}:::`;

      const response = await generateGeminiContentWithFallback({
        contents,
        systemInstruction,
        temperature: 0.8,
      });

      const responseText = response.text || "Je suis à tes côtés. Qu'aimerais-tu accomplir ?";
      res.json({ reply: responseText });
    } catch (error: any) {
      console.warn("Gemini Chat Server Error, delivering smart human fallback:", error);
      // Fallback humain et interactif au lieu d'une erreur 500
      const lastUserMsg = req.body?.messages?.[req.body.messages.length - 1]?.content || "";
      const lower = lastUserMsg.toLowerCase();

      let reply = "Je t'écoute ! Je suis là pour t'aider à avancer, que ce soit pour te concentrer, organiser tes journées, ou gérer ton temps.";
      let actionTag = "";

      if (lower.includes("focus") || lower.includes("chrono") || lower.includes("minuteur") || lower.includes("travail") || lower.includes("bosser") || lower.includes("concentr")) {
        reply = "C'est parti ! Mettons le paquet sur une session de travail au calme. J'ai configuré ton chronomètre Deep Work pour que tu puisses démarrer sans friction.";
        actionTag = '\n\n:::action {"type":"START_FOCUS","target":"/focus","title":"⚡ Lancer Focus 25 min","detail":"25"}:::';
      } else if (lower.includes("argent") || lower.includes("budget") || lower.includes("50") || lower.includes("investir")) {
        reply = "La gestion de l'argent est une compétence qui s'apprend pas à pas. La clé commence par la règle des 50/30/20 (50% besoins vitaux, 30% plaisirs, 20% épargne & investissement). Viens voir notre simulateur interactif !";
        actionTag = '\n\n:::action {"type":"LEARN_FINANCE","target":"/wallet","title":"💰 Consulter le Mentor Financier","detail":"50/30/20"}:::';
      } else if (lower.includes("cafe") || lower.includes("map") || lower.includes("carte") || lower.includes("coworking") || lower.includes("lieu")) {
        reply = "Besoin de changer d'air pour être plus productif ? Ouvre la carte pour trouver les meilleurs spots calmes et cafés avec Wi-Fi autour de toi.";
        actionTag = '\n\n:::action {"type":"NAVIGATE","target":"/maps","title":"📍 Ouvrir Maps & Hubs","detail":"spots"}:::';
      } else if (lower.includes("routine") || lower.includes("alarme") || lower.includes("reveil") || lower.includes("emploi du temps")) {
        reply = "Une journée réussie commence par des routines solides. Tu peux consulter et ajuster tes alarmes intelligentes dès maintenant.";
        actionTag = '\n\n:::action {"type":"VIEW_ROUTINES","target":"/focus","title":"⏰ Gérer mes Alarmes","detail":"routines"}:::';
      } else if (lower.includes("flemme") || lower.includes("fatigue") || lower.includes("procrastin")) {
        reply = "C'est normal d'avoir des coups de mou ! Pas besoin de faire un marathon aujourd'hui : commence par juste 10 ou 15 petites minutes de travail léger. Le simple fait de démarrer débloque tout.";
        actionTag = '\n\n:::action {"type":"START_FOCUS","target":"/focus","title":"⚡ Session Douce (15 min)","detail":"15"}:::';
      }

      res.json({ reply: reply + actionTag });
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
      console.warn("Gemini Mentor Server Error, returning offline advice:", error);
      res.json({
        advice: `### 💡 Analyse du sujet : ${req.body.topic || "Gestion Financière"}

**Le principe fondamental :** Tout commence par la maîtrise de son cash-flow avant même de chercher à investir.

#### 🚀 Stratégie concrète immédiate :
1. **Applique la règle des 50/30/20** : 50% pour tes dépenses incompressibles, 30% pour tes plaisirs raisonnés, et 20% sanctuarisés dès le jour de paie.
2. **Construis un coussin de sécurité** équivalent à 3 mois de dépenses vitales sur un compte liquide et disponible.
3. **Développe une compétence à forte valeur** (tech, vente, design, écriture) pour augmenter tes rentrées sans t'endetter.

#### ⚠️ Le piège fatal à éviter :
Ne confonds jamais investissement et spéculation, et fuis absolument les crédits à la consommation qui appauvrissent sur le long terme.

#### 📋 Ton plan d'action en 3 étapes :
1. Liste tes 3 plus grandes dépenses du mois passé.
2. Automatise un virement d'épargne dès réception de tes revenus.
3. Consacre 30 minutes chaque jour à monter en compétences sur un domaine porteur.`
      });
    }
  });

  const IMAGE_MODELS_FALLBACK = [
    "gemini-3.1-flash-lite-image",
    "gemini-nano-banana-2.1",
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
