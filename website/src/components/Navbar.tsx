
import { useState } from "react";

type NavbarProps = {
  onBookNow: () => void;
  isBookingPage?: boolean;
};

export default function Navbar({
  onBookNow,
  isBookingPage = false,
}: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { label: "ABOUT", href: isBookingPage ? "/#about" : "#about" },
    { label: "MEMBERSHIP", href: isBookingPage ? "/#cards" : "#cards" },
    { label: "AMENITIES", href: isBookingPage ? "/#amenities" : "#amenities" },
    { label: "GALLERY", href: isBookingPage ? "/#gallery" : "#gallery" },
    { label: "CONTACT", href: isBookingPage ? "/#contact" : "#contact" },
  ];

  const closeMenu = () => setMenuOpen(false);

  const handleBookNow = () => {
    closeMenu();
    onBookNow();
  };

  return (
    <nav
      className={`absolute left-0 right-0 top-0 z-[50]
        border-b border-[rgba(240,207,120,0.2)]
        bg-[#061426]
        ${menuOpen ? "max-[700px]:!bg-[#061426]" : ""}`}
    >
      {/* NAVBAR CONTAINER */}
      <div className="mx-auto flex h-[74px] w-[min(1180px,92%)] items-center justify-between text-white max-[700px]:h-[68px]">

        {/* LOGO */}
        <a
          href="/"
          onClick={closeMenu}
          className="whitespace-nowrap font-[Georgia,'Times_New_Roman',serif] text-[30px] tracking-[3px] !text-[#f0cf78] no-underline max-[700px]:text-[20px] max-[420px]:text-[16px] max-[420px]:tracking-[2px]"
        >
          LORVENS CLUB
        </a>

        {/* DESKTOP NAVIGATION LINKS */}
        <div className="hidden items-center gap-[34px] text-[12px] font-bold tracking-[1.2px] min-[701px]:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={closeMenu}
              className="whitespace-nowrap text-white no-underline transition-colors hover:text-[#f0cf78]"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* DESKTOP ACTION BUTTONS */}
        <div className="hidden items-center gap-3 min-[701px]:flex">

          {/* BOOK NOW - HOMEPAGE ONLY */}
          {!isBookingPage && (
            <a
              
              onClick={handleBookNow}
              className="inline-flex items-center justify-center rounded-[2px] border border-[#c99a2e] bg-transparent px-5 py-[11px] text-[11px] font-extrabold tracking-[1px] !text-[#f0cf78] no-underline transition-colors hover:bg-[#c99a2e] hover:!text-[#061426] cursor-pointer"
          >
              BOOK NOW
            </a>
          )}

          {/* ENQUIRE NOW - BOTH PAGES */}
          <a
            href={isBookingPage ? "/#contact" : "#contact"}
            onClick={closeMenu}
            className="inline-flex items-center justify-center rounded-[2px] border border-[#c99a2e] bg-transparent px-5 py-[11px] text-[11px] font-extrabold tracking-[1px] !text-[#f0cf78] no-underline transition-colors hover:bg-[#c99a2e] hover:!text-[#061426]"
          >
            ENQUIRE NOW
          </a>

        </div>

        {/* MOBILE MENU BUTTON */}
        <button
          type="button"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="hidden h-[40px] w-[40px] shrink-0 place-items-center border border-[#c99a2e] bg-transparent text-[#f0cf78] transition-colors hover:bg-[#c99a2e] hover:text-[#061426] max-[700px]:grid"
        >
          {menuOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h16" />
            </svg>
          )}
        </button>

      </div>

      {/* MOBILE DROPDOWN */}
      {menuOpen && (
        <div className="absolute left-0 right-0 top-full z-[60] border-t border-[rgba(240,207,120,0.2)] bg-[#061426] px-[6%] pb-6 pt-5 shadow-xl min-[701px]:hidden">

          {/* MOBILE NAVIGATION */}
          <div className="flex flex-col">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={closeMenu}
                className="border-b border-[rgba(240,207,120,0.12)] py-3 text-[11px] font-semibold tracking-[1.5px] !text-[#f0cf78] no-underline transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* MOBILE ACTION BUTTONS */}
          <div className={`mt-5 grid gap-3 ${!isBookingPage ? "grid-cols-2" : "grid-cols-1"}`}>

            {!isBookingPage && (
              <button
                type="button"
                onClick={handleBookNow}
                className="flex min-h-[42px] items-center justify-center border border-[#c99a2e] px-3 py-3 text-[11px] font-bold tracking-[1px] !text-[#f0cf78] no-underline transition-colors hover:bg-[#c99a2e] hover:!text-[#061426]"
            >
                BOOK NOW
              </button>
            )}

            <a
              href={isBookingPage ? "/#contact" : "#contact"}
              onClick={closeMenu}
              className="flex min-h-[42px] items-center justify-center border border-[#c99a2e] px-3 py-3 text-[11px] font-bold tracking-[1px] !text-[#f0cf78] no-underline transition-colors hover:bg-[#c99a2e] hover:!text-[#061426]"
            >
              ENQUIRE NOW
            </a>

          </div>
        </div>
      )}
    </nav>
  );
}
