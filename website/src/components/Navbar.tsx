type NavbarProps = {
  onBookNow: () => void;
};

export default function Navbar({ onBookNow }: NavbarProps) {
  return (
    <nav className="absolute left-0 right-0 top-0 z-[10] border-b border-[rgba(240,207,120,0.2)]">
      <div className="mx-auto flex h-[88px] w-[min(1180px,92%)] items-center justify-between text-white max-[700px]:h-[68px] max-[420px]:h-[62px]">
        <a
          href="#"
          className="whitespace-nowrap font-[Georgia,'Times_New_Roman',serif] text-[22px] tracking-[4px] !text-[#f0cf78] max-[700px]:text-[16px] max-[700px]:tracking-[2.2px] max-[420px]:text-[14px] max-[420px]:tracking-[1.7px]"
        >
          LORVENS CLUB
        </a>

        <div className="flex items-center gap-[28px] text-[12px] font-bold tracking-[1.4px] max-[700px]:hidden">
          <a className="transition-colors hover:text-[#f0cf78]" href="#about">ABOUT</a>
          <a className="transition-colors hover:text-[#f0cf78]" href="#cards">MEMBERSHIP</a>
          <a className="transition-colors hover:text-[#f0cf78]" href="#amenities">AMENITIES</a>
          <a className="transition-colors hover:text-[#f0cf78]" href="#gallery">GALLERY</a>
          <a className="transition-colors hover:text-[#f0cf78]" href="#contact">CONTACT</a>
        </div>

        {/* BOOK NOW BUTTON */}
        <button
          type="button"
          onClick={onBookNow}
          className="inline-block rounded-[2px] border border-[#c99a2e] bg-transparent px-[24px] py-[13px] text-[12px] font-extrabold tracking-[1.2px] !text-[#f0cf78] transition-colors hover:bg-[#c99a2e] hover:text-[#182418] max-[700px]:px-[16px] max-[700px]:py-[12px] max-[700px]:text-[10px] max-[700px]:tracking-[0.8px]"
          >
          BOOK NOW
        </button>

        <a
          href="#contact"
          className="inline-block rounded-[2px] border border-[#c99a2e] bg-transparent px-[24px] py-[13px] text-[12px] font-extrabold tracking-[1.2px] !text-[#f0cf78] transition-colors hover:bg-[#c99a2e] hover:text-[#182418] max-[700px]:px-[16px] max-[700px]:py-[12px] max-[700px]:text-[10px] max-[700px]:tracking-[0.8px]"
        >
          ENQUIRE NOW
        </a>
      </div>
    </nav>
  );
}
