import React from "react";

export const BackgroundDecor: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none select-none bg-[#001E16]">
      {/* Real architectural building on the left */}
      <div
        className="absolute inset-y-0 left-0 w-full lg:w-[60%] bg-cover bg-left-top bg-no-repeat opacity-45 sm:opacity-55 mix-blend-luminosity brightness-90 contrast-125"
        style={{
          backgroundImage: "url('/assets/hero-club-exterior.png')",
        }}
      />

      {/* Emerald gradient overlay blending building with deep emerald darkness */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#001E16]/80 via-[#002D20]/90 to-[#001E16]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#003828]/50 via-transparent to-[#00140E]/90" />

      {/* Subtle gold decorative curved lines in the top-right corner */}
      <svg
        className="absolute top-0 right-0 w-[320px] sm:w-[500px] md:w-[650px] h-[320px] sm:h-[500px] md:h-[650px] opacity-75"
        viewBox="0 0 650 650"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="cornerGold1" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E5C378" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#D9AD55" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#D9AD55" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="cornerGold2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E5C378" stopOpacity="0.6" />
            <stop offset="60%" stopColor="#D9AD55" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#D9AD55" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {/* Curving swooshes in top-right */}
        <path
          d="M650 0 C 650 250, 450 480, 200 560"
          stroke="url(#cornerGold1)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M650 60 C 620 280, 420 510, 160 590"
          stroke="url(#cornerGold2)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <path
          d="M650 120 C 580 320, 390 530, 120 620"
          stroke="url(#cornerGold1)"
          strokeWidth="0.8"
          strokeDasharray="4 6"
        />
      </svg>

      {/* Subtle gold decorative curved lines in the bottom-right corner */}
      <svg
        className="absolute bottom-0 right-0 w-[300px] sm:w-[480px] md:w-[600px] h-[300px] sm:h-[480px] md:h-[600px] opacity-65"
        viewBox="0 0 600 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M600 600 C 450 580, 300 480, 200 320 C 150 240, 120 140, 100 0"
          stroke="#D9AD55"
          strokeOpacity="0.35"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M600 520 C 480 500, 350 420, 260 280 C 210 200, 180 100, 160 0"
          stroke="#E5C378"
          strokeOpacity="0.25"
          strokeWidth="1"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};
