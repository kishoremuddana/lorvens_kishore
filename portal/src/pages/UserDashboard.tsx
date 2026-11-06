
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Award,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  FileCheck2,
  FileText,
  Headphones,
  LogOut,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  Upload,
  X,
  Menu,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { authService } from "../services/authService";
type FamilyMember = {
  name: string;
  relationship: string;
  dob: string;
};

type FormData = {
  dob: string;
  gender: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  pan: string;
  aadhaar: string;
  membershipName: string;
  declaration: boolean;
  signature: string;
};

type FileKey = "photo" | "panDocument" | "aadhaarDocument";

const steps = [
  { title: "Personal", subtitle: "Your information", icon: UserRound },
  { title: "Membership", subtitle: "Membership details", icon: Award },
  { title: "Family", subtitle: "Family information", icon: Users },
  { title: "Documents", subtitle: "Supporting documents", icon: FileCheck2 },
  { title: "Review", subtitle: "Final confirmation", icon: ShieldCheck },
];

const initialForm: FormData = {
  dob: "",
  gender: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  pan: "",
  aadhaar: "",
  membershipName: "",
  declaration: false,
  signature: "",
};

const formatDate = (value?: string) => {
  if (!value) return "Not available";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const formatAmount = (paise?: number) => {
  if (typeof paise !== "number") return "₹1,00,000";
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
};

export const UserDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, customerDashboard, logout, isLoading } = useAuth();

  const [activeStep, setActiveStep] = useState(0);
  const [form, setForm] = useState<FormData>(initialForm);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [files, setFiles] = useState<Record<FileKey, File | null>>({
    photo: null,
    panDocument: null,
    aadhaarDocument: null,
  });
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [checkingApplication, setCheckingApplication] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");
  const [uploadedDocuments, setUploadedDocuments] = useState<
    Record<FileKey, { file_name: string } | null>
  >({
    photo: null,
    panDocument: null,
    aadhaarDocument: null,
  });
  const [uploadingDocuments, setUploadingDocuments] = useState<
    Record<FileKey, boolean>
  >({
    photo: false,
    panDocument: false,
    aadhaarDocument: false,
  });

  useEffect(() => {
    let isMounted = true;

    const loadApplication = async () => {
      try {
        setCheckingApplication(true);
        const response = await authService.getCustomerApplication();

        if (!isMounted) return;

        setApplicationSubmitted(Boolean(response.submitted));

        const application = response.application;
        if (application && !response.submitted) {
          const data = application.application_data || {};

          setForm({
            dob: String(data.dob ?? ""),
            gender: String(data.gender ?? ""),
            address: String(data.address ?? ""),
            city: String(data.city ?? ""),
            state: String(data.state ?? ""),
            pincode: String(data.pincode ?? ""),
            pan: String(data.pan ?? ""),
            aadhaar: String(data.aadhaar ?? ""),
            membershipName: String(data.membershipName ?? ""),
            declaration: Boolean(data.declaration),
            signature: String(data.signature ?? ""),
          });

          setFamilyMembers(
            (application.family_members || []).map((member) => ({
              name: member.fullName || "",
              relationship: member.relationship || "",
              dob: member.dob || "",
            }))
          );

          const savedDocuments = {
            photo: null,
            panDocument: null,
            aadhaarDocument: null,
          } as Record<FileKey, { file_name: string } | null>;

          (application.document_files || []).forEach((document) => {
            if (
              document.document_type === "photo" ||
              document.document_type === "panDocument" ||
              document.document_type === "aadhaarDocument"
            ) {
              savedDocuments[document.document_type] = {
                file_name: document.file_name,
              };
            }
          });

          setUploadedDocuments(savedDocuments);
        }
      } catch (err) {
        console.error("Unable to load membership application:", err);
        if (isMounted) {
          setError("Unable to check your application status. Please refresh the page.");
        }
      } finally {
        if (isMounted) setCheckingApplication(false);
      }
    };

    loadApplication();

    return () => {
      isMounted = false;
    };
  }, []);

  const membership = customerDashboard?.membership;

  const fullName =
    customerDashboard?.user?.full_name || user?.full_name || "Member";

  const email =
    customerDashboard?.user?.email || user?.email || "";

  const mobile = membership?.mobile || "";

  const paymentId = membership?.payment_id || "Not available";

  const amount = formatAmount(membership?.amount_paise);

  const paidDate = formatDate(membership?.created_at);

  const applicationProgress = useMemo(() => {
    if (applicationSubmitted) return 100;

    let completed = 0;

    if (
      form.dob &&
      form.gender &&
      form.address &&
      form.city &&
      form.state &&
      form.pincode &&
      form.pan &&
      form.aadhaar
    ) completed++;

    if (form.membershipName.trim()) completed++;
    if (familyMembers.length > 0) completed++;

    if (uploadedDocuments.photo && uploadedDocuments.panDocument && uploadedDocuments.aadhaarDocument) {
      completed++;
    }

    if (form.declaration && form.signature.trim()) completed++;

    return Math.round((completed / 5) * 100);
  }, [form, familyMembers, uploadedDocuments, applicationSubmitted]);

  const updateForm = (key: keyof FormData, value: string | boolean) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  const handleFileChange = async (
    key: FileKey,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes =
      key === "photo"
        ? ["image/jpeg", "image/png", "image/webp"]
        : ["image/jpeg", "image/png", "image/webp", "application/pdf"];

    if (!allowedTypes.includes(file.type)) {
      setError(
        key === "photo"
          ? "Please select a JPG, PNG or WEBP photograph."
          : "Please select a JPG, PNG, WEBP or PDF file."
      );
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    setError("");
    setDraftMessage("");
    event.target.value = "";
    setFiles((previous) => ({ ...previous, [key]: file }));
    setUploadingDocuments((previous) => ({ ...previous, [key]: true }));

    try {
      const response = await authService.uploadCustomerApplicationDocument(key, file);
      setUploadedDocuments((previous) => ({
        ...previous,
        [key]: { file_name: response.document.file_name || file.name },
      }));
    } catch (err) {
      console.error(`Unable to upload ${key}:`, err);
      setFiles((previous) => ({ ...previous, [key]: null }));
      setError(
        err instanceof Error
          ? err.message
          : "Unable to upload the selected document. Please try again."
      );
    } finally {
      setUploadingDocuments((previous) => ({ ...previous, [key]: false }));
    }
  };

  const addFamilyMember = () => {
    if (familyMembers.length >= 5) return;
    setFamilyMembers((previous) => [
      ...previous,
      { name: "", relationship: "", dob: "" },
    ]);
  };

  const updateFamilyMember = (
    index: number,
    key: keyof FamilyMember,
    value: string
  ) => {
    setFamilyMembers((previous) =>
      previous.map((member, i) =>
        i === index ? { ...member, [key]: value } : member
      )
    );
  };

  const removeFamilyMember = (index: number) => {
    setFamilyMembers((previous) =>
      previous.filter((_, i) => i !== index)
    );
  };

  const validateStep = () => {
    setError("");

    // Only the verified account name, email and mobile are mandatory.
    // Profile fields, family members and supporting documents are optional.
    if (activeStep === 3 && Object.values(uploadingDocuments).some(Boolean)) {
      setError("Please wait for the document upload to finish.");
      return false;
    }

    return true;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    setActiveStep((previous) => Math.min(previous + 1, 4));
  };

  const previousStep = () => {
    setError("");
    setActiveStep((previous) => Math.max(previous - 1, 0));
  };

  const buildApplicationPayload = () => ({
    application_data: {
      dob: form.dob,
      gender: form.gender,
      address: form.address,
      city: form.city,
      state: form.state,
      pincode: form.pincode,
      pan: form.pan,
      aadhaar: form.aadhaar,
      membershipName: form.membershipName,
      declaration: form.declaration,
      signature: form.signature,
    },
    family_members: familyMembers.map((member) => ({
      fullName: member.name,
      relationship: member.relationship,
      dob: member.dob,
    })),
  });

  const saveDraft = async () => {
    if (applicationSubmitted || savingDraft || checkingApplication) return;

    setSavingDraft(true);
    setError("");
    setDraftMessage("");

    try {
      const response = await authService.saveCustomerApplicationDraft(
        buildApplicationPayload()
      );
      if (response.saved) {
        setDraftMessage("Your application draft has been saved.");
      } else {
        setDraftMessage("Draft save request completed.");
      }
    } catch (err) {
      console.error("Unable to save application draft:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save your draft. Please try again."
      );
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmit = async () => {
    if (applicationSubmitted || submitting || checkingApplication) return;

    if (!fullName.trim() || !email.trim() || !mobile.trim()) {
      setError("Your membership account must have a name, email address and mobile number.");
      return;
    }

    if (Object.values(uploadingDocuments).some(Boolean)) {
      setError("Please wait for the document upload to finish before submitting.");
      setActiveStep(3);
      return;
    }

    setSubmitting(true);
    setError("");
    setDraftMessage("");

    try {
      const response = await authService.submitCustomerApplication(
        buildApplicationPayload()
      );

      if (response.submitted) {
        setApplicationSubmitted(true);
        setError("");
        setDraftMessage("");
      } else {
        setError("The application was not confirmed as submitted. Please try again.");
      }
    } catch (err) {
      console.error("Application submission failed:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit your application. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading && !customerDashboard) {
    return (
      <div className="min-h-screen bg-[#061C16] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[#D6B46A]/30 border-t-[#D6B46A]" />
          <p className="text-sm text-[#D6CBAF]">Loading your membership...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F4F2EA] text-[#18392F]">
      {/* TOP NAVIGATION */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#09291F]/95 text-white backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-4 sm:px-7 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#D6B46A] bg-[#12392B] font-serif text-2xl text-[#E2C57E]">
              L
            </div>
            <div>
              <h1 className="font-serif text-lg tracking-[3px] text-[#F7F1E3]">
                LORVENS
              </h1>
              <p className="text-[9px] tracking-[3px] text-[#D6B46A]">
                PRIVATE MEMBERS CLUB
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <div className="hidden items-center gap-2 rounded-full border border-[#D6B46A]/30 bg-white/5 px-3 py-2 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-[#E9E2D0]">Member Portal</span>
            </div>

            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-white">{fullName}</p>
              <p className="text-[11px] text-[#C5C8B9]">Member account</p>
            </div>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-2 rounded-full border border-[#D6B46A]/40 px-3 py-2 text-xs text-[#E9D49E] transition hover:bg-[#D6B46A]/10 disabled:opacity-50"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">
                {loggingOut ? "Signing out..." : "Logout"}
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 py-7 sm:px-7 sm:py-10 lg:px-10">
        {/* WELCOME HERO */}
        <section className="relative mb-8 overflow-hidden rounded-[28px] bg-[#09291F] shadow-[0_20px_60px_rgba(9,41,31,0.15)]">
          <div className="absolute -right-20 -top-28 h-80 w-80 rounded-full border border-[#D6B46A]/15" />
          <div className="absolute -right-8 -top-16 h-60 w-60 rounded-full border border-[#D6B46A]/15" />
          <div className="absolute -bottom-36 right-1/4 h-72 w-72 rounded-full border border-[#D6B46A]/10" />

          <div className="relative grid gap-8 p-7 sm:p-10 lg:grid-cols-[1.5fr_0.8fr] lg:items-center lg:p-14">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#D6B46A]/30 bg-[#D6B46A]/10 px-4 py-2">
                <Sparkles size={14} className="text-[#E3C477]" />
                <span className="text-[10px] font-semibold tracking-[2px] text-[#E3C477]">
                  WELCOME TO LORVENS CLUB
                </span>
              </div>

              <h2 className="max-w-2xl font-serif text-4xl leading-tight text-[#F8F3E7] sm:text-5xl lg:text-6xl">
                Welcome,
                <br />
                <span className="italic text-[#D9B96F]">{fullName}</span>
              </h2>

              <p className="mt-5 max-w-xl text-sm leading-7 text-[#D3D9D0] sm:text-base">
                Your place in the Lorvens circle. Explore your membership,
                complete your application and enjoy your club experience.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                {!checkingApplication && !applicationSubmitted && (
                  <a
                    href="#application"
                    className="inline-flex items-center gap-3 rounded-full bg-[#D6B46A] px-6 py-3 text-sm font-semibold text-[#102B21] shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-[#E6C981]"
                  >
                    Continue application
                    <ArrowRight size={17} />
                  </a>
                )}

                <span className="flex items-center gap-2 text-xs text-[#D5DCCF]">
                  <ShieldCheck size={16} className="text-[#D6B46A]" />
                  Secure member access
                </span>
              </div>
            </div>

            {/* MEMBERSHIP STATUS */}
            <div className="relative rounded-2xl border border-[#D6B46A]/30 bg-white/[0.06] p-6 backdrop-blur-sm sm:p-8">
              <div className="flex items-center justify-between">
                <span className="text-[10px] tracking-[2px] text-[#D9B96F]">
                  YOUR MEMBERSHIP
                </span>
                <Award className="text-[#D9B96F]" size={25} />
              </div>

              <div className="my-7">
                <p className="font-serif text-3xl text-white">
                  Lifetime
                </p>
                <p className="mt-1 text-sm text-[#C5CDBF]">
                  Membership
                </p>
              </div>

              <div className="border-t border-[#D6B46A]/20 pt-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] tracking-wider text-[#B8C3B8]">
                      PAYMENT STATUS
                    </p>
                    <p className="mt-1 text-sm font-semibold text-emerald-300">
                      {membership?.status === "paid" ? "Payment verified" : "Paid"}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/10">
                    <CheckCircle2 className="text-emerald-300" size={21} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SUMMARY CARDS */}
        <section className="mb-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon={<CreditCard size={21} />}
            label="Membership fee"
            value={amount}
            detail="Payment received"
          />
          <SummaryCard
            icon={<ShieldCheck size={21} />}
            label="Payment status"
            value="Verified"
            detail="Transaction confirmed"
            green
          />
          <SummaryCard
            icon={<FileText size={21} />}
            label="Application"
            value={applicationSubmitted ? "Submitted" : `${applicationProgress}%`}
            detail={applicationSubmitted ? "Application received" : "Profile completion"}
          />
          <SummaryCard
            icon={<Clock3 size={21} />}
            label="Payment date"
            value={paidDate}
            detail="Membership payment"
            compact
          />
        </section>

        {/* MAIN DASHBOARD GRID */}
        <div className="grid items-start gap-7 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0 space-y-7">
            {/* APPLICATION */}
            <section
              id="application"
              className="scroll-mt-24 overflow-hidden rounded-3xl border border-[#E4E0D4] bg-white shadow-sm"
            >
              {checkingApplication ? (
              <div className="p-12 text-center">
                Checking application status...
              </div>
            ) : applicationSubmitted ? (
              <div className="p-10 text-center">
                <CheckCircle2
                  size={45}
                  className="mx-auto text-emerald-600"
                />

                <h2 className="mt-4 font-serif text-3xl text-[#173D31]">
                  Application Submitted
                </h2>

                <p className="mt-3 text-sm text-[#77796F]">
                  Your membership application has been successfully submitted.
                </p>

                <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                  Duplicate submissions are disabled.
                </div>
              </div>
            ) : (
              <>


              <div className="flex flex-col justify-between gap-5 border-b border-[#EAE7DE] p-6 sm:flex-row sm:items-center sm:p-8">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-[10px] font-bold tracking-[2px] text-[#A7833F]">
                    <Sparkles size={14} />
                    MEMBERSHIP ONBOARDING
                  </div>
                  <h2 className="font-serif text-2xl text-[#173D31] sm:text-3xl">
                    Complete your application
                  </h2>
                  <p className="mt-2 text-sm text-[#77796F]">
                    Provide your details to complete your membership profile.
                  </p>
                </div>

                <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full border-4 border-[#E7D8B2] bg-[#F9F6ED]">
                  <span className="text-lg font-bold text-[#173D31]">
                    {applicationProgress}%
                  </span>
                  <span className="text-[8px] tracking-wider text-[#8D794F]">
                    DONE
                  </span>
                </div>
              </div>

              {/* PROGRESS BAR */}
              <div className="h-1.5 bg-[#EEECE5]">
                <div
                  className="h-full bg-gradient-to-r from-[#A98440] to-[#E1C47C] transition-all duration-500"
                  style={{ width: `${applicationProgress}%` }}
                />
              </div>

              {/* STEPPER */}
              <div className="overflow-x-auto border-b border-[#EAE7DE] px-4 py-6 sm:px-8">
                <div className="flex min-w-[570px] items-center justify-between">
                  {steps.map((step, index) => {
                    const Icon = step.icon;
                    const active = activeStep === index;
                    const completed = activeStep > index;

                    return (
                      <React.Fragment key={step.title}>
                        <button
                          type="button"
                          onClick={() => {
                            if (index <= activeStep) {
                              setActiveStep(index);
                              setError("");
                            }
                          }}
                          className="flex min-w-[85px] flex-col items-center gap-2"
                        >
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
                              completed
                                ? "border-[#173D31] bg-[#173D31] text-white"
                                : active
                                ? "border-[#B38B42] bg-[#F6F0E2] text-[#A47C34] ring-4 ring-[#D6B46A]/15"
                                : "border-[#E5E1D6] bg-[#F8F7F3] text-[#9A9A90]"
                            }`}
                          >
                            {completed ? <Check size={17} /> : <Icon size={17} />}
                          </div>
                          <span
                            className={`text-xs font-semibold ${
                              active || completed
                                ? "text-[#173D31]"
                                : "text-[#99998F]"
                            }`}
                          >
                            {step.title}
                          </span>
                        </button>

                        {index !== steps.length - 1 && (
                          <div
                            className={`mx-1 h-px flex-1 ${
                              completed ? "bg-[#A98440]" : "bg-[#E5E1D6]"
                            }`}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* STEP CONTENT */}
              <div className="p-5 sm:p-8">
                <div className="mb-7">
                  <p className="text-[10px] font-bold tracking-[2px] text-[#A7833F]">
                    STEP {activeStep + 1} OF 5
                  </p>
                  <h3 className="mt-2 font-serif text-2xl text-[#173D31]">
                    {steps[activeStep].title} Information
                  </h3>
                  <p className="mt-1 text-sm text-[#85857B]">
                    {steps[activeStep].subtitle}
                  </p>
                </div>

                {error && (
                  <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {activeStep === 0 && (
                  <div className="space-y-7">
                    <div>
                      <SectionHeading>Account information</SectionHeading>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <ReadOnlyField label="Full name" value={fullName} />
                        <ReadOnlyField label="Email address" value={email} />
                        <ReadOnlyField label="Mobile number" value={mobile} />
                      </div>
                    </div>

                    <div>
                      <SectionHeading>Personal details</SectionHeading>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField label="Date of birth">
                          <input
                            type="date"
                            value={form.dob}
                            onChange={(e) => updateForm("dob", e.target.value)}
                            className="form-input"
                          />
                        </FormField>

                        <FormField label="Gender">
                          <select
                            value={form.gender}
                            onChange={(e) => updateForm("gender", e.target.value)}
                            className="form-input"
                          >
                            <option value="">Select gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </FormField>

                        <div className="sm:col-span-2">
                          <FormField label="Residential address">
                            <textarea
                              rows={3}
                              value={form.address}
                              onChange={(e) => updateForm("address", e.target.value)}
                              placeholder="Enter your complete residential address"
                              className="form-input resize-none"
                            />
                          </FormField>
                        </div>

                        <FormField label="City">
                          <input
                            value={form.city}
                            onChange={(e) => updateForm("city", e.target.value)}
                            placeholder="Enter city"
                            className="form-input"
                          />
                        </FormField>

                        <FormField label="State">
                          <input
                            value={form.state}
                            onChange={(e) => updateForm("state", e.target.value)}
                            placeholder="Enter state"
                            className="form-input"
                          />
                        </FormField>

                        <FormField label="PIN code">
                          <input
                            maxLength={6}
                            inputMode="numeric"
                            value={form.pincode}
                            onChange={(e) =>
                              updateForm("pincode", e.target.value.replace(/\D/g, ""))
                            }
                            placeholder="6-digit PIN code"
                            className="form-input"
                          />
                        </FormField>

                        <FormField label="PAN number">
                          <input
                            maxLength={10}
                            value={form.pan}
                            onChange={(e) =>
                              updateForm("pan", e.target.value.toUpperCase())
                            }
                            placeholder="ABCDE1234F"
                            className="form-input uppercase"
                          />
                        </FormField>

                        <FormField label="Aadhaar number">
                          <input
                            maxLength={12}
                            inputMode="numeric"
                            value={form.aadhaar}
                            onChange={(e) =>
                              updateForm("aadhaar", e.target.value.replace(/\D/g, ""))
                            }
                            placeholder="12-digit Aadhaar number"
                            className="form-input"
                          />
                        </FormField>
                      </div>
                    </div>
                  </div>
                )}

                {activeStep === 1 && (
                  <div className="space-y-6">
                    <div className="rounded-2xl bg-[#F4F1E8] p-5 sm:p-7">
                      <div className="mb-5 flex items-center justify-between">
                        <span className="text-[10px] font-bold tracking-[2px] text-[#A7833F]">
                          LORVENS CLUB
                        </span>
                        <Award className="text-[#A7833F]" size={26} />
                      </div>
                      <p className="font-serif text-2xl text-[#173D31]">
                        Lifetime Membership
                      </p>
                      <p className="mt-2 text-xs text-[#74766C]">
                        Your membership card preview
                      </p>
                      <div className="mt-8 border-t border-[#D9D0BA] pt-4">
                        <p className="text-[9px] tracking-[2px] text-[#8C794D]">
                          MEMBER NAME
                        </p>
                        <p className="mt-1 font-serif text-xl text-[#173D31]">
                          {form.membershipName || fullName}
                        </p>
                      </div>
                    </div>

                    <FormField label="Name to be printed on membership card">
                      <input
                        value={form.membershipName}
                        onChange={(e) =>
                          updateForm("membershipName", e.target.value)
                        }
                        placeholder="Enter your preferred card name"
                        className="form-input"
                      />
                    </FormField>

                    <div className="rounded-xl border border-[#E6DDC6] bg-[#FBF9F3] p-5">
                      <div className="flex items-start gap-3">
                        <ShieldCheck className="mt-0.5 shrink-0 text-[#A7833F]" />
                        <div>
                          <h4 className="text-sm font-semibold text-[#173D31]">
                            Lifetime membership
                          </h4>
                          <p className="mt-1 text-xs leading-6 text-[#77796F]">
                            Your membership payment has already been received.
                            You do not need to make another payment to complete
                            this application.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeStep === 2 && (
                  <div className="space-y-5">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div>
                        <h4 className="font-semibold text-[#173D31]">
                          Family member details
                        </h4>
                        <p className="mt-1 text-xs text-[#85857B]">
                          You can add up to five family members.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={addFamilyMember}
                        disabled={familyMembers.length >= 5}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-[#B38B42] px-4 py-2.5 text-xs font-semibold text-[#8C6B2F] transition hover:bg-[#F7F1E4] disabled:opacity-40"
                      >
                        <Users size={15} />
                        Add family member
                      </button>
                    </div>

                    {familyMembers.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-[#D8D2C4] bg-[#FAF9F5] px-5 py-12 text-center">
                        <Users className="mx-auto mb-3 text-[#A7833F]" size={30} />
                        <p className="text-sm font-semibold text-[#173D31]">
                          No family members added
                        </p>
                        <p className="mt-1 text-xs text-[#85857B]">
                          Add family details if applicable.
                        </p>
                      </div>
                    )}

                    {familyMembers.map((member, index) => (
                      <div
                        key={index}
                        className="rounded-2xl border border-[#E6E2D8] bg-[#FCFBF8] p-5"
                      >
                        <div className="mb-5 flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-[#173D31]">
                            Family member {index + 1}
                          </h4>
                          <button
                            type="button"
                            onClick={() => removeFamilyMember(index)}
                            className="rounded-full p-2 text-red-500 hover:bg-red-50"
                            aria-label="Remove family member"
                          >
                            <X size={17} />
                          </button>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <FormField label="Full name">
                            <input
                              value={member.name}
                              onChange={(e) =>
                                updateFamilyMember(index, "name", e.target.value)
                              }
                              placeholder="Family member name"
                              className="form-input"
                            />
                          </FormField>

                          <FormField label="Relationship">
                            <select
                              value={member.relationship}
                              onChange={(e) =>
                                updateFamilyMember(
                                  index,
                                  "relationship",
                                  e.target.value
                                )
                              }
                              className="form-input"
                            >
                              <option value="">Select relationship</option>
                              <option value="Spouse">Spouse</option>
                              <option value="Son">Son</option>
                              <option value="Daughter">Daughter</option>
                              <option value="Father">Father</option>
                              <option value="Mother">Mother</option>
                              <option value="Other">Other</option>
                            </select>
                          </FormField>

                          <FormField label="Date of birth">
                            <input
                              type="date"
                              value={member.dob}
                              onChange={(e) =>
                                updateFamilyMember(index, "dob", e.target.value)
                              }
                              className="form-input"
                            />
                          </FormField>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeStep === 3 && (
                  <div className="space-y-5">
                    <div className="rounded-xl border border-[#E6DDC6] bg-[#FBF9F3] p-4">
                      <p className="text-sm font-semibold text-[#173D31]">
                        Supporting documents (optional)
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[#77796F]">
                        JPG, PNG, WEBP or PDF. Maximum file size: 5 MB per file.
                      </p>
                      <p className="mt-3 text-xs leading-5 text-[#6D725F]">
                        You may upload supporting documents now or leave this section empty.
                      </p>
                    </div>

                    <FileUpload
                      title="Member photograph"
                      description="Upload your recent photograph"
                      file={files.photo}
                      savedFileName={uploadedDocuments.photo?.file_name}
                      uploading={uploadingDocuments.photo}
                      onChange={(e) => handleFileChange("photo", e)}
                    />

                    <FileUpload
                      title="PAN card"
                      description="Upload a clear copy of your PAN card"
                      file={files.panDocument}
                      savedFileName={uploadedDocuments.panDocument?.file_name}
                      uploading={uploadingDocuments.panDocument}
                      onChange={(e) => handleFileChange("panDocument", e)}
                    />

                    <FileUpload
                      title="Aadhaar card"
                      description="Upload a clear copy of your Aadhaar card"
                      file={files.aadhaarDocument}
                      savedFileName={uploadedDocuments.aadhaarDocument?.file_name}
                      uploading={uploadingDocuments.aadhaarDocument}
                      onChange={(e) => handleFileChange("aadhaarDocument", e)}
                    />
                  </div>
                )}

                {activeStep === 4 && (
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-[#E5E0D3] p-5 sm:p-6">
                      <h4 className="mb-5 font-serif text-xl text-[#173D31]">
                        Application summary
                      </h4>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <ReviewItem label="Full name" value={fullName} />
                        <ReviewItem label="Email" value={email} />
                        <ReviewItem label="Mobile" value={mobile} />
                        <ReviewItem label="Date of birth" value={form.dob} />
                        <ReviewItem label="Gender" value={form.gender} />
                        <ReviewItem label="City" value={form.city} />
                        <ReviewItem label="Membership card name" value={form.membershipName} />
                        <ReviewItem
                          label="Family members"
                          value={`${familyMembers.length} added`}
                        />
                      </div>

                      <div className="mt-6 border-t border-[#EAE7DE] pt-5">
                        <h5 className="mb-3 text-xs font-semibold text-[#173D31]">
                          Documents
                        </h5>
                        <div className="space-y-2">
                          {[
                            ["Photograph", uploadedDocuments.photo],
                            ["PAN document", uploadedDocuments.panDocument],
                            ["Aadhaar document", uploadedDocuments.aadhaarDocument],
                          ].map(([label, file]) => (
                            <div
                              key={label as string}
                              className="flex items-center justify-between gap-3 text-xs"
                            >
                              <span className="text-[#77796F]">{label}</span>
                              <span className="flex items-center gap-1 text-emerald-700">
                                {file ? <CheckCircle2 size={14} /> : null}
                                {(file as { file_name: string } | null)?.file_name || "Not uploaded"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#E5E0D3] bg-[#FBFAF6] p-4">
                      <input
                        type="checkbox"
                        checked={form.declaration}
                        onChange={(e) =>
                          updateForm("declaration", e.target.checked)
                        }
                        className="mt-1 h-4 w-4 accent-[#173D31]"
                      />
                      <span className="text-xs leading-6 text-[#65675F]">
                        I confirm that the information provided in this
                        application is true and correct to the best of my
                        knowledge. I agree to the applicable membership terms
                        and conditions.
                      </span>
                    </label>

                    <FormField label="Type your full name as signature">
                      <input
                        value={form.signature}
                        onChange={(e) =>
                          updateForm("signature", e.target.value)
                        }
                        placeholder="Enter your full name"
                        className="form-input"
                      />
                    </FormField>
                  </div>
                )}

                {draftMessage && (
                  <p className="mt-5 text-sm font-medium text-emerald-700">
                    {draftMessage}
                  </p>
                )}

                {/* STEP NAVIGATION */}
                <div className="mt-9 flex flex-col-reverse justify-between gap-3 border-t border-[#EAE7DE] pt-6 sm:flex-row">
                  <button
                    type="button"
                    onClick={previousStep}
                    disabled={activeStep === 0}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[#DCD8CD] px-6 py-3 text-sm font-medium text-[#5D675F] transition hover:bg-[#F7F6F1] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ArrowLeft size={16} />
                    Previous
                  </button>

                  <button
                    type="button"
                    onClick={saveDraft}
                    disabled={savingDraft || applicationSubmitted || checkingApplication}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[#B28B43] px-6 py-3 text-sm font-semibold text-[#8B6B31] transition hover:bg-[#FBF7EC] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingDraft ? "Saving..." : "Save draft"}
                  </button>

                  {activeStep < 4 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#173D31] px-7 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#245344]"
                    >
                      Continue
                      <ArrowRight size={16} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitting || applicationSubmitted || checkingApplication}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#B28B43] px-7 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#987335] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submitting
                        ? "Submitting..."
                        : applicationSubmitted
                        ? "Application submitted"
                        : "Submit application"}

                      <Check size={17} />
                    </button>
                  )}
                </div>
              </div>
              </>
              )}
            </section>

            {/* PAYMENT DETAILS */}
            <section className="rounded-3xl border border-[#E4E0D4] bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F5F0E3] text-[#A7833F]">
                  <CreditCard size={21} />
                </div>
                <div>
                  <h3 className="font-serif text-xl text-[#173D31]">
                    Payment information
                  </h3>
                  <p className="text-xs text-[#85857B]">
                    Your confirmed membership transaction
                  </p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <ReviewItem label="Payment amount" value={amount} />
                <ReviewItem label="Payment status" value="Paid and verified" />
                <ReviewItem label="Payment date" value={paidDate} />
                <ReviewItem label="Payment ID" value={paymentId} />
              </div>
            </section>
          </div>

          {/* RIGHT SIDEBAR */}
          <aside className="space-y-6">
            {/* PROFILE CARD */}
            <section className="rounded-3xl border border-[#E4E0D4] bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="font-serif text-xl text-[#173D31]">
                  Your profile
                </h3>
                <UserRound className="text-[#A7833F]" size={20} />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#D6B46A]/50 bg-[#F5F0E3] font-serif text-2xl text-[#A7833F]">
                  {fullName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#173D31]">
                    {fullName}
                  </p>
                  <p className="mt-1 truncate text-xs text-[#85857B]">
                    {email}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4 border-t border-[#EAE7DE] pt-5">
                <ReviewItem label="Mobile number" value={mobile} />
                <ReviewItem label="Membership type" value="Lifetime" />
                <ReviewItem label="Payment status" value="Verified" />
              </div>
            </section>

            {/* APPLICATION PROGRESS */}
            <section className="rounded-3xl bg-[#12392B] p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold tracking-[2px] text-[#D9B96F]">
                  APPLICATION STATUS
                </p>
                <FileText size={19} className="text-[#D9B96F]" />
              </div>

              <div className="mt-6 flex items-end gap-2">
                <span className="font-serif text-5xl text-[#F6F1E4]">
                  {applicationProgress}%
                </span>
                <span className="pb-2 text-xs text-[#C4CDBF]">completed</span>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-[#D6B46A] transition-all duration-500"
                  style={{ width: `${applicationProgress}%` }}
                />
              </div>

              <p className="mt-4 text-xs leading-6 text-[#D2DACE]">
                Complete the required steps to prepare your membership
                application.
              </p>
              {!applicationSubmitted && (
              <a
                href="#application"
                className="mt-5 flex items-center justify-between rounded-xl border border-[#D6B46A]/40 px-4 py-3 text-xs font-semibold text-[#E6CD94] transition hover:bg-white/5"
              >
                Continue application
                <ChevronRight size={16} />
              </a>
              )}
            </section>
            

            {/* SUPPORT CARD */}
            <section className="rounded-3xl border border-[#E4E0D4] bg-white p-6 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F5F0E3] text-[#A7833F]">
                <Headphones size={21} />
              </div>
              <h3 className="mt-4 font-serif text-xl text-[#173D31]">
                Need assistance?
              </h3>
              <p className="mt-2 text-xs leading-6 text-[#85857B]">
                Contact the Lorvens membership team if you need help with your
                membership application.
              </p>
              <p className="mt-4 text-xs font-semibold text-[#A7833F]">
                Membership Support
              </p>
            </section>
          </aside>
        </div>

        {/* FOOTER */}
        <footer className="mt-12 border-t border-[#DEDACF] py-7 text-center">
          <p className="font-serif text-sm tracking-[3px] text-[#173D31]">
            LORVENS CLUB
          </p>
          <p className="mt-2 text-[10px] tracking-wider text-[#85857B]">
            EXCLUSIVE MEMBERSHIP · PRIVATE CLUB EXPERIENCE
          </p>
        </footer>
      </main>

      {/* LOCAL INPUT STYLES */}
      <style>{`
        .form-input {
          width: 100%;
          min-height: 46px;
          border: 1px solid #dedbd1;
          border-radius: 10px;
          background: #fff;
          padding: 11px 13px;
          font-size: 13px;
          color: #173d31;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .form-input::placeholder {
          color: #aaa99f;
        }
        .form-input:focus {
          border-color: #b38b42;
          box-shadow: 0 0 0 3px rgba(179,139,66,0.12);
        }
      `}</style>
    </div>
  );
};

/* REUSABLE COMPONENTS */

const SummaryCard = ({
  icon,
  label,
  value,
  detail,
  green = false,
  compact = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  green?: boolean;
  compact?: boolean;
}) => (
  <div className="rounded-2xl border border-[#E4E0D4] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
    <div className="mb-4 flex items-center justify-between">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F0E3] text-[#A7833F]">
        {icon}
      </div>
      {green && (
        <CheckCircle2 size={18} className="text-emerald-600" />
      )}
    </div>
    <p className="text-xs text-[#85857B]">{label}</p>
    <p className={`mt-1 font-serif text-2xl text-[#173D31] ${compact ? "text-base sm:text-lg" : ""}`}>
      {value}
    </p>
    <p className="mt-2 text-[11px] text-[#9B9B90]">{detail}</p>
  </div>
);

const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <h4 className="mb-4 border-b border-[#EAE7DE] pb-3 text-sm font-semibold text-[#173D31]">
    {children}
  </h4>
);

const FormField = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <label className="block">
    <span className="mb-2 block text-xs font-semibold text-[#555F56]">
      {label}
    </span>
    {children}
  </label>
);

const ReadOnlyField = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div>
    <p className="mb-2 text-xs font-semibold text-[#555F56]">{label}</p>
    <div className="flex min-h-[46px] items-center rounded-xl border border-[#E6E2D8] bg-[#F7F6F1] px-3 text-sm text-[#77796F]">
      {value || "Not available"}
    </div>
  </div>
);

const ReviewItem = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div className="min-w-0">
    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#929287]">
      {label}
    </p>
    <p className="mt-1 break-words text-sm font-medium text-[#29483C]">
      {value || "Not provided"}
    </p>
  </div>
);

const FileUpload = ({
  title,
  description,
  file,
  savedFileName,
  uploading,
  onChange,
}: {
  title: string;
  description: string;
  file: File | null;
  savedFileName?: string;
  uploading?: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  const inputId = `upload-${title.toLowerCase().replace(/\s/g, "-")}`;

  return (
    <div className="rounded-2xl border border-[#E5E1D7] bg-[#FCFBF8] p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F3EEDF] text-[#A7833F]">
            <Upload size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#173D31]">{title}</p>
            <p className="mt-1 text-xs text-[#85857B]">{description}</p>
            {(file || savedFileName || uploading) && (
              <p className="mt-2 max-w-full truncate text-xs text-emerald-700">
                {uploading ? (
                  "Uploading document..."
                ) : (
                  <>
                    <CheckCircle2 size={13} className="mr-1 inline" />
                    {file?.name || savedFileName}
                  </>
                )}
              </p>
            )}
          </div>
        </div>

        <label
          htmlFor={inputId}
          className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border border-[#B38B42] px-5 py-2.5 text-xs font-semibold text-[#8C6B2F] transition hover:bg-[#F7F1E4]"
        >
          <Upload size={14} />
          {file || savedFileName ? "Change file" : "Choose file"}
        </label>

        <input
          id={inputId}
          type="file"
          accept={title === "Member photograph"
            ? ".jpg,.jpeg,.png,.webp"
            : ".jpg,.jpeg,.png,.webp,.pdf"}
          onChange={onChange}
          className="hidden"
        />
      </div>
    </div>
  );
};
