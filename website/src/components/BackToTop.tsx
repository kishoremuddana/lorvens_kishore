
import { useEffect, useState } from "react";
import { FaArrowUp } from "react-icons/fa";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.querySelector("header");

    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(hero);

    return () => observer.disconnect();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={`
        fixed bottom-6 right-6 z-[9999]
        flex h-[52px] w-[52px]
        items-center justify-center
        rounded-full bg-[#c99a2e] text-white
        shadow-[0_4px_15px_rgba(0,0,0,0.3)]
        transition-all duration-500 ease-in-out
        hover:scale-110 hover:bg-[#f0cf78]
        max-[640px]:bottom-5
        max-[640px]:right-4
        max-[640px]:h-[46px]
        max-[640px]:w-[46px]
        ${
          visible
            ? "translate-y-0 scale-100 opacity-100 pointer-events-auto"
            : "translate-y-5 scale-75 opacity-0 pointer-events-none"
        }
      `}
    >
      <FaArrowUp className="text-[20px]" />
    </button>
  );
}
