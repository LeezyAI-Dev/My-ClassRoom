import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import BannerCarousel from "../components/BannerCarousel";
import BannerManager from "../components/BannerManager";
import lpmiLogo from "../assets/lpmi-logo.png";
import Checklist from "./Checklist";
import RegistreNotes from "./RegistreNotes";

const ROLE_LABEL = { developer: "développeur", student: "élève" };

function ProfileIcon(){return(<svg width="24" height="24" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7v1H4v-1z"/></svg>)}
function HomeIcon(){return(<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 10.5 12 4l8 6.5" stroke="white" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 9.5V19a1 1 0 0 0 1 1h3v-5h4v5h3a1 1 0 0 0 1-1V9.5" stroke="white" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"/></svg>)}
function CapIcon(){return(<svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M12 3 1 8l11 5 9-4.1V17h2V8L12 3z"/><path d="M5 10.5V15c0 1.7 3.1 4 7 4s7-2.3 7-4v-4.5l-7 3.2-7-3.2z" opacity="0.9"/></svg>)}
function CalendarIcon(){return(<svg width="24" height="24" viewBox="0 0 24 24" fill="white"><rect x="3" y="5" width="18" height="16" rx="2.5" fill="none" stroke="white" strokeWidth="1.8"/><path d="M3 9.5h18" stroke="white" strokeWidth="1.8"/><path d="M8 3v3M16 3v3" stroke="white" strokeWidth="1.8" strokeLinecap="round"/><rect x="6.3" y="12" width="3" height="3" rx="0.6" fill="white"/><rect x="10.5" y="12" width="3" height="3" rx="0.6" fill="white"/><rect x="14.7" y="12" width="3" height="3" rx="0.6" fill="white"/></svg>)}
function CalcIcon(){return(<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="4" y="2.5" width="16" height="19" rx="2.5" fill="none" stroke="white" strokeWidth="1.8"/><rect x="6.5" y="5" width="11" height="4.5" rx="1" fill="white"/>{[0,1].map((row)=>[0,1,2].map((col)=><rect key={`${row}-${col}`} x={6.7+col*3.8} y={12+row*4.3} width="2.6" height="2.6" rx="0.6" fill="white"/>))}</svg>)}
function EyeIconSimple(){return(<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/><circle cx="12" cy="12" r="3.2" fill="white"/></svg>)}
function ChecklistIcon(){return(<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 5h6M9 12h6M9 19h6M5 5l2 2 3-3M5 12l2 2 3-3M5 19l2 2 3-3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>)}
function NotesIcon(){return(<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M7 3h7l3 3v15a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke="white" strokeWidth="1.8"/><path d="M14 3v3h3" stroke="white" strokeWidth="1.8"/><path d="M9 12h6M9 16h6" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>)}
function ArrowIcon(){return(<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>)}

function MenuTile({ icon, label, onClick, gradient, iconBg, glow, active = true }) {
  if (!active) {
    return <div className={`relative rounded-[24px] h-[148px] border border-white/10 overflow-hidden flex items-center justify-center bg-gradient-to-br ${gradient} ${glow}`}><div className="flex gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-white/50"/><span className="w-1.5 h-1.5 rounded-full bg-white/50"/><span className="w-1.5 h-1.5 rounded-full bg-white/50"/></div></div>;
  }
  return (
    <button onClick={onClick} className={`relative rounded-[24px] h-[148px] p-3.5 flex flex-col justify-between overflow-hidden border border-white/10 active:scale-[0.96] transition-transform bg-gradient-to-br ${gradient} ${glow}`}>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg" style={{ background: iconBg }}>{icon}</div>
      <div className="flex items-end justify-between gap-1"><span className="text-white font-extrabold text-[12px] leading-tight text-left uppercase tracking-wide">{label}</span><span className="w-7 h-7 rounded-full bg-black/30 flex items-center justify-center shrink-0"><ArrowIcon/></span></div>
    </button>
  );
}

export default function Dashboard({ onNavigate: onNavigateProp, onLogout }) {
  const { user, isDeveloper, isStudent } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [currentView, setCurrentView] = useState("dashboard");
  const [selectedSubject, setSelectedSubject] = useState(null);

  const onNavigate = (view, data) => {
    if (data) setSelectedSubject(data);
    setCurrentView(view);
    if (onNavigateProp) onNavigateProp(view, data);
  };

  useEffect(() => {
    if (!user) return;
    const sendHeartbeat = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('myclassroom_session') || '{}')?.token || localStorage.getItem('token');
        if (!token) return;
        await fetch(`${import.meta.env.VITE_API_URL || '/api'}/presence/heartbeat`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch {}
    };
    sendHeartbeat();
    const id = setInterval(sendHeartbeat, 30000);
    return () => clearInterval(id);
  }, [user]);

  if (currentView === "checklist") {
    return <Checklist onBack={() => setCurrentView("dashboard")} />;
  }
  if (currentView === "registre-notes") {
    return <RegistreNotes onBack={() => setCurrentView("dashboard")} />;
  }

  return (
    <div className="min-h-screen bg-[#060b1c] flex flex-col">
      <header className="px-6 pt-9 pb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-white leading-tight text-[1.4rem] sm:text-[1.6rem] uppercase truncate" style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800 }}>Bonjour, {user?.username}</h1>
            <p className="text-sky-400 text-lg font-extrabold uppercase tracking-wide mt-2" style={{ fontFamily: "'Baloo 2', sans-serif" }}>Accueil</p>
            <div className="flex gap-1 mt-1.5"><span className="w-6 h-1 rounded-full bg-sky-400"/><span className="w-4 h-1 rounded-full bg-white/15"/></div>
          </div>
          <div className="relative shrink-0">
            <button onClick={()=>setProfileOpen(o=>!o)} aria-label="Profil" className="w-20 h-20 rounded-full overflow-hidden active:opacity-70 transition shadow-[0_0_26px_-2px_rgba(56,189,248,0.65)]"><img src={lpmiLogo} alt="LPMI" className="w-full h-full object-cover"/></button>
            {profileOpen && <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border p-4 z-20"><p className="text-sm font-semibold text-slate-800">{user?.username}</p><p className="text-xs text-slate-500 mb-3">Compte {ROLE_LABEL[user?.role]||user?.role}</p><button onClick={onLogout} className="w-full text-left text-sm font-medium text-red-600">Se déconnecter</button></div>}
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 pb-6">
        <BannerCarousel/>
        {isDeveloper && <div className="max-w-md mx-auto mb-6"><BannerManager/></div>}
        {isStudent && <p className="max-w-md mx-auto text-xs text-white/40 mb-5 text-center">Espace élève : consultation seule. Le contenu se met à jour automatiquement.</p>}

        <div className="max-w-md mx-auto grid grid-cols-3 gap-3">
          <MenuTile icon={<CapIcon/>} label="Matières" onClick={()=>onNavigate("subjects")} gradient="from-[#1660e0] to-[#05122c]" iconBg="linear-gradient(135deg, #4da3ff, #1454d8)" glow="shadow-[0_0_24px_-4px_rgba(37,120,255,0.55)]"/>
          <MenuTile icon={<CalendarIcon/>} label="Emploi du temps" onClick={()=>onNavigate("schedule")} gradient="from-[#0e8f6b] to-[#04211b]" iconBg="linear-gradient(135deg, #34d399, #047857)" glow="shadow-[0_0_24px_-4px_rgba(16,185,129,0.5)]"/>
          {isDeveloper ? (
            <MenuTile icon={<ChecklistIcon/>} label="Checklist" onClick={()=>onNavigate("checklist")} gradient="from-[#dc2626] to-[#1a0505]" iconBg="linear-gradient(135deg, #f87171, #dc2626)" glow="shadow-[0_0_24px_-4px_rgba(239,68,68,0.6)]"/>
          ) : <MenuTile icon={<NotesIcon/>} label="Registre de notes" onClick={()=>onNavigate("registre-notes")} gradient="from-[#dc2626] to-[#1a0505]" iconBg="linear-gradient(135deg, #f87171, #dc2626)" glow="shadow-[0_0_24px_-4px_rgba(239,68,68,0.6)]"/>}

          <MenuTile icon={<CalcIcon/>} label="Calculateur de moyenne" onClick={()=>onNavigate("average")} gradient="from-[#f2960c] to-[#3a1503]" iconBg="linear-gradient(135deg, #fdba74, #c2410c)" glow="shadow-[0_0_24px_-4px_rgba(245,158,11,0.55)]"/>
          <MenuTile icon={<NotesIcon/>} label="Registre de notes" onClick={()=>onNavigate("registre-notes")} gradient="from-[#6d28d9] to-[#1b0a35]" iconBg="linear-gradient(135deg, #a78bfa, #6d28d9)" glow="shadow-[0_0_20px_-6px_rgba(147,51,234,0.4)]"/>
          <MenuTile active={false} gradient="from-[#123a8f] to-[#050d24]" glow="shadow-[0_0_20px_-6px_rgba(59,130,246,0.4)]"/>

          <MenuTile active={false} gradient="from-[#0f8f9d] to-[#052226]" glow="shadow-[0_0_20px_-6px_rgba(20,184,166,0.35)]"/>
          <MenuTile active={false} gradient="from-[#a21caf] to-[#230a2e]" glow="shadow-[0_0_20px_-6px_rgba(217,70,239,0.35)]"/>
          <MenuTile icon={<EyeIconSimple/>} label="Eyes" onClick={()=>onNavigate("eyes")} gradient="from-[#f2b705] to-[#3a2400]" iconBg="linear-gradient(135deg, #fde68a, #d97706)" glow="shadow-[0_0_24px_-4px_rgba(245,180,5,0.5)]"/>
        </div>
      </main>

      <footer className="px-6 pb-6 pt-1 shrink-0">
        <div className="max-w-md mx-auto bg-white/[0.04] border border-white/10 rounded-[28px] px-10 py-3 flex items-center justify-between backdrop-blur">
          <button onClick={()=>setCurrentView("dashboard")} aria-label="Accueil" className="flex flex-col items-center gap-1.5 active:opacity-70 transition"><span className="w-11 h-11 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 shadow-[0_0_18px_rgba(56,189,248,0.6)] flex items-center justify-center"><HomeIcon/></span><span className="w-5 h-0.5 rounded-full bg-sky-400"/></button>
          <button onClick={()=>setLogoutConfirmOpen(true)} aria-label="Profil" className="w-11 h-11 rounded-full border-2 border-white/30 flex items-center justify-center active:opacity-70 transition"><ProfileIcon/></button>
        </div>
      </footer>

      {logoutConfirmOpen && <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-8" onClick={()=>setLogoutConfirmOpen(false)}><div className="bg-[#0b1230] border border-white/10 rounded-[24px] p-6 max-w-xs w-full text-center shadow-2xl" onClick={e=>e.stopPropagation()}><p className="font-extrabold text-white text-lg mb-1">Se déconnecter ?</p><p className="text-sm text-white/50 mb-5">Tu devras te reconnecter.</p><div className="flex gap-3"><button onClick={()=>setLogoutConfirmOpen(false)} className="flex-1 py-2.5 rounded-xl bg-white/10 font-bold text-white">Annuler</button><button onClick={onLogout} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold">Déconnexion</button></div></div></div>}
    </div>
  );
}
