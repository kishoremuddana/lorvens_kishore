
type TermsAndConditionsProps = {
  onBack: () => void;
};

const terms = [
  {
    title: "Validity & AMC",
    description:
      "The membership is valid for a lifetime. AMC charges will be applicable from the 6th year after issuance of the membership card.",
  },
  {
    title: "Non-Transferability",
    description:
      "Membership is issued to the registered primary member and authorized family members. It cannot be transferred to another person.",
  },
  {
    title: "Property Ownership",
    description:
      "The physical membership cards remain the property of Lorvens Club and must be returned upon request.",
  },
  {
    title: "Loss or Damage",
    description:
      "Any lost or misplaced membership card must be reported to Lorvens Club immediately.",
  },
  {
    title: "Fee Non-Refundability",
    description:
      "Membership fees are non-refundable once the membership card has been issued.",
  },
];

export default function TermsAndConditions({
  onBack,
}: TermsAndConditionsProps) {
  return (
    <main className="min-h-screen bg-[#F5F4EF] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow-sm sm:p-10">
        <div className="mb-10">
          <div className="mb-5 h-12 w-2 rounded-full bg-[#C99A35]" />

          <h1 className="font-serif text-3xl font-bold text-[#061426] sm:text-4xl">
            Terms & Conditions
          </h1>

          <p className="mt-4 text-sm leading-7 text-[#777777]">
            Please read the membership terms and conditions carefully
            before proceeding with your application.
          </p>
        </div>

        <div className="space-y-8">
          {terms.map((term, index) => (
            <section
              key={term.title}
              className="border-b border-[#E5E3DC] pb-7 last:border-0"
            >
              <h2 className="text-lg font-semibold text-[#061426]">
                {index + 1}. {term.title}
              </h2>

              <p className="mt-3 text-sm leading-7 text-[#666666]">
                {term.description}
              </p>
            </section>
          ))}
        </div>

        <div className="mt-8 border-t border-[#E5E3DC] pt-6">
          <button
            type="button"
            onClick={onBack}
            className="border border-[#C99A35] bg-[#C99A35] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#AF8125]"
          >
            ← Back to Application
          </button>
        </div>
      </div>
    </main>
  );
}
