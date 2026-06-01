import React, { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { apiUrl, formatFetchError, readApiError } from "./api";

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

const defaultPartnersBannerSrc =
  "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=2400&h=1200&fit=crop&q=85";

const partnersBannerSrc =
  import.meta.env.VITE_PARTNERS_BANNER_URL?.trim() || defaultPartnersBannerSrc;

const alloShopUrl =
  import.meta.env.VITE_ALLO_SHOP_URL?.trim() || "https://allo.et";

/** Consistent homepage section spacing (vertical rhythm on each block; `<main>` stacks with no extra gap). */
const homeSectionX = "px-4 sm:px-6";
const homeSectionY = "py-8 sm:py-10 lg:py-12";
const homeMainStack = "flex flex-col";
const pageShell = "min-h-screen allo-page-bg font-sans text-brand-ink antialiased";

const brandCard =
  "rounded-2xl border border-brand-tint/60 bg-white shadow-[var(--shadow-card)] ring-1 ring-black/[0.03] transition duration-300 ease-out motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] hover:ring-brand/10 motion-reduce:hover:translate-y-0";
const brandEyebrow = "text-xs font-semibold uppercase tracking-[0.22em] text-brand";
const brandHeading = "font-bold tracking-tight text-brand-ink";
const brandBody = "text-brand-muted leading-relaxed";
const brandModalHeader =
  "bg-gradient-to-br from-brand via-[#4d76f5] to-brand-navy shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]";

const splitSectionImage =
  "relative min-h-[16rem] overflow-hidden rounded-[1.75rem] shadow-[var(--shadow-hero-media)] ring-1 ring-brand-tint/70 sm:min-h-[22rem] lg:min-h-[26rem]";

const heroPhoneVisual = {
  src: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=2400&h=1400&fit=crop&q=85",
  alt: "Smartphone with verification overlay",
} as const;

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

/** Solid CTA — navy secondary brand (#2C3D8F), same as Buy Certified Phones. */
const btnSolid =
  "group inline-flex items-center justify-center gap-2 rounded-full bg-brand-navy px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-navy-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-navy disabled:cursor-not-allowed disabled:opacity-60";

const btnPrimary = btnSolid;
const btnPartnerCta = btnSolid;
const btnCheckNow = btnSolid;

/** Row layout: matches hero Check Now footprint on result / share actions. */
const btnActionRowLayout =
  "w-full justify-center gap-2 px-8 py-3.5 text-sm font-semibold sm:w-auto sm:min-w-[12rem] sm:text-base";

/** Header Check Now — slightly larger than default solid CTA. */
const btnHeaderCheckNow = `${btnSolid} px-7 py-3.5 text-sm sm:px-8 sm:text-base`;

/** Hero Check Now — full width on mobile; inline beside input from sm+. */
const btnHeroCheckNow = `${btnSolid} flex w-full items-center justify-center gap-2 whitespace-nowrap px-6 py-4 text-base font-semibold sm:inline-flex sm:w-auto sm:shrink-0 sm:px-9 sm:py-4`;

/** Modal Check Now — enlarged full-width CTA in the check popup. */
const btnModalCheckNow = `${btnSolid} flex w-full items-center justify-center gap-2 px-8 py-4 text-base font-semibold sm:py-4 sm:text-lg`;

const btnPartnerCtaRow = `${btnSolid} ${btnActionRowLayout}`;

const btnShareOutline =
  "inline-flex items-center justify-center rounded-full border-2 border-brand-navy/90 bg-white text-brand-navy shadow-sm transition duration-200 ease-out hover:-translate-y-px hover:border-brand-navy hover:bg-brand-mist hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

/** Full width of result card (max-w-md column) — matched height for paired actions. */
const btnActionCardFull =
  "box-border flex h-12 w-full items-center justify-center gap-2 px-6 text-sm font-semibold";
const btnCheckNowCard = `${btnSolid} ${btnActionCardFull}`;
const btnShareOutlineCard = `${btnShareOutline} ${btnActionCardFull}`;
const btnPartnerCtaCard = `${btnSolid} ${btnActionCardFull}`;

const heroSearchInput =
  "w-full rounded-full border border-brand-tint bg-white py-3 pr-3 pl-10 text-sm text-brand-ink shadow-sm outline-none transition placeholder:text-brand-soft focus:border-brand focus:ring-2 focus:ring-brand/25 sm:text-base";

/** Trust badge — solid white pill (hero + below). */
const heroTrustPill =
  "flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full border border-white/90 bg-white px-3 py-2.5 shadow-[0_10px_32px_-12px_rgba(26,31,46,0.28)] ring-1 ring-black/[0.04] sm:gap-2 sm:px-4 sm:py-3";

const loadingMessages = [
  "Searching...",
  "Searching all databases...",
  "Searching international databases...",
];

function LookupLoadingPanel({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center px-2 py-6 text-center sm:py-8" role="status" aria-live="polite">
      <div className="relative flex h-14 w-14 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-brand/20 blur-md" aria-hidden />
        <div
          className="relative h-12 w-12 rounded-full border-[3px] border-brand-tint border-t-brand border-r-brand-navy animate-spin"
          style={{ animationDuration: "0.9s" }}
          aria-hidden
        />
        <svg
          className="absolute h-5 w-5 text-brand-navy"
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
      <p className="mt-4 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-brand-muted">
        AlloCheck lookup
      </p>
      <p className="mt-1 min-h-[1.75rem] text-base font-bold text-brand-ink transition-all duration-300 sm:text-lg">
        {message}
      </p>
      <p className="mt-1.5 text-xs text-brand-muted">Verifying across available records…</p>
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
      className={`overflow-hidden rounded-2xl border border-brand-tint bg-white shadow-2xl shadow-brand/15 ${className}`.trim()}
    >
      <div className={`relative ${brandModalHeader} px-5 py-4 sm:px-6 sm:py-5`}>
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
  | { kind: "about" }
  | { kind: "privacy" }
  | { kind: "terms" }
  | { kind: "contact" }
  | { kind: "api-docs" };

const legalRoutes = ["about", "privacy", "terms", "contact", "api-docs"] as const;
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

function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function BusinessGrowthChartOverlay() {
  const gradId = useId().replace(/:/g, "");
  const areaGradId = `${gradId}-area`;
  const lineGradId = `${gradId}-line`;

  return (
    <div
      className="pointer-events-none absolute top-4 right-4 z-10 w-[min(100%,18rem)] origin-top-right scale-50 sm:top-6 sm:right-5"
      aria-hidden
    >
      <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/90 p-3 shadow-[0_16px_40px_-12px_rgba(44,61,143,0.2)] ring-1 ring-brand/10 backdrop-blur-md sm:p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-brand-muted">
              Partner revenue
            </p>
            <p className="mt-0.5 text-xl font-bold tabular-nums tracking-tight text-brand-navy sm:text-[1.35rem]">
              +24%
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-brand-mist px-2 py-0.5 text-[0.62rem] font-semibold text-brand ring-1 ring-brand-tint">
            MoM
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
              <stop offset="0%" stopColor="#5A81FA" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#2C3D8F" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id={lineGradId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#5A81FA" />
              <stop offset="100%" stopColor="#2C3D8F" />
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
          <circle cx="220" cy="4" r="3.5" fill="#5A81FA" stroke="#fff" strokeWidth="2" />
        </svg>

        <div className="mt-2 flex items-center justify-between gap-2 border-t border-brand-surface pt-2 text-[0.58rem] font-medium text-brand-muted">
          <span>Jan</span>
          <span>Mar</span>
          <span>May</span>
          <span>Jul</span>
        </div>
      </div>
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
  /** White wordmark for navy/brand backgrounds (footer, modal header). */
  onBrand?: boolean;
}) {
  return (
    <div
      role="img"
      aria-label="AlloCheck"
      className={`allocheck-logo shrink-0 ${
        compact
          ? "h-14 -my-[0.875rem]"
          : "h-16 -my-4 sm:h-[4.5rem] sm:-my-[1.125rem]"
      } ${onBrand ? "allocheck-logo--white" : "allocheck-logo--navy"} ${className}`}
    />
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

function tierLineIconClass(tier: StatusTier): string {
  switch (tier) {
    case "clean":
      return "border-emerald-500/40 text-emerald-600";
    case "stolen":
      return "border-rose-500/40 text-rose-600";
    case "finance":
      return "border-amber-500/40 text-amber-600";
    case "unknown":
      return "border-violet-500/40 text-violet-600";
    default:
      return "border-brand-soft text-brand-muted";
  }
}

/** Result header icon on gradient backgrounds. */
function tierIconWrap(tier: StatusTier): string {
  switch (tier) {
    case "unknown":
      return "bg-amber-950/10 text-amber-950 ring-amber-950/30";
    default:
      return "bg-white/10 text-white ring-white/30";
  }
}

const EXPLAINER_CARD_SHELL = `${brandCard}`;
const EXPLAINER_CARD_BODY = "text-brand-ink";
const EXPLAINER_CARD_MUTED = "text-brand-muted";

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

const EXPLAINER_DO_NOT_BUY_ICON_LINE = "border-violet-500/40 text-violet-600";

function ExplainerCardVisual({ image }: { image: { src: string; alt: string } }) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl bg-brand-surface ring-1 ring-black/[0.04] sm:rounded-2xl">
      <img
        src={image.src}
        alt={image.alt}
        className="absolute inset-0 h-full w-full scale-100 rounded-xl object-cover transition duration-500 ease-out group-hover:scale-[1.03] sm:rounded-2xl"
        loading="lazy"
      />
      <div
        className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-t from-brand-navy/20 via-transparent to-transparent sm:rounded-2xl"
        aria-hidden
      />
    </div>
  );
}

function StatusExplainerCard({
  tier,
  title,
  description,
  cardLayout = "content-first",
  theme: themeOverride,
  iconLineClass,
}: {
  tier: StatusTier;
  title: string;
  description: string;
  cardLayout?: "content-first" | "visual-first";
  theme?: ExplainerCardTheme;
  iconLineClass?: string;
}) {
  const theme = themeOverride ?? EXPLAINER_CARD_THEME[tier];
  const visualFirst = cardLayout === "visual-first";
  const lineIcon = iconLineClass ?? tierLineIconClass(tier);

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
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-white/90 backdrop-blur-sm sm:h-12 sm:w-12 lg:h-10 lg:w-10 ${lineIcon}`}
          aria-hidden
        >
          <StatusLineIcon tier={tier} className="h-6 w-6 sm:h-6 sm:w-6 lg:h-5 lg:w-5" />
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
      <ExplainerCardVisual image={theme.image} />
    </div>
  );

  return (
    <article
      className={`group relative flex h-[24rem] w-full flex-col overflow-hidden rounded-2xl sm:h-[29rem] lg:aspect-[3/4] lg:h-auto lg:max-h-[20rem] xl:max-h-[22rem] ${EXPLAINER_CARD_SHELL}`}
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

/** Line-style icons for explainer cards and result headers. */
function StatusLineIcon({ tier, className }: { tier: StatusTier; className?: string }) {
  const common = className ?? "h-6 w-6 shrink-0";
  const stroke = 1.5;
  switch (tier) {
    case "clean":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={stroke} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      );
    case "unknown":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={stroke} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M12 18h.008v.008H12V18z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25c5.385 0 9.75 4.365 9.75 9.75S17.385 21.75 12 21.75 2.25 17.385 2.25 12 6.615 2.25 12 2.25z" />
        </svg>
      );
    case "finance":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={stroke} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      );
    case "stolen":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={stroke} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25c5.385 0 9.75 4.365 9.75 9.75S17.385 21.75 12 21.75 2.25 17.385 2.25 12 6.615 2.25 12 2.25z" />
        </svg>
      );
    default:
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={stroke} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25c5.385 0 9.75 4.365 9.75 9.75S17.385 21.75 12 21.75 2.25 17.385 2.25 12 6.615 2.25 12 2.25z" />
        </svg>
      );
  }
}

function StatusGlyphByTier({ tier, className }: { tier: StatusTier; className?: string }) {
  return <StatusLineIcon tier={tier} className={className ?? "h-7 w-7 shrink-0 sm:h-8 sm:w-8 lg:h-6 lg:w-6"} />;
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
    <div className="grid grid-cols-[42%_1fr] items-start border-b border-brand-tint/70 py-2.5 last:border-b-0">
      <span className="pr-3 text-xs leading-snug text-brand-muted">{label}</span>
      <span className="min-w-0 pl-3 text-right text-xs font-medium leading-snug text-brand-ink sm:text-sm">
        {value}
      </span>
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
  const statusEyebrow =
    tier === "unknown" ? "text-amber-950/65" : "text-white/75";

  return (
    <div
      className={`${className} mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-brand-tint/70 bg-white shadow-[var(--shadow-card)] ring-1 ring-black/[0.04]`}
      role="region"
      aria-label="Verification result"
    >
      <div className={`relative bg-gradient-to-br ${grad} px-4 py-3.5 sm:px-5 sm:py-4`}>
        <div
          className={`pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_70%_at_100%_0%,rgba(255,255,255,0.2),transparent)] ${tier === "unknown" ? "opacity-90" : ""}`}
        />
        <div className="relative flex items-start gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 backdrop-blur-sm ${tierIconWrap(tier)}`}
          >
            <StatusGlyphByTier tier={tier} className="h-5 w-5 shrink-0" />
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-[0.6rem] font-semibold uppercase tracking-[0.14em] ${statusEyebrow}`}>
              Status
            </p>
            <h3 className={`mt-0.5 text-lg font-bold leading-tight tracking-tight ${tierTextPrimary(tier)}`}>
              {tierStyle.title}
            </h3>
            {result.statusLabel ? (
              <p className={`mt-0.5 text-xs font-medium ${tierTextMuted(tier)}`}>{result.statusLabel}</p>
            ) : null}
            <p className={`mt-1 text-xs leading-relaxed ${tierTextMuted(tier)}`}>{tierStyle.blurb}</p>
          </div>
        </div>
      </div>

      <div className="bg-white">
        <div className="flex items-center gap-1.5 border-b border-brand-tint/70 bg-brand-surface/40 px-4 py-2 sm:px-5">
          <svg
            className="h-3.5 w-3.5 shrink-0 text-brand-soft"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
            />
          </svg>
          <span className="text-xs font-semibold text-brand-ink">Device details</span>
        </div>
        <div className="relative px-4 sm:px-5">
          <div
            className="pointer-events-none absolute top-2 bottom-2 left-[42%] w-px -translate-x-1/2 bg-brand-tint"
            aria-hidden
          />
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

function useOnceInView<T extends HTMLElement = HTMLElement>(threshold = 0.35) {
  const ref = useRef(null) as React.MutableRefObject<T | null>;
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

type HeroStatDef =
  | { kind: "count"; target: number; suffix: string; label: string }
  | { kind: "text"; display: string; label: string };

const HERO_STATS: readonly HeroStatDef[] = [
  { kind: "count", target: 50_000, suffix: "+", label: "Registered devices" },
  { kind: "count", target: 1_700, suffix: "+", label: "Reported stolen" },
  { kind: "text", display: "FREE", label: "Individual checks" },
];

function useCountUp(target: number, active: boolean, durationMs = 1400) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setValue(target);
      return;
    }

    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, target, durationMs]);

  return value;
}

function useHeroStatCounts(inView: boolean) {
  const registered = useCountUp(50_000, inView);
  const stolen = useCountUp(1_700, inView);
  return [registered, stolen] as const;
}

function heroStatKey(stat: HeroStatDef) {
  return stat.label;
}

function HeroStatItem({ stat, count }: { stat: HeroStatDef; count?: number }) {
  const valueClass =
    "bg-gradient-to-br from-brand-navy via-brand to-brand-navy bg-clip-text text-[clamp(1.35rem,4vw,2.75rem)] font-bold tabular-nums leading-none tracking-tight text-transparent";
  const suffixClass = "text-[clamp(1rem,3vw,2rem)]";
  const labelClass =
    "mt-2 text-[0.65rem] font-semibold uppercase tracking-wider text-brand-muted sm:text-xs";

  return (
    <div className="flex shrink-0 flex-col items-center justify-center px-2 py-0 text-center sm:px-3">
      {stat.kind === "count" ? (
        <p className={valueClass}>
          {(count ?? 0).toLocaleString("en-US")}
          <span className={suffixClass}>{stat.suffix}</span>
        </p>
      ) : (
        <p className={valueClass}>{stat.display}</p>
      )}
      <p className={labelClass}>{stat.label}</p>
    </div>
  );
}

function heroStatsWithCounts(counts: readonly [number, number]) {
  let countIndex = 0;
  return HERO_STATS.map((stat) => {
    if (stat.kind === "count") {
      const entry = { stat, count: counts[countIndex] ?? 0 };
      countIndex += 1;
      return entry;
    }
    return { stat, count: undefined };
  });
}

const HERO_STATS_CONTEXT =
  "Verify before you buy—backed by local and global registries. Individual IMEI and serial lookups stay free for everyone.";

function HeroStatsBar({ inView }: { inView: boolean }) {
  const counts = useHeroStatCounts(inView);
  const stats = useMemo(() => heroStatsWithCounts(counts), [counts]);
  const numericStats = stats.filter((entry) => entry.stat.kind === "count");
  const freeStat = stats.find((entry) => entry.stat.kind === "text");

  return (
    <div aria-label="Registry statistics">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:flex-nowrap md:items-center md:justify-between md:gap-x-12 lg:gap-x-16 xl:gap-x-24">
          <div className="grid grid-cols-3 divide-x divide-brand-tint/80 md:contents">
            {numericStats.map(({ stat, count }) => (
              <HeroStatItem key={heroStatKey(stat)} stat={stat} count={count} />
            ))}
            {freeStat ? (
              <HeroStatItem stat={freeStat.stat} count={freeStat.count} />
            ) : null}
          </div>
          <p
            className={`w-full text-pretty text-center text-xs leading-relaxed sm:text-sm md:max-w-sm md:shrink-0 md:text-left lg:max-w-md ${brandBody}`}
          >
            {HERO_STATS_CONTEXT}
          </p>
        </div>
      </div>
    </div>
  );
}

const EXPLAINER_CARDS = [
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
    iconLineClass: EXPLAINER_DO_NOT_BUY_ICON_LINE,
  },
] as const;

function HomeTrustSection({ onCheckNow }: { onCheckNow: () => void }) {
  const { ref, inView } = useOnceInView<HTMLElement>(0.22);

  return (
    <section
      ref={ref}
      id="trust"
      className={`scroll-mt-24 bg-gradient-to-b from-white via-white to-brand-mist/50 ${homeSectionX} ${homeSectionY}`}
    >
      <div className="mx-auto max-w-7xl">
        <HeroStatsBar inView={inView} />
        <div className="mt-6 lg:mt-8">
          <RotatingBrandHeadline inView={inView} />
        </div>
        <div className="mt-7 -mx-4 flex gap-5 overflow-x-auto px-4 pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] sm:-mx-6 sm:gap-6 sm:px-6 lg:mx-0 lg:mt-8 lg:grid lg:grid-cols-4 lg:items-stretch lg:gap-3 lg:overflow-visible lg:pb-0 lg:snap-none xl:gap-4 [&::-webkit-scrollbar]:hidden">
          {EXPLAINER_CARDS.map((item) => (
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
                iconLineClass={"iconLineClass" in item ? item.iconLineClass : undefined}
              />
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <button type="button" onClick={onCheckNow} className={btnCheckNow}>
            Check Now
            <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </section>
  );
}

function AlloCertifiedSection({ shopUrl }: { shopUrl: string }) {
  const features = [
    "Warranty included on every certified device",
    "Built-in AlloCheck verification before you buy",
    "Genuine phones from the Allo retail network",
  ] as const;

  return (
    <section className={`bg-gradient-to-b from-brand-mist/60 via-brand-mist/25 to-white ${homeSectionX} ${homeSectionY}`}>
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="order-2 lg:order-1">
            <p className={brandEyebrow}>Allo Certified</p>
            <h2 className={`mt-3 text-balance text-2xl sm:text-3xl lg:text-4xl ${brandHeading}`}>
              Instead of Worrying, Buy Certified Hardware
            </h2>
            <p className={`mt-4 text-pretty text-sm leading-relaxed sm:text-base ${brandBody}`}>
              Every device passes verification in the AlloCheck registry—backed by warranty and the Allo
              network.
            </p>
            <ul className="mt-8 space-y-4">
              {features.map((item) => (
                <li key={item} className="flex gap-3 text-sm text-brand-ink">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-tint via-white to-brand-mist text-brand shadow-sm ring-1 ring-brand/15">
                    <CheckIcon className="h-3.5 w-3.5" />
                  </span>
                  <span className="pt-0.5">{item}</span>
                </li>
              ))}
            </ul>
            <a
              href={shopUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${btnPartnerCta} mt-8`}
            >
              Buy Certified Phones
              <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
            </a>
          </div>
          <div className={`order-1 lg:order-2 ${splitSectionImage}`}>
            <img
              src={alloCertifiedImage.src}
              alt={alloCertifiedImage.alt}
              className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-out motion-reduce:transition-none hover:scale-[1.03] motion-reduce:hover:scale-100"
              loading="lazy"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-navy/40 via-brand-navy/8 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}

