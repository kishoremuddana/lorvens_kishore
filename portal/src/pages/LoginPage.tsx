import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Clock, Mail, ShieldCheck } from "lucide-react";
import { LorvensLogo } from "../components/LorvensLogo";
import { BackgroundDecor } from "../components/BackgroundDecor";
import { OtpInput } from "../components/OtpInput";
import { useAuth } from "../hooks/useAuth";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    sendOtp,
    verifyOtp,
    isAuthenticated,
    isLoading,
    error,
    clearError,
    pendingEmail,
  } = useAuth();

  // State: "email" or "otp"
  const [step, setStep] = useState<"email" | "otp">(
    pendingEmail ? "otp" : "email"
  );
  const [emailInput, setEmailInput] = useState(pendingEmail || "");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [cooldown, setCooldown] = useState<number>(60);
  const [localError, setLocalError] = useState<string | null>(null);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    if (step !== "otp" || cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step, cooldown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    const trimmed = emailInput.trim().toLowerCase();
    if (!trimmed) {
      setLocalError("Please enter your admin email address.");
      return;
    }

    try {
      await sendOtp(trimmed);
      setStep("otp");
      setCooldown(60);
      setOtpDigits(["", "", "", "", "", ""]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send OTP.";
      setLocalError(msg);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || isLoading) return;
    setLocalError(null);
    clearError();
    try {
      await sendOtp(emailInput || pendingEmail);
      setCooldown(60);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to resend OTP.";
      setLocalError(msg);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLocalError(null);
    clearError();

    const fullCode = otpDigits.join("");
    if (fullCode.length !== 6) {
      setLocalError("Please enter the complete 6-digit OTP code.");
      return;
    }

    try {
      await verifyOtp(fullCode);
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid or expired OTP.";
      setLocalError(msg);
    }
  };

  // Format cooldown seconds as 00:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const activeError = localError || error;

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-x-hidden selection:bg-[#D9AD55]/30">
      <BackgroundDecor />

      {/* CENTRAL AUTHENTICATION CARD */}
      <div className="relative w-full max-w-[530px] rounded-[28px] sm:rounded-[32px] border border-[#D9AD55]/35 bg-[#002219]/90 backdrop-blur-md p-7 sm:p-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85),_0_0_40px_rgba(217,173,85,0.06)] transition-all duration-300">
        
        {/* TOP BRANDING */}
        <LorvensLogo />

        {/* ERROR NOTIFICATION */}
        {activeError && (
          <div className="mt-5 rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-xs leading-5 text-red-200">
            {activeError}
          </div>
        )}

        {/* SCREEN 1: EMAIL LOGIN */}
        {step === "email" ? (
          <div className="mt-7">
            <h1 className="font-[Georgia,serif] text-[28px] sm:text-[32px] font-normal text-white tracking-tight leading-tight">
              Welcome Back
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-[#B8C2BB] leading-relaxed">
              Enter your registered email address to access the admin portal.
            </p>

            <form onSubmit={handleSendOtp} className="mt-6">
              <label className="block text-xs sm:text-[13px] font-medium text-[#F5F0E4] mb-2">
                Email Address
              </label>

              <div className="relative flex items-center rounded-xl border border-[#D9AD55]/30 bg-[#001711]/70 transition-all duration-200 focus-within:border-[#D9AD55] focus-within:ring-1 focus-within:ring-[#D9AD55]/40">
                <Mail className="ml-3.5 mr-2.5 h-4 w-4 sm:h-5 sm:w-5 text-[#B8C2BB] shrink-0" />
                <input
                  type="email"
                  required
                  placeholder="admin@lorvensclub.com"
                  value={emailInput}
                  disabled={isLoading}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    if (activeError) {
                      setLocalError(null);
                      clearError();
                    }
                  }}
                  className="w-full bg-transparent py-3.5 pr-4 text-xs sm:text-sm text-[#F5F0E4] placeholder:text-[#B8C2BB]/40 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D9AD55] via-[#E5C378] to-[#D9AD55] py-3.5 sm:py-4 text-xs sm:text-[13px] font-bold tracking-[2px] text-[#002D20] uppercase shadow-lg shadow-[#D9AD55]/15 transition-all duration-200 hover:brightness-105 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <span>Sending...</span>
                ) : (
                  <>
                    <span>SEND OTP</span>
                    <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* SCREEN 2: OTP VERIFICATION */
          <div className="mt-5">
            {/* Back to Email */}
            <button
              type="button"
              onClick={() => {
                setStep("email");
                clearError();
                setLocalError(null);
              }}
              className="group mb-4 flex items-center gap-1.5 text-xs font-medium text-[#F5F0E4]/80 transition-colors hover:text-[#D9AD55] cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to Email</span>
            </button>

            <h1 className="font-[Georgia,serif] text-[28px] sm:text-[32px] font-normal text-white tracking-tight leading-tight">
              Verify Your Email
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-[#B8C2BB] leading-relaxed">
              We've sent a 6-digit OTP to
              <span className="block font-medium text-[#F5F0E4] break-all mt-0.5">
                {emailInput || pendingEmail}
              </span>
            </p>

            <form onSubmit={handleVerifyOtp} className="mt-6">
              {/* Six individual OTP inputs */}
              <OtpInput
                value={otpDigits}
                onChange={(digits) => {
                  setOtpDigits(digits);
                  if (activeError) {
                    setLocalError(null);
                    clearError();
                  }
                }}
                disabled={isLoading}
              />

              {/* Resend OTP countdown row */}
              <div className="mt-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-[#B8C2BB]/80">
                  <Clock className="h-3.5 w-3.5 text-[#B8C2BB]/70" />
                  <span>
                    {cooldown > 0
                      ? `Resend OTP in ${formatTimer(cooldown)}`
                      : "Ready to resend code"}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={cooldown > 0 || isLoading}
                  onClick={handleResendOtp}
                  className="font-semibold text-[#D9AD55] transition-colors hover:text-[#E5C378] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                >
                  Resend OTP
                </button>
              </div>

              {/* VERIFY & CONTINUE button */}
              <button
                type="submit"
                disabled={isLoading || otpDigits.join("").length !== 6}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D9AD55] via-[#E5C378] to-[#D9AD55] py-3.5 sm:py-4 text-xs sm:text-[13px] font-bold tracking-[2px] text-[#002D20] uppercase shadow-lg shadow-[#D9AD55]/15 transition-all duration-200 hover:brightness-105 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? "Verifying..." : "VERIFY & CONTINUE"}
              </button>
            </form>
          </div>
        )}

        {/* SECURITY FOOTER */}
        <div className="mt-7 flex items-center justify-center gap-2 text-[11px] sm:text-xs text-[#B8C2BB]/75">
          <ShieldCheck className="h-4 w-4 text-[#B8C2BB]/80" />
          <span>Secure access for authorized administrators</span>
        </div>
      </div>
    </div>
  );
};
