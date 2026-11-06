
import { useEffect, useState, type FormEvent } from "react";

type BookingFormProps = {
  onBack: () => void;
  onViewTerms: () => void;
};

type CreateOrderResponse = {
  message: string;
  key_id: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  email: string;
  mobile: string;
};

type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
  handler: (response: RazorpaySuccessResponse) => void;
  modal: {
    ondismiss: () => void;
  };
};

type RazorpayInstance = {
  open: () => void;
  on: (
    event: "payment.failed",
    callback: (response: {
      error?: { description?: string };
    }) => void
  ) => void;
};

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const MEMBERSHIP_FEE = 100000;
const CARD_FLIP_INTERVAL = 2500;

type CardSide = "front" | "back";

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    if (existingScript) {
      existingScript.addEventListener(
        "load",
        () => resolve(true),
        { once: true }
      );

      existingScript.addEventListener(
        "error",
        () => resolve(false),
        { once: true }
      );

      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
};

export default function BookingForm({
  onBack,
  onViewTerms,
}: BookingFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [notice, setNotice] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Automatic membership card animation
  const [showBackCard, setShowBackCard] = useState(false);

  // Popup state
  const [selectedCard, setSelectedCard] = useState<CardSide | null>(null);

  useEffect(() => {
    const cardInterval = window.setInterval(() => {
      setShowBackCard((previous) => !previous);
    }, CARD_FLIP_INTERVAL);

    return () => {
      window.clearInterval(cardInterval);
    };
  }, []);

  // Close popup using Escape key and prevent background scrolling
  useEffect(() => {
    if (!selectedCard) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedCard(null);
      }

      if (event.key === "ArrowRight") {
        setSelectedCard((previous) =>
          previous === "front" ? "back" : "front"
        );
      }

      if (event.key === "ArrowLeft") {
        setSelectedCard((previous) =>
          previous === "front" ? "back" : "front"
        );
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedCard]);

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  const handleMobileChange = (value: string) => {
    setMobile(value.replace(/\D/g, "").slice(0, 10));
  };

  const openCardPopup = (side: CardSide) => {
    setSelectedCard(side);
  };

  const showNextCard = () => {
    setSelectedCard((previous) =>
      previous === "front" ? "back" : "front"
    );
  };

  const showPreviousCard = () => {
    setSelectedCard((previous) =>
      previous === "front" ? "back" : "front"
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice("");

    if (isProcessing) return;

    if (!acceptedTerms) {
      setNotice("Please accept the Terms & Conditions to continue.");
      return;
    }

    if (mobile.length !== 10) {
      setNotice("Please enter a valid 10-digit mobile number.");
      return;
    }

    setIsProcessing(true);

    try {
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded || !window.Razorpay) {
        throw new Error(
          "Unable to load the payment gateway. Please try again."
        );
      }

      const orderResponse = await fetch(
        `${API_BASE_URL}/api/v1/payments/create-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            full_name: fullName.trim(),
            email: email.trim(),
            mobile,
          }),
        }
      );

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(
          orderData.detail || "Unable to create payment order."
        );
      }

      const order = orderData as CreateOrderResponse;

      const options: RazorpayOptions = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "Lorvens Club",
        description: "Lifetime Membership",
        order_id: order.order_id,

        prefill: {
          name: order.name,
          email: order.email,
          contact: order.mobile,
        },

        theme: {
          color: "#00352d",
        },

        handler: async (response) => {
          try {
            setNotice("Payment received. Verifying your payment...");

            const verifyResponse = await fetch(
              `${API_BASE_URL}/api/v1/payments/verify`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              }
            );

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok) {
              throw new Error(
                verifyData.detail || "Payment verification failed."
              );
            }

            if (verifyData.status !== "paid") {
              setNotice(
                "Payment is not yet confirmed. Please contact Lorvens Club before retrying."
              );
              return;
            }

            setNotice(
              "Payment successful! Your Lorvens Club membership payment has been verified."
            );
          } catch (error) {
            console.error("Payment verification error:", error);

            setNotice(
              error instanceof Error
                ? error.message
                : "Payment verification failed. Please contact support."
            );
          } finally {
            setIsProcessing(false);
          }
        },

        modal: {
          ondismiss: () => {
            setNotice(
              "Payment window closed. You can try again when ready."
            );
            setIsProcessing(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", (response) => {
        setNotice(
          response.error?.description ||
            "Payment failed. Please try again."
        );

        setIsProcessing(false);
      });

      razorpay.open();
    } catch (error) {
      console.error("Payment initialization error:", error);

      setNotice(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );

      setIsProcessing(false);
    }
  };

  const frontImage = "/assets/membership-card-front.png";
  const backImage = "/assets/membership-card-back.png";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#061d19] text-[#10251f]">
      {/* BACKGROUND */}
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-[url('/assets/herobanner.png')] bg-cover bg-center bg-no-repeat"
      />

      <div
        aria-hidden="true"
        className="fixed inset-0 bg-[#001914]/75"
      />

      <div className="relative z-10">
        {/* PAGE HEADING */}
        <section className="px-5 pb-5 pt-[130px] text-center sm:pt-[140px] lg:pt-[100px]">
          <p className="text-[10px] font-bold uppercase tracking-[4px] text-[#e9b94e] sm:text-[11px]">
            LORVENS CLUB MEMBERSHIP
          </p>

          <h1 className="mt-2 font-serif text-[27px] font-bold leading-tight text-[#f6efdc] sm:text-[36px]">
            Begin Your Membership
          </h1>

          <div className="mx-auto mt-3 h-[2px] w-[90px] bg-[#d5a43d]" />

          <p className="mx-auto mt-3 max-w-[650px] text-[12px] leading-5 text-[#f3eee3] sm:text-[13px]">
            Complete your details below and take the first step towards
            becoming a part of the exclusive Lorvens Club community.
          </p>
        </section>

        {/* BOOKING FORM AND MEMBERSHIP CARD */}
        <section className="mx-auto grid w-[90%] max-w-[1000px] grid-cols-1 items-stretch gap-5 pb-7 lg:grid-cols-[1.1fr_0.9fr]">
          {/* LEFT: BOOKING FORM */}
          <div className="h-full overflow-hidden rounded-[14px] border border-[#d5a43d] bg-[#f7f2e7] shadow-[0_10px_30px_rgba(0,0,0,0.30)]">
            {/* HEADER */}
            <div className="relative overflow-hidden bg-[#00352d] px-5 py-3.5">
              <div
                aria-hidden="true"
                className="absolute -right-5 top-0 h-full w-[55px] skew-x-[-22deg] bg-gradient-to-b from-[#e8bd57] to-[#a76d18]"
              />

              <div className="relative z-10">
                <p className="text-[9px] font-bold tracking-[2.5px] text-[#e9b94e]">
                  MEMBERSHIP APPLICATION
                </p>

                <h2 className="mt-1.5 font-serif text-[22px] font-bold text-[#fff8e9] sm:text-[25px]">
                  Personal Information
                </h2>

                <p className="mt-1 text-[11px] text-[#e8e5da]">
                  Please provide your contact information.
                  <span className="text-red-400"> *</span> Required fields
                </p>
              </div>
            </div>

            {/* FORM BODY */}
            <form
              onSubmit={handleSubmit}
              className="space-y-3.5 px-4 py-4 sm:px-5 sm:py-5"
            >
              {/* NAME AND EMAIL */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* FULL NAME */}
                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-[12px] font-semibold text-[#171717]"
                  >
                    Full Name <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    required
                    className="mt-1 h-[39px] w-full rounded-md border border-[#d5cbb8] bg-white/60 px-3 text-[13px] text-[#222] outline-none transition placeholder:text-[11px] placeholder:text-[#999] focus:border-[#b58a32] focus:ring-1 focus:ring-[#b58a32]/30"
                  />
                </div>

                {/* EMAIL */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-[12px] font-semibold text-[#171717]"
                  >
                    Email Address <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    autoComplete="email"
                    required
                    className="mt-1 h-[39px] w-full rounded-md border border-[#d5cbb8] bg-white/60 px-3 text-[13px] text-[#222] outline-none transition placeholder:text-[11px] placeholder:text-[#999] focus:border-[#b58a32] focus:ring-1 focus:ring-[#b58a32]/30"
                  />
                </div>
              </div>

              {/* MOBILE NUMBER */}
              <div>
                <label
                  htmlFor="mobile"
                  className="block text-[12px] font-semibold text-[#171717]"
                >
                  Mobile Number <span className="text-red-500">*</span>
                </label>

                <div className="mt-1 flex h-[39px] items-center rounded-md border border-[#d5cbb8] bg-white/60 px-3 transition focus-within:border-[#b58a32] focus-within:ring-1 focus-within:ring-[#b58a32]/30">
                  <span className="border-r border-[#d5cbb8] pr-3 text-[12px] font-semibold text-[#333]">
                    +91
                  </span>

                  <input
                    id="mobile"
                    type="tel"
                    inputMode="numeric"
                    value={mobile}
                    onChange={(e) => handleMobileChange(e.target.value)}
                    placeholder="Enter your 10-digit mobile number"
                    autoComplete="tel-national"
                    required
                    maxLength={10}
                    className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-[13px] text-[#222] outline-none placeholder:text-[11px] placeholder:text-[#999] focus:ring-0"
                  />
                </div>
              </div>

              {/* TERMS AND CONDITIONS */}
              <div className="border-t border-[#e0d7c7] pt-3">
                <label className="flex cursor-pointer items-start gap-2.5 text-[11px] leading-5 text-[#222] sm:text-[12px]">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 h-[14px] w-[14px] shrink-0 accent-[#b58a32]"
                  />

                  <span>
                    I have read and agree to the Lorvens Club Terms & Conditions.
                  </span>
                </label>

                <button
                  type="button"
                  onClick={onViewTerms}
                >
                  <h1 className="ml-[23px] mt-1 text-[11px] text-[#95601c] underline underline-offset-4 transition hover:text-[#633b0c]">
                    View Terms & Conditions
                  </h1>
                </button>
              </div>

              {/* MEMBERSHIP PAYMENT */}
              <div className="overflow-hidden rounded-[10px] border border-[#e2d2b3] bg-[#f1e6d0]">
                <div className="flex items-center justify-between gap-2 px-3 py-3">
                  <div>
                    <p className="text-[9px] font-bold tracking-[1.3px] text-[#95601c]">
                      MEMBERSHIP PAYMENT
                    </p>

                    <h3 className="mt-1 font-serif text-[17px] font-bold text-[#10251f]">
                      Lifetime Membership
                    </h3>
                  </div>

                  <div className="text-right">
                    <p className="text-[9px] font-bold tracking-[1px] text-[#6b5734]">
                      MEMBERSHIP FEE
                    </p>

                    <p className="mt-1 text-[19px] font-bold text-[#00352d]">
                      {formatAmount(MEMBERSHIP_FEE)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[#dfd2ba] px-3 py-2 text-[12px] font-bold text-[#111]">
                  <span>Total Amount</span>

                  <span className="text-[#00352d]">
                    {formatAmount(MEMBERSHIP_FEE)}
                  </span>
                </div>
              </div>

              {/* VALIDATION MESSAGE */}
              {notice && (
                <p
                  role="status"
                  aria-live="polite"
                  className="rounded-md border border-[#d6b66c] bg-[#fff7e6] px-3 py-2 text-[11px] text-[#684710]"
                >
                  {notice}
                </p>
              )}

              {/* PAYMENT BUTTON */}
              <button
                type="submit"
                disabled={isProcessing}
                className="flex min-h-[41px] w-full items-center justify-center gap-2 rounded-[7px] bg-gradient-to-r from-[#d9a52e] to-[#9b6415] px-4 py-2 text-[12px] font-bold tracking-[1px] text-white shadow-md transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isProcessing ? "PROCESSING..." : "PROCEED TO PAYMENT"}

                {!isProcessing && (
                  <span className="text-[18px]">→</span>
                )}
              </button>

              <p className="text-center text-[10px] italic text-[#6e6a60]">
                Your information will be used for membership application purposes.
              </p>
            </form>
          </div>

          {/* RIGHT: MEMBERSHIP CARD */}
          <aside className="flex h-full flex-col rounded-[14px] border border-[#d5a43d] bg-[#f7f2e7] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.25)] sm:p-5">
            <h2 className="font-serif text-[23px] font-bold leading-tight text-[#00352d] sm:text-[26px]">
              Lorvens Club
              <br />
              Membership Card
            </h2>

            <p className="mb-2 mt-4 text-[11px] font-bold tracking-[2px] text-[#777]">
              MEMBERSHIP CARD
            </p>

            {/* AUTOMATIC 3D FLIP MEMBERSHIP CARD */}
            <button
              type="button"
              onClick={() =>
                openCardPopup(showBackCard ? "back" : "front")
              }
              aria-label="Click to enlarge membership card"
              className="group relative mt-3 block w-full cursor-zoom-in rounded-[9px] text-left outline-none focus-visible:ring-2 focus-visible:ring-[#b58a32] focus-visible:ring-offset-4"
              style={{ perspective: "1200px" }}
            >
              <div
                className="relative w-full transition-transform duration-1000 ease-in-out"
                style={{
                  aspectRatio: "1.7 / 1",
                  transformStyle: "preserve-3d",
                  transform: showBackCard
                    ? "rotateY(180deg)"
                    : "rotateY(0deg)",
                }}
              >
                {/* FRONT SIDE */}
                <img
                  src={frontImage}
                  alt="Lorvens Club membership card front side"
                  draggable={false}
                  className="absolute inset-0 h-full w-full rounded-[9px] object-contain shadow-md"
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                  }}
                />

                {/* BACK SIDE */}
                <img
                  src={backImage}
                  alt="Lorvens Club membership card back side"
                  draggable={false}
                  className="absolute inset-0 h-full w-full rounded-[9px] object-contain shadow-md"
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                />
              </div>

              {/* ENLARGE HINT */}
              <span className="absolute bottom-2 right-2 rounded-full bg-[#00352d]/85 px-3 py-1.5 text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
                Click to enlarge
              </span>
            </button>

            <p className="mt-4 text-center text-[10px] tracking-wide text-[#8a806e]">
              Discover both sides of your Lorvens membership card
            </p>

            {/* FRONT AND BACK IMAGES SIDE BY SIDE */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => openCardPopup("front")}
                className="group overflow-hidden rounded-lg border border-[#d5c39c] bg-white p-1.5 text-left transition hover:border-[#b58a32] hover:shadow-md"
              >
                <img
                  src={frontImage}
                  alt="Lorvens Club membership card front"
                  className="aspect-[1.7/1] w-full rounded object-contain"
                />

                <span className="mt-2 block text-center text-[10px] font-semibold text-[#73572a]">
                  Front View
                </span>
              </button>

              <button
                type="button"
                onClick={() => openCardPopup("back")}
                className="group overflow-hidden rounded-lg border border-[#d5c39c] bg-white p-1.5 text-left transition hover:border-[#b58a32] hover:shadow-md"
              >
                <img
                  src={backImage}
                  alt="Lorvens Club membership card back"
                  className="aspect-[1.7/1] w-full rounded object-contain"
                />

                <span className="mt-2 block text-center text-[10px] font-semibold text-[#73572a]">
                  Back View
                </span>
              </button>
            </div>

            <p className="mt-auto pt-5 text-center text-[10px] text-[#8a806e]">
              Click any card image to view it in full size.
            </p>
          </aside>
        </section>

        {/* BACK TO WEBSITE */}
        <div className="pb-7 text-center">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-[12px] font-bold tracking-[2px] text-[#e9b94e] transition hover:text-white"
          >
            <span className="text-[20px]">←</span>
            BACK TO WEBSITE
          </button>
        </div>
      </div>

      
{/* MEMBERSHIP CARD POPUP */}
{selectedCard && (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm"
    onClick={() => setSelectedCard(null)}
  >
    <div
      className="relative w-full max-w-[620px] rounded-xl border border-[#d5a43d] bg-[#f7f2e7] p-4 sm:p-5"
      onClick={(e) => e.stopPropagation()}
    >
      {/* HEADER */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-serif text-xl font-bold text-[#00352d]">
          Membership Card
        </h2>

        <button
          type="button"
          onClick={() => setSelectedCard(null)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00352d] text-lg text-white hover:bg-[#a16c20]"
        >
          ×
        </button>
      </div>

      {/* CARD IMAGE */}
      <div className="flex items-center justify-center rounded-lg border border-[#e2d2b3] bg-[#eee6d6] p-3">
        <img
          src={
            selectedCard === "front"
              ? "/assets/membership-card-front.png"
              : "/assets/membership-card-back.png"
          }
          alt="Lorvens Club Membership Card"
          className="max-h-[38vh] w-full object-contain"
        />
      </div>

      {/* CARD SIDE */}
      <p className="mt-3 text-center text-xs font-bold text-[#73572a]">
        {selectedCard === "front" ? "FRONT SIDE" : "BACK SIDE"}
      </p>

      {/* NAVIGATION */}
      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() =>
            setSelectedCard(
              selectedCard === "front" ? "back" : "front"
            )
          }
          className="rounded-lg border border-[#b58a32] px-4 py-2 text-xs text-[#73572a] hover:bg-[#e9dfc9]"
        >
          ← Previous
        </button>

        <button
          type="button"
          onClick={() =>
            setSelectedCard(
              selectedCard === "front" ? "back" : "front"
            )
          }
          className="rounded-lg bg-[#00352d] px-5 py-2 text-xs text-white hover:bg-[#a16c20]"
        >
          Next →
        </button>
      </div>
    </div>
  </div>
)}

    </main>
  );
}