function AlloBusinessSection() {
  const features = [
    "API and dashboard to register and update device status",
    "Certified inventory and partner visibility",
    "Dedicated flows for vendors and enterprise partners",
  ] as const;

  return (
    <section id="partners" className={`scroll-mt-24 bg-white ${homeSectionX} ${homeSectionY}`}>
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div className={splitSectionImage}>
            <img
              src={partnersBannerSrc}
              alt="Allo business partners"
              className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-out motion-reduce:transition-none hover:scale-[1.03] motion-reduce:hover:scale-100"
              loading="lazy"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-navy/45 via-brand-navy/8 to-transparent" />
            <BusinessGrowthChartOverlay />
          </div>
          <div>
            <p className={brandEyebrow}>For business</p>
            <h2 className={`mt-3 text-balance text-2xl sm:text-3xl lg:text-4xl ${brandHeading}`}>
              Grow Your Business with Allo
            </h2>
            <p className={`mt-4 text-pretty text-sm leading-relaxed sm:text-base ${brandBody}`}>
              Check, register, and certify devices—enterprise-grade tools that help partners reduce risk and
              grow sales.
            </p>
            <ul className="mt-8 space-y-4">
              {features.map((item) => (
                <li key={item} className="flex gap-3 text-sm text-brand-ink">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-tint via-white to-brand-mist text-brand shadow-sm ring-1 ring-brand/15">
                    <CheckIcon className="h-3.5 w-3.5" />
                  </span>
                  <span className="pt-0.5">{item}</span>
                </li>
              ))}
            </ul>
            <a href="mailto:partners@allo.example" className={`${btnPartnerCta} mt-8`}>
              Become a Partner
              <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

const ROTATING_SECTION_HEADLINES = [
  {
    id: "fraud",
    label: "Protect Yourself From Fraud",
    className: `text-balance text-2xl tracking-tight sm:text-3xl lg:text-4xl ${brandHeading}`,
    content: (
      <>
        Protect Yourself From <span className="font-bold text-red-600">FRAUD</span>
      </>
    ),
  },
  {
    id: "allocheck",
    label: "What AlloCheck tells you",
    className:
      "text-balance bg-gradient-to-r from-brand via-[#6b92fc] to-brand-navy bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-3xl lg:text-4xl",
    content: "What AlloCheck tells you",
  },
] as const;

const ROTATING_HEADLINE_INTERVAL_MS = 3500;

/** Viewport-triggered headlines that crossfade on a loop (respects reduced motion). */
function RotatingBrandHeadline({
  className = "",
  inView: inViewProp,
}: {
  className?: string;
  inView?: boolean;
}) {
  const { ref, inView: observedInView } = useOnceInView<HTMLDivElement>(0.3);
  const inView = inViewProp ?? observedInView;
  const [activeIndex, setActiveIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!inView) {
      setActiveIndex(0);
      return;
    }
    if (reducedMotion) return;

    const id = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % ROTATING_SECTION_HEADLINES.length);
    }, ROTATING_HEADLINE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [inView, reducedMotion]);

  const liveHeadline = ROTATING_SECTION_HEADLINES[activeIndex]?.label ?? ROTATING_SECTION_HEADLINES[0].label;

  return (
    <div ref={inViewProp === undefined ? ref : undefined} className={`text-center ${className}`}>
      <h2 className="relative mx-auto min-h-[2.75em] max-w-4xl sm:min-h-[3rem]">
        {ROTATING_SECTION_HEADLINES.map((line, index) => {
          const isActive = index === activeIndex;
          return (
            <span
              key={line.id}
              className={`absolute inset-x-0 top-0 block transition-all duration-700 ease-in-out motion-reduce:transition-none ${line.className} ${
                isActive
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none translate-y-2 opacity-0"
              }`}
              aria-hidden={!isActive}
            >
              {line.content}
            </span>
          );
        })}
        <span className="sr-only">{liveHeadline}</span>
      </h2>
    </div>
  );
}

