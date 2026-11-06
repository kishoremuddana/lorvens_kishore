import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Download,
  Eye,
  FileText,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import {
  adminApplicationService,
  type AdminApplicationRow,
  type AdminApplicationDetails,
  type AdminDocument,
} from "../services/adminApplicationService";

const formatDate = (value?: string | null) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatSize = (size?: number) => {
  if (typeof size !== "number") return "";

  return `${(size / 1024).toFixed(0)} KB`;
};

export const ApplicationsPage: React.FC = () => {
  const [items, setItems] = useState<AdminApplicationRow[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selected, setSelected] =
    useState<AdminApplicationDetails | null>(null);

  const [detailsLoading, setDetailsLoading] = useState(false);
  const [documentBusy, setDocumentBusy] = useState<string | null>(null);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result =
        await adminApplicationService.getApplications(
          page,
          10,
          search
        );

      setItems(result.items || []);

      setTotalPages(
        Math.max(result.pagination?.total_pages || 1, 1)
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load applications."
      );
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  const openDetails = async (id: string) => {
    setDetailsLoading(true);
    setSelected(null);
    setError("");

    try {
      const result =
        await adminApplicationService.getDetails(id);

      setSelected(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load application details."
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDocument = async (
    doc: AdminDocument,
    action: "view" | "download"
  ) => {
    if (!selected) return;

    const key = `${doc.document_type}-${action}`;

    setDocumentBusy(key);

    try {
      if (action === "view") {
        await adminApplicationService.viewDocument(
          selected.id,
          doc.document_type,
          doc.file_name
        );
      } else {
        await adminApplicationService.downloadDocument(
          selected.id,
          doc.document_type,
          doc.file_name
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to open this document."
      );
    } finally {
      setDocumentBusy(null);
    }
  };

  const renderValue = (value: unknown): React.ReactNode => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "—";
    }

    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    return String(value);
  };

  return (
    <div className="space-y-6 text-[#F5F0E4]">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl text-white">
            Membership Applications
          </h1>

          <p className="mt-1 text-sm text-[#B8C2BB]">
            View submitted applications and uploaded documents.
          </p>
        </div>

        <button
          onClick={() => void loadApplications()}
          className="inline-flex items-center gap-2 rounded-lg border border-[#D9AD55]/40 px-4 py-2 text-sm text-[#D9AD55]"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 rounded-xl border border-[#D9AD55]/20 bg-[#002219]/70 px-3">
        <Search size={17} className="text-[#D9AD55]" />

        <input
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Search name, email or mobile"
          className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-[#9BA99F]"
        />
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-200">
          {error}
        </p>
      )}

      {/* Applications table */}
      <div className="overflow-hidden rounded-2xl border border-[#D9AD55]/20 bg-[#002219]/70">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#D9AD55]/20 text-xs uppercase tracking-wider text-[#D9AD55]">
              <tr>
                <th className="px-5 py-4">Applicant Name</th>
                <th className="px-5 py-4">Email</th>
                <th className="px-5 py-4">Mobile</th>
                <th className="px-5 py-4">Submitted</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#D9AD55]/10">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-[#B8C2BB]">
                    Loading applications...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-[#B8C2BB]">
                    No submitted applications found.
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.id} className="text-[#E9E5D9]">
                    <td className="px-5 py-4 font-medium text-white">
                      {row.full_name}
                    </td>

                    <td className="px-5 py-4">{row.email}</td>
                    <td className="px-5 py-4">{row.mobile}</td>
                    <td className="px-5 py-4">
                      {formatDate(row.submitted_at)}
                    </td>

                    <td className="px-5 py-4">
                      <button
                        onClick={() => void openDetails(row.id)}
                        className="rounded-lg border border-[#D9AD55]/40 px-3 py-2 text-xs text-[#D9AD55] hover:bg-[#D9AD55]/10"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-[#D9AD55]/15 px-5 py-3 text-xs text-[#B8C2BB]">
          <span>
            Page {page} of {totalPages}
          </span>

          <div className="flex gap-2">
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => p - 1)}
              className="rounded border border-[#D9AD55]/30 px-3 py-1.5 disabled:opacity-40"
            >
              Previous
            </button>

            <button
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="rounded border border-[#D9AD55]/30 px-3 py-1.5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Details modal */}
      {(detailsLoading || selected) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-6">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-[#D9AD55]/30 bg-[#002219] p-5 shadow-2xl sm:p-7">

            <div className="mb-5 flex items-start justify-between border-b border-[#D9AD55]/20 pb-4">
              <div>
                <h2 className="font-serif text-xl text-white">
                  Application Details
                </h2>

                {selected && (
                  <p className="mt-1 text-sm text-[#B8C2BB]">
                    {selected.full_name} · {selected.email}
                  </p>
                )}
              </div>

              <button
                onClick={() => setSelected(null)}
                className="rounded-lg p-2 text-[#D9AD55] hover:bg-white/5"
              >
                <X />
              </button>
            </div>

            {detailsLoading ? (
              <p className="py-10 text-center text-[#B8C2BB]">
                Loading details...
              </p>
            ) : selected && (
              <div className="space-y-6">

                {/* Personal information */}
                <section>
                  <h3 className="mb-3 font-serif text-lg text-white">
                    Personal Information
                  </h3>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                      ["Full Name", selected.full_name],
                      ["Email", selected.email],
                      ["Mobile", selected.mobile],
                      ["Submitted", formatDate(selected.submitted_at)],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-lg border border-[#D9AD55]/15 bg-black/10 p-3"
                      >
                        <p className="text-xs text-[#B8C2BB]">{label}</p>
                        <p className="mt-1 break-words text-sm text-white">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Application information */}
                <section>
                  <h3 className="mb-3 font-serif text-lg text-white">
                    Application Information
                  </h3>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(selected.application_data || {}).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="rounded-lg border border-[#D9AD55]/15 p-3"
                        >
                          <p className="text-xs capitalize text-[#B8C2BB]">
                            {key.replace(/([A-Z])/g, " $1")}
                          </p>

                          <p className="mt-1 break-words text-sm text-white">
                            {renderValue(value)}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </section>

                {/* Family members */}
                <section>
                  <h3 className="mb-3 font-serif text-lg text-white">
                    Family Members
                  </h3>

                  {selected.family_members?.length ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {selected.family_members.map((member, index) => (
                        <div
                          key={index}
                          className="rounded-lg border border-[#D9AD55]/15 p-3 text-sm text-white"
                        >
                          {Object.entries(member).map(([key, value]) => (
                            <p key={key}>
                              <span className="capitalize text-[#B8C2BB]">
                                {key}:{" "}
                              </span>
                              {renderValue(value)}
                            </p>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#B8C2BB]">
                      No family members added.
                    </p>
                  )}
                </section>

                {/* Uploaded documents */}
                <section>
                  <h3 className="mb-3 font-serif text-lg text-white">
                    Uploaded Documents
                  </h3>

                  {selected.document_files?.length ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {selected.document_files.map((doc) => (
                        <div
                          key={doc.document_type}
                          className="flex flex-col gap-3 rounded-xl border border-[#D9AD55]/20 bg-black/10 p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <FileText className="shrink-0 text-[#D9AD55]" />

                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-white">
                                {doc.file_name}
                              </p>

                              <p className="text-xs text-[#B8C2BB]">
                                {doc.document_type}
                                {doc.size ? ` · ${formatSize(doc.size)}` : ""}
                              </p>
                            </div>
                          </div>

                          <div className="flex shrink-0 gap-2">
                            <button
                              disabled={!!documentBusy}
                              onClick={() => void handleDocument(doc, "view")}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#D9AD55]/40 px-3 py-2 text-xs text-[#D9AD55] disabled:opacity-50"
                            >
                              <Eye size={14} />
                              {documentBusy === `${doc.document_type}-view`
                                ? "Opening..."
                                : "View"}
                            </button>

                            <button
                              disabled={!!documentBusy}
                              onClick={() => void handleDocument(doc, "download")}
                              className="inline-flex items-center gap-1 rounded-lg bg-[#D9AD55] px-3 py-2 text-xs font-semibold text-[#10251D] disabled:opacity-50"
                            >
                              <Download size={14} />
                              {documentBusy === `${doc.document_type}-download`
                                ? "Downloading..."
                                : "Download"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-lg border border-[#D9AD55]/15 p-4 text-sm text-[#B8C2BB]">
                      No documents found.
                    </p>
                  )}
                </section>

                {/* Payment information */}
                <section>
                  <h3 className="mb-3 font-serif text-lg text-white">
                    Payment Information
                  </h3>

                  {selected.payments?.length ? (
                    <div className="space-y-3">
                      {selected.payments.map((payment, index) => (
                        <div
                          key={String(payment.id || index)}
                          className="grid gap-2 rounded-lg border border-[#D9AD55]/15 p-3 text-sm sm:grid-cols-2"
                        >
                          {Object.entries(payment).map(([key, value]) => (
                            <p key={key} className="break-words">
                              <span className="capitalize text-[#B8C2BB]">
                                {key.replace(/_/g, " ")}:{" "}
                              </span>

                              <span className="text-white">
                                {renderValue(value)}
                              </span>
                            </p>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#B8C2BB]">
                      No payment information found.
                    </p>
                  )}
                </section>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};