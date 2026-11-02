import React from "react";

export const LorvensLogo: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Monogram L with Laurel Wreath */}
      <div className="relative flex items-center justify-center w-16 h-14 mb-2">
        <svg
          viewBox="0 0 100 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full text-[#D9AD55]"
        >
          {/* Laurel branch - Left side */}
          <path
            d="M25 65C23 55 24 40 33 26C34 24 33 22 31 23C27 26 21 34 18 45C16 53 19 62 25 65Z"
            fill="currentColor"
            opacity="0.85"
          />
          <path
            d="M20 54C16 51 12 43 14 36C15 34 13 33 12 35C10 40 10 49 14 56C16 58 19 57 20 54Z"
            fill="currentColor"
            opacity="0.75"
          />
          <path
            d="M23 41C19 37 17 29 21 23C22 21 20 20 19 22C16 26 15 34 19 41C21 43 23 42 23 41Z"
            fill="currentColor"
            opacity="0.8"
          />
          <path
            d="M29 30C27 25 27 18 33 13C34 11 32 10 31 12C26 15 23 21 25 30C26 32 29 32 29 30Z"
            fill="currentColor"
            opacity="0.85"
          />

          {/* Laurel branch - Right side */}
          <path
            d="M75 65C77 55 76 40 67 26C66 24 67 22 69 23C73 26 79 34 82 45C84 53 81 62 75 65Z"
            fill="currentColor"
            opacity="0.85"
          />
          <path
            d="M80 54C84 51 88 43 86 36C85 34 87 33 88 35C90 40 90 49 86 56C84 58 81 57 80 54Z"
            fill="currentColor"
            opacity="0.75"
          />
          <path
            d="M77 41C81 37 83 29 79 23C78 21 80 20 81 22C84 26 85 34 81 41C79 43 77 42 77 41Z"
            fill="currentColor"
            opacity="0.8"
          />
          <path
            d="M71 30C73 25 73 18 67 13C66 11 68 10 69 12C74 15 77 21 75 30C74 32 71 32 71 30Z"
            fill="currentColor"
            opacity="0.85"
          />

          {/* Elegant script letter L */}
          <path
            d="M48 24C44 24 41 27 41 31C41 37 47 42 49 46C51 49 51 53 49 55C47 57 43 57 39 54C37 53 36 54 37 56C39 58 43 60 48 59C54 58 57 53 56 47C55 42 48 37 47 33C46 30 48 27 52 27C55 27 58 29 60 31C61 32 62 31 62 30C59 26 54 24 48 24Z"
            fill="currentColor"
          />
          <path
            d="M51 22C43 27 46 45 42 55C40 59 36 61 31 61C29 61 29 63 31 63C38 64 45 61 47 55C49 48 48 35 55 26C56 24 54 21 51 22Z"
            fill="currentColor"
          />
        </svg>
      </div>

      {/* LORVENS CLUB title */}
      <h2 className="text-[#D9AD55] text-[19px] sm:text-[21px] font-[Georgia,serif] font-normal tracking-[3.5px] uppercase">
        Lorvens Club
      </h2>

      {/* EXCLUSIVE MEMBERSHIP with horizontal divider rules */}
      <div className="flex items-center gap-3 mt-1 w-full max-w-[280px] justify-center">
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#D9AD55]/60" />
        <span className="text-[#D9AD55]/85 text-[9px] sm:text-[10px] tracking-[2.5px] uppercase font-sans font-medium whitespace-nowrap">
          Exclusive Membership
        </span>
        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#D9AD55]/60" />
      </div>
    </div>
  );
};
