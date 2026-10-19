import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { askGuide } from "../api";
import { answer, buildReply, welcome } from "../guide/guideEngine";
import { ChatIcon, CloseIcon, SendIcon, SparkIcon } from "./ui/Icons";

// Guide « Mia » : bouton flottant + feuille de discussion en bas d'écran.
// - Connaît l'écran courant et le rôle (élève / développeur) pour répondre juste.
// - Peut ouvrir l'écran dont il parle (bouton d'action) via `onNavigate`.
// - 100 % local : voir guide/guideEngine.js pour brancher une IA plus tard.

const TYPING_MS = 450;

// Libellé du bouton quand l'IA suggère d'ouvrir un écran.
const SCREEN_LABEL = {
  schedule: "Ouvrir l'emploi du temps",
  subjects: "Ouvrir les matières",
  grades: "Ouvrir le registre de notes",
  average: "Ouvrir le calculateur",
  eyes: "Ouvrir EYES",
  checklist: "Ouvrir la checklist",
};
const SEEN_KEY = "mc_guide_seen";

function hasSeenGuide() {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch (err) {
    return true; // stockage indisponible : pas de pulsation
  }
}
function markGuideSeen() {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch (err) {
    // rien à faire
  }
}

let nextId = 1;
const uid = () => `m${nextId++}`;

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1" role="status" aria-label="Mia écrit">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 animate-bounce rounded-full bg-lavender/80 motion-reduce:animate-none"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  );
}

function BotAvatar() {
  return (
    <span
      aria-hidden="true"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-white shadow-glow-sm"
    >
      <SparkIcon size={16} />
    </span>
  );
}

