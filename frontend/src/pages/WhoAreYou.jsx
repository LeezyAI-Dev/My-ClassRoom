import React from "react";

export default function WhoAreYou({ onSelectDeveloper, onSelectStudent }) {
  return (
    <div className="min-h-screen bg-[#1c1c1c] flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-10 pb-8">
        <h1
          className="text-white text-4xl tracking-wide"
          style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800 }}
        >
          My ClassRoom
        </h1>
      </div>

      {/* Wavy white panel */}
      <div className="relative flex-1">
        <svg
          className="absolute -top-px left-0 w-full"
          viewBox="0 0 1440 100"
          preserveAspectRatio="none"
          style={{ height: "70px" }}
        >
          <path
            d="M0,70 C280,95 480,15 780,35 C1050,53 1250,8 1440,10 L1440,100 L0,100 Z"
            fill="#ffffff"
          />
        </svg>

        <div className="bg-white pt-16 pb-20 px-6 min-h-full flex flex-col items-center">
          {/* Avatar + settings row */}
          <div className="w-full flex items-center justify-between mb-8">
            <div className="flex-1" />
            <svg width="130" height="130" viewBox="0 0 140 140" fill="none">
              <circle cx="70" cy="70" r="65" stroke="#1c1c1c" strokeWidth="5" fill="none" />
              <circle cx="70" cy="54" r="23" fill="#1c1c1c" />
              <path
                d="M20,132 C20,98 42,86 70,86 C98,86 120,98 120,132"
                fill="none"
                stroke="#1c1c1c"
                strokeWidth="0"
              />
              <clipPath id="avatarClip">
                <circle cx="70" cy="70" r="65" />
              </clipPath>
              <path
                d="M14,140 C14,98 38,82 70,82 C102,82 126,98 126,140 Z"
                fill="#1c1c1c"
                clipPath="url(#avatarClip)"
              />
            </svg>
            <div className="flex-1 flex justify-end">
              <div className="bg-[#1c1c1c] rounded-xl p-3">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <line x1="3" y1="7" x2="21" y2="7" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
                  <circle cx="9" cy="7" r="2" fill="#1c1c1c" stroke="white" strokeWidth="1.6" />
                  <line x1="3" y1="15" x2="21" y2="15" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
                  <circle cx="16" cy="15" r="2" fill="#1c1c1c" stroke="white" strokeWidth="1.6" />
                </svg>
              </div>
            </div>
          </div>

          {/* Question */}
          <p
            className="text-3xl text-slate-800 mb-10 italic"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            vous êtes&nbsp;?
          </p>

          {/* Buttons */}
          <div className="w-full max-w-xs space-y-5">
            <button
              onClick={() => {}}
              className="w-full py-4 px-4 rounded-2xl bg-[#1c1c1c] text-white text-lg"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Délégué(e)
            </button>
            <button
              onClick={onSelectStudent}
              className="w-full py-4 px-4 rounded-2xl bg-[#1c1c1c] text-white text-lg hover:bg-black transition"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Élève
            </button>
            <button
              onClick={onSelectDeveloper}
              className="w-full py-4 px-4 rounded-2xl bg-[#1c1c1c] text-white text-lg hover:bg-black transition"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Développeur
            </button>
          </div>
        </div>

        <svg
          className="absolute -bottom-px left-0 w-full"
          viewBox="0 0 1440 100"
          preserveAspectRatio="none"
          style={{ height: "70px" }}
        >
          <path
            d="M0,30 C190,92 390,47 660,65 C960,85 1160,25 1440,90 L1440,0 L0,0 Z"
            fill="#ffffff"
          />
        </svg>
      </div>
    </div>
  );
}