function VerifiedFromAlloCta({ shopUrl }: { shopUrl: string }) {
  return (
    <div className={`px-4 py-3.5 sm:px-5 sm:py-4 ${brandCard}`}>
      <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-brand">Allo Certified</p>
      <h3 className="mt-1 text-sm font-bold text-brand-ink sm:text-base">Buy verified from Allo</h3>
      <p className="mt-1 text-xs leading-relaxed text-brand-muted sm:text-sm">
        Every certified phone includes a built-in AlloCheck result—clean, verified, and warranty-backed.
      </p>
      <a href={shopUrl} target="_blank" rel="noopener noreferrer" className={`${btnPartnerCtaRow} mt-3`}>
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
    <div className="border-t border-brand-tint pt-5">
      {shareError ? (
        <p className="mb-3 text-center text-sm font-medium text-rose-700">{shareError}</p>
      ) : null}
      {shareNotice ? (
        <p className="mb-3 text-center text-sm font-medium text-emerald-700">{shareNotice}</p>
      ) : null}

      <div className="flex w-full flex-col gap-3">
        <button type="button" onClick={onCheckAnother} className={btnCheckNowCard}>
          Check another phone
          <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
        </button>
        <button type="button" onClick={onShareResult} disabled={shareBusy} className={btnShareOutlineCard}>
          {shareBusy ? "Creating link…" : "Share result"}
        </button>
      </div>

      {shareUrl ? (
        <div className="mt-4 flex w-full flex-col gap-2">
          <div className="w-full rounded-xl border border-brand-tint/70 bg-brand-mist/80 px-3 py-2.5 text-sm text-brand-navy ring-1 ring-brand/5">
            <span className="block truncate font-medium">{shareUrl}</span>
          </div>
          <button type="button" onClick={onCopyLink} className={btnPartnerCtaCard}>
            Copy link
          </button>
        </div>
      ) : null}
    </div>
  );
}