export default function GuideBot({ screen, onNavigate }) {
  const { user, token } = useAuth();
  const role = user?.role;
  const ctx = { role, screen, username: user?.username };

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [pulse, setPulse] = useState(() => !hasSeenGuide());

  const fabRef = useRef(null);
  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const endRef = useRef(null);
  const timerRef = useRef(null);
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;

  const pushBot = useCallback((reply) => {
    setMessages((m) => [...m, { id: uid(), from: "bot", ...reply }]);
  }, []);

  // Réponse du guide avec un court temps de « frappe » (sans délai si l'animation est réduite).
  const reply = useCallback(
    (build) => {
      clearTimeout(timerRef.current);
      setTyping(true);
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      timerRef.current = setTimeout(
        () => {
          setTyping(false);
          pushBot(build());
        },
        reduce ? 0 : TYPING_MS
      );
    },
    [pushBot]
  );

  useEffect(() => () => clearTimeout(timerRef.current), []);

  // Ouverture : message d'accueil (une seule fois par session de discussion).
  const openGuide = () => {
    setOpen(true);
    setPulse(false);
    markGuideSeen();
    setMessages((m) => (m.length ? m : [{ id: uid(), from: "bot", ...welcome(ctxRef.current) }]));
  };

  const closeGuide = useCallback(() => {
    setOpen(false);
    fabRef.current?.focus();
  }, []);

  // Fermeture avec Échap + focus gardé dans la fenêtre tant qu'elle est ouverte.
  useEffect(() => {
    if (!open) return undefined;
    inputRef.current?.focus();

    const onKey = (e) => {
      if (e.key === "Escape") {
        closeGuide();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll("button:not([disabled]), input");
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeGuide]);

  // Toujours montrer le dernier message.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "auto" });
  }, [messages, typing, open]);

  // Question libre : l'IA répond ; en cas d'échec (quota, réseau, clé absente) on retombe
  // sur le moteur local par mots-clés, donc le guide répond toujours.
  const askAI = async (clean, history) => {
    clearTimeout(timerRef.current);
    setTyping(true);
    const c = ctxRef.current;
    try {
      const { text, screen: target } = await askGuide(token, { message: clean, screen: c.screen, history });
      const allowed = SCREEN_LABEL[target] && target !== c.screen && (target !== "checklist" || c.role === "developer");
      setTyping(false);
      pushBot({ text, action: allowed ? { label: SCREEN_LABEL[target], screen: target } : null, next: [], ai: true });
    } catch (err) {
      setTyping(false);
      pushBot(answer(clean, ctxRef.current));
    }
  };

  const ask = (text, subjectId) => {
    const clean = text.trim();
    if (!clean || typing) return;
    // Les 6 derniers échanges donnent le contexte à l'IA (texte seul, rien de sensible).
    const history = messages.slice(-6).map((m) => ({ from: m.from, text: m.text }));
    setMessages((m) => [...m, { id: uid(), from: "user", text: clean }]);
    setInput("");
    if (subjectId) {
      // Pastille de suggestion : réponse locale instantanée, sans consommer de quota IA.
      reply(() => buildReply(subjectId, ctxRef.current));
    } else {
      askAI(clean, history);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    ask(input);
  };

  const runAction = (action) => {
    onNavigate(action.screen);
    closeGuide();
  };

  // Seules les suggestions du DERNIER message du guide sont actives (l'historique reste lisible).
  const lastBotId = [...messages].reverse().find((m) => m.from === "bot")?.id;

  return (
    <>
      {!open && (
        <button
          ref={fabRef}
          type="button"
          onClick={openGuide}
          aria-label="Ouvrir le guide Mia"
          aria-haspopup="dialog"
          className="fixed right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-gradient text-white shadow-glow transition active:scale-95 active:brightness-110 motion-reduce:transition-none"
          style={{ bottom: "calc(6.25rem + env(safe-area-inset-bottom, 0px))" }}
        >
          {pulse && (
            <span
              aria-hidden="true"
              className="absolute inset-0 animate-ping rounded-full bg-brand/60 motion-reduce:animate-none"
            />
          )}
          <ChatIcon size={26} className="relative" />
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={closeGuide}>
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="guide-title"
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-b-0 border-white/10 bg-surface shadow-2xl"
            style={{ height: "min(78dvh, 640px)" }}
          >
            {/* En-tête */}
            <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
              <span
                aria-hidden="true"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow-sm"
              >
                <SparkIcon size={22} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id="guide-title" className="text-base font-extrabold leading-tight text-white">
                  Mia
                </h2>
                <p className="text-xs text-lavender">Ton guide My ClassRoom</p>
              </div>
              <button
                type="button"
                onClick={closeGuide}
                aria-label="Fermer le guide"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.08] text-white transition active:bg-white/20 motion-reduce:transition-none"
              >
                <CloseIcon size={20} />
              </button>
            </header>

            {/* Conversation */}
            <div
              role="log"
              aria-live="polite"
              aria-label="Conversation avec Mia"
              className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4"
            >
              {messages.map((m) =>
                m.from === "user" ? (
                  <div key={m.id} className="flex justify-end">
                    <p className="max-w-[85%] rounded-3xl rounded-br-lg bg-brand-gradient px-4 py-2.5 text-sm font-medium text-white">
                      {m.text}
                    </p>
                  </div>
                ) : (
                  <div key={m.id} className="flex items-start gap-2">
                    <BotAvatar />
                    <div className="min-w-0 max-w-[85%] space-y-2.5">
                      <p
                        className={`rounded-3xl rounded-tl-lg border px-4 py-2.5 text-sm leading-relaxed text-white ${
                          m.unknown ? "border-orange-300/30 bg-orange-400/10" : "border-white/10 bg-white/[0.07]"
                        }`}
                      >
                        {m.text}
                      </p>

                      {m.id === lastBotId && m.action && (
                        <button type="button" onClick={() => runAction(m.action)} className="btn-primary min-h-[44px] px-5">
                          {m.action.label}
                        </button>
                      )}

                      {m.id === lastBotId && m.next?.length > 0 && !typing && (
                        <div className="flex flex-wrap gap-2">
                          {m.next.map((n) => (
                            <button
                              key={n.id}
                              type="button"
                              onClick={() => ask(n.label, n.id)}
                              className="min-h-[44px] rounded-full border border-violet-300/40 bg-violet-400/10 px-4 text-[13px] font-semibold text-violet-100 transition active:bg-violet-400/25 motion-reduce:transition-none"
                            >
                              {n.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}

              {typing && (
                <div className="flex items-start gap-2">
                  <BotAvatar />
                  <div className="rounded-3xl rounded-tl-lg border border-white/10 bg-white/[0.07] px-4 py-2">
                    <TypingDots />
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Saisie */}
            <form
              onSubmit={onSubmit}
              className="flex items-center gap-2 border-t border-white/10 px-4 pt-3"
              style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
            >
              <label htmlFor="guide-input" className="sr-only">
                Ta question pour Mia
              </label>
              <input
                id="guide-input"
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={200}
                autoComplete="off"
                enterKeyHint="send"
                placeholder="Pose ta question…"
                className="field min-h-[48px] flex-1"
              />
              <button
                type="submit"
                disabled={!input.trim() || typing}
                aria-label="Envoyer"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-white shadow-glow-sm transition active:brightness-110 disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none"
              >
                <SendIcon size={20} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
