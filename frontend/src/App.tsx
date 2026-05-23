import { useEffect, useId, useRef, useState, type ReactNode } from "react";

type DisplayLevel = "SAFE" | "WARNING" | "BLOCKED";

type LookupResult = {
  found: boolean;
  displayLevel?: DisplayLevel;
  status?: string;
  deviceId?: string | null;
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

const defaultPartnersBannerSrc =
  "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=2400&h=1200&fit=crop&q=85";

const partnersBannerSrc =
  import.meta.env.VITE_PARTNERS_BANNER_URL?.trim() || defaultPartnersBannerSrc;

/** Matches partners banner / business image panel gradient (`partners-banner.svg`). */
const alloBusinessImageGradient =
  "bg-gradient-to-br from-[#1e3a8a] via-[#0e7490] to-[#164e63]";

const alloShopUrl =
  import.meta.env.VITE_ALLO_SHOP_URL?.trim() || "https://allo.et";

const heroImages = [
  {
    src: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=2400&h=1200&fit=crop&q=85",
    alt: "Smartphones on display",
  },
  {
    src: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=2400&h=1200&fit=crop&q=85",
    alt: "Person checking a smartphone",
  },
] as const;

const alloCertifiedImage = {
  src: "https://images.unsplash.com/photo-1556656793-08538906a9f8?w=2400&h=1200&fit=crop&q=85",
  alt: "Certified smartphones with warranty",
} as const;

const EXPLAINER_CARD_IMAGES = {
  clean: {
    src: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=640&fit=crop&q=80",
    alt: "Clean device ready to buy",
  },
  stolen: {
    src: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&h=640&fit=crop&q=80",
    alt: "Device flagged as stolen or blacklisted",
  },
  finance: {
    src: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=640&fit=crop&q=80",
    alt: "Device that may still be financed",
  },
  unknown: {
    src: "https://images.unsplash.com/photo-1633265486064-086b219458ec?w=800&h=640&fit=crop&q=80",
    alt: "Unverified device not in registry",
  },
};

const EXPLAINER_DO_NOT_BUY_IMAGE = {
  src: "https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=800&h=640&fit=crop&q=80",
  alt: "Unregistered device — do not buy",
} as const;

const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60";

const btnPartnerCta =
  "group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-cyan-300 px-8 py-3.5 text-base font-semibold text-blue-950 shadow-lg shadow-cyan-500/20 transition hover:from-cyan-300 hover:to-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300";

/** Same size as hero Check Now: full-width on small screens, `py-3` / `sm:py-3.5` to match submit button. */
const btnPartnerCtaRow = `${btnPartnerCta} w-full justify-center py-3 sm:w-auto sm:shrink-0 sm:py-3.5`;

/** Allo Certified shop CTA: 50% stat slab fill, 24% stat slab label color. */
const btnAlloCertifiedShop =
  "group inline-flex items-center justify-center gap-2 rounded-full bg-blue-950 px-8 py-3.5 text-base font-bold lowercase tracking-tight text-cyan-300 shadow-lg shadow-blue-950/25 transition hover:bg-blue-900 hover:text-cyan-200";
const btnAlloCertifiedShopRow = `${btnAlloCertifiedShop} w-full justify-center py-3 sm:w-auto sm:shrink-0 sm:py-3.5`;
const btnNavCheck = `${btnPartnerCta} shrink-0 px-4 py-2 text-sm sm:px-5 sm:py-2.5`;

const btnShareOutline =
  "inline-flex w-full items-center justify-center rounded-full border-2 border-cyan-600 bg-white px-6 py-3 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:shrink-0 sm:py-3.5";

const heroFieldShell =
  "border border-cyan-200/60 bg-gradient-to-r from-cyan-200/55 via-cyan-100/45 to-blue-100/40 text-blue-950 backdrop-blur-sm";

const loadingMessages = [
  "Searching...",
  "Searching all databases...",
  "Searching international databases...",
];

function LookupLoadingPanel({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center px-2 py-6 text-center sm:py-8" role="status" aria-live="polite">
      <div className="relative flex h-14 w-14 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-md" aria-hidden />
        <div
          className="relative h-12 w-12 rounded-full border-[3px] border-cyan-100 border-t-cyan-500 border-r-blue-500 animate-spin"
          style={{ animationDuration: "0.9s" }}
          aria-hidden
        />
        <svg
          className="absolute h-5 w-5 text-blue-950"
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
      </div>
      <p className="mt-4 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-blue-950/55">
        AlloCheck lookup
      </p>
      <p className="mt-1 min-h-[1.75rem] text-base font-bold text-blue-950 transition-all duration-300 sm:text-lg">
        {message}
      </p>
      <p className="mt-1.5 text-xs text-zinc-500">Verifying across available records…</p>
    </div>
  );
}

/** Shared lookup loading: brand gradient header + logo (modal & hero). */
function CheckLookupLoadingCard({
  message,
  className = "",
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-cyan-200/70 bg-white shadow-2xl shadow-cyan-500/15 ${className}`.trim()}
    >
      <div className="relative bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 px-5 py-4 sm:px-6 sm:py-5">
        <AlloLogo onBrand />
        <p className="mt-1 text-sm font-medium text-white/90">Verify a device before you buy</p>
      </div>
      <LookupLoadingPanel message={message} />
    </div>
  );
}

const RESULT_STORAGE_KEY = "allocheck:lastResult";

type AppRoute =
  | { kind: "home" }
  | { kind: "result" }
  | { kind: "share"; token: string }
  | { kind: "privacy" }
  | { kind: "terms" }
  | { kind: "contact" }
  | { kind: "api-docs" };

const legalRoutes = ["privacy", "terms", "contact", "api-docs"] as const;
type LegalRouteKind = (typeof legalRoutes)[number];

function isLegalRouteKind(value: string): value is LegalRouteKind {
  return (legalRoutes as readonly string[]).includes(value);
}

function readStoredResult(): LookupResult | null {
  try {
    const raw = sessionStorage.getItem(RESULT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LookupResult;
  } catch {
    return null;
  }
}

function storeResult(payload: LookupResult) {
  sessionStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(payload));
}

function clearStoredResult() {
  sessionStorage.removeItem(RESULT_STORAGE_KEY);
}

function parseAppRouteFromHash(): AppRoute {
  const raw = window.location.hash.replace(/^#\/?/, "").trim();
  if (!raw) return { kind: "home" };
  const lower = raw.toLowerCase();
  if (lower === "result") return { kind: "result" };
  if (isLegalRouteKind(lower)) return { kind: lower };
  if (lower.startsWith("share/")) {
    const token = raw.slice(6).split(/[/?#]/)[0]?.trim() ?? "";
    if (/^[a-f0-9]{48}$/i.test(token)) return { kind: "share", token };
  }
  return { kind: "home" };
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

const splitSectionImageCardClass =
  "relative order-1 min-h-[22rem] overflow-hidden rounded-2xl shadow-lg shadow-blue-950/5 sm:min-h-[24rem] md:min-h-[360px] lg:min-h-[420px]";

function PartnerBannerImage({ src }: { src: string }) {
  return (
    <img
      src={src}
      alt="Allo business partners"
      className="absolute inset-0 z-0 h-full w-full object-cover"
      loading="lazy"
    />
  );
}

function BusinessGrowthChartOverlay() {
  const gradId = useId().replace(/:/g, "");
  const areaGradId = `${gradId}-area`;
  const lineGradId = `${gradId}-line`;

  return (
    <div
      className="pointer-events-none absolute bottom-4 right-4 z-10 w-[min(100%,18rem)] origin-bottom-right scale-50 sm:bottom-6 sm:right-5"
      aria-hidden
    >
      <div className="overflow-hidden rounded-xl border border-white/70 bg-white/90 p-3 shadow-[0_16px_40px_-12px_rgba(23,37,84,0.35)] ring-1 ring-cyan-500/10 backdrop-blur-md sm:p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-blue-950/45">
              Certified sales
            </p>
            <p className="mt-0.5 text-xl font-bold tabular-nums tracking-tight text-blue-950 sm:text-[1.35rem]">
              +24%
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-gradient-to-r from-cyan-50 to-emerald-50 px-2 py-0.5 text-[0.62rem] font-semibold text-emerald-700 ring-1 ring-emerald-200/80">
            ↑ MoM
          </span>
        </div>

        <svg
          viewBox="0 0 220 72"
          className="mt-2.5 h-[4.25rem] w-full sm:h-[4.5rem]"
          role="img"
          aria-label="Upward sales trend chart"
        >
          <defs>
            <linearGradient id={areaGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id={lineGradId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
          </defs>
          <line x1="0" y1="58" x2="220" y2="58" stroke="#e2e8f0" strokeWidth="1" />
          <line x1="0" y1="38" x2="220" y2="38" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="0" y1="18" x2="220" y2="18" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
          <path
            d="M0 52 L28 48 L56 44 L84 36 L112 30 L140 22 L168 14 L196 8 L220 4 L220 58 L0 58 Z"
            fill={`url(#${areaGradId})`}
          />
          <path
            d="M0 52 L28 48 L56 44 L84 36 L112 30 L140 22 L168 14 L196 8 L220 4"
            fill="none"
            stroke={`url(#${lineGradId})`}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="220" cy="4" r="3.5" fill="#22d3ee" stroke="#fff" strokeWidth="2" />
        </svg>

        <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-100/90 pt-2 text-[0.58rem] font-medium text-slate-500">
          <span>Jan</span>
          <span>Mar</span>
          <span>May</span>
          <span>Jul</span>
        </div>
      </div>
    </div>
  );
}

function SplitSectionImageCard({
  children,
  className = "",
  mdOrder = "md:order-2",
}: {
  children: ReactNode;
  className?: string;
  mdOrder?: string;
}) {
  return (
    <div className={`${splitSectionImageCardClass} ${mdOrder} ${className}`.trim()}>
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-blue-950/25 via-blue-950/5 to-transparent" />
      {children}
    </div>
  );
}

function AlloLogo({
  className = "",
  compact = false,
  onBrand = false,
}: {
  className?: string;
  compact?: boolean;
  /** Light text for cyan/blue brand backgrounds (e.g. check modal header). */
  onBrand?: boolean;
}) {
  const gradId = useId().replace(/:/g, "");
  const iconSize = compact ? 28 : 36;
  return (
    <div className={`flex items-center gap-1.5 sm:gap-2 ${className}`}>
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 40 40"
        fill="none"
        className="shrink-0"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="20" x2="40" y2="20" gradientUnits="userSpaceOnUse">
            <stop stopColor="#22d3ee" />
            <stop stopColor="#67e8f9" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="10" fill={`url(#${gradId})`} />
        <path
          d="M12 26V14h4.2l3.8 7.2L23.8 14H28v12h-3.2v-7.2l-3.4 7.2h-2.8l-3.4-7.2V26H12z"
          className="fill-blue-950"
        />
      </svg>
      <span
        className={`font-bold tracking-tight ${compact ? "text-base" : "text-xl"} ${
          onBrand ? "text-white" : "text-zinc-900"
        }`}
      >
        Allo
        <span
          className={
            onBrand
              ? "text-cyan-100"
              : "bg-gradient-to-r from-cyan-400 to-cyan-300 bg-clip-text text-transparent"
          }
        >
          Check
        </span>
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

function tierTagText(tier: StatusTier): string {
  return tier === "unknown" ? "text-amber-950" : "text-white";
}

const EXPLAINER_CARD_SHELL = "bg-white border border-zinc-200/70 shadow-sm";
const EXPLAINER_CARD_BODY = "text-zinc-900";
const EXPLAINER_CARD_MUTED = "text-zinc-500";

const EXPLAINER_CARD_THEME: Record<
  StatusTier,
  {
    image: { src: string; alt: string };
    body: string;
    muted: string;
  }
> = {
  clean: {
    image: EXPLAINER_CARD_IMAGES.clean,
    body: EXPLAINER_CARD_BODY,
    muted: EXPLAINER_CARD_MUTED,
  },
  stolen: {
    image: EXPLAINER_CARD_IMAGES.stolen,
    body: EXPLAINER_CARD_BODY,
    muted: EXPLAINER_CARD_MUTED,
  },
  finance: {
    image: EXPLAINER_CARD_IMAGES.finance,
    body: EXPLAINER_CARD_BODY,
    muted: EXPLAINER_CARD_MUTED,
  },
  unknown: {
    image: EXPLAINER_CARD_IMAGES.unknown,
    body: EXPLAINER_CARD_BODY,
    muted: EXPLAINER_CARD_MUTED,
  },
};

type ExplainerCardTheme = (typeof EXPLAINER_CARD_THEME)[StatusTier];

const EXPLAINER_DO_NOT_BUY_THEME: ExplainerCardTheme = {
  image: EXPLAINER_DO_NOT_BUY_IMAGE,
  body: EXPLAINER_CARD_BODY,
  muted: EXPLAINER_CARD_MUTED,
};

const EXPLAINER_DO_NOT_BUY_ICON_GRAD = "from-violet-500 via-purple-600 to-violet-950";

function ExplainerCardVisual({
  image,
  mobileEdge = "default",
}: {
  image: { src: string; alt: string };
  mobileEdge?: "default" | "flush-bottom" | "flush-top";
}) {
  const radiusClass =
    mobileEdge === "flush-bottom"
      ? "rounded-t-2xl rounded-b-none"
      : mobileEdge === "flush-top"
        ? "rounded-b-2xl rounded-t-none"
        : "rounded-t-2xl rounded-b-xl";

  return (
    <div className={`relative h-full w-full overflow-hidden bg-zinc-200/90 ${radiusClass}`}>
      <img src={image.src} alt={image.alt} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
    </div>
  );
}

function StatusExplainerCard({
  tier,
  title,
  description,
  cardLayout = "content-first",
  theme: themeOverride,
  iconGrad,
  iconTextClass,
}: {
  tier: StatusTier;
  title: string;
  description: string;
  cardLayout?: "content-first" | "visual-first";
  theme?: ExplainerCardTheme;
  iconGrad?: string;
  iconTextClass?: string;
}) {
  const grad = iconGrad ?? tierHeaderGradient(tier);
  const theme = themeOverride ?? EXPLAINER_CARD_THEME[tier];
  const visualFirst = cardLayout === "visual-first";

  const contentBlock = (
    <div
      className={`relative z-10 flex min-h-0 shrink-0 flex-col px-4 sm:px-5 lg:px-3.5 lg:py-0 ${
        visualFirst
          ? "h-[35%] justify-end pb-4 pt-2 sm:pb-5 sm:pt-3 lg:h-auto lg:flex-[2] lg:justify-end lg:pb-3.5 lg:pt-2"
          : "h-[35%] justify-start pb-2 pt-4 sm:pt-5 lg:h-auto lg:flex-[2] lg:justify-start lg:pb-2 lg:pt-3.5"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3
          className={`min-w-0 flex-1 line-clamp-2 text-xl font-semibold leading-tight tracking-tight sm:text-2xl lg:text-base lg:leading-snug xl:text-lg ${theme.body}`}
        >
          {title}
        </h3>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm ring-1 ring-black/5 sm:h-11 sm:w-11 lg:h-9 lg:w-9 ${grad} ${iconTextClass ?? tierTagText(tier)}`}
          aria-hidden
        >
          <StatusGlyphByTier tier={tier} className="h-5 w-5 sm:h-5 sm:w-5 lg:h-4 lg:w-4" />
        </div>
      </div>
      <p className={`mt-2 line-clamp-3 text-xs leading-relaxed sm:text-sm lg:mt-1.5 lg:line-clamp-4 lg:text-[0.7rem] lg:leading-snug xl:text-xs ${theme.muted}`}>
        {description}
      </p>
    </div>
  );

  const visualBlock = (
    <div
      className={`relative z-0 min-h-0 shrink-0 px-3 sm:px-4 lg:px-2.5 lg:py-0 ${
        visualFirst
          ? "h-[65%] pt-0 lg:h-auto lg:flex-[3]"
          : "h-[65%] pb-0 lg:h-auto lg:flex-[3]"
      }`}
    >
      <ExplainerCardVisual
        image={theme.image}
        mobileEdge={visualFirst ? "flush-top" : "flush-bottom"}
      />
    </div>
  );

  return (
    <article
      className={`relative flex h-[24rem] w-full flex-col overflow-hidden rounded-3xl sm:h-[29rem] lg:aspect-[3/4] lg:h-auto lg:max-h-[20rem] lg:rounded-2xl xl:max-h-[22rem] ${EXPLAINER_CARD_SHELL}`}
    >
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        {visualFirst ? (
          <>
            {visualBlock}
            {contentBlock}
          </>
        ) : (
          <>
            {contentBlock}
            {visualBlock}
          </>
        )}
      </div>
    </article>
  );
}

function StatusGlyphByTier({ tier, className }: { tier: StatusTier; className?: string }) {
  const common = className ?? "h-7 w-7 shrink-0 sm:h-8 sm:w-8 lg:h-6 lg:w-6";
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

function formatImeiDisplay(imei?: string | null): string {
  const digits = (imei ?? "").replace(/\D/g, "");
  if (digits.length === 15) {
    return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6, 10)} ${digits.slice(10, 14)} ${digits.slice(14)}`;
  }
  const trimmed = (imei ?? "").trim();
  return trimmed && trimmed !== "—" ? trimmed : "—";
}

function displayField(value?: string | null): string {
  const trimmed = (value ?? "").trim();
  return trimmed && trimmed !== "—" ? trimmed : "—";
}

function detailTheftReports(tier: StatusTier): string {
  switch (tier) {
    case "stolen":
      return "Report found — do not purchase";
    case "clean":
      return "None found";
    case "finance":
      return "None found";
    case "unknown":
      return "No registry match";
    default:
      return "—";
  }
}

function detailLockStatus(tier: StatusTier, status?: string): string {
  const s = (status ?? "").toUpperCase();
  if (s === "LOCKED_NON_PAYMENT") return "Locked — non-payment or carrier hold";
  if (tier === "finance") return "Locked — payment or carrier restrictions";
  if (tier === "stolen") return "May be blocklisted";
  if (tier === "clean") return "Unlocked — no restrictions";
  if (tier === "unknown") return "Unknown";
  return "—";
}

function DeviceDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-zinc-200 px-4 py-3.5 last:border-b-0 sm:px-5 sm:py-4">
      <span className="shrink-0 text-sm text-zinc-500">{label}</span>
      <span className="min-w-0 text-right text-sm font-medium text-zinc-900">{value}</span>
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
          <div className="mt-2 flex min-w-0 gap-3">
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

      <div className="bg-white">
        <div className="flex items-center gap-2 border-b border-zinc-200 px-4 py-3.5 sm:px-5 sm:py-4">
          <svg className="h-4 w-4 shrink-0 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
          </svg>
          <span className="text-sm font-semibold text-zinc-900">Device details</span>
        </div>
        <div>
          <DeviceDetailRow label="IMEI checked" value={formatImeiDisplay(result.imei)} />
          <DeviceDetailRow label="Device name" value={displayField(result.deviceName)} />
          <DeviceDetailRow label="Brand" value={displayField(result.brand)} />
          <DeviceDetailRow label="Serial number" value={displayField(result.serialNumber)} />
          <DeviceDetailRow label="Theft reports" value={detailTheftReports(tier)} />
          <DeviceDetailRow label="Databases checked" value="Ethiopian registry · Trustonic global" />
          <DeviceDetailRow label="Lock status" value={detailLockStatus(tier, result.status)} />
        </div>
      </div>
    </div>
  );
}

/** Three columns: stepped heights, light cyan palette. */
const HERO_STAT_SLABS = [
  {
    value: "50",
    caption: "registered devices",
    slabHeight: "h-[9.5rem] sm:h-[11.5rem]",
    valueSize: "text-[clamp(2.25rem,7vw,3.25rem)]",
    bg: "bg-gradient-to-b from-white to-cyan-50",
    text: "text-blue-950",
    muted: "text-blue-950/60",
  },
  {
    value: "24",
    caption: "stolen reported",
    slabHeight: "h-[14rem] sm:h-[17rem]",
    valueSize: "text-[clamp(2.5rem,8vw,3.75rem)]",
    bg: "bg-gradient-to-b from-cyan-50 to-cyan-100",
    text: "text-blue-950",
    muted: "text-blue-950/65",
  },
  {
    value: "26",
    caption: "buyer checks",
    slabHeight: "h-[19rem] sm:h-[23rem]",
    valueSize: "text-[clamp(2.75rem,9vw,4.25rem)]",
    bg: "bg-gradient-to-b from-cyan-100 to-cyan-200",
    text: "text-blue-950",
    muted: "text-blue-950/65",
  },
] as const;

function statSlabOuterRound(index: number): string {
  if (index === 0) return "rounded-tl-2xl rounded-bl-2xl sm:rounded-tl-3xl sm:rounded-bl-3xl";
  if (index === 1) return "";
  return "rounded-tr-2xl rounded-br-2xl sm:rounded-tr-3xl sm:rounded-br-3xl";
}

function HeroStatsBar() {
  return (
    <section
      className="bg-gradient-to-b from-zinc-50 to-white px-4 pt-8 pb-6 sm:px-6 sm:pt-10 sm:pb-8"
      aria-label="Platform statistics"
    >
      <div className="mx-auto max-w-5xl">
        <p className="mb-4 text-center text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-cyan-700/80">
          AlloCheck registry
        </p>
        <div className="grid grid-cols-3 gap-0 overflow-hidden rounded-2xl shadow-sm shadow-cyan-950/5 sm:rounded-3xl" role="list">
          {HERO_STAT_SLABS.map((stat, index) => (
            <article key={stat.caption} role="listitem" className="flex min-w-0 flex-col">
              <div
                className={`relative flex w-full flex-col overflow-hidden ${stat.slabHeight} ${stat.bg} ${statSlabOuterRound(index)}`}
              >
                <div className={`flex flex-1 flex-col px-3 pt-5 sm:px-5 sm:pt-7 ${stat.text}`}>
                  <div className="flex items-start justify-center">
                    <span
                      className={`${stat.valueSize} font-bold lowercase leading-none tracking-tight`}
                    >
                      {stat.value}
                    </span>
                    <span className={`ml-1 mt-1 text-sm font-light lowercase sm:text-base ${stat.muted}`}>
                      %
                    </span>
                  </div>
                </div>

                <div
                  className={`px-3 pb-4 pt-2 text-center text-[0.65rem] font-medium lowercase leading-tight sm:px-5 sm:pb-5 sm:text-xs ${stat.muted}`}
                >
                  {stat.caption}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function VerifiedFromAlloCta({ shopUrl }: { shopUrl: string }) {
  return (
    <div className="rounded-xl border border-cyan-200/70 bg-gradient-to-br from-cyan-50 via-white to-blue-50 px-4 py-4 shadow-sm sm:px-5 sm:py-5">
      <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-blue-600">Allo Certified</p>
      <h3 className="mt-1 text-base font-bold text-zinc-900 sm:text-lg">Buy verified from Allo</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">
        Every certified phone includes a built-in AlloCheck result—clean, verified, and warranty-backed.
      </p>
      <a href={shopUrl} target="_blank" rel="noopener noreferrer" className={`${btnPartnerCtaRow} mt-4`}>
        Buy certified phones
      </a>
    </div>
  );
}

function ResultPageActions({
  onCheckAnother,
  onShareResult,
  onCopyLink,
  shareBusy,
  shareNotice,
  shareError,
  shareUrl,
}: {
  onCheckAnother: () => void;
  onShareResult: () => void;
  onCopyLink: () => void;
  shareBusy: boolean;
  shareNotice: string | null;
  shareError: string | null;
  shareUrl: string | null;
}) {
  return (
    <div className="mt-8 border-t border-zinc-200 pt-6">
      {shareError ? (
        <p className="mb-3 text-center text-sm font-medium text-rose-700">{shareError}</p>
      ) : null}
      {shareNotice ? (
        <p className="mb-3 text-center text-sm font-medium text-emerald-700">{shareNotice}</p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
        <button type="button" onClick={onCheckAnother} className={btnPartnerCtaRow}>
          Check another phone
        </button>
        <button type="button" onClick={onShareResult} disabled={shareBusy} className={btnShareOutline}>
          {shareBusy ? "Creating link…" : "Share result"}
        </button>
      </div>

      {shareUrl ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <div className="min-w-0 flex-1 rounded-lg border border-cyan-200/60 bg-gradient-to-r from-cyan-200/55 via-cyan-100/45 to-blue-100/40 px-3 py-2.5 text-sm text-blue-950 backdrop-blur-sm">
            <span className="block truncate font-medium">{shareUrl}</span>
          </div>
          <button type="button" onClick={onCopyLink} className={btnPartnerCtaRow}>
            Copy link
          </button>
        </div>
      ) : null}
    </div>
  );
}

function CheckTrustBadges({ className = "" }: { className?: string }) {
  return (
    <div
      className={`mx-auto flex w-full max-w-3xl flex-col items-stretch gap-2 sm:flex-row sm:justify-center sm:gap-8 ${className}`}
    >
      <div className="flex items-center justify-center gap-2 text-xs font-medium text-white sm:text-sm">
        <span className="text-cyan-300" aria-hidden>
          ✓
        </span>
        <span>Real-time Verification</span>
      </div>
      <div className="flex items-center justify-center gap-2 text-xs font-medium text-white sm:text-sm">
        <span className="text-cyan-300" aria-hidden>
          ✓
        </span>
        <span>Trusted Registry</span>
      </div>
    </div>
  );
}

function CheckPhoneModal({
  open,
  onClose,
  serial,
  onSerialChange,
  onSubmit,
  loading,
  loadingMessage,
  error,
  inputRef,
}: {
  open: boolean;
  onClose: () => void;
  serial: string;
  onSerialChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  loadingMessage: string;
  error: string | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="check-phone-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-zinc-950/55 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
        disabled={loading}
      />
      <div className="relative w-full max-w-md">
        {loading ? (
          <CheckLookupLoadingCard message={loadingMessage} className="w-full" />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-cyan-200/70 bg-white shadow-2xl shadow-cyan-500/15">
            <div className="relative bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 px-5 py-4 pr-14 sm:px-6 sm:py-5 sm:pr-16">
              <div id="check-phone-modal-title">
                <AlloLogo onBrand />
              </div>
              <p className="mt-1 text-sm font-medium text-white/90">Verify a device before you buy</p>
              <button
                type="button"
                onClick={onClose}
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-4 sm:top-4"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.25} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          <form onSubmit={onSubmit} className="space-y-3 p-5 sm:p-6">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-blue-950/70">
                IMEI or Serial Number
              </span>
              <div className="relative">
                <svg
                  className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-zinc-950"
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
                  ref={inputRef}
                  type="text"
                  name="serial"
                  autoComplete="off"
                  placeholder="Enter phone IMEI or Serial Number"
                  value={serial}
                  onChange={(e) => onSerialChange(e.target.value)}
                  className={`w-full rounded-full py-3 pr-4 pl-11 text-[0.95rem] shadow-sm outline-none transition placeholder:text-blue-950/75 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/35 sm:py-3.5 sm:text-base ${heroFieldShell}`}
                />
              </div>
            </label>

            <button
              type="submit"
              className={`${btnPartnerCta} group w-full justify-center py-3 sm:py-3.5`}
            >
              Check Now
              <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
            </button>

            {error ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm text-rose-800">
                {error}
              </p>
            ) : null}
          </form>
          </div>
        )}
      </div>
    </div>
  );
}

function AppHeader({
  onLogoClick,
  onCheckPhone,
}: {
  onLogoClick: () => void;
  onCheckPhone: () => void;
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/70 bg-white/90 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 sm:px-6 sm:py-2.5">
        <a
          href="#/"
          onClick={(e) => {
            e.preventDefault();
            onLogoClick();
          }}
          className="min-w-0 shrink-0 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          <AlloLogo />
        </a>
        <button type="button" onClick={onCheckPhone} className={btnNavCheck}>
          Check Phone
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5 sm:h-[1.125rem] sm:w-[1.125rem]" />
        </button>
      </div>
    </header>
  );
}

const footerLinkClass =
  "text-sm font-medium text-cyan-100/85 transition hover:text-cyan-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400";

function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className={`relative overflow-hidden ${alloBusinessImageGradient} text-white`}>
      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-md text-center md:text-left">
            <AlloLogo onBrand />
            <p className="mt-4 text-sm leading-relaxed text-cyan-100/80">
              Verify devices before you buy. Real-time checks against trusted registries—built for buyers and
              partners across Ethiopia.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-cyan-100/60">
              AlloCheck is a subsidiary of{" "}
              <a
                href={alloShopUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-cyan-300 underline-offset-2 transition hover:text-white hover:underline"
              >
                Allo
              </a>
            </p>
          </div>

          <nav className="flex flex-col items-center md:items-end" aria-label="Footer legal and support">
            <p className="mb-2 hidden text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-cyan-300/90 md:block">
              Legal & support
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 md:flex-col md:items-end md:gap-1">
              <a href="#/privacy" className={footerLinkClass}>
                Privacy
              </a>
              <a href="#/terms" className={footerLinkClass}>
                Terms
              </a>
              <a href="#/contact" className={footerLinkClass}>
                Contact
              </a>
              <a href="#/api-docs" className={footerLinkClass}>
                API docs
                <span className="text-cyan-100/50"> (soon)</span>
              </a>
            </div>
          </nav>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-white/10 pt-6 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-cyan-100/55">© {year} AlloCheck. All rights reserved.</p>
          <p className="text-xs text-cyan-100/45">Device verification you can trust</p>
        </div>
      </div>
    </footer>
  );
}

function LegalPageLayout({
  title,
  children,
  onHome,
}: {
  title: string;
  children: ReactNode;
  onHome: () => void;
}) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">{title}</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-zinc-600">{children}</div>
      <button type="button" onClick={onHome} className={`${btnPartnerCtaRow} mt-10`}>
        Back to home
      </button>
    </main>
  );
}

function LegalPageContent({ route, onHome }: { route: LegalRouteKind; onHome: () => void }) {
  switch (route) {
    case "privacy":
      return (
        <LegalPageLayout title="Privacy Policy" onHome={onHome}>
          <p>
            AlloCheck processes device identifiers (such as IMEI or serial numbers) and related lookup
            results to provide verification services. We use this information only to run checks, display
            results to you, and support features such as share links when you choose to create them.
          </p>
          <p>
            We may retain technical logs (for example IP address, request time, and error details) for
            security and service reliability. Shared result links expire after a limited period configured
            on our servers.
          </p>
          <p>
            For privacy questions, contact us using the details on our Contact page. This policy may be
            updated from time to time; continued use of AlloCheck after changes constitutes acceptance.
          </p>
        </LegalPageLayout>
      );
    case "terms":
      return (
        <LegalPageLayout title="Terms of Use" onHome={onHome}>
          <p>
            By using AlloCheck you agree to use the service lawfully and only for legitimate device
            verification purposes. Results are provided for informational purposes and do not constitute
            legal advice, a guarantee of ownership, or a warranty that a device will remain clear in all
            registries.
          </p>
          <p>
            You must not abuse the API or website (including automated scraping beyond fair use, attempts
            to circumvent rate limits, or misuse of share links). We may suspend access if we detect abuse.
          </p>
          <p>
            AlloCheck is operated as a subsidiary of Allo. These terms may be updated; the current version
            applies when you use the service.
          </p>
        </LegalPageLayout>
      );
    case "contact":
      return (
        <LegalPageLayout title="Contact" onHome={onHome}>
          <p>For general inquiries about AlloCheck, reach our team at:</p>
          <p>
            <a
              href="mailto:support@allo.example"
              className="font-semibold text-blue-950 underline-offset-2 hover:underline"
            >
              support@allo.example
            </a>
          </p>
          <p>For partnership and API access:</p>
          <p>
            <a
              href="mailto:partners@allo.example"
              className="font-semibold text-blue-950 underline-offset-2 hover:underline"
            >
              partners@allo.example
            </a>
          </p>
          <p>
            Visit{" "}
            <a
              href={alloShopUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-blue-950 underline-offset-2 hover:underline"
            >
              Allo
            </a>{" "}
            for certified devices and retail support.
          </p>
        </LegalPageLayout>
      );
    case "api-docs":
      return (
        <LegalPageLayout title="API documentation" onHome={onHome}>
          <p className="rounded-full border border-cyan-200/80 bg-gradient-to-r from-cyan-50 to-blue-50 px-4 py-3 text-center font-medium text-blue-950">
            Coming soon
          </p>
          <p>
            Partner and developer documentation for device lookup, registration, and certification APIs will
            be published here. If you need early access, contact{" "}
            <a
              href="mailto:partners@allo.example"
              className="font-semibold text-blue-950 underline-offset-2 hover:underline"
            >
              partners@allo.example
            </a>
            .
          </p>
        </LegalPageLayout>
      );
  }
}

export default function App() {
  const [heroIndex, setHeroIndex] = useState(0);
  const [serial, setSerial] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const serialInputRef = useRef<HTMLInputElement | null>(null);
  const modalInputRef = useRef<HTMLInputElement | null>(null);
  const [checkModalOpen, setCheckModalOpen] = useState(false);
  const [appRoute, setAppRoute] = useState<AppRoute>(() =>
    typeof window !== "undefined" ? parseAppRouteFromHash() : { kind: "home" },
  );
  const [resultPayload, setResultPayload] = useState<LookupResult | null>(() =>
    typeof window !== "undefined" && parseAppRouteFromHash().kind === "result"
      ? readStoredResult()
      : null,
  );
  const [shareLoadState, setShareLoadState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [shareLoadError, setShareLoadError] = useState<string | null>(null);
  const [sharedResult, setSharedResult] = useState<LookupResult | null>(null);
  const [sharedExpiresAt, setSharedExpiresAt] = useState<string | null>(null);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareNotice, setShareNotice] = useState<string | null>(null);
  const [shareLinkError, setShareLinkError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

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
    if (!checkModalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => modalInputRef.current?.focus(), 50);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCheckModalOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [checkModalOpen]);

  useEffect(() => {
    const sync = () => {
      const route = parseAppRouteFromHash();
      setAppRoute(route);
      if (route.kind === "result") {
        setResultPayload(readStoredResult());
      } else if (route.kind === "home") {
        setResultPayload(null);
      }
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  useEffect(() => {
    if (appRoute.kind !== "share") {
      setSharedResult(null);
      setSharedExpiresAt(null);
      setShareLoadError(null);
      setShareLoadState("idle");
      return;
    }
    const shareToken = appRoute.token;
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
  }, [appRoute]);

  function goHome() {
    clearStoredResult();
    setResultPayload(null);
    setShareUrl(null);
    setShareNotice(null);
    setShareLinkError(null);
    if (window.location.hash) window.location.hash = "";
    else setAppRoute({ kind: "home" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openCheckModal() {
    setError(null);
    setCheckModalOpen(true);
  }

  function closeCheckModal() {
    setCheckModalOpen(false);
  }

  function handleCheckPhoneNav() {
    const route = parseAppRouteFromHash();
    if (route.kind !== "home") {
      goHome();
      window.setTimeout(openCheckModal, 400);
      return;
    }
    openCheckModal();
  }

  function goToResultPage(payload: LookupResult) {
    storeResult(payload);
    setResultPayload(payload);
    setAppRoute({ kind: "result" });
    setShareUrl(null);
    window.location.hash = "#/result";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function runLookup() {
    setError(null);
    setShareUrl(null);
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
      setCheckModalOpen(false);
      goToResultPage(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  }

  async function onModalSubmit(e: React.FormEvent) {
    e.preventDefault();
    await runLookup();
  }

  async function onHeroSubmit(e: React.FormEvent) {
    e.preventDefault();
    await runLookup();
  }

  const checkPhoneModal = (
    <CheckPhoneModal
      open={checkModalOpen}
      onClose={closeCheckModal}
      serial={serial}
      onSerialChange={setSerial}
      onSubmit={(e) => void onModalSubmit(e)}
      loading={loading}
      loadingMessage={loadingMessages[loadingMessageIndex]}
      error={error}
      inputRef={modalInputRef}
    />
  );

  const hero = heroImages[heroIndex];
  function goHomeFromShare() {
    goHome();
    setSharedResult(null);
    setSharedExpiresAt(null);
    setShareLoadError(null);
    setShareLoadState("idle");
  }

  async function createShareLink(payload: LookupResult) {
    if (shareUrl) return;
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
      setShareUrl(buildShareUrl(data.token));
    } catch (e) {
      setShareLinkError(e instanceof Error ? e.message : "Could not create share link");
      window.setTimeout(() => setShareLinkError(null), 6000);
    } finally {
      setShareBusy(false);
    }
  }

  async function copyShareLink() {
    if (!shareUrl) return;
    setShareNotice(null);
    setShareLinkError(null);
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareNotice("Link copied to clipboard.");
    } catch {
      setShareNotice("Copy the link from the field above.");
    }
    window.setTimeout(() => setShareNotice(null), 5000);
  }

  function handleCheckAnother() {
    setError(null);
    setSerial("");
    openCheckModal();
  }

  if (
    appRoute.kind === "privacy" ||
    appRoute.kind === "terms" ||
    appRoute.kind === "contact" ||
    appRoute.kind === "api-docs"
  ) {
    return (
      <div className="min-h-screen bg-white text-zinc-900">
        <AppHeader onLogoClick={goHome} onCheckPhone={handleCheckPhoneNav} />
        <LegalPageContent route={appRoute.kind} onHome={goHome} />
        <AppFooter />
        {checkPhoneModal}
      </div>
    );
  }

  if (appRoute.kind === "result") {
    return (
      <div className="min-h-screen bg-white text-zinc-900">
        <AppHeader onLogoClick={goHome} onCheckPhone={handleCheckPhoneNav} />

        <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
          <h1 className="text-center text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl md:text-4xl">
            Verification result
          </h1>

          {!resultPayload ? (
            <div className="mt-10 text-center">
              <p className="rounded-lg border border-zinc-200 bg-white px-4 py-6 text-sm text-zinc-600">
                No result to show. Run a new check from the home page.
              </p>
              <button type="button" onClick={openCheckModal} className={`${btnPrimary} mt-6`}>
                Check a device
              </button>
            </div>
          ) : (
            <div className="mt-8 w-full space-y-6">
              <LookupResultCard result={resultPayload} className="mt-0" />
              <ResultPageActions
                onCheckAnother={handleCheckAnother}
                onShareResult={() => void createShareLink(resultPayload)}
                onCopyLink={() => void copyShareLink()}
                shareBusy={shareBusy}
                shareNotice={shareNotice}
                shareError={shareLinkError}
                shareUrl={shareUrl}
              />
              <VerifiedFromAlloCta shopUrl={alloShopUrl} />
            </div>
          )}
        </main>

        <AppFooter />
        {checkPhoneModal}
      </div>
    );
  }

  if (appRoute.kind === "share") {
    const sharedTier = sharedResult ? resolveStatusTier(sharedResult) : null;
    const sharedUnknown = Boolean(sharedResult && sharedTier === "unknown");

    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900">
        <AppHeader onLogoClick={goHomeFromShare} onCheckPhone={handleCheckPhoneNav} />

        <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
          <h1 className="text-center text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl md:text-4xl">
            Shared verification result
          </h1>

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
              <div className="mt-6 w-full space-y-6">
                <LookupResultCard result={sharedResult} className="mt-0" />
                {sharedUnknown ? (
                  <div className="flex justify-center">
                    <a
                      href={alloShopUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${btnPartnerCta} w-full max-w-md justify-center py-3 sm:w-auto sm:py-3.5`}
                    >
                      Buy original phones from Allo
                      <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
                    </a>
                  </div>
                ) : null}
              </div>
              <div className="mt-8 flex justify-center px-2">
                <button
                  type="button"
                  onClick={() => {
                    goHomeFromShare();
                    window.setTimeout(openCheckModal, 150);
                  }}
                  className={`${btnPartnerCta} w-full max-w-lg justify-center px-10 py-4 text-base sm:w-auto sm:px-12 sm:py-4 sm:text-lg`}
                >
                  Run your own check
                  <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5 sm:h-6 sm:w-6" />
                </button>
              </div>
            </>
          )}
        </main>

        <AppFooter />
        {checkPhoneModal}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <AppHeader onLogoClick={goHome} onCheckPhone={handleCheckPhoneNav} />

      <section id="hero-search" className="w-full px-3 sm:px-5 md:px-6">
        <div className="w-full">
          <div className="relative w-full overflow-hidden rounded-2xl bg-zinc-200 sm:rounded-3xl">
            <div className="relative aspect-[25/24] w-full min-h-[26.4rem] sm:aspect-[35/18] sm:min-h-[19.2rem] md:aspect-[175/54] md:min-h-[13.2rem] lg:min-h-[15.6rem]">
              <img
                key={heroIndex}
                src={hero.src}
                alt={hero.alt}
                className="absolute inset-0 h-full w-full rounded-2xl object-cover transition-opacity duration-700 ease-out sm:rounded-3xl"
                loading={heroIndex === 0 ? "eager" : "lazy"}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/45 via-zinc-900/10 to-transparent" />
              <div className="absolute inset-x-3 bottom-4 z-10 sm:inset-x-6 sm:bottom-8">
                {loading && !checkModalOpen ? (
                  <CheckLookupLoadingCard
                    message={loadingMessages[loadingMessageIndex]}
                    className="mx-auto w-full max-w-md"
                  />
                ) : (
                  <form
                    onSubmit={(e) => void onHeroSubmit(e)}
                    className="mx-auto flex w-full max-w-3xl flex-col items-center gap-2.5 sm:flex-row sm:items-end sm:gap-3"
                  >
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
                          className={`w-full rounded-full py-3 pr-4 pl-11 text-[0.95rem] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)] outline-none transition placeholder:text-blue-950/75 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/35 sm:py-3.5 sm:pr-5 sm:pl-12 sm:text-base ${heroFieldShell}`}
                        />
                      </div>
                    </label>
                    <button
                      type="submit"
                      disabled={loading}
                      className={`${btnPartnerCta} group w-full py-3 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:shrink-0 sm:py-3.5`}
                    >
                      {loading ? "Checking..." : "Check Now"}
                      {!loading ? (
                        <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
                      ) : null}
                    </button>
                  </form>
                )}
                {!loading || checkModalOpen ? (
                  <CheckTrustBadges className="mt-2.5 sm:mt-3" />
                ) : null}
                {error && !checkModalOpen ? (
                  <p className="mx-auto mt-3 w-full max-w-3xl rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm text-rose-800 shadow-sm">
                    {error}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <HeroStatsBar />

      <section className="bg-white px-4 pb-12 pt-8 sm:px-6 sm:pb-16 sm:pt-10 lg:pb-20 lg:pt-12">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-balance bg-gradient-to-r from-cyan-600 via-blue-700 to-blue-950 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent sm:text-4xl md:text-5xl">
              What AlloCheck tells you
            </h2>
          </div>

          <div className="mt-9 -mx-4 flex gap-5 overflow-x-auto px-4 pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] sm:-mx-6 sm:gap-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:items-stretch lg:gap-3 lg:overflow-visible lg:pb-0 lg:snap-none xl:gap-4 [&::-webkit-scrollbar]:hidden">
            {(
              [
                {
                  tier: "clean" as const,
                  title: "Ready to buy",
                  description: "No reported registry issues found for this device.",
                  cardLayout: "content-first" as const,
                },
                {
                  tier: "stolen" as const,
                  title: "Do not proceed",
                  description: "The device may be flagged as stolen or blacklisted.",
                  cardLayout: "visual-first" as const,
                },
                {
                  tier: "finance" as const,
                  title: "Verify ownership",
                  description: "The device may still be under a payment agreement.",
                  cardLayout: "content-first" as const,
                },
                {
                  tier: "unknown" as const,
                  title: "Do not buy",
                  description: "Not registered in AlloCheck—may not be genuine or original.",
                  cardLayout: "visual-first" as const,
                  explainerTheme: EXPLAINER_DO_NOT_BUY_THEME,
                  iconGrad: EXPLAINER_DO_NOT_BUY_ICON_GRAD,
                  iconTextClass: "text-white",
                },
              ] as const
            ).map((item) => (
              <div
                key={item.title}
                className="w-[min(71.28vw,19.44rem)] shrink-0 snap-center lg:flex lg:w-full lg:min-w-0 lg:max-w-none"
              >
                <StatusExplainerCard
                  tier={item.tier}
                  title={item.title}
                  description={item.description}
                  cardLayout={item.cardLayout}
                  theme={"explainerTheme" in item ? item.explainerTheme : undefined}
                  iconGrad={"iconGrad" in item ? item.iconGrad : undefined}
                  iconTextClass={"iconTextClass" in item ? item.iconTextClass : undefined}
                />
              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <button type="button" onClick={openCheckModal} className={btnPartnerCta}>
              Check Now
              <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-10 sm:px-6 sm:py-16 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 md:gap-8 lg:gap-10">
            <div className="order-2 flex flex-col justify-center rounded-2xl border border-zinc-200/80 bg-white px-6 py-8 text-center shadow-lg shadow-blue-950/5 sm:px-10 sm:py-12 md:order-1 md:text-left lg:px-12 lg:py-14">
              <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-blue-600">Allo Certified</p>
              <h2 className="mt-3 text-balance text-xl font-bold leading-tight text-zinc-900 sm:text-3xl lg:text-4xl">
                Instead of Worrying, Buy from Allo Certified Phones with Warranty
              </h2>
              <p className="mt-4 text-pretty text-sm leading-relaxed text-zinc-600 sm:text-lg">
                Get a device that has already passed verification—backed by warranty and the Allo network.
              </p>
              <div className="mt-6 flex justify-center md:mt-8 md:justify-start">
                <a
                  href={alloShopUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={btnAlloCertifiedShopRow}
                >
                  Buy original phones from Allo
                  <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
                </a>
              </div>
            </div>

            <SplitSectionImageCard mdOrder="md:order-2">
              <img
                src={alloCertifiedImage.src}
                alt={alloCertifiedImage.alt}
                className="absolute inset-0 z-0 h-full w-full object-cover"
                loading="lazy"
              />
            </SplitSectionImageCard>
          </div>
        </div>
      </section>

      <section id="partners" className="scroll-mt-20 bg-white px-4 py-10 sm:px-6 sm:py-16 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 md:gap-8 lg:gap-10">
            <div className="order-2 flex flex-col justify-center rounded-2xl bg-blue-950 px-6 py-8 text-center shadow-lg shadow-blue-950/20 sm:px-10 sm:py-12 md:order-1 md:text-left lg:px-12 lg:py-14">
              <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-cyan-300/90">
                For business
              </p>
              <h2 className="mt-3 text-balance text-xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
                Grow Your Business with Allo
              </h2>
              <p className="mt-4 text-pretty text-sm leading-relaxed text-cyan-100/90 sm:text-lg">
                Check, get your device registered & certified—reach buyers who value trust.
              </p>
              <ul className="mt-6 flex flex-col gap-3 text-left text-cyan-50/95 sm:mt-8">
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
              <div className="mt-6 flex justify-center md:mt-8 md:justify-start">
                <a href="mailto:partners@allo.example" className={btnPartnerCta}>
                  Become partner
                  <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
                </a>
              </div>
            </div>

            <SplitSectionImageCard mdOrder="md:order-2">
              <PartnerBannerImage src={partnersBannerSrc} />
              <BusinessGrowthChartOverlay />
            </SplitSectionImageCard>
          </div>
        </div>
      </section>

      <AppFooter />

      {checkPhoneModal}
    </div>
  );
}
