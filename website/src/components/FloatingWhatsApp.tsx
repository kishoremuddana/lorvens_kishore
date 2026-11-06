
import { FaWhatsapp } from "react-icons/fa";

const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER;

const message =
  "Hello Lorvens Club! I'm interested in knowing more about your club membership, facilities, and benefits. Please share more details.";

export default function FloatingWhatsApp() {
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Lorvens Club on WhatsApp"
      className="
        fixed bottom-6 left-6 z-[9999]
        flex h-[50px] w-[50px]
        items-center justify-center
        rounded-full bg-[#25D366]
        text-white
        shadow-[0_4px_15px_rgba(0,0,0,0.3)]
        transition-transform duration-300
        hover:scale-110
        max-[640px]:bottom-5
        max-[640px]:left-4
        max-[640px]:h-[52px]
        max-[640px]:w-[52px]
      "
    >
      <FaWhatsapp className="text-[30px] max-[500px]:text-[30px] text-white" />
    </a>
  );
}
