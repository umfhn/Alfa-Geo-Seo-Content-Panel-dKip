// types.ts

// --- Enums and string literal types ---

export enum InputType {
  URL = 'url',
  TEXT = 'text',
  JSON = 'json',
}

export enum Tone {
  NEUTRAL = 'neutral',
  WERBLICH = 'werblich',
  FACHLICH = 'fachlich',
  FREUNDSCHAFTLICH = 'freundschaftlich',
}

export enum PanelCount {
  ONE = '1',
  THREE = '3',
  SIX = '6',
  NINE = '9',
  TWELVE = '12',
}

export enum ContentDepth {
  COMPACT = 'kompakt',
  STANDARD = 'standard',
  DETAILED = 'detailliert',
}

export type ExportProfile = 
  | 'gutenberg' 
  | 'classic_inline' 
  | 'classic_split' 
  | 'raw_html' 
  | 'onepage_html_full' 
  | 'onepage_html_no_css' 
  | 'wp_gutenberg_html';

export type HealthStatus = 'green' | 'yellow' | 'red' | 'neutral';

// --- Core Data Structures ---

export interface Geo {
  companyName: string;
  city: string;
  region: string;
  zip: string;
  branch: string;
  street: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface HeroMedia {
  avif1280: string;
  avif1920: string;
  webp1280: string;
  webp1920: string;
  jpg: string;
  alt: string;
  headline: string;
  subtitle: string;
  ctaUrl: string;
}

export interface GalleryMediaItem {
  id: string; // for React key
  thumb: string;
  full: string;
  alt: string;
  caption: string;
}

export interface JobMedia {
  hero: HeroMedia;
  gallery: GalleryMediaItem[];
  logoUrl?: string;
}

export interface UserInput {
  inputType: InputType;
  content: string;
  geo: Geo;
  tone: Tone;
  panelCount: PanelCount;
  contentDepth: ContentDepth;
  keepDesign: boolean;
  topics?: string[];
  outputFormat: 'onepage' | 'legacy';
  media?: JobMedia;
}

export interface PanelSection {
  title: string;
  bullets: string[];
}

export interface PanelFAQ {
  q: string;
  a: string;
}

export interface Panel {
  slug: string;
  title: string;
  kind: 'accordion';
  summary: string;
  sections: PanelSection[];
  faqs: PanelFAQ[];
  keywords: string[];
  sources: any[]; // Define more strictly if needed
  payloadHash: string;
}

export interface CIColors {
  primary: string;
  secondary: string;
  accent: string;
  text_primary: string;
  text_secondary: string;
  fontSizeTitle: number;
  fontSizeAccordionTitle: number;
  fontSizeContent: number;
  scrollbarPosition: 'left' | 'right';
}

export interface SectionLabels {
  summary: string;
  sections: string;
  faq: string;
  keywords: string;
}

export interface PanelSegmentsLockState {
    title: boolean;
    summary: boolean;
    sections: boolean;
    faq: boolean;
    keywords: boolean;
}

export interface Explainability {
    source_info: string;
    extracted_geo: Geo;
    duration_ms: number;
    payload_hash: string;
}

export interface QualityScoreBreakdownValue {
    score: number;
    weight: number;
}

export interface QualityScoreBreakdown {
    completeness: QualityScoreBreakdownValue;
    variance: QualityScoreBreakdownValue;
    geo_integration: QualityScoreBreakdownValue;
    readability: QualityScoreBreakdownValue;
    keywords: QualityScoreBreakdownValue;
}

export interface LintIssue {
    code: string;
    message: string;
    severity: 'ERROR' | 'WARN';
}

export interface LintingResults {
    passed: boolean;
    has_warnings: boolean;
    issues: LintIssue[];
    similarity_score: number;
    content_hash: string;
    quality_score_breakdown?: QualityScoreBreakdown;
}

export interface PanelResult {
  index: number;
  status: 'pending' | 'ok' | 'failed' | 'skipped';
  panel?: Panel;
  topic: string;
  angle: string;
  quality_score?: number;
  is_locked?: boolean;
  segment_locks?: Partial<PanelSegmentsLockState>;
  linting_results?: LintingResults;
  explainability?: Explainability;
  error?: string;
}

export interface JobStep {
    kind: string;
    description: string;
    index?: number;
    of?: number;
    segment?: string;
}

export interface JobError {
    code: string;
    message: string;
    atStep: string;
}

export interface JobResults {
    geo?: Geo;
    topic?: string;
    panels: PanelResult[];
    ci_colors?: CIColors;
    section_labels?: SectionLabels;
    meta?: Meta;
    lintSummary?: LintIssue[];
    set_hash?: string;
    media?: JobMedia;
}

export interface Job {
  jobId: string;
  state: 'queued' | 'running' | 'paused' | 'done' | 'error';
  progress: number;
  step: JobStep;
  userInput: UserInput;
  results: JobResults;
  lastError: JobError | null;
  timestamps: {
    created: string;
    updated: string;
  };
}

export interface Sixpack {
  type: 'sixpack';
  format: '1x1';
  topic: string;
  geo: Geo;
  panels: Panel[];
  meta?: Meta;
  ci_colors?: CIColors;
}

export interface Meta {
    companyName?: string;
    street?: string;
    representatives?: string[];
    phone?: string;
    fax?: string;
    email?: string;
    taxId?: string;
    website?: string;
    title?: string;
    description?: string;
}

export interface VCardData {
    company: string;
    branch: string;
    phone: string;
    email: string;
    website: string;
    street: string;
    city: string;
    region: string;
    zip: string;
}

export interface SeoData {
    title: string;
    description: string;
    jsonLd: string;
    canonical: string;
}


// --- System Check specific types ---

export interface HealthCheckResult {
  ok: boolean;
  status: HealthStatus;
  latency_ms?: number;
  message: string;
  source?: 'live' | 'mock';
  unresolved?: string[];
  duplicates?: string[];
  remaining?: number;
  quota?: number;
}

export interface RunHistory {
  id: string;
  panels: number;
  tone: Tone;
  detail: ContentDepth;
  timestamp: string;
}

export interface SystemInfo {
  app_version: string;
  build_hash: string;
  env: string;
  feature_flags: string[];
  lastRunId?: string;
}

export interface HealthReport {
  timestamp: string;
  status: HealthStatus;
  summary: string;
  checks: {
    backend: HealthCheckResult;
    mini_prompt: HealthCheckResult;
    placeholders: HealthCheckResult;
    keywords: HealthCheckResult;
    rate_limit: HealthCheckResult;
    runs: RunHistory[];
    system: SystemInfo;
  };
}

// --- Layout Module specific types ---

export enum FrameVariant {
    F1 = 'F1', // Standard
    F2 = 'F2', // Header-focus
    F3 = 'F3', // Footer-focus
}

export enum ContentVariant {
    L1 = 'L1', // Stack
    L2 = 'L2', // Split
    L3 = 'L3', // Grid
    L4 = 'L4', // Accordion
}

export enum ButtonVariant {
    PRIMARY = 'primary',
    SECONDARY = 'secondary',
    GHOST = 'ghost',
}

export enum ButtonPosition {
    HEADER = 'header',
    CONTENT = 'content',
    FOOTER = 'footer',
}

export interface LayoutTokens {
  gap_px: number;
  radius_px: number;
  primary: string;
  surface: string;
  text: string;
  border: string;
}

export interface LayoutButton {
  id: string;
  label: string;
  url: string;
  variant: ButtonVariant;
  pos: ButtonPosition;
}

export interface LayoutConfig {
  module_label: string;
  frame_variant: FrameVariant;
  content_variant: ContentVariant;
  show_header: boolean;
  show_footer: boolean;
  tokens: LayoutTokens;
  buttons: LayoutButton[];
}
