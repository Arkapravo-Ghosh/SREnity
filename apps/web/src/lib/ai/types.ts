/** Shape returned by srenity-ai. Every `cites` entry is a key of `citations`. */
export type Citation = {
  id: string;
  source: string | null;
  record: string | null;
  system: string;
  label: string;
  derivedFrom?: string[];
  sourceLabel?: string | null;
  at?: string | null;
  /** Copy of the cited record, saved with the analysis. */
  raw?: Record<string, unknown>;
};

export type Span = { start: string | null; end: string | null; text: string; cites: string[] };
export type CitedText = { text: string; cites: string[]; disputed?: string };

export type IncidentContext = {
  incident: { number: string; sysId: string; openedAt: string; ci: string; shortDescription: string };
  status: { open: boolean; endedAt: string | null; text: string };
  summary: CitedText[];
  story: { at: string | null; title: string; why: string; quotes: { text: string; cite: string }[]; cites: string[]; disputed?: string }[];
  attempts: {
    at: string | null;
    action: string;
    claimed: "worked" | "did_not_work" | "unclear";
    verdict: "worked" | "did_not_work" | "contradicted" | "recovered" | "unclear";
    outcome: string;
    monitoring: "recovered" | "kept_failing" | "quiet" | "no_linked_alerts" | "unavailable";
    cites: string[];
    monitoringCites: string[];
  }[];
  openItems: CitedText[];
  excluded: { reason: string; count: number; cites: string[] }[];
  owners: (Span & { group: string; assignee: string })[];
  states: (Span & { state: string })[];
  handovers: (Span & { from: string; to: string; field: string; by: string; confirmedInChat?: string | null })[];
  chatHandovers: { at: string; quote: string; by: string; confirmed: boolean; note: string; cites: string[] }[];
  idleGaps: (Span & { open: boolean })[];
  detectionLag: (Span & { seconds?: number; via?: "alert" | "traces" }) | null;
  /** Change requests on the incident CI or CIs related to it, with when they ran relative to the first symptom. */
  changes?: {
    at: string | null; number: string; title: string; type: string; ci: string; relation: string; state: string; closeCode: string;
    basis: string; linkedAs: string[]; timing: string | null; before: boolean | null; cites: string[];
  }[];
  /** Set when the change search found nothing: cited to the search itself (Q…). */
  changeSearch?: (CitedText & { from?: string | null; to?: string | null; cis?: string[] }) | null;
  /** CMDB relationships around the incident CI. upstream = the incident CI relies on it; downstream = it relies on the incident CI. */
  dependencies?: { ci: string; direction: "upstream" | "downstream"; relation: string; hop: number; via?: string | null; kind?: string; cites: string[] }[];
  /** Related CIs that showed symptoms during the incident. */
  impact?: (Span & { ci: string; direction: "upstream" | "downstream"; relation: string })[];
  traces?: {
    services: { service: string; relation: string; linked: boolean; errorSpans: number; lowerBound?: boolean;
                intervals: [string, string][]; peers: Record<string, number>; cites: string[] }[];
    calls: { caller: string; callee: string; calls: number; inCmdb: boolean; cites: string[] }[];
  };
  /** Computed from ticket and alert timestamps: this ticket's TTR, the impact window, and MTTR of past incidents. */
  resolution?: {
    ttr?: Span & { seconds: number };
    impact?: Span & { seconds: number };
    mttr?: Span & { seconds: number; count: number; basis: "same_ci" | "same_words" };
  };
  sla: (Span & { name: string; breached: boolean; percent: string })[];
  chat: {
    linked: { id: string; reason: string; messages: number; cites: string[] }[];
    possible: { id: string; reason: string; messages: number; preview: string; cites: string[] }[];
    excluded: { id: string; reason: string; messages: number }[];
  };
  gaps: { kind: string; text: string; cites: string[] }[];
  citations: Record<string, Citation>;
  method: string;
  model: string | null;
  usage: { requests: number; inputTokens: number; outputTokens: number };
  generatedAt: string;
  /** When this analysis was saved; page loads read the saved copy, Resync replaces it. */
  savedAt?: string | null;
  fromSaved?: boolean;
};

export type IncidentHistory = {
  incident: { number: string; sysId: string };
  takeaways: CitedText[];
  matches: {
    id: string;
    number: string;
    sysId: string;
    title: string;
    openedAt: string | null;
    resolvedAt: string | null;
    timeToResolve: string | null;
    resolvedBy: string;
    closeCode: string;
    matchedBy: string[];
    score: number;
    why: string;
    resolution: string;
    quotes: { text: string; cite: string }[];
    lesson: string;
    cites: string[];
    /** Code-computed: change requests that started within a day before this past incident opened. */
    changesBefore?: CitedText[];
  }[];
  /** CIs related to this incident's CI in the CMDB; past incidents on them were searched too. */
  related?: { ci: string; direction: string; relation: string }[];
  gaps: { kind: string; text: string; cites: string[] }[];
  searched: { keywords: string[]; candidates: number };
  citations: Record<string, { id: string; label: string; system: string; raw: Record<string, unknown> }>;
  model: string | null;
  generatedAt: string;
  /** When this analysis was saved; page loads read the saved copy, Resync replaces it. */
  savedAt?: string | null;
  fromSaved?: boolean;
};
