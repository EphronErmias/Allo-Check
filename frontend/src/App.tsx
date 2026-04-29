import { useEffect, useState } from "react";

type DisplayLevel = "SAFE" | "WARNING" | "BLOCKED";

type LookupResult = {
  found: boolean;
  displayLevel?: DisplayLevel;
  status?: string;
  deviceName?: string;
  brand?: string;
  imei?: string;
  serialNumber?: string;
  statusLabel?: string;
  reportedDate?: string | null;
  notes?: string;
  message?: string;
};

const rawApiUrl = import.meta.env.VITE_API_URL?.trim() ?? "http://localhost:4000";
const apiBase = rawApiUrl.replace(/\/api\/v1\/?$/i, "").replace(/\/$/, "");

const partnersBannerSrc =
  import.meta.env.VITE_PARTNERS_BANNER_URL?.trim() || "/partners-banner.svg";

const alloShopUrl =
  import.meta.env.VITE_ALLO_SHOP_URL?.trim() || "https://allo.example/phones";

const heroImages = [
  {
    src: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=2400&h=1200&fit=crop&q=85",
    alt: "Smartphones on display",
  },
  {
    src: "https://images.unsplash.com/photo-1616348436218-f43bb1235e01?w=2400&h=1200&fit=crop&q=85",
    alt: "",
  },
];

const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-none bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60";

const btnPartnerCta =
  "group inline-flex items-center justify-center gap-2 rounded-none bg-gradient-to-r from-cyan-400 to-cyan-300 px-8 py-3.5 text-base font-semibold text-blue-950 shadow-lg shadow-cyan-500/20 transition hover:from-cyan-300 hover:to-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300";

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function PartnerBannerImage({ src }: { src: string }) {
  return (
    <img
      src={src}
      alt=""
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}

function AlloLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width="36"
        height="36"
        viewBox="0 0 40 40"
        fill="none"
        className="shrink-0"
        aria-hidden
      >
        <rect width="40" height="40" rx="10" className="fill-blue-600" />
        <path
          d="M12 26V14h4.2l3.8 7.2L23.8 14H28v12h-3.2v-7.2l-3.4 7.2h-2.8l-3.4-7.2V26H12z"
          className="fill-white"
        />
      </svg>
      <span className="text-xl font-bold tracking-tight text-zinc-900">
        Allo<span className="text-blue-600">Check</span>
      </span>
    </div>
  );
}

/** Maps API `status` to AlloCheck visual tier (gradient + copy). */
type StatusTier = "clean" | "unknown" | "finance" | "stolen";

function resolveStatusTier(result: LookupResult): StatusTier {
  const s = (result.status ?? "").toUpperCase();
  if (s === "CLEAN") return "clean";
  if (s === "STOLEN_BLACKLISTED") return "stolen";
  if (s === "LOCKED_NON_PAYMENT" || s === "UNDER_FINANCING") return "finance";
  if (s === "UNREGISTERED_UNKNOWN") return "unknown";
  if (!result.found) return "unknown";
  if (result.displayLevel === "SAFE") return "clean";
  return "unknown";
}

const TIER_COPY: Record<
  StatusTier,
  { title: string; blurb: string }
> = {
  clean: {
    title: "Verified / Clean",
    blurb: "No reported issues for this status in the AlloCheck registry.",
  },
  unknown: {
    title: "Not Registered / Unknown",
    blurb: "Limited or no registry match—verify with seller and carriers.",
  },
  finance: {
    title: "Locked / Under Financing",
    blurb: "Financing or lock status may affect activation or resale.",
  },
  stolen: {
    title: "Stolen / Blacklisted",
    blurb: "This device is flagged as stolen or blocklisted—do not buy until cleared.",
  },
};

function tierHeaderGradient(tier: StatusTier): string {
  switch (tier) {
    case "clean":
      return "from-emerald-400 via-green-600 to-teal-800";
    case "unknown":
      return "from-amber-300 via-yellow-400 to-amber-600";
    case "finance":
      return "from-orange-400 via-amber-500 to-orange-700";
    case "stolen":
      return "from-rose-500 via-red-600 to-red-900";
    default:
      return "from-amber-300 via-yellow-400 to-amber-600";
  }
}

function tierTextPrimary(tier: StatusTier): string {
  switch (tier) {
    case "unknown":
      return "text-amber-950";
    default:
      return "text-white";
  }
}

function tierTextMuted(tier: StatusTier): string {
  switch (tier) {
    case "unknown":
      return "text-amber-950/85";
    default:
      return "text-white/90";
  }
}

