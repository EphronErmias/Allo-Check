import { useState, type FormEvent } from "react";
import { apiUrl, formatFetchError, readApiError } from "./api";

const INQUIRY_OPTIONS = [
  { value: "business_owner", label: "Business owner / retailer" },
  { value: "retail_partner", label: "Retail or distribution partner" },
  { value: "enterprise", label: "Enterprise / API partner" },
  { value: "individual", label: "Individual buyer or seller" },
  { value: "other", label: "Other" },
] as const;

const contactInput =
  "w-full border-0 border-b border-brand-tint/90 bg-transparent py-2.5 text-sm text-brand-ink outline-none transition placeholder:text-brand-soft focus:border-brand focus:ring-0";

const contactLabel = "mb-1 block text-xs font-medium text-brand-muted";

type ContactPageProps = {
  onClose: () => void;
  defaultInquiryType?: string;
  partnersEmail?: string;
};

export function ContactPage({
  onClose,
  defaultInquiryType = "business_owner",
  partnersEmail = "partners@Kedamay.com",
}: ContactPageProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [inquiryType, setInquiryType] = useState(defaultInquiryType);
  const [message, setMessage] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      const res = await fetch(apiUrl("/api/v1/contact"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          companyName,
          email,
          phone,
          inquiryType,
          message,
          marketingOptIn,
        }),
      });
      if (!res.ok) throw new Error(await readApiError(res));
      const data = (await res.json()) as { message?: string };
      setSuccess(data.message ?? "Thank you. We will be in touch soon.");
      setFirstName("");
      setLastName("");
      setCompanyName("");
      setEmail("");
      setPhone("");
      setMessage("");
      setMarketingOptIn(false);
    } catch (err) {
      setError(formatFetchError(err, "contact service"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-brand-navy text-white shadow-md transition hover:bg-brand-navy-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:right-6 sm:top-8"
        aria-label="Close and return home"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.25} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 lg:pr-8">
        <div className="max-w-md pt-2">
          <h1 className="text-3xl font-bold tracking-tight text-brand-ink sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
            Want to talk to us?
          </h1>
          <p className="mt-1 text-3xl font-bold tracking-tight text-brand sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
            Get in touch.
          </p>
          <p className="mt-8 text-sm text-brand-muted leading-relaxed">
            Interested in becoming an AlloCheck partner?{" "}
            <a href={`mailto:${partnersEmail}`} className="font-medium text-brand hover:underline">
              {partnersEmail}
            </a>
          </p>
        </div>

        <div className="lg:pt-2">
          <p className="text-sm font-medium text-brand-ink">Please fill in the form below.</p>
          <p className="mt-1 text-sm text-brand-muted">We aim to reply within 1 business day.</p>

          {success ? (
            <div
              className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-6 text-sm text-emerald-900"
              role="status"
            >
              {success}
            </div>
          ) : (
            <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <label className="block">
                  <span className={contactLabel}>
                    First name <span className="text-brand">*</span>
                  </span>
                  <input
                    type="text"
                    name="firstName"
                    required
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={contactInput}
                  />
                </label>
                <label className="block">
                  <span className={contactLabel}>
                    Last name <span className="text-brand">*</span>
                  </span>
                  <input
                    type="text"
                    name="lastName"
                    required
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={contactInput}
                  />
                </label>
              </div>

              <label className="block">
                <span className={contactLabel}>Company name</span>
                <input
                  type="text"
                  name="companyName"
                  autoComplete="organization"
                  placeholder="Optional"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className={contactInput}
                />
              </label>

              <label className="block">
                <span className={contactLabel}>
                  E-mail <span className="text-brand">*</span>
                </span>
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={contactInput}
                />
              </label>

              <label className="block">
                <span className={contactLabel}>
                  Phone number <span className="text-brand">*</span>
                </span>
                <input
                  type="tel"
                  name="phone"
                  required
                  autoComplete="tel"
                  placeholder="+251 …"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={contactInput}
                />
              </label>

              <fieldset>
                <legend className={contactLabel}>
                  I am contacting you as <span className="text-brand">*</span>
                </legend>
                <div className="mt-2 space-y-2">
                  {INQUIRY_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex cursor-pointer items-center gap-2.5 text-sm text-brand-ink"
                    >
                      <input
                        type="radio"
                        name="inquiryType"
                        value={opt.value}
                        checked={inquiryType === opt.value}
                        onChange={() => setInquiryType(opt.value)}
                        className="h-4 w-4 border-brand-tint text-brand-navy focus:ring-brand/30"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="block">
                <span className={contactLabel}>Your message</span>
                <textarea
                  name="message"
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className={`${contactInput} resize-y min-h-[5rem]`}
                />
              </label>

              <label className="flex cursor-pointer items-start gap-3 text-sm text-brand-muted">
                <input
                  type="checkbox"
                  checked={marketingOptIn}
                  onChange={(e) => setMarketingOptIn(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-brand-tint text-brand-navy focus:ring-brand/30"
                />
                <span>Would you like to receive updates from us? (We promise no spam!)</span>
              </label>

              {error ? (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-full bg-brand-navy px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-navy-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[14rem]"
              >
                {busy ? "Sending…" : "Submit message"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
