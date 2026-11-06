
import type { ReactNode } from "react";
import { MdAddIcCall } from "react-icons/md";

type MobileActionBarProps = {
  onBookNow: () => void;
};

type ActionButtonProps = {
  label: string;
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
};

function ActionButton({
  label,
  children,
  href,
  onClick,
  disabled = false,
}: ActionButtonProps) {
  const className =
    "grid h-11 w-11 place-items-center rounded-full border border-[#f0cf78]/70 bg-[#c99a2e] text-[#071a31] shadow-[0_5px_18px_rgba(0,0,0,0.28)] transition duration-200 hover:scale-105 hover:bg-[#f0cf78] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50";

  if (href) {
    return (
      <a
        href={href}
        target={href.startsWith("https://") ? "_blank" : undefined}
        rel={
          href.startsWith("https://")
            ? "noopener noreferrer"
            : undefined
        }
        aria-label={label}
        title={label}
        className={className}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={className}
    >
      {children}
    </button>
  );
}

export default function MobileActionBar({
  onBookNow,
}: MobileActionBarProps) {
  const whatsappNumber = (
    import.meta.env.VITE_WHATSAPP_NUMBER ?? ""
  ).replace(/\D/g, "");

  const whatsappMessage =
    "Hello Lorvens Club! I'm interested in knowing more about your club membership, facilities, and benefits. Please share more details.";

  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        whatsappMessage
      )}`
    : undefined;

  return (
    <aside
      aria-label="Quick actions"
      className="fixed right-2 top-[82%] z-[60] flex -translate-y-1/2 flex-col items-center gap-3 min-[701px]:hidden"
    >
      {/* WhatsApp */}
      <ActionButton
        label="WhatsApp"
        href={whatsappUrl}
        disabled={!whatsappUrl}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-[23px] w-[23px]"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M20.52 3.48A11.82 11.82 0 0 0 12.1 0C5.55 0 .22 5.33.22 11.88c0 2.1.55 4.15 1.6 5.96L.12 24l6.31-1.66a11.9 11.9 0 0 0 5.67 1.44h.01c6.55 0 11.88-5.33 11.88-11.88 0-3.17-1.24-6.15-3.47-8.42ZM12.1 21.76a9.9 9.9 0 0 1-5.05-1.38l-.36-.21-3.75.98 1-3.65-.24-.38a9.83 9.83 0 0 1-1.51-5.24c0-5.47 4.45-9.92 9.92-9.92 2.65 0 5.14 1.03 7.01 2.91a9.86 9.86 0 0 1 2.9 7.02c0 5.47-4.45 9.92-9.92 9.92Zm5.45-7.43c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.09 4.49.71.31 1.27.5 1.7.64.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.08-.13-.27-.2-.57-.35Z" />
        </svg>
      </ActionButton>

      {/* Book Now */}
      <ActionButton
        label="Book Now"
        onClick={onBookNow}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-[22px] w-[22px]"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 10h18M8 14h3M8 17h7" />
        </svg>
      </ActionButton>

      {/* Enquire Now */}
      <ActionButton
  label="Call Now"
  href="#contact"
>
  <MdAddIcCall size={23} />
</ActionButton>
    </aside>
  );
}
