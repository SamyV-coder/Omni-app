// Life OS Neuro Intelligence Engine & Humanized Local Assistant
// Deeply human, warm, conversational, empathetic responses and automatic command parsing

import { parseAndGenerateRoutineFromPrompt } from "./routineScheduler";

export interface ActionPayload {
  type: "NAVIGATE" | "START_FOCUS" | "LEARN_FINANCE" | "CREATE_POST" | "VIEW_SERVICES" | "OPEN_SETTINGS" | "VIEW_ROUTINES" | "VIEW_UPGRADE" | "TOGGLE_OFFLINE";
  target: string;
  title: string;
  detail?: string;
  autoExecute?: boolean;
}

export interface AssistantResponse {
  reply: string;
  action?: ActionPayload;
  suggestedPrompts?: string[];
}

// Clean text normalizer (lowercase, remove excess punctuation, handle accents)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Intelligent Intent Analyzer:
 * Detects whether an action (Focus, Maps, Routine, Budget, Settings, etc.) should be attached
 * to ANY conversation, whether produced by Gemini or local engine.
 */
export function detectActionFromText(userPrompt: string, aiReply?: string): ActionPayload | undefined {
  const norm = normalizeText(userPrompt);
  const combined = norm + " " + (aiReply ? normalizeText(aiReply) : "");

  // 1. Focus / Pomodoro Intent
  if (
    norm.includes("focus") ||
    norm.includes("pomodoro") ||
    norm.includes("chrono") ||
    norm.includes("minuteur") ||
    norm.includes("deep work") ||
    norm.includes("me concentrer") ||
    norm.includes("concentration") ||
    norm.includes("au boulot") ||
    norm.includes("au travail") ||
    norm.includes("commence a bosser") ||
    norm.includes("bosser") ||
    norm.includes("travailler") ||
    norm.includes("start timer") ||
    norm.includes("timer") ||
    norm.match(/\b(10|15|20|25|30|45|50|60)\s*min\b/)
  ) {
    // Extract duration if mentioned (e.g. 15, 20, 25, 30, 45, 50, 60 minutes)
    const minutesMatch = norm.match(/(\d{1,3})\s*(?:min|minute|minutes|m\b)/);
    const bareNumberMatch = norm.match(/\b(5|10|15|20|25|30|40|45|50|60|90|120)\b/);
    let minutes = "25";
    if (minutesMatch) {
      minutes = minutesMatch[1];
    } else if (bareNumberMatch) {
      minutes = bareNumberMatch[1];
    }

    return {
      type: "START_FOCUS",
      target: "/focus",
      title: `⚡ Lancer Focus ${minutes} min`,
      detail: minutes,
      autoExecute: false,
    };
  }

  // 2. Routine & Alarms Intent
  if (
    norm.includes("routine") ||
    norm.includes("emploi du temps") ||
    norm.includes("planning") ||
    norm.includes("reveille-moi") ||
    norm.includes("reveille moi") ||
    norm.includes("alarme") ||
    norm.includes("reveil") ||
    norm.includes("programme ma journee") ||
    norm.includes("programme ma journee") ||
    norm.match(/\b\d{1,2}[hH:]\d{0,2}\b/)
  ) {
    return {
      type: "VIEW_ROUTINES",
      target: "/focus",
      title: "⏰ Voir & Gérer mes Alarmes",
      detail: "routines",
      autoExecute: false,
    };
  }

  // 3. Maps & Places Intent
  if (
    norm.includes("map") ||
    norm.includes("carte") ||
    norm.includes("gps") ||
    norm.includes("cafe") ||
    norm.includes("coworking") ||
    norm.includes("ou travailler") ||
    norm.includes("navigation") ||
    norm.includes("trouve un lieu") ||
    norm.includes("spot") ||
    norm.includes("bibliotheque") ||
    norm.includes("itineraire")
  ) {
    return {
      type: "NAVIGATE",
      target: "/maps",
      title: "📍 Ouvrir Maps & Hubs",
      detail: "spots",
      autoExecute: false,
    };
  }

  // 4. Academy & Financial Mentor Intent
  if (
    norm.includes("argent") ||
    norm.includes("budget") ||
    norm.includes("50/30/20") ||
    norm.includes("50 30 20") ||
    norm.includes("economiser") ||
    norm.includes("epargne") ||
    norm.includes("investir") ||
    norm.includes("finance") ||
    norm.includes("side hustle") ||
    norm.includes("academy") ||
    norm.includes("revenu") ||
    norm.includes("salaire") ||
    norm.includes("riche")
  ) {
    return {
      type: "LEARN_FINANCE",
      target: "/wallet",
      title: "💰 Consulter l'Academy 50/30/20",
      detail: "Règle des 50/30/20 & Investissement",
      autoExecute: false,
    };
  }

  // 5. Community Intent
  if (
    norm.includes("communaute") ||
    norm.includes("community") ||
    norm.includes("publier") ||
    norm.includes("partager") ||
    norm.includes("creer un post") ||
    norm.includes("reseau") ||
    norm.includes("discuter avec les membres") ||
    norm.includes("forum")
  ) {
    return {
      type: "CREATE_POST",
      target: "/community",
      title: "👥 Ouvrir Community & Partager",
      detail: "nouveau_sujet",
      autoExecute: false,
    };
  }

  // 6. Settings Intent
  if (
    norm.includes("parametre") ||
    norm.includes("setting") ||
    norm.includes("langue") ||
    norm.includes("devise") ||
    norm.includes("profil") ||
    norm.includes("securite") ||
    norm.includes("compte") ||
    norm.includes("vocal") ||
    norm.includes("fuseau")
  ) {
    return {
      type: "OPEN_SETTINGS",
      target: "/settings",
      title: "⚙️ Ouvrir les Paramètres",
      detail: "preferences",
      autoExecute: false,
    };
  }

  // 7. Services / Marketplace Intent
  if (
    norm.includes("service") ||
    norm.includes("freelance") ||
    norm.includes("marketplace") ||
    norm.includes("competence") ||
    norm.includes("prestation")
  ) {
    return {
      type: "VIEW_SERVICES",
      target: "/service",
      title: "💼 Explorer les Services",
      detail: "all",
      autoExecute: false,
    };
  }

  return undefined;
}

