// Moteur local de Mia : réponses par mots-clés, sans réseau ni quota.
// Exports utilisés par GuideBot.jsx : answer(), buildReply(), welcome(), startChips().

import {
  TOPICS,
  SCREEN_LABEL,
  SCREEN_START,
  SCREEN_HINT,
  DEFAULT_HINT,
  CHIP_LABEL,
  GREETING,
  UNKNOWN_TEXT,
} from "./guideData";

const isDev = (ctx) => ctx?.role === "developer";

// Minuscules, sans accents ni ponctuation.
function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function visible(id, ctx) {
  const t = TOPICS[id];
  return !!t && (!t.dev || isDev(ctx));
}

function chipsFor(ids, ctx) {
  return ids
    .filter((id) => visible(id, ctx))
    .map((id) => ({ id, label: CHIP_LABEL[id] || id }));
}

function textFor(topic, ctx) {
  const t = topic.text;
  return (isDev(ctx) ? t.developer : t.student) || t.all || t.student || t.developer || "";
}

// Réponse pour un sujet connu (pastille ou mot-clé trouvé).
export function buildReply(id, ctx) {
  const topic = TOPICS[id];
  if (!topic || !visible(id, ctx)) return { text: UNKNOWN_TEXT, action: null, next: startChips(ctx), unknown: true };
  const target = topic.screen && topic.screen !== ctx?.screen ? topic.screen : null;
  return {
    text: textFor(topic, ctx),
    action: target && SCREEN_LABEL[target] && (target !== "checklist" || isDev(ctx)) ? { label: SCREEN_LABEL[target], screen: target } : null,
    next: chipsFor(topic.next || [], ctx),
  };
}

// Question libre : meilleur sujet par score de mots-clés.
export function answer(text, ctx) {
  const q = ` ${normalize(text)} `;
  let best = null;
  let bestScore = 0;
  for (const id of Object.keys(TOPICS)) {
    if (!visible(id, ctx)) continue;
    let score = 0;
    for (const kw of TOPICS[id].keywords) {
      const k = normalize(kw);
      if (k && q.includes(k.includes(" ") ? ` ${k} ` : k)) score += k.length;
    }
    if (score > bestScore) {
      bestScore = score;
      best = id;
    }
  }
  return best ? buildReply(best, ctx) : { text: UNKNOWN_TEXT, action: null, next: startChips(ctx), unknown: true };
}

// Pastilles proposées selon l'écran courant.
export function startChips(ctx) {
  const ids = SCREEN_HINT[ctx?.screen] || DEFAULT_HINT;
  const base = chipsFor(ids, ctx);
  return base.length ? base : chipsFor(DEFAULT_HINT, ctx);
}

// Message d'accueil à l'ouverture.
export function welcome(ctx) {
  const greeting = isDev(ctx) ? GREETING.developer : GREETING.student;
  const here = SCREEN_START[ctx?.screen];
  return {
    text: here ? `${greeting} ${here}` : greeting,
    action: null,
    next: startChips(ctx),
  };
}
