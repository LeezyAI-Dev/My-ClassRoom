import React from "react";

export default function WhoAreYou({ onSelectDeveloper, onSelectStudent }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <h1 className="text-2xl font-semibold text-slate-800 mb-2">My ClassRoom</h1>
      <p className="text-lg text-slate-600 mb-8">Vous êtes ?</p>

      <div className="w-full max-w-xs space-y-3">
        <button
          onClick={onSelectStudent}
          className="w-full py-3 px-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
        >
          Élève
        </button>
        <button
          onClick={onSelectDeveloper}
          className="w-full py-3 px-4 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition"
        >
          Compte développeur
        </button>
      </div>
    </div>
  );
}
