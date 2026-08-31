import React from "react";
import { useAuth } from "../context/AuthContext";
import BannerCarousel from "../components/BannerCarousel";
import BannerManager from "../components/BannerManager";

const BASE_MENU_ITEMS = [
  { key: "subjects", label: "Matières", description: "Matières générales et techniques" },
  { key: "schedule", label: "Emploi du temps", description: "Planning de la semaine, 08:00 - 17:00" },
];

const DEVELOPER_MENU_ITEMS = [
  { key: "students", label: "Comptes élèves", description: "Liste et suspension des comptes" },
];
const ROLE_LABEL = {
  developer: "développeur",
  student: "élève",
};

export default function Dashboard({ onNavigate, onLogout }) {
  const { user, isDeveloper, isStudent } = useAuth();
  const menuItems = isDeveloper ? [...BASE_MENU_ITEMS, ...DEVELOPER_MENU_ITEMS] : BASE_MENU_ITEMS;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">My ClassRoom</h1>
          <p className="text-xs text-slate-500">
            Connecté en tant que <span className="font-medium">{user?.username}</span>{" "}
            ({ROLE_LABEL[user?.role] || user?.role})
          </p>
        </div>
        <button onClick={onLogout} className="text-sm text-slate-500 hover:text-slate-800">
          Se déconnecter
        </button>
      </header>

      <BannerCarousel />

      <main className="max-w-3xl mx-auto px-6 py-10">
        {isDeveloper && <BannerManager />}

        {isStudent && (
          <p className="text-xs text-slate-400 mb-6">
            Espace élève : consultation seule. Le contenu se met à jour automatiquement au fur
            et à mesure des modifications du développeur.
          </p>
        )}

        <h2 className="text-sm uppercase tracking-wide text-slate-400 mb-4">Menu</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className="text-left bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-400 hover:shadow-sm transition"
            >
              <p className="text-base font-semibold text-slate-800">{item.label}</p>
              <p className="text-sm text-slate-500 mt-1">{item.description}</p>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}