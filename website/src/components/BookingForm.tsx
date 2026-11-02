import { useRef, useState, type FormEvent, type ReactNode } from "react";

type FamilyMember = {
  id: number;
  fullName: string;
  relationship: string;
  dob: string;
  pan: string;
  aadhaar: string;
};

type BookingFormProps = {
  isOpen: boolean;
  onClose: () => void;
};

const emptyFamilyMember = (id: number): FamilyMember => ({
  id,
  fullName: "",
  relationship: "",
  dob: "",
  pan: "",
  aadhaar: "",
});

const benefits = [
  ["Exclusive Privileges", "Priority access across Lorvens Club facilities and partner venues."],
  ["Preferred Bookings", "Advance reservation opportunities for club events, stays and services."],
  ["Member Discounts", "Special member rates on dining, stays and recreational activities."],
  ["Dedicated Support", "Personalized assistance for membership-related queries."],
  ["Referral Rewards", "Exclusive rewards and club vouchers for successful referrals."],
];

const terms = [
  ["Validity & AMC", "Membership is for a lifetime. Annual Maintenance Charges (AMC) begin from the 6th year onwards from the date of issuance."],
  ["Non-Transferability", "Membership is non-transferable and is intended for the registered primary member and authorized family members."],
  ["Property Ownership", "Physical membership cards remain the property of Lorvens Club and must be returned upon request."],
  ["Loss or Damage", "Lost or misplaced cards must be reported to club management immediately."],
  ["Fee Non-Refundability", "Membership fees are non-refundable upon issuance of the membership card."],
];

const inputClass =
  "mt-1.5 w-full rounded-lg border border-[#E8DDC5] bg-white px-3.5 py-2.5 text-sm text-[#173F35] outline-none transition placeholder:text-[#A09C91] focus:border-[#D9AD55] focus:ring-2 focus:ring-[#D9AD55]/20";

const labelClass = "block text-sm font-semibold text-[#173F35]";