function CheckTrustBadges({ className = "" }: { className?: string }) {
  const iconClass =
    "bg-gradient-to-br from-brand-tint to-brand/25 text-brand shadow-sm ring-1 ring-brand/15";
  const labelClass =
    "text-[0.65rem] font-bold leading-tight text-brand-ink sm:text-xs";

  return (
    <div className={`flex w-full flex-row items-stretch gap-2 sm:gap-3 ${className}`}>
      <div className={heroTrustPill}>
        <span
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full sm:h-5 sm:w-5 ${iconClass}`}
        >
          <CheckIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
        </span>
        <span className={`truncate ${labelClass}`}>Real-time Verification</span>
      </div>
      <div className={heroTrustPill}>
        <span
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full sm:h-5 sm:w-5 ${iconClass}`}
        >
          <CheckIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
        </span>
        <span className={`truncate ${labelClass}`}>Trusted Global Registry</span>
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
          <div className="overflow-hidden rounded-2xl border border-brand-tint bg-white shadow-2xl shadow-brand/15">
            <div className={`relative ${brandModalHeader} px-5 py-4 pr-14 sm:px-6 sm:py-5 sm:pr-16`}>
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
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-brand-muted">
                IMEI or Serial Number
              </span>
              <div className="relative">
                <svg
                  className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-brand-soft"
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
                  className={`${heroSearchInput} py-3.5 pr-4 pl-11 text-[0.95rem] sm:py-3.5`}
                />
              </div>
            </label>

            <button type="submit" className={`${btnModalCheckNow} group`}>
              Check Now
              <ArrowRight className="h-6 w-6 transition group-hover:translate-x-0.5" />
            </button>

            {error ? (
              <p className="rounded-none border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm text-rose-800">
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
    <header className="sticky top-0 z-50 border-b border-brand-tint/60 bg-white/90 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_8px_24px_-12px_rgba(44,61,143,0.12)] backdrop-blur-lg backdrop-saturate-150">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-3.5">
        <a
          href="#/"
          onClick={(e) => {
            e.preventDefault();
            onLogoClick();
          }}
          className="min-w-0 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <AlloLogo />
        </a>
        <button type="button" onClick={onCheckPhone} className={btnHeaderCheckNow}>
          Check Now
          <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5 sm:h-6 sm:w-6" />
        </button>
      </div>
    </header>
  );
}

const footerLinkClass =
  "text-sm text-brand-soft transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

const footerTopographicBg =
  "bg-[url('/footer-topographic.png')] bg-repeat-x bg-[length:auto_100%] bg-center";

function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-gradient-to-b from-brand-navy via-[#243266] to-[#1a2558] text-white">
      <div className={`pointer-events-none absolute inset-0 opacity-35 ${footerTopographicBg}`} aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(90,129,250,0.18),transparent_65%)]" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1a2558] via-transparent to-transparent" aria-hidden />
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="min-w-0">
          <AlloLogo onBrand compact />
          <p className="mt-2 text-xs text-brand-soft/90">
            A subsidiary of{" "}
            <a
              href={alloShopUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-tint hover:text-white hover:underline"
            >
              Allo
            </a>
          </p>
        </div>
        <nav
          aria-label="Footer"
          className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/10 pt-4 sm:gap-x-6"
        >
          <a href="#/about" className={footerLinkClass}>
            About
          </a>
          <a href="#/privacy" className={footerLinkClass}>
            Privacy
          </a>
          <a href="#/terms" className={footerLinkClass}>
            Terms
          </a>
          <a href="#/api-docs" className={footerLinkClass}>
            API docs
          </a>
          <a href="#/contact" className={footerLinkClass}>
            Contact
          </a>
        </nav>
        <p className="mt-4 text-center text-[0.65rem] text-white/75 sm:text-left sm:text-xs">
          © {year} AlloCheck. All rights reserved.
        </p>
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
      <div className={`p-6 sm:p-8 ${brandCard} hover:translate-y-0 hover:shadow-[var(--shadow-card)]`}>
        <h1 className={`text-2xl tracking-tight sm:text-3xl ${brandHeading}`}>{title}</h1>
        <div className={`mt-6 space-y-4 text-sm ${brandBody}`}>{children}</div>
      </div>
      <button type="button" onClick={onHome} className={`${btnPartnerCtaRow} mt-10`}>
        Back to home
      </button>
    </main>
  );
}

