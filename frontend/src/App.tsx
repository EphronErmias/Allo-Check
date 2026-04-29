import { useEffect, useRef, useState } from "react";

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
  "inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60";

/** Same horizontal and vertical size as the hero Check Now button (`btnPartnerCta` + py rhythm). */
const btnPrimaryLg =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 w-full justify-center sm:w-auto sm:shrink-0 sm:py-3.5";

const btnPartnerCta =
  "group inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-400 to-cyan-300 px-8 py-3.5 text-base font-semibold text-blue-950 shadow-lg shadow-cyan-500/20 transition hover:from-cyan-300 hover:to-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300";

/** Same size as hero Check Now: full-width on small screens, `py-3` / `sm:py-3.5` to match submit button. */
const btnPartnerCtaRow = `${btnPartnerCta} w-full justify-center py-3 sm:w-auto sm:shrink-0 sm:py-3.5`;

const loadingMessages = [
  "Searching...",
  "Searching all databases...",
  "Searching international databases...",
];

function parseShareTokenFromHash(): string | null {
  const raw = window.location.hash.replace(/^#\/?/, "").trim();
  if (!raw.toLowerCase().startsWith("share/")) return null;
  const token = raw.slice(6).split(/[/?#]/)[0]?.trim() ?? "";
  if (!/^[a-f0-9]{48}$/i.test(token)) return null;
  return token;
}

function buildPublicOrigin(): string {
  const env = import.meta.env.VITE_APP_ORIGIN?.trim();
  if (env) return env.replace(/\/$/, "");
  return window.location.origin;
}

function buildShareUrl(token: string): string {
  const origin = buildPublicOrigin();
  const path = window.location.pathname || "/";
  const search = window.location.search || "";
  return `${origin}${path}${search}#/share/${token}`;
}

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
  const common = "h-6 w-6 shrink-0";
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
  className = "",
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={`border-b border-zinc-200 py-3.5 sm:py-4 ${className}`}>
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
  className = "mt-10",
}: {
  result: LookupResult;
  className?: string;
}) {
  const tier = resolveStatusTier(result);
  const tierStyle = TIER_COPY[tier];
  const grad = tierHeaderGradient(tier);

  return (
    <div
      className={`${className} mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm`}
      role="region"
      aria-label="Verification result"
    >
      <div className={`relative bg-gradient-to-br ${grad} px-4 py-4 sm:px-5 sm:py-5`}>
        <div
          className={`pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_80%_at_100%_0%,rgba(255,255,255,0.22),transparent)] ${tier === "unknown" ? "opacity-90" : ""}`}
        />
        <div className="relative">
          <p
            className={`text-[0.6rem] font-semibold uppercase tracking-[0.18em] ${tier === "unknown" ? "text-amber-950/70" : "text-white/80"}`}
          >
            Status
          </p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start">
            <div className="flex min-w-0 gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-2 backdrop-blur-sm ${tierIconWrap(tier)}`}
              >
                <StatusGlyphByTier tier={tier} />
              </div>
              <div className="min-w-0">
                <h3 className={`text-xl font-bold tracking-tight sm:text-2xl ${tierTextPrimary(tier)}`}>
                  {tierStyle.title}
                </h3>
                {result.statusLabel && (
                  <p className={`mt-0.5 text-xs font-semibold sm:text-sm ${tierTextMuted(tier)}`}>
                    {result.statusLabel}
                  </p>
                )}
                <p className={`mt-1.5 max-w-none text-xs leading-snug sm:text-sm ${tierTextMuted(tier)}`}>
                  {tierStyle.blurb}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-200 bg-white px-5 py-2 sm:px-8 sm:py-3">
        <p className="pt-4 text-[0.65rem] font-semibold uppercase tracking-wider text-zinc-500">Device details</p>
        <div className="mt-1 grid sm:grid-cols-2 sm:gap-x-8">
          <ResultField label="Device name" value={result.deviceName} />
          <ResultField label="Brand" value={result.brand} />
          <ResultField label="IMEI" value={result.imei} mono className="sm:border-b-0" />
          <ResultField label="Serial number" value={result.serialNumber} mono className="border-b-0" />
        </div>
      </div>
    </div>
  );
}

/** Shown when lookup resolves to Not Registered / Unknown — replaces the form + standard result card. */
function UnknownNotRegisteredPanel({ shopUrl }: { shopUrl: string }) {
  return (
    <div className="mx-auto w-full max-w-3xl text-center sm:text-left">
      <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 via-orange-500 to-orange-700 text-white shadow-lg shadow-orange-500/40 ring-2 ring-white/30 sm:mx-0">
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <p className="bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-[0.65rem] font-semibold uppercase tracking-wider text-transparent">
        Not registered / unknown
      </p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">Proceed with caution</h2>
      <div className="relative mt-6 overflow-hidden rounded-2xl bg-gradient-to-br from-orange-400 via-orange-500 to-orange-700 px-5 py-5 text-left shadow-xl shadow-orange-600/30 sm:px-6 sm:py-6">
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
          className={`${btnPartnerCta} w-full max-w-md justify-center py-3 sm:w-auto sm:shrink-0 sm:py-3.5`}
        >
          Buy original phones from Allo
          <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
        </a>
      </div>
    </div>
  );
}

function ResultFooterActions({
  onShare,
  onCheckAnother,
  shareBusy,
  shareNotice,
  shareError,
}: {
  onShare: () => void;
  onCheckAnother: () => void;
  shareBusy: boolean;
  shareNotice: string | null;
  shareError: string | null;
}) {
  return (
    <div className="mt-8 border-t border-zinc-200 pt-6">
      {shareError ? (
        <p className="mb-3 text-center text-sm font-medium text-rose-700">{shareError}</p>
      ) : null}
      {shareNotice ? (
        <p className="mb-3 text-center text-sm font-medium text-emerald-700">{shareNotice}</p>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={onShare}
          disabled={shareBusy}
          className="inline-flex w-full items-center justify-center rounded-lg border-2 border-cyan-600 bg-white px-6 py-3 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {shareBusy ? "Creating link…" : "Share result"}
        </button>
        <button type="button" onClick={onCheckAnother} className={btnPartnerCtaRow}>
          Check another
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [heroIndex, setHeroIndex] = useState(0);
  const [serial, setSerial] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LookupResult | null>(null);
  const verifySectionRef = useRef<HTMLElement | null>(null);
  const serialInputRef = useRef<HTMLInputElement | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(() =>
    typeof window !== "undefined" ? parseShareTokenFromHash() : null,
  );
  const [shareLoadState, setShareLoadState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [shareLoadError, setShareLoadError] = useState<string | null>(null);
  const [sharedResult, setSharedResult] = useState<LookupResult | null>(null);
  const [sharedExpiresAt, setSharedExpiresAt] = useState<string | null>(null);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareNotice, setShareNotice] = useState<string | null>(null);
  const [shareLinkError, setShareLinkError] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => {
      setHeroIndex((i) => (i + 1) % heroImages.length);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!loading) return;
    setLoadingMessageIndex(0);
    const t = setInterval(() => {
      setLoadingMessageIndex((i) => (i + 1) % loadingMessages.length);
    }, 1200);
    return () => clearInterval(t);
  }, [loading]);

  useEffect(() => {
    if (!result) return;
    // Bring the result card into view as soon as lookup resolves.
    verifySectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [result]);

  useEffect(() => {
    const sync = () => {
      setShareToken(parseShareTokenFromHash());
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  useEffect(() => {
    if (!shareToken) {
      setSharedResult(null);
      setSharedExpiresAt(null);
      setShareLoadError(null);
      setShareLoadState("idle");
      return;
    }
    let cancelled = false;
    setShareLoadState("loading");
    setShareLoadError(null);
    setSharedResult(null);
    void (async () => {
      try {
        const res = await fetch(`${apiBase}/api/v1/shares/${encodeURIComponent(shareToken)}`, {
          cache: "no-store",
        });
        const text = await res.text();
        if (cancelled) return;
        if (!res.ok) {
          setShareLoadError(text || `Request failed (${res.status})`);
          setShareLoadState("error");
          return;
        }
        const data = JSON.parse(text) as { payload: LookupResult; expiresAt?: string };
        setSharedResult(data.payload);
        setSharedExpiresAt(data.expiresAt ?? null);
        setShareLoadState("done");
      } catch (e) {
        if (!cancelled) {
          setShareLoadError(e instanceof Error ? e.message : "Failed to load share");
          setShareLoadState("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [shareToken]);

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
  const resultTier = result ? resolveStatusTier(result) : null;
  const showUnknownNotRegisteredPanel = resultTier === "unknown";

  function goHomeFromShare() {
    if (window.location.hash) window.location.hash = "";
    setShareToken(null);
    setSharedResult(null);
    setSharedExpiresAt(null);
    setShareLoadError(null);
    setShareLoadState("idle");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function createAndCopyShareLink(payload: LookupResult) {
    setShareBusy(true);
    setShareNotice(null);
    setShareLinkError(null);
    try {
      const res = await fetch(`${apiBase}/api/v1/shares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || `Request failed (${res.status})`);
      const data = JSON.parse(text) as { token: string };
      const url = buildShareUrl(data.token);
      await navigator.clipboard.writeText(url);
      setShareNotice("Link copied to clipboard.");
      window.setTimeout(() => setShareNotice(null), 5000);
    } catch (e) {
      setShareLinkError(e instanceof Error ? e.message : "Could not create share link");
      window.setTimeout(() => setShareLinkError(null), 6000);
    } finally {
      setShareBusy(false);
    }
  }

  function handleCheckAnother() {
    setResult(null);
    setError(null);
    setShareNotice(null);
    setShareLinkError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.setTimeout(() => serialInputRef.current?.focus(), 500);
  }

  if (shareToken) {
    const sharedTier = sharedResult ? resolveStatusTier(sharedResult) : null;
    const sharedUnknown = Boolean(sharedResult && sharedTier === "unknown");

    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(59,130,246,0.12),transparent)] bg-zinc-50 text-zinc-900">
        <header className="border-b border-zinc-200/70 bg-white/90 shadow-sm backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-start gap-4 px-4 py-2.5 sm:px-6 sm:py-3">
            <a
              href="#/"
              onClick={(e) => {
                e.preventDefault();
                goHomeFromShare();
              }}
              className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <AlloLogo />
            </a>
          </div>
        </header>

        <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
          <p className="text-center text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-blue-600">
            Shared verification result
          </p>
          <p className="mt-2 text-center text-xs text-zinc-500">
            Read-only snapshot. Anyone with the link can view these details.
          </p>

          {shareLoadState === "loading" && (
            <div className="mt-12 flex flex-col items-center gap-4 text-zinc-600">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600" />
              <p className="text-sm font-medium">Loading shared result…</p>
            </div>
          )}

          {shareLoadState === "error" && shareLoadError && (
            <p className="mt-8 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm text-rose-800">
              {shareLoadError}
            </p>
          )}

          {shareLoadState === "done" && sharedResult && (
            <>
              {sharedExpiresAt && (
                <p className="mt-6 text-center text-xs text-zinc-500">
                  This link expires on {new Date(sharedExpiresAt).toLocaleString()}.
                </p>
              )}
              <div className="mt-6 w-full">
                {sharedUnknown ? (
                  <UnknownNotRegisteredPanel shopUrl={alloShopUrl} />
                ) : (
                  <LookupResultCard result={sharedResult} className="mt-0" />
                )}
              </div>
              <div className="mt-8 flex justify-center">
                <button type="button" onClick={goHomeFromShare} className={btnPrimary}>
                  Run your own check
                </button>
              </div>
            </>
          )}
        </main>

        <footer className="border-t border-zinc-200 bg-white px-4 py-10 text-center text-xs text-zinc-500 sm:px-6">
          <p>AlloCheck — device verification.</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(59,130,246,0.12),transparent)] bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200/70 bg-white/90 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-start gap-4 px-4 py-2.5 sm:px-6 sm:py-3">
          <a
            href="#/"
            onClick={(e) => {
              e.preventDefault();
              if (window.location.hash) window.location.hash = "";
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
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
                    <span className="sr-only">Enter phone IMEI or Serial Number</span>
                    <div className="relative">
                      <svg
                        className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-zinc-950 sm:h-6 sm:w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.25}
                        aria-hidden
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21 21l-4.35-4.35m1.35-5.15a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
                        />
                      </svg>
                      <input
                        ref={serialInputRef}
                        type="text"
                        name="serial"
                        autoComplete="off"
                        placeholder="Enter phone IMEI or Serial Number"
                        value={serial}
                        onChange={(e) => setSerial(e.target.value)}
                        className="w-full rounded-lg border border-cyan-200/60 bg-gradient-to-r from-cyan-200/55 via-cyan-100/45 to-blue-100/40 py-3 pr-4 pl-11 text-[0.95rem] text-blue-950 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)] outline-none backdrop-blur-sm transition placeholder:text-blue-950/75 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/35 sm:py-3.5 sm:pr-5 sm:pl-12 sm:text-base"
                      />
                    </div>
                  </label>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`${btnPartnerCta} w-full py-3 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:shrink-0 sm:py-3.5`}
                  >
                    {loading ? "Checking..." : "Check Now"}
                  </button>
                </form>
                <div className="mx-auto mt-2.5 flex w-full max-w-3xl snap-x snap-mandatory gap-1.5 overflow-x-auto rounded-lg border border-cyan-200/60 bg-gradient-to-r from-cyan-200/55 via-cyan-100/45 to-blue-100/40 p-1 text-blue-950 backdrop-blur-sm sm:mt-3 sm:grid sm:grid-cols-2 sm:gap-0 sm:overflow-visible sm:p-0">
                  <div className="flex min-w-[11rem] snap-start items-center justify-center gap-2 border border-white/20 px-3 py-2 text-center text-xs font-medium sm:min-w-0 sm:border-y-0 sm:border-l-0 sm:border-r sm:px-4 sm:py-2.5 sm:text-sm">
                    <span className="text-blue-950">✓</span>
                    <span>Real-time Verification</span>
                  </div>
                  <div className="flex min-w-[10rem] snap-start items-center justify-center gap-2 border border-white/20 px-3 py-2 text-center text-xs font-medium sm:min-w-0 sm:border-y-0 sm:border-l-0 sm:border-r-0 sm:px-4 sm:py-2.5 sm:text-sm">
                    <span className="text-blue-950">✓</span>
                    <span>Trusted Registry</span>
                  </div>
                </div>
                {error && (
                  <p className="mx-auto mt-3 w-full max-w-3xl rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm text-rose-800">
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
          ref={verifySectionRef}
          className="scroll-mt-20 border-b border-zinc-200 bg-gradient-to-b from-zinc-100 to-zinc-50 px-4 py-12 sm:px-6 sm:py-20"
        >
          <div className="mx-auto flex w-full max-w-3xl flex-col items-stretch px-4 sm:px-6">
            {showUnknownNotRegisteredPanel ? (
              <UnknownNotRegisteredPanel shopUrl={alloShopUrl} />
            ) : (
              <LookupResultCard result={result} className="mt-0" />
            )}
            <ResultFooterActions
              onShare={() => void createAndCopyShareLink(result)}
              onCheckAnother={handleCheckAnother}
              shareBusy={shareBusy}
              shareNotice={shareNotice}
              shareError={shareLinkError}
            />
          </div>
        </section>
      )}

      <section className="border-b border-zinc-200 bg-gradient-to-b from-zinc-100 to-zinc-50 py-10 sm:py-16 lg:py-24">
        <div className="w-full px-4 sm:px-5 lg:px-6">
          <div className="w-full overflow-hidden rounded-2xl border border-white/80 bg-white shadow-[0_25px_60px_-15px_rgba(37,99,235,0.15)] ring-1 ring-blue-100/80">
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
                  <a href="#" className={btnPrimaryLg}>
                    Buy Phone from Allo
                  </a>
                </div>
              </div>

              {/* Visual — half width on md+; fills its column */}
              <div className="relative flex min-h-[240px] min-w-0 flex-col items-center justify-center bg-gradient-to-br from-cyan-50/95 via-white to-blue-50/70 px-5 py-8 sm:min-h-[320px] sm:px-8 sm:py-12 md:min-h-[360px] md:px-6 md:py-10 lg:min-h-0 lg:px-8 lg:py-12 xl:px-10">
                <div className="flex w-full max-w-[280px] flex-col items-center justify-center sm:max-w-[300px] md:max-w-none md:w-full">
                  <div className="mx-auto aspect-[9/19] w-full max-w-[220px] rounded-[2rem] border-[5px] border-blue-900 bg-zinc-900 shadow-2xl sm:max-w-[240px] md:max-w-[min(100%,260px)] md:min-h-[300px] lg:min-h-[320px]">
                    <div className="mx-auto mt-3 h-4 w-16 rounded-full bg-zinc-800 sm:mt-4 sm:h-5 sm:w-20" />
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
          <div className="overflow-hidden rounded-2xl border border-cyan-500/20 bg-blue-900/50 shadow-2xl shadow-black/40">
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

      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-blue-950/80 px-4 backdrop-blur-md">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-cyan-200/35 bg-gradient-to-br from-blue-950/90 via-blue-900/85 to-teal-950/90 p-10 text-center text-white shadow-2xl ring-1 ring-cyan-400/20">
            <div className="relative mx-auto mb-8 flex h-36 w-36 items-center justify-center sm:h-40 sm:w-40">
              {/* Ambient glow */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400/35 via-blue-500/25 to-blue-600/30 blur-2xl" />
              {/* Outer static ring */}
              <div className="absolute inset-2 rounded-full border-[3px] border-white/10" />
              {/* Primary spinning arc */}
              <div
                className="absolute inset-2 rounded-full border-[3px] border-transparent border-t-cyan-300 border-r-sky-400 animate-spin"
                style={{ animationDuration: "1.1s" }}
              />
              {/* Counter-rotating inner arc */}
              <div className="absolute inset-5 scale-x-[-1]">
                <div
                  className="h-full w-full rounded-full border-[2px] border-transparent border-b-cyan-200/90 border-l-blue-300/80 animate-spin"
                  style={{ animationDuration: "0.85s" }}
                />
              </div>
              {/* Center hub */}
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-white/20 to-white/5 shadow-inner ring-1 ring-white/25 backdrop-blur-sm">
                <svg
                  className="relative z-10 h-8 w-8 text-cyan-100"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-4.35-4.35m1.35-5.15a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-[0.7rem] uppercase tracking-[0.2em] text-cyan-200/90">AlloCheck Lookup</p>
            <h3 className="mt-2 min-h-[2.5rem] text-2xl font-bold transition-all duration-300 sm:min-h-[3rem] sm:text-3xl">
              {loadingMessages[loadingMessageIndex]}
            </h3>
            <p className="mt-3 text-sm text-blue-100/90 sm:text-base">
              Please wait while we verify the device across available records.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
