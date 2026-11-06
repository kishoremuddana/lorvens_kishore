
export default function Hero() {
  return (
    <header
      className="
        relative isolate
        overflow-hidden
        bg-[#071a31]
        bg-cover
        bg-center
        bg-no-repeat
      "
      style={{
        backgroundImage: "url('/assets/herobanner.png')",
      }}
    >
      {/* DARK OVERLAY */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute inset-0 z-0
          bg-[linear-gradient(90deg,rgba(4,15,30,0.50)_0%,rgba(4,15,30,0.24)_45%,rgba(4,15,30,0.08)_100%)]
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute inset-0 z-0
          bg-[linear-gradient(180deg,rgba(1,7,14,0.22),transparent_65%,rgba(2,8,14,0.15))]
        "
      />

      {/* HERO CONTENT */}
      <div
        className="
          relative z-[2]
          mx-auto flex
          w-[min(1180px,92%)]
          items-center
          pt-[120px]
          pb-0
          max-[700px]:w-[calc(100%-32px)]
          max-[700px]:items-end
          max-[700px]:pt-[100px]
          max-[700px]:pb-0
          max-[420px]:w-[calc(100%-24px)]
        "
      >
        <div className="max-w-[650px] text-white">
          <img
            src="/assets/lorvens-logo.png"
            alt="Lorvens Club logo"
            className="
              mb-[14px] block
              w-[min(240px,52vw)]
              drop-shadow-[0_8px_18px_rgba(0,0,0,0.5)]
              max-[700px]:w-[min(190px,58vw)]
              max-[420px]:w-[min(160px,60vw)]
            "
          />

          <div
            className="
              inline-flex items-center gap-[12px]
              text-[12px] font-bold
              tracking-[4px] text-[#f0cf78]
              before:h-px before:w-[34px] before:bg-[#c99a2e]
              after:h-px after:w-[34px] after:bg-[#c99a2e]
              max-[700px]:gap-[8px]
              max-[700px]:text-[9px]
              max-[700px]:tracking-[2.2px]
            "
          >
            COMING SOON
          </div>

          <h1
            className="
              my-[20px]
              text-[clamp(55px,7vw,96px)]
              leading-[0.95]
              tracking-[5px]
              text-[#fffaf0]
              [font-family:Georgia,'Times_New_Roman',serif]
              [text-shadow:0_8px_28px_#000]
              max-[700px]:my-[14px]
              max-[700px]:text-[46px]
              max-[700px]:leading-[1.02]
              max-[700px]:tracking-[2px]
              max-[420px]:text-[39px]
            "
          >
            A NEW <span className="text-[#f0cf78]">PRIVILEGED</span>
            <br />
            CIRCLE AWAITS
          </h1>

          <p
            className="
              mb-[28px]
              max-w-[570px]
              text-[18px]
              text-[#e7eceb]
              max-[700px]:mb-[22px]
              max-[700px]:text-[15px]
              max-[700px]:leading-[1.65]
              max-[420px]:text-[14px]
            "
          >
            Wellness. Comfort. Nature. A thoughtfully designed club
            destination where premium experiences, leisure and meaningful
            moments come together.
          </p>

          {/* BUTTONS */}
          <div
            className="
              mb-[14px]
              flex flex-wrap gap-[14px]
              max-[700px]:gap-[10px]
              max-[420px]:flex-col
              max-[420px]:items-start
            "
          >
            <a
              href="#cards"
              className="
                inline-flex items-center justify-center
                rounded-[2px]
                bg-[#c99a2e]
                px-[24px] py-[13px]
                text-[12px] font-extrabold
                tracking-[1.2px]
                text-[#182418]
                transition-colors hover:bg-[#f0cf78]
                max-[700px]:px-[16px]
                max-[700px]:py-[12px]
                max-[700px]:text-[10px]
                max-[420px]:w-full
              "
            >
              EXPLORE MEMBERSHIP
            </a>

            <a
              href="#about"
              className="
                inline-flex items-center justify-center
                rounded-[2px]
                border border-[#c99a2e]
                bg-transparent
                px-[24px] py-[13px]
                text-[12px] font-extrabold
                tracking-[1.2px]
                text-[#f0cf78]
                transition-colors
                hover:bg-[#c99a2e]
                hover:text-[#182418]
                max-[700px]:px-[16px]
                max-[700px]:py-[12px]
                max-[700px]:text-[10px]
                max-[420px]:w-full
              "
            >
              DISCOVER LORVENS
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