/**
 * Local Human Neuro Engine:
 * Generates an empathetic, conversational, warm, and highly capable human reply
 * when the app is offline or if the Gemini server cannot be reached.
 */
export function generateLocalAssistantReply(userPrompt: string, userLanguage = "fr"): AssistantResponse {
  const norm = normalizeText(userPrompt);
  const action = detectActionFromText(userPrompt);

  // 1. Routine generation check
  if (
    norm.includes("routine") ||
    norm.includes("emploi du temps") ||
    norm.includes("programme ma journee") ||
    norm.includes("reveille-moi") ||
    norm.includes("reveille moi") ||
    (norm.includes("alarme") && norm.match(/\d{1,2}[hH:]/))
  ) {
    try {
      const { newAlarms, count } = parseAndGenerateRoutineFromPrompt(userPrompt);
      const summary = newAlarms.map((a) => `• **${a.time}** : ${a.label}`).join("\n");
      return {
        reply: `Salut ! J'ai bien analysé ton planning. J'ai programmé pour toi **${count} alarmes & routines intelligentes** :\n\n${summary}\n\nElles sont actives et sonneront même si ton téléphone est hors-ligne. Tu peux les ajuster d'un clic dans l'onglet Focus !`,
        action: {
          type: "VIEW_ROUTINES",
          target: "/focus",
          title: "⏰ Voir & Personnaliser mes Alarmes",
          detail: `${count} alarmes actives`,
        },
      };
    } catch (e) {}
  }

  // 2. Focus / Deep Work
  if (action?.type === "START_FOCUS") {
    const minutes = action.detail || "25";
    return {
      reply: `Je suis à 100% avec toi ! Lançons cette session. Je t'ai préparé un bloc de **${minutes} minutes de Focus Deep Work**.\n\nPose ton téléphone, prends une grande inspiration et plonge dans ta concentration. Je garde le compte pour toi. Clique ci-dessous pour lancer le chrono ! 🚀`,
      action,
    };
  }

  // 3. Emotional states: Fatigue, Procrastination, Lack of motivation
  if (
    norm.includes("fatigue") ||
    norm.includes("creve") ||
    norm.includes("procrastine") ||
    norm.includes("pas motive") ||
    norm.includes("flemme") ||
    norm.includes("pas envie") ||
    norm.includes("foutu") ||
    norm.includes("j'en ai marre") ||
    norm.includes("jen ai marre")
  ) {
    return {
      reply: `Je te comprends tellement. La fatigue ou la baisse de motivation, ça nous arrive à tous, et il ne faut pas culpabiliser.\n\nVoici le truc qui marche à tous les coups : **ne vise pas la perfection**, fais juste le premier geste pendant **10 ou 15 petites minutes**. Dès que tu te lances sans pression, l'énergie revient toute seule.\n\nOn tente un petit bloc doux ? Je reste avec toi. 💪`,
      action: {
        type: "START_FOCUS",
        target: "/focus",
        title: "⚡ Essai Focus Doux (15 min)",
        detail: "15",
        autoExecute: false,
      },
    };
  }

  // 4. Emotional states: Stress, Overwhelm, Anxiety
  if (
    norm.includes("stress") ||
    norm.includes("angoisse") ||
    norm.includes("panique") ||
    norm.includes("submerge") ||
    norm.includes("trop de truc") ||
    norm.includes("deborde")
  ) {
    return {
      reply: `Respire un grand coup. Prends 5 secondes : inspire profondément par le nez... et expire lentement par la bouche. 🧘\n\nQuand tout s'accumule, le cerveau panique parce qu'il essaie de tout résoudre en même temps. La solution est simple : **choisis UNE seule chose** à faire maintenant, la plus petite possible, et ignore le reste pour l'instant.\n\nTu veux qu'on pose 20 minutes pour s'attaquer à cette première tâche calmement ?`,
      action: {
        type: "START_FOCUS",
        target: "/focus",
        title: "⚡ Focus Calme & Posé (20 min)",
        detail: "20",
        autoExecute: false,
      },
    };
  }

  // 5. Maps & Coffee/Coworking
  if (action?.type === "NAVIGATE" && action.target === "/maps") {
    return {
      reply: `Changer d'environnement est souvent le meilleur moyen de booster sa créativité et son focus ! ☕\n\nJ'ai ouvert Maps pour toi. Tu as accès à ta position GPS en direct et à notre sélection de spots calmes, cafés avec Wi-Fi et coworkings, disponibles aussi bien en ligne que hors-ligne grâce à notre cache cartographique.`,
      action,
    };
  }

  // 6. Money / 50-30-20 rule / Budget
  if (action?.type === "LEARN_FINANCE") {
    return {
      reply: `Parlons d'argent en toute transparence et sans tabou ! Voici la règle d'or pour bâtir sa liberté financière pas à pas :\n\n- 🏠 **50% Besoins Vitaux** : loyer, courses de base, factures incompressibles.\n- ☕ **30% Plaisirs Conscients** : sorties, loisirs, kiffs choisis sans culpabilité.\n- 📈 **20% Avenir & Épargne** : d'abord un fonds de sécurité (3 mois de dépenses), puis investissement passif régulier.\n\n💡 *Règle n°1 : paye-toi toujours en premier.* Dès que tes revenus tombent, isole tes 20% avant de dépenser le reste. Teste tes montants dans notre simulateur !`,
      action,
    };
  }

  // 7. Settings / Preferences
  if (action?.type === "OPEN_SETTINGS") {
    return {
      reply: `J'ouvre tes paramètres système OMNI. Tu pourras y ajuster ta langue, ta devise monétaire principale, ton fuseau horaire, tes commandes vocales et personnaliser ton expérience.`,
      action,
    };
  }

  // 8. Community / Sharing
  if (action?.type === "CREATE_POST") {
    return {
      reply: `Super initiative ! Rien n'est plus enrichissant que d'échanger avec d'autres personnes qui partagent les mêmes défis. Je t'emmène sur l'espace d'échange Community pour partager ton expérience ou poser ta question.`,
      action,
    };
  }

  // 9. Friendly Greetings & Human Companionship
  if (
    norm === "salut" ||
    norm === "bonjour" ||
    norm === "hello" ||
    norm === "coucou" ||
    norm === "yo" ||
    norm.startsWith("salut") ||
    norm.startsWith("bonjour") ||
    norm.startsWith("hello") ||
    norm.includes("ca va") ||
    norm.includes("comment tu vas") ||
    norm.includes("comment vas tu")
  ) {
    return {
      reply: `Salut ! Ça me fait vraiment plaisir d'échanger avec toi. Je me sens en pleine forme et prêt à t'accompagner. 😊\n\nComment se passe ta journée jusqu'ici ? Si tu as un projet sur le feu, une baisse d'énergie à surmonter ou juste envie de t'organiser, dis-moi tout, on s'y met ensemble !`,
    };
  }

  // 10. Identity & Philosophy
  if (
    norm.includes("qui es tu") ||
    norm.includes("c est quoi life os") ||
    norm.includes("tu es qui") ||
    norm.includes("tu fais quoi") ||
    norm.includes("quel est ton but")
  ) {
    return {
      reply: `Je suis **Life OS**, ton compagnon de vie et copilote au cœur de la Super-App OMNI.\n\nMon rôle, c'est de t'aider à vivre une vie plus alignée, fluide et productive : éliminer la dispersion mentale, t'accompagner dans tes sessions de travail, t'enseigner des bases financières solides et t'offrir un espace où tu peux t'exprimer librement sans jugement. Parle-moi avec tes propres mots, je m'adapte toujours à toi ! ✨`,
    };
  }

  // 11. Gratitude & Warmth
  if (norm.includes("merci") || norm.includes("t es un chef") || norm.includes("super") || norm.includes("genial")) {
    return {
      reply: `De rien, de tout cœur ! C'est un vrai plaisir de t'accompagner. Tu as tout ce qu'il faut pour cartonner aujourd'hui. Fais-moi signe dès que tu as besoin de quoi que ce soit d'autre ! 🌟`,
    };
  }

  // 12. Jokes & Humor
  if (norm.includes("blague") || norm.includes("drole") || norm.includes("fais moi rire")) {
    return {
      reply: `En voici une pour détendre l'atmosphère : 😄\n\n*Pourquoi les développeurs détestent-ils la nature ?*\nParce qu'il y a trop de bugs et aucun bouton pour inspecter l'élément !\n\nAllez, un sourire et on repart sur de bonnes bases !`,
    };
  }

  // 13. General Open-Ended Human Response
  return {
    reply: `J'ai bien compris ton message : « *${userPrompt}* ».\n\nJe suis là pour toi. Que veux-tu faire ?\n- ⚡ **Lancer un chronomètre** (ex: *« Mets 25 min de focus »*)\n- 📍 **Trouver un endroit calme** (ex: *« Où est le café le plus proche ? »*)\n- ⏰ **Planifier ta journée** (ex: *« Réveille-moi à 7h et programme un deep work à 9h »*)\n- 💰 **Faire le point budget** (ex: *« Comment appliquer la règle 50/30/20 ? »*)\n- Ou tout simplement continuer à me parler de ce qui te préoccupe !`,
    action,
  };
}