function Field({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
  pattern,
  maxLength,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  pattern?: string;
  maxLength?: number;
}) {
  return (
    <label className={labelClass}>
      {label}
      {required && <span className="ml-1 text-red-600">*</span>}
      <input
        className={inputClass}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        pattern={pattern}
        maxLength={maxLength}
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  options,
  required = false,
}: {
  label: string;
  name: string;
  options: string[];
  required?: boolean;
}) {
  return (
    <label className={labelClass}>
      {label}
      {required && <span className="ml-1 text-red-600">*</span>}
      <select
        className={inputClass}
        name={name}
        required={required}
        defaultValue=""
      >
        <option value="" disabled>
          Select {label.toLowerCase()}
        </option>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function UploadField({
  label,
  name,
  accept = ".pdf,.jpg,.jpeg,.png",
  required = false,
}: {
  label: string;
  name: string;
  accept?: string;
  required?: boolean;
}) {
  return (
    <label className={labelClass}>
      {label}
      {required && <span className="ml-1 text-red-600">*</span>}
      <input
        className={`${inputClass} cursor-pointer file:mr-3 file:rounded-lg file:border-0 file:bg-[#173F35] file:px-3 file:py-2 file:text-xs file:font-bold file:text-[#F5F0E4] file:transition-colors hover:file:bg-[#1E4E42]`}
        type="file"
        name={name}
        accept={accept}
        required={required}
      />
    </label>
  );
}

function Section({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#E8DDC5] bg-white p-5 sm:p-6 shadow-[0_4px_20px_rgba(23,63,53,0.035)]">
      <div className="mb-4 flex items-start gap-3.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#D9AD55]/40 bg-[#F5F0E4] text-sm font-extrabold text-[#B88B32]">
          {number}
        </span>

        <div>
          <h3 className="m-0 font-[Georgia,serif] text-lg font-bold text-[#173F35] sm:text-xl">
            {title}
          </h3>

          {description && (
            <p className="mb-0 mt-1 text-xs leading-5 text-[#716F63]">
              {description}
            </p>
          )}
        </div>
      </div>

      {children}
    </section>
  );
}

export default function BookingForm({
  isOpen,
  onClose,
}: BookingFormProps) {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [nextId, setNextId] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const stepContentRef = useRef<HTMLDivElement>(null);

  const stepTitles = [
    "Primary Member Details",
    "Membership Details",
    "Family Member Details",
    "Document Upload",
    "Payment Details",
    "Membership Benefits",
    "Terms & Declaration",
  ];

  const goToNextStep = () => {
    const fields =
      stepContentRef.current?.querySelectorAll<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >("input, select, textarea");

    if (fields) {
      for (const field of fields) {
        if (!field.checkValidity()) {
          field.reportValidity();
          field.focus();
          return;
        }
      }
    }

    setCurrentStep((step) =>
      Math.min(step + 1, stepTitles.length - 1)
    );

    setSubmitted(false);
  };

  const goToPreviousStep = () => {
    setCurrentStep((step) => Math.max(step - 1, 0));
    setSubmitted(false);
  };

  const addFamilyMember = () => {
    if (familyMembers.length >= 5) return;

    setFamilyMembers((current) => [
      ...current,
      emptyFamilyMember(nextId),
    ]);

    setNextId((id) => id + 1);
  };

  const updateFamilyMember = (
    id: number,
    field: keyof FamilyMember,
    value: string
  ) => {
    setFamilyMembers((current) =>
      current.map((member) =>
        member.id === id
          ? { ...member, [field]: value }
          : member
      )
    );
  };

  const removeFamilyMember = (id: number) => {
    setFamilyMembers((current) =>
      current.filter((member) => member.id !== id)
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#173F35]/65 p-3 sm:p-5 backdrop-blur-[3px] transition-opacity"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {/* COMPACT CENTERED POPUP */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="membership-form-title"
        className="my-auto flex max-h-[90vh] w-full max-w-[860px] flex-col overflow-y-auto overscroll-contain rounded-2xl border border-[#E8DDC5] bg-[#F5F0E4] shadow-[0_25px_60px_-15px_rgba(23,63,53,0.35)] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:rounded-3xl"
      >
        {/* LUXURY WARM IVORY HEADER */}
        <header className="sticky top-0 z-20 flex shrink-0 items-center justify-between gap-4 overflow-hidden border-b border-[#E8DDC5] bg-[#F5F0E4] px-5 py-4 sm:px-7 sm:py-5">
          {/* ELEGANT GOLD DECORATIVE CURVED ACCENTS */}
          <svg
            className="pointer-events-none absolute right-0 top-0 h-full w-[260px] sm:w-[380px] md:w-[460px] overflow-hidden"
            viewBox="0 0 460 120"
            fill="none"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="goldRibbonGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D9AD55" stopOpacity="0.02" />
                <stop offset="35%" stopColor="#D9AD55" stopOpacity="0.18" />
                <stop offset="70%" stopColor="#E5C378" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#D9AD55" stopOpacity="0.12" />
              </linearGradient>
              <linearGradient id="goldRibbonGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D9AD55" stopOpacity="0.02" />
                <stop offset="50%" stopColor="#D9AD55" stopOpacity="0.14" />
                <stop offset="100%" stopColor="#B88B32" stopOpacity="0.25" />
              </linearGradient>
              <linearGradient id="goldStroke1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#D9AD55" stopOpacity="0.1" />
                <stop offset="50%" stopColor="#D9AD55" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#B88B32" stopOpacity="0.85" />
              </linearGradient>
              <linearGradient id="goldStroke2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#D9AD55" stopOpacity="0.1" />
                <stop offset="60%" stopColor="#E5C378" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#D9AD55" stopOpacity="0.7" />
              </linearGradient>
              <linearGradient id="goldStroke3" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#D9AD55" stopOpacity="0.05" />
                <stop offset="70%" stopColor="#D9AD55" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#D9AD55" stopOpacity="0.6" />
              </linearGradient>
            </defs>

            {/* Soft silk ribbon wave 1 */}
            <path
              d="M 110 0 C 180 42, 280 85, 460 96 L 460 120 L 320 120 C 220 110, 140 60, 60 0 Z"
              fill="url(#goldRibbonGrad1)"
            />

            {/* Soft silk ribbon wave 2 */}
            <path
              d="M 210 0 C 270 45, 340 75, 460 84 L 460 110 C 360 100, 280 65, 160 0 Z"
              fill="url(#goldRibbonGrad2)"
            />

            {/* Graceful gold flowing contour curves */}
            <path
              d="M 90 0 C 170 45, 270 90, 460 98"
              stroke="url(#goldStroke1)"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M 150 0 C 220 40, 310 80, 460 85"
              stroke="url(#goldStroke2)"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <path
              d="M 220 0 C 280 35, 360 70, 460 72"
              stroke="url(#goldStroke3)"
              strokeWidth="1.1"
              strokeLinecap="round"
            />
            <path
              d="M 40 0 C 130 52, 240 102, 440 116"
              stroke="url(#goldStroke1)"
              strokeWidth="0.75"
              strokeDasharray="4 4"
              strokeOpacity="0.35"
            />
          </svg>

          {/* HEADER BRANDING & TITLES */}
          <div className="relative z-10">
            <p className="mb-1 text-[10px] font-bold tracking-[3px] text-[#D9AD55]">
              LORVENS CLUB · TIRUPATI
            </p>

            <h2
              id="membership-form-title"
              className="m-0 font-[Georgia,serif] text-xl font-bold tracking-tight text-[#173F35] sm:text-2xl"
            >
              Membership Application
            </h2>

            <p className="mb-0 mt-1 text-xs text-[#716F63]">
              Begin your journey with an exclusive club experience.
            </p>
          </div>

          {/* CIRCULAR CLOSE BUTTON */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close application"
            className="relative z-10 grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full border border-[#D9AD55]/70 bg-[#F5F0E4] text-xl font-medium text-[#173F35] shadow-sm transition hover:scale-105 hover:border-[#D9AD55] hover:bg-[#E8DDC5]/60 active:scale-95 sm:h-10 sm:w-10"
          >
            ×
          </button>
        </header>

        {/* MAIN CONTENT */}
        <div className="px-4 py-5 sm:px-7 sm:py-6">

          {/* GREEN INTRODUCTION CARD */}
          <div className="mb-5 rounded-2xl border border-[#173F35] bg-gradient-to-br from-[#173F35] to-[#12332B] p-5 text-white shadow-sm sm:p-6">
            <p className="mb-2 text-[10px] font-bold tracking-[3px] text-[#D9AD55]">
              EXCLUSIVE MEMBERSHIP
            </p>

            <h1 className="mb-2 font-[Georgia,serif] text-xl font-bold tracking-tight text-[#F5F0E4] sm:text-2xl">
              Your place in the Lorvens circle.
            </h1>

            <p className="mb-0 max-w-2xl text-xs leading-5 text-[#F5F0E4]/85 sm:text-sm">
              Complete the application below. Keep your identity documents
              and photographs ready before you begin.
            </p>

            <div className="mt-3.5 flex flex-wrap gap-2 text-[11px]">
              <span className="rounded-full border border-[#D9AD55]/30 bg-[#12332B]/70 px-3 py-1 text-[#F5F0E4]/90">
                Lifetime membership
              </span>

              <span className="rounded-full border border-[#D9AD55]/30 bg-[#12332B]/70 px-3 py-1 text-[#F5F0E4]/90">
                Up to 5 family members
              </span>

              <span className="rounded-full border border-[#D9AD55]/30 bg-[#12332B]/70 px-3 py-1 text-[#F5F0E4]/90">
                Secure document handling required
              </span>
            </div>
          </div>

          {/* SUBMISSION MESSAGE */}
          {submitted && (
            <div
              className="mb-4 rounded-xl border border-[#D9AD55] bg-[#FFF9EC] p-3.5 text-sm leading-6 text-[#5A451A]"
              role="status"
            >
              <strong>
                Form completed and validated in your browser.
              </strong>{" "}
              Your application has not been sent or saved because a secure
              backend submission endpoint has not yet been connected.
            </div>
          )}

          {/* PROGRESS BAR */}
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="m-0 text-sm font-bold text-[#173F35]">
                Step {currentStep + 1} of {stepTitles.length}
              </p>

              <p className="m-0 text-xs font-semibold text-[#716F63]">
                {Math.round(
                  ((currentStep + 1) / stepTitles.length) * 100
                )}
                % complete
              </p>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-[#E8DDC5]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#D9AD55] to-[#E5C378] transition-all duration-300"
                style={{
                  width: `${
                    ((currentStep + 1) / stepTitles.length) * 100
                  }%`,
                }}
              />
            </div>

            <div className="mt-3.5 hidden flex-wrap gap-1.5 lg:flex">
              {stepTitles.map((title, index) => (
                <span
                  key={title}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${
                    index === currentStep
                      ? "bg-[#173F35] text-[#F5F0E4] shadow-sm"
                      : index < currentStep
                        ? "bg-[#E8DDC5] text-[#173F35]"
                        : "border border-[#E8DDC5] bg-[#FAF7F0] text-[#716F63]"
                  }`}
                >
                  {index + 1}. {title}
                </span>
              ))}
            </div>

            <p className="mb-0 mt-2 text-xs font-bold text-[#173F35] lg:hidden">
              {stepTitles[currentStep]}
            </p>
          </div>

          {/* FORM */}
          <form
            onSubmit={handleSubmit}
            onChange={() => setSubmitted(false)}
            className="space-y-4"
          >
            <div ref={stepContentRef} className="space-y-4">

              {/* STEP 1: PRIMARY MEMBER DETAILS */}
              {currentStep === 0 && (
                <Section
                  number="01"
                  title="Primary Member Details"
                  description="Tell us about the primary applicant."
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Field
                        label="Full name"
                        name="primaryFullName"
                        required
                        placeholder="Enter your full name"
                      />
                    </div>

                    <Field
                      label="Date of birth"
                      name="primaryDob"
                      type="date"
                      required
                    />

                    <SelectField
                      label="Gender"
                      name="gender"
                      options={["Male", "Female", "Other"]}
                      required
                    />

                    <Field
                      label="Mobile number"
                      name="mobile"
                      type="tel"
                      required
                      pattern="[0-9+() -]{8,18}"
                      placeholder="Enter contact number"
                    />

                    <Field
                      label="Email address"
                      name="email"
                      type="email"
                      required
                      placeholder="name@example.com"
                    />

                    <div className="sm:col-span-2">
                      <label className={labelClass}>
                        Residential address
                        <span className="ml-1 text-red-600">*</span>

                        <textarea
                          className={inputClass}
                          name="address"
                          rows={2}
                          required
                          placeholder="House / street, city, state and PIN code"
                        />
                      </label>
                    </div>

                    <Field
                      label="PAN number"
                      name="primaryPan"
                      required
                      placeholder="ABCDE1234F"
                      pattern="[A-Za-z]{5}[0-9]{4}[A-Za-z]"
                      maxLength={10}
                    />

                    <Field
                      label="Aadhaar number"
                      name="primaryAadhaar"
                      required
                      placeholder="12-digit Aadhaar number"
                      pattern="[0-9 ]{12,14}"
                      maxLength={14}
                    />

                    <div className="sm:col-span-2">
                      <UploadField
                        label="Primary member photograph"
                        name="primaryPhoto"
                        accept="image/*"
                        required
                      />
                    </div>
                  </div>
                </Section>
              )}

              {/* STEP 2: MEMBERSHIP DETAILS */}
              {currentStep === 1 && (
                <Section
                  number="02"
                  title="Membership Details"
                  description="Choose how your membership card should be issued."
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Name to print on membership card"
                      name="nameOnCard"
                      required
                      placeholder="Name as it should appear on the card"
                    />

                    <label className={labelClass}>
                      Membership validity

                      <input
                        className={`${inputClass} bg-[#F5F0E4] font-semibold text-[#173F35]`}
                        value="Lifetime · AMC from 6th year"
                        readOnly
                      />
                    </label>
                  </div>
                </Section>
              )}

              {/* STEP 3: FAMILY MEMBER DETAILS */}
              {currentStep === 2 && (
                <Section
                  number="03"
                  title="Family Member Details"
                  description="Add up to five family members. This section is optional."
                >
                  <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
                    <p className="m-0 text-sm text-[#716F63]">
                      {familyMembers.length} of 5 family members added
                    </p>

                    <button
                      type="button"
                      onClick={addFamilyMember}
                      disabled={familyMembers.length >= 5}
                      className="cursor-pointer rounded-lg border border-[#173F35] px-4 py-2 text-xs font-bold text-[#173F35] transition hover:bg-[#173F35] hover:text-[#F5F0E4] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      + Add family member
                    </button>
                  </div>

                  {familyMembers.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#D8CDC0] bg-[#FAF7F0] p-5 text-center text-sm text-[#716F63]">
                      No family members added. Select "Add family member"
                      if you want to include someone.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {familyMembers.map((member, index) => (
                        <div
                          key={member.id}
                          className="rounded-xl border border-[#E8DDC5] bg-[#FAF7F0] p-4 sm:p-5"
                        >
                          <div className="mb-3.5 flex items-center justify-between">
                            <h4 className="m-0 text-sm font-bold text-[#173F35]">
                              Family member {index + 1}
                            </h4>

                            <button
                              type="button"
                              onClick={() => removeFamilyMember(member.id)}
                              className="cursor-pointer text-xs font-semibold text-red-700 hover:text-red-800 hover:underline"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="grid gap-3.5 sm:grid-cols-2">
                            {(
                              [
                                ["fullName", "Full name", "text"],
                                ["relationship", "Relationship", "text"],
                                ["dob", "Date of birth", "date"],
                                ["pan", "PAN number", "text"],
                                ["aadhaar", "Aadhaar number", "text"],
                              ] as const
                            ).map(([field, label, type]) => (
                              <label key={field} className={labelClass}>
                                {label}

                                <input
                                  className={inputClass}
                                  type={type}
                                  value={member[field]}
                                  onChange={(event) =>
                                    updateFamilyMember(
                                      member.id,
                                      field,
                                      event.target.value
                                    )
                                  }
                                  placeholder={
                                    field === "relationship"
                                      ? "e.g. Spouse, Child, Parent"
                                      : ""
                                  }
                                  maxLength={
                                    field === "pan"
                                      ? 10
                                      : field === "aadhaar"
                                        ? 14
                                        : undefined
                                  }
                                />
                              </label>
                            ))}
                          </div>

                          <div className="mt-3.5 grid gap-3.5 sm:grid-cols-3">
                            <UploadField
                              label="Member photograph"
                              name={`familyPhoto${member.id}`}
                              accept="image/*"
                            />

                            <UploadField
                              label="Aadhaar copy"
                              name={`familyAadhaar${member.id}`}
                            />

                            <UploadField
                              label="PAN copy"
                              name={`familyPan${member.id}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Section>
              )}

              {/* STEP 4: DOCUMENT UPLOAD */}
              {currentStep === 3 && (
                <Section
                  number="04"
                  title="Document Upload"
                  description="Upload clear copies of the required documents."
                >
                  <div className="mb-3.5 rounded-xl border border-[#E8DDC5] bg-[#FAF7F0] p-3.5 text-xs leading-5 text-[#716F63]">
                    Please prepare self-attested Aadhaar and PAN copies
                    for the primary member and each registered family
                    member, along with passport-size photographs.
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <UploadField
                      label="Primary member Aadhaar copy"
                      name="primaryAadhaarCopy"
                      required
                    />

                    <UploadField
                      label="Primary member PAN copy"
                      name="primaryPanCopy"
                      required
                    />
                  </div>

                  <p className="mb-0 mt-3 text-xs leading-5 text-[#716F63]">
                    Accepted uploads: PDF, JPG or PNG. Family member
                    document uploads are available in each family
                    member's card above.
                  </p>
                </Section>
              )}

              {/* STEP 5: PAYMENT DETAILS */}
              {currentStep === 4 && (
                <Section
                  number="05"
                  title="Payment Details"
                  description="Provide payment details for membership processing."
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Membership fee"
                      name="membershipFee"
                      required
                      placeholder="Enter amount"
                    />

                    <SelectField
                      label="Payment method"
                      name="paymentMode"
                      options={["Cash", "Card", "UPI", "Cheque / DD", "NEFT"]}
                      required
                    />

                    <Field
                      label="Transaction / cheque number"
                      name="transactionNumber"
                      placeholder="Enter reference number"
                    />

                    <Field
                      label="Bank and branch"
                      name="bankBranch"
                      placeholder="Enter bank and branch name"
                    />
                  </div>
                </Section>
              )}

              {/* STEP 6: MEMBERSHIP BENEFITS */}
              {currentStep === 5 && (
                <Section
                  number="06"
                  title="Membership Benefits"
                  description="A summary of the privileges associated with Lorvens Club membership."
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    {benefits.map(([title, description]) => (
                      <div
                        key={title}
                        className="rounded-xl border border-[#E8DDC5] bg-[#FAF7F0] p-3.5"
                      >
                        <h4 className="mb-1 mt-0 text-sm font-bold text-[#173F35]">
                          {title}
                        </h4>

                        <p className="m-0 text-xs leading-5 text-[#716F63]">
                          {description}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
                    <div>
                      <img
                        src="/assets/membership-card-front.png"
                        alt="Lorvens Club membership card front preview"
                        className="w-full rounded-xl border border-[#D9AD55]/60 shadow-sm"
                      />

                      <p className="mb-0 mt-2 text-center text-[10px] font-bold tracking-[1.5px] text-[#B88B32]">
                        CARD FRONT PREVIEW
                      </p>
                    </div>

                    <div>
                      <img
                        src="/assets/membership-card-back.png"
                        alt="Lorvens Club membership card back preview"
                        className="w-full rounded-xl border border-[#D9AD55]/60 shadow-sm"
                      />

                      <p className="mb-0 mt-2 text-center text-[10px] font-bold tracking-[1.5px] text-[#B88B32]">
                        CARD BACK PREVIEW
                      </p>
                    </div>
                  </div>
                </Section>
              )}

              {/* STEP 7: TERMS AND DECLARATION */}
              {currentStep === 6 && (
                <>
                  <Section
                    number="07"
                    title="Terms & Declaration"
                    description="Review the membership conditions before submitting your application."
                  >
                    <ol className="space-y-2.5 pl-5 text-xs leading-5 text-[#716F63]">
                      {terms.map(([title, description]) => (
                        <li key={title}>
                          <strong className="font-semibold text-[#173F35]">
                            {title}:
                          </strong>{" "}
                          {description}
                        </li>
                      ))}
                    </ol>

                    <div className="mt-4 rounded-xl border border-[#E8DDC5] bg-[#FAF7F0] p-3.5 text-xs leading-5 text-[#716F63]">
                      <strong className="text-[#173F35]">
                        Applicant declaration
                      </strong>

                      <p className="mb-0 mt-1">
                        I confirm that the information provided for myself
                        and my family members is true and accurate. I agree
                        to the membership privileges, terms, conditions and
                        applicable AMC schedule of Lorvens Club.
                      </p>
                    </div>

                    <label className="mt-4 flex cursor-pointer items-start gap-3 text-xs leading-5 text-[#173F35]">
                      <input
                        type="checkbox"
                        name="declarationAccepted"
                        required
                        className="mt-1 h-4 w-4 accent-[#173F35]"
                      />

                      <span>
                        I have read and accept the declaration and
                        membership terms above.
                        <span className="ml-1 text-red-600">*</span>
                      </span>
                    </label>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <Field
                        label="Application date"
                        name="applicationDate"
                        type="date"
                        required
                      />

                      <Field
                        label="Applicant signature (type full name)"
                        name="applicantSignature"
                        required
                        placeholder="Type your full name"
                      />
                    </div>
                  </Section>

                  <div className="rounded-xl border border-[#E8DDC5] bg-[#EFE8D8] p-4">
                    <p className="mb-1 text-[10px] font-extrabold tracking-[1.5px] text-[#B88B32]">
                      FOR CLUB ADMINISTRATION
                    </p>

                    <p className="m-0 text-xs leading-5 text-[#716F63]">
                      Membership ID, receipt number, document verification,
                      cards issued, processing officer and authorized
                      signature are reserved for Lorvens Club staff.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* BACK AND NEXT BUTTONS */}
            <div className="flex flex-col-reverse gap-3 border-t border-[#E8DDC5] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={
                  currentStep === 0
                    ? onClose
                    : goToPreviousStep
                }
                className="cursor-pointer rounded-lg border border-[#173F35] px-6 py-2.5 text-sm font-bold text-[#173F35] transition hover:bg-[#173F35]/10"
              >
                {currentStep === 0 ? "Cancel" : "Back"}
              </button>

              {currentStep < stepTitles.length - 1 ? (
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="cursor-pointer rounded-lg bg-[#D9AD55] px-7 py-2.5 text-sm font-extrabold tracking-wide text-[#173F35] shadow-md transition-all hover:bg-[#E5BE6C] active:scale-[0.99]"
                >
                  Save & Continue →
                </button>
              ) : (
                <button
                  type="submit"
                  className="cursor-pointer rounded-lg bg-[#D9AD55] px-6 py-2.5 text-sm font-extrabold tracking-wide text-[#173F35] shadow-md transition-all hover:bg-[#E5BE6C] active:scale-[0.99]"
                >
                  Submit membership application
                </button>
              )}
            </div>

            <p className="m-0 text-center text-[11px] leading-5 text-[#716F63]">
              Your details and documents contain sensitive personal
              information. Do not submit real identity documents until
              the club's secure backend and privacy controls are in place.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