function LegalPageContent({ route, onHome }: { route: LegalRouteKind; onHome: () => void }) {
  switch (route) {
    case "about":
      return (
        <LegalPageLayout title="About AlloCheck" onHome={onHome}>
          <p>
            AlloCheck helps buyers and sellers verify mobile devices before a purchase. Enter an IMEI or
            serial number to see registry status—including clean, flagged, or unknown devices—so you can
            decide with confidence.
          </p>
          <p>
            We combine local and global data sources (including the Ethiopian registry and Trustonic global
            coverage) to surface theft, blacklist, and financing signals in one clear result.
          </p>
          <p>
            AlloCheck is a subsidiary of{" "}
            <a
              href={alloShopUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand underline-offset-2 hover:underline"
            >
              Allo
            </a>
            . Certified phones sold through Allo include built-in verification and warranty support. For
            questions or partnerships, visit our{" "}
            <a href="#/contact" className="font-semibold text-brand underline-offset-2 hover:underline">
              Contact
            </a>{" "}
            page.
          </p>
        </LegalPageLayout>
      );
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
              className="font-semibold text-brand underline-offset-2 hover:underline"
            >
              support@allo.example
            </a>
          </p>
          <p>For partnership and API access:</p>
          <p>
            <a
              href="mailto:partners@allo.example"
              className="font-semibold text-brand underline-offset-2 hover:underline"
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
              className="font-semibold text-brand underline-offset-2 hover:underline"
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
          <p className="rounded-xl border border-brand-tint/70 bg-gradient-to-r from-brand-mist to-brand-tint px-4 py-3 text-center font-medium text-brand-navy shadow-sm">
            Coming soon
          </p>
          <p>
            Partner and developer documentation for device lookup, registration, and certification APIs will
            be published here. If you need early access, contact{" "}
            <a
              href="mailto:partners@allo.example"
              className="font-semibold text-brand underline-offset-2 hover:underline"
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
        const res = await fetch(apiUrl(`/api/v1/shares/${encodeURIComponent(shareToken)}`), {
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
      const res = await fetch(apiUrl(`/api/v1/devices/lookup?${params.toString()}`), {
        method: "GET",
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(await readApiError(res));
      }
      const data = (await res.json()) as LookupResult;
      setCheckModalOpen(false);
      goToResultPage(data);
    } catch (err) {
      setError(formatFetchError(err));
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
      const res = await fetch(apiUrl("/api/v1/shares"), {
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
    appRoute.kind === "about" ||
    appRoute.kind === "privacy" ||
    appRoute.kind === "terms" ||
    appRoute.kind === "contact" ||
    appRoute.kind === "api-docs"
  ) {
    return (
      <div className={pageShell}>
        <AppHeader onLogoClick={goHome} onCheckPhone={handleCheckPhoneNav} />
        <LegalPageContent route={appRoute.kind} onHome={goHome} />
        <AppFooter />
        {checkPhoneModal}
      </div>
    );
  }

  if (appRoute.kind === "result") {
    return (
      <div className={pageShell}>
        <AppHeader onLogoClick={goHome} onCheckPhone={handleCheckPhoneNav} />

        <main className="mx-auto max-w-lg px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
          <h1 className={`text-center text-xl tracking-tight sm:text-2xl ${brandHeading}`}>
            Verification result
          </h1>

          {!resultPayload ? (
            <div className="mt-8 text-center">
              <p
                className={`rounded-2xl border border-brand-tint/70 bg-white px-5 py-6 text-sm shadow-[var(--shadow-card)] ring-1 ring-black/[0.03] ${brandBody}`}
              >
                No result to show. Run a new check from the home page.
              </p>
              <button type="button" onClick={openCheckModal} className={`${btnPrimary} mt-6`}>
                Check a device
              </button>
            </div>
          ) : (
            <div className="mx-auto mt-6 w-full max-w-md space-y-5">
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
      <div className={pageShell}>
        <AppHeader onLogoClick={goHomeFromShare} onCheckPhone={handleCheckPhoneNav} />

        <main className="mx-auto max-w-lg px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
          <h1 className={`text-center text-xl tracking-tight sm:text-2xl ${brandHeading}`}>
            Shared verification result
          </h1>

          {shareLoadState === "loading" && (
            <div className="mt-12 flex flex-col items-center gap-4 text-brand-muted">
              <div className="relative flex h-14 w-14 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-brand/15 blur-md" aria-hidden />
                <div className="relative h-12 w-12 animate-spin rounded-full border-[3px] border-brand-tint border-t-brand border-r-brand-navy" />
              </div>
              <p className="text-sm font-medium">Loading shared result…</p>
            </div>
          )}

          {shareLoadState === "error" && shareLoadError && (
            <p className="mt-8 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm text-rose-800 shadow-sm">
              {shareLoadError}
            </p>
          )}

          {shareLoadState === "done" && sharedResult && (
            <>
              {sharedExpiresAt && (
                <p className="mt-6 text-center text-xs text-brand-muted">
                  This link expires on {new Date(sharedExpiresAt).toLocaleString()}.
                </p>
              )}
              <div className="mx-auto mt-6 w-full max-w-md space-y-5">
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
    <div className={pageShell}>
      <AppHeader onLogoClick={goHome} onCheckPhone={handleCheckPhoneNav} />

      <main className={`${homeMainStack} pb-6 sm:pb-8 lg:pb-10`}>
      <section id="hero-search" className="relative w-full overflow-hidden">
        <img
          src={heroPhoneVisual.src}
          alt=""
          className="absolute inset-0 h-full w-full scale-105 object-cover object-center lg:object-[65%_center]"
          loading="eager"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-navy/90 via-brand-navy/40 to-brand/10"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_100%,rgba(90,129,250,0.22),transparent_68%)]"
          aria-hidden
        />
        <div className="relative z-10 mx-auto flex min-h-[min(36rem,90vh)] max-w-6xl flex-col justify-end px-4 pt-16 pb-10 sm:min-h-[34rem] sm:px-6 sm:pb-12 lg:min-h-[38rem] lg:pb-14">
          <div className="mx-auto w-full max-w-2xl text-center">
            <h1 className="sr-only">Device verification lookup</h1>

            {loading && !checkModalOpen ? (
              <div>
                <CheckLookupLoadingCard
                  message={loadingMessages[loadingMessageIndex]}
                  className="w-full"
                />
              </div>
            ) : (
              <form
                onSubmit={(e) => void onHeroSubmit(e)}
                className="mx-auto flex w-full flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-3"
              >
                <label className="relative w-full min-w-0 sm:flex-1">
                  <span className="sr-only">Enter phone IMEI or Serial Number</span>
                  <svg
                    className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-soft sm:left-4 sm:h-5 sm:w-5"
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
                    ref={serialInputRef}
                    type="text"
                    name="serial"
                    autoComplete="off"
                    placeholder="Enter phone IMEI or Serial Number"
                    value={serial}
                    onChange={(e) => setSerial(e.target.value)}
                    className={`${heroSearchInput} py-3.5 pl-10 sm:py-4 sm:pl-11`}
                  />
                </label>
                <button type="submit" disabled={loading} className={btnHeroCheckNow}>
                  {loading ? "Checking..." : "Check Now"}
                  {!loading ? (
                    <ArrowRight className="h-6 w-6 shrink-0 transition group-hover:translate-x-0.5" />
                  ) : null}
                </button>
              </form>
            )}

            {!loading || checkModalOpen ? (
              <div className="mx-auto mt-6 w-full max-w-2xl">
                <CheckTrustBadges />
              </div>
            ) : null}
            {error && !checkModalOpen ? (
              <p className="mx-auto mt-4 max-w-2xl rounded-xl border border-rose-200/90 bg-rose-50/95 px-4 py-3 text-center text-sm text-rose-900 shadow-sm backdrop-blur-sm">
                {error}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <HomeTrustSection onCheckNow={openCheckModal} />

      <AlloCertifiedSection shopUrl={alloShopUrl} />

      <AlloBusinessSection />
      </main>

      <AppFooter />

      {checkPhoneModal}
    </div>
  );
}