function tierIconWrap(tier: StatusTier): string {
  switch (tier) {
    case "unknown":
      return "bg-amber-950/10 text-amber-950 ring-amber-950/20";
    default:
      return "bg-white/15 text-white ring-white/25";
  }
}

function StatusGlyphByTier({ tier }: { tier: StatusTier }) {
  const common = "h-7 w-7 shrink-0";
  switch (tier) {
    case "clean":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "unknown":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
        </svg>
      );
    case "finance":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      );
    case "stolen":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      );
    default:
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      );
  }
}

function ResultField({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  return (
    <div className="rounded-none border border-zinc-100 bg-white px-4 py-3.5 shadow-sm shadow-zinc-900/5 sm:px-5">
      <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-blue-600/90">{label}</p>
      <p
        className={`mt-1.5 text-[0.95rem] font-medium leading-snug text-zinc-900 ${mono ? "font-mono text-sm tracking-tight" : ""}`}
      >
        {value && String(value).trim() !== "" ? value : "—"}
      </p>
    </div>
  );
}

function LookupResultCard({
  result,
  notes,
}: {
  result: LookupResult;
  notes: string | undefined;
}) {
  const tier = resolveStatusTier(result);
  const tierStyle = TIER_COPY[tier];
  const grad = tierHeaderGradient(tier);
  const registryLabel = result.found ? "In AlloCheck registry" : "Not in registry";

  return (
    <div
      className="mt-10 overflow-hidden rounded-none bg-white shadow-[0_20px_50px_-12px_rgba(37,99,235,0.18)] ring-1 ring-zinc-200/80"
      role="region"
      aria-label="Verification result"
    >
      <div className={`relative bg-gradient-to-br ${grad} px-6 py-8 sm:px-8 sm:py-9`}>
        <div
          className={`pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_80%_at_100%_0%,rgba(255,255,255,0.22),transparent)] ${tier === "unknown" ? "opacity-90" : ""}`}
        />
        <div className="relative">
          <p
            className={`text-[0.65rem] font-semibold uppercase tracking-[0.22em] ${tier === "unknown" ? "text-amber-950/70" : "text-white/80"}`}
          >
            Status
          </p>
          <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 gap-4">
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-none ring-2 backdrop-blur-sm ${tierIconWrap(tier)}`}
              >
                <StatusGlyphByTier tier={tier} />
              </div>
              <div className="min-w-0">
                <h3 className={`text-2xl font-bold tracking-tight sm:text-3xl ${tierTextPrimary(tier)}`}>
                  {tierStyle.title}
                </h3>
                {result.statusLabel && (
                  <p className={`mt-1 text-sm font-semibold sm:text-base ${tierTextMuted(tier)}`}>
                    {result.statusLabel}
                  </p>
                )}
                <p className={`mt-3 max-w-xl text-sm leading-relaxed sm:text-[0.95rem] ${tierTextMuted(tier)}`}>
                  {tierStyle.blurb}
                </p>
              </div>
            </div>
            <span
              className={`inline-flex w-fit shrink-0 rounded-none px-4 py-2 text-xs font-bold shadow-md ring-2 ${
                tier === "unknown"
                  ? "bg-amber-950/10 text-amber-950 ring-amber-950/25"
                  : "bg-white/95 text-zinc-900 ring-white/50"
              }`}
            >
              {registryLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-100 bg-gradient-to-b from-zinc-50/90 to-white px-5 py-6 sm:px-8 sm:py-8">
        <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-zinc-500">Device details</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <ResultField label="Device name" value={result.deviceName} />
          <ResultField label="Brand" value={result.brand} />
          <ResultField label="IMEI" value={result.imei} mono />
          <ResultField label="Serial number" value={result.serialNumber} mono />
          <div className="sm:col-span-2">
            <ResultField label="Reported date" value={result.reportedDate ?? undefined} />
          </div>
        </div>

        <div className="mt-6 rounded-none border border-cyan-100/90 bg-gradient-to-br from-cyan-50 via-white to-blue-50/60 p-5 shadow-inner shadow-blue-900/5 sm:p-6">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-blue-700/80">Notes</p>
          <p className="mt-3 text-sm leading-relaxed text-zinc-700">{notes && notes.trim() !== "" ? notes : "—"}</p>
        </div>

        <p className="mt-6 border-t border-zinc-100 pt-5 text-xs text-zinc-500">
          Results reflect the AlloCheck registry at the time of lookup.
        </p>
      </div>
    </div>
  );
}

/** Shown when lookup resolves to Not Registered / Unknown — replaces the form + standard result card. */
function UnknownNotRegisteredPanel({
  shopUrl,
  onCheckAnother,
}: {
  shopUrl: string;
  onCheckAnother: () => void;
}) {
  return (
    <div className="text-center sm:text-left">
      <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-none bg-gradient-to-br from-orange-400 via-orange-500 to-orange-700 text-white shadow-lg shadow-orange-500/40 ring-2 ring-white/30 sm:mx-0">
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <p className="bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-[0.65rem] font-semibold uppercase tracking-wider text-transparent">
        Not registered / unknown
      </p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">Proceed with caution</h2>
      <div className="relative mt-6 overflow-hidden rounded-none bg-gradient-to-br from-orange-400 via-orange-500 to-orange-700 px-5 py-5 text-left shadow-xl shadow-orange-600/30 sm:px-6 sm:py-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_80%_at_100%_0%,rgba(255,255,255,0.2),transparent)]" />
        <div className="relative">
          <p className="text-base font-semibold leading-relaxed text-white sm:text-lg">
            This device is not registered in AlloCheck and might not be genuine or original.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-orange-50/95">
            Only continue if you trust the seller. For a verified device, buy from an authorized source.
          </p>
        </div>
      </div>
      <div className="mt-8 flex flex-col items-center gap-4 sm:items-start">
        <a
          href={shopUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btnPartnerCta} w-full max-w-md justify-center sm:w-auto`}
        >
          Buy original phones from Allo
          <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
        </a>
        <button
          type="button"
          onClick={onCheckAnother}
          className="text-sm font-semibold text-blue-600 underline decoration-blue-600/30 underline-offset-4 transition hover:text-blue-700"
        >
          Check another IMEI or serial
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [heroIndex, setHeroIndex] = useState(0);
  const [serial, setSerial] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LookupResult | null>(null);

  useEffect(() => {
    const t = setInterval(() => {
      setHeroIndex((i) => (i + 1) % heroImages.length);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    const trimmed = serial.trim();
    if (!trimmed) {
      setError("Enter a serial number or IMEI.");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (/^\d[\d\s-]*$/.test(trimmed) && trimmed.replace(/\D/g, "").length >= 8) {
        params.set("imei", trimmed);
      } else {
        params.set("serial", trimmed);
      }
      const res = await fetch(
        `${apiBase}/api/v1/devices/lookup?${params.toString()}`,
        { method: "GET", cache: "no-store" },
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed (${res.status})`);
      }
      const data = (await res.json()) as LookupResult;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  }

  const hero = heroImages[heroIndex];
  const notes = result?.notes ?? result?.message;
  const resultTier = result ? resolveStatusTier(result) : null;
  const showUnknownNotRegisteredPanel = resultTier === "unknown";

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(59,130,246,0.12),transparent)] bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-50 border-b border-zinc-200/70 bg-white/90 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-4 px-4 py-2.5 sm:px-6 sm:py-3">
          <a
            href="#"
            className="rounded-none outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <AlloLogo />
          </a>
        </div>
      </header>

      <section id="hero-search" className="w-full">
        <div className="w-full">
          {/* Full-bleed rectangular banner — wide aspect, edge-to-edge */}
          <div className="relative w-full overflow-hidden bg-zinc-200">
            <div className="relative aspect-[5/4] w-full min-h-[22rem] sm:aspect-[21/9] sm:min-h-[16rem] md:aspect-[35/9] md:min-h-[11rem] lg:min-h-[13rem]">
              <img
                key={heroIndex}
                src={hero.src}
                alt={hero.alt}
                className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/45 via-zinc-900/10 to-transparent" />
              <div className="absolute inset-x-3 bottom-4 z-10 sm:inset-x-6 sm:bottom-8">
                <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-3xl flex-col items-center gap-2.5 sm:flex-row sm:items-end sm:gap-3">
                  <label className="block w-full">
                    <span className="sr-only">Serial number or IMEI</span>
                    <div className="relative">
                      <svg
                        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-blue-950"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21 21l-4.35-4.35m1.35-5.15a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
                        />
                      </svg>
                      <input
                        type="text"
                        name="serial"
                        autoComplete="off"
                        placeholder="enter serial number or imie number in"
                        value={serial}
                        onChange={(e) => setSerial(e.target.value)}
                        className="w-full rounded-none border border-cyan-200/60 bg-gradient-to-r from-cyan-200/55 via-cyan-100/45 to-blue-100/40 py-3 pr-4 pl-11 text-[0.95rem] text-blue-950 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)] outline-none backdrop-blur-sm transition placeholder:text-blue-950/70 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/35 sm:py-3.5 sm:pr-5 sm:pl-12 sm:text-base"
                      />
                    </div>
                  </label>
                  <button type="submit" disabled={loading} className={`${btnPartnerCta} w-full py-3 sm:w-auto sm:shrink-0 sm:py-3.5`}>
                    {loading ? "Checking..." : "Check Now"}
                  </button>
                </form>
                <div className="mx-auto mt-2.5 flex w-full max-w-3xl snap-x snap-mandatory gap-1.5 overflow-x-auto border border-cyan-200/60 bg-gradient-to-r from-cyan-200/55 via-cyan-100/45 to-blue-100/40 p-1 text-blue-950 backdrop-blur-sm sm:mt-3 sm:grid sm:grid-cols-3 sm:gap-0 sm:overflow-visible sm:p-0">
                  <div className="flex min-w-[11rem] snap-start items-center justify-center gap-2 border border-white/20 px-3 py-2 text-center text-xs font-medium sm:min-w-0 sm:border-y-0 sm:border-l-0 sm:border-r sm:px-4 sm:py-2.5 sm:text-sm">
                    <span className="text-blue-950">✓</span>
                    <span>Real-time Verification</span>
                  </div>
                  <div className="flex min-w-[10rem] snap-start items-center justify-center gap-2 border border-white/20 px-3 py-2 text-center text-xs font-medium sm:min-w-0 sm:border-y-0 sm:border-l-0 sm:border-r sm:px-4 sm:py-2.5 sm:text-sm">
                    <span className="text-blue-950">✓</span>
                    <span>Trusted Registry</span>
                  </div>
                  <div className="flex min-w-[9rem] snap-start items-center justify-center gap-2 border border-white/20 px-3 py-2 text-center text-xs font-medium sm:min-w-0 sm:border-y-0 sm:border-l-0 sm:border-r-0 sm:px-4 sm:py-2.5 sm:text-sm">
                    <span className="text-blue-950">✓</span>
                    <span>Secure Checks</span>
                  </div>
                </div>
                {error && (
                  <p className="mx-auto mt-3 w-full max-w-3xl rounded-none border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm text-rose-800">
                    {error}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-blue-900/30 bg-gradient-to-br from-blue-900 via-blue-950 to-teal-950 px-4 py-12 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
            Protect Yourself from Fraud
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-blue-100/90 sm:mt-6 sm:text-lg">
            Stolen and financed phones circulate every day. One quick check reduces the chance you pay for a device you cannot use or resell.
          </p>
        </div>
      </section>

      {result && (
        <section
          id="verify"
          className="scroll-mt-20 border-b border-zinc-200 bg-gradient-to-b from-zinc-100 to-zinc-50 px-4 py-12 sm:px-6 sm:py-20"
        >
          <div className="mx-auto flex max-w-2xl justify-center">
            <div className="w-full rounded-none border border-white/80 bg-white p-5 shadow-[0_25px_60px_-15px_rgba(37,99,235,0.15)] ring-1 ring-blue-100/80 sm:p-10 md:p-12">
              {showUnknownNotRegisteredPanel ? (
                <UnknownNotRegisteredPanel
                  shopUrl={alloShopUrl}
                  onCheckAnother={() => {
                    setResult(null);
                    setError(null);
                  }}
                />
              ) : (
                <LookupResultCard result={result} notes={notes} />
              )}
            </div>
          </div>
        </section>
      )}

      <section className="border-b border-zinc-200 bg-gradient-to-b from-zinc-100 to-zinc-50 py-10 sm:py-16 lg:py-24">
        <div className="w-full px-4 sm:px-5 lg:px-6">
          <div className="w-full overflow-hidden rounded-none border border-white/80 bg-white shadow-[0_25px_60px_-15px_rgba(37,99,235,0.15)] ring-1 ring-blue-100/80">
            {/* Mobile: stack. md+: strict 50% / 50% (1fr 1fr). */}
            <div className="grid min-h-0 w-full grid-cols-1 divide-y divide-zinc-100/90 md:grid-cols-2 md:divide-x md:divide-y-0 md:divide-zinc-100">
              {/* Content + CTA — half width on md+ */}
              <div className="flex min-h-0 min-w-0 flex-col justify-center gap-4 px-5 py-8 text-center sm:px-8 sm:py-12 md:gap-5 md:px-8 md:py-10 lg:px-10 lg:py-12 xl:px-12 xl:py-14 md:text-left">
                <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-blue-600">
                  Allo Certified
                </p>
                <h2 className="text-balance text-xl font-bold leading-tight text-zinc-900 sm:text-3xl lg:text-[2rem] xl:text-4xl">
                  Instead of Worrying, Buy from Allo Certified Phones with Warranty
                </h2>
                <p className="text-pretty text-sm leading-relaxed text-zinc-600 sm:text-lg">
                  Get a device that has already passed verification—backed by warranty and the Allo network.
                </p>
                <div className="mt-2 flex justify-center md:mt-4 md:justify-start">
                  <a href="#" className={btnPrimary}>
                    Buy Phone from Allo
                  </a>
                </div>
              </div>

              {/* Visual — half width on md+; fills its column */}
              <div className="relative flex min-h-[240px] min-w-0 flex-col items-center justify-center bg-gradient-to-br from-cyan-50/95 via-white to-blue-50/70 px-5 py-8 sm:min-h-[320px] sm:px-8 sm:py-12 md:min-h-[360px] md:px-6 md:py-10 lg:min-h-0 lg:px-8 lg:py-12 xl:px-10">
                <div className="flex w-full max-w-[280px] flex-col items-center justify-center sm:max-w-[300px] md:max-w-none md:w-full">
                  <div className="mx-auto aspect-[9/19] w-full max-w-[220px] rounded-none border-[5px] border-blue-900 bg-zinc-900 shadow-2xl sm:max-w-[240px] md:max-w-[min(100%,260px)] md:min-h-[300px] lg:min-h-[320px]">
                    <div className="mx-auto mt-3 h-4 w-16 rounded-none bg-zinc-800 sm:mt-4 sm:h-5 sm:w-20" />
                    <div className="mx-auto mt-8 flex min-h-[120px] flex-1 items-center justify-center text-5xl sm:mt-10 sm:min-h-[140px] sm:text-6xl md:text-7xl">
                      📱
                    </div>
                  </div>
                  <p className="mt-6 text-center text-sm font-semibold text-blue-800 sm:mt-8 sm:text-base lg:text-lg">
                    Allo Certified
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="partners" className="scroll-mt-20 bg-blue-950 px-4 py-12 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="overflow-hidden rounded-none border border-cyan-500/20 bg-blue-900/50 shadow-2xl shadow-black/40">
            <div className="flex flex-col lg:min-h-[320px] lg:flex-row lg:items-stretch">
              <div className="relative min-h-[240px] w-full lg:min-h-[min(22rem,100%)] lg:w-[48%] lg:flex-shrink-0 lg:self-stretch">
                <PartnerBannerImage src={partnersBannerSrc} />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-blue-950/70 via-blue-950/25 to-transparent lg:bg-gradient-to-r lg:from-blue-950/85 lg:via-blue-950/35 lg:to-transparent" />
              </div>
              <div className="flex flex-1 flex-col justify-center px-5 py-8 sm:px-10 sm:py-12 lg:px-12 lg:py-14">
                <div className="mx-auto max-w-xl text-center lg:mx-0 lg:max-w-none lg:text-left">
                  <h2 className="text-xl font-bold text-white sm:text-3xl md:text-4xl">
                    Grow Your Business with Allo
                  </h2>
                  <p className="mt-3 text-base leading-relaxed text-cyan-100/90 sm:mt-4 sm:text-lg">
                    Check, get your device registered & certified—reach buyers who value trust.
                  </p>
                  <ul className="mt-8 flex flex-col gap-3 text-left text-cyan-50/95">
                    <li className="flex gap-3">
                      <span className="mt-0.5 shrink-0 text-cyan-400">✓</span>
                      <span>API and dashboard to register and update device status</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="mt-0.5 shrink-0 text-cyan-400">✓</span>
                      <span>Certified inventory and partner visibility</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="mt-0.5 shrink-0 text-cyan-400">✓</span>
                      <span>Dedicated flows for vendors and enterprise</span>
                    </li>
                  </ul>
                  <div className="mt-10 flex justify-center lg:justify-start">
                    <a href="mailto:partners@allo.example" className={btnPartnerCta}>
                      Become partner
                      <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-200 bg-white px-4 py-10 text-center text-xs text-zinc-500 sm:px-6">
        <p>AlloCheck — device verification.</p>
      </footer>
    </div>
  );
}
