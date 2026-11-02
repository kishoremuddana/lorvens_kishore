import React, { useEffect, useRef } from "react";

interface OtpInputProps {
  value: string[];
  onChange: (otp: string[]) => void;
  disabled?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus the first input box when the component mounts
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const val = e.target.value;
    const digit = val.slice(-1);

    if (digit && !/^\d+$/.test(digit)) return;

    const newOtp = [...value];
    newOtp[index] = digit;
    onChange(newOtp);

    // If a digit was entered, automatically focus next input
    if (digit && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace") {
      if (!value[index] && index > 0) {
        // Move back to previous input
        inputRefs.current[index - 1]?.focus();
        const newOtp = [...value];
        newOtp[index - 1] = "";
        onChange(newOtp);
      } else {
        const newOtp = [...value];
        newOtp[index] = "";
        onChange(newOtp);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text/plain").trim();
    const digits = pasted.replace(/\D/g, "").slice(0, 6).split("");

    if (digits.length > 0) {
      const newOtp = [...value];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = digits[i] || "";
      }
      onChange(newOtp);

      // Focus the last filled box or 6th box
      const targetIndex = Math.min(digits.length, 5);
      inputRefs.current[targetIndex]?.focus();
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-3 w-full">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={value[i] || ""}
          disabled={disabled}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onPaste={handlePaste}
          className={`w-11 h-14 sm:w-14 sm:h-14 text-center text-xl sm:text-2xl font-semibold rounded-xl bg-[#001711]/70 text-[#F5F0E4] border transition-all duration-200 outline-none
            ${
              value[i]
                ? "border-[#D9AD55] ring-1 ring-[#D9AD55]/40"
                : "border-[#D9AD55]/30 hover:border-[#D9AD55]/50"
            }
            focus:border-[#D9AD55] focus:ring-2 focus:ring-[#D9AD55]/50 focus:bg-[#002219]`}
        />
      ))}
    </div>
  );
};
