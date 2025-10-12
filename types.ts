// types.ts

// --- Basic Enums & Types for User Input ---

export enum InputType {
  TEXT = 'Text',
  URL = 'URL',
  JSON = 'JSON',
}

export enum Tone {
  NEUTRAL = 'neutral',
  WERBLICH = 'werblich',
  FACHLICH = 'fachlich',
  FREUNDLICH = 'freundlich',
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

export interface Geo {
  companyName: string;
  branch: string;
  street: string;
  city: string;
  zip: string;
  region: string;
  slug: string;
  phone: string;
  email: string;
  website: string;
  topAnswer: string;
  keyFacts: string[];
}

export interface GalleryMediaItem {
    id: string;
    thumb: string;
    full: string;
    alt: string;
    caption: string;
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

export interface JobMedia {
    hero: HeroMedia;
    gallery: GalleryMediaItem[];
    logoUrl: string;
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
  media: JobMedia;
  toggles?: {
    generateFaqJsonLd?: boolean;
    generateHowToJsonLd?: boolean;
    [key: string]: boolean | undefined;
  };
}


// --- AI Generated Content Panel Structure ---

export interface Section {
  title: string;
  bullets: string[];
}

export interface Faq {
  q: string;
  a: string;
}

export interface Panel {
  slug: string;
  title: string;
  kind: 'accordion' | 'other';
  summary: string;
  sections: Section[];
  faqs: Faq[];
  keywords: string[];
  sources: any[];
  payloadHash: string;
}

// --- Job & Result Management ---

export interface JobStep {
    kind: 'profiling' | 'ci_colors' | 'panel' | 'panel_segment' | 'finalizing';
    description: string;
    index?: number;
    of?: number;
    segment?: string;
}

export interface PanelSegmentsLockState {
    title?: boolean;
    summary?: boolean;
    sections?: boolean;
    faq?: boolean;
    keywords?: boolean;
}

export interface PanelResult {
    index: number;
    status: 'pending' | 'ok' | 'failed' | 'skipped';
    panel?: Panel;
    topic: string;
    angle: string;
    error?: string;
    quality_score?: number;
    is_locked?: boolean;
    segment_locks?: PanelSegmentsLockState;
    linting_results: LintingResults;
    explainability?: {
      source_info: string;
      extracted_geo: Geo;
      duration_ms: number;
      payload_hash: string;
    };
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
  radius_px: number;
  blur_px: number;
}

export interface SectionLabels {
    summary: string;
    sections: string;
    faq: string;
    keywords: string;
}

export interface SeoData {
    title: string;
    description: string;
    jsonLd: string;
    canonical?: string;
}

export interface JobResults {
    topic?: string;
    geo: Geo;
    media: JobMedia;
    panels: PanelResult[];
    ci_colors?: CIColors;
    section_labels: SectionLabels;
    meta?: SeoData;
    set_hash?: string;
    lintSummary?: LintIssue[];
}

export interface JobError {
    code: string;
    message: string;
    atStep: string;
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

// --- Linter & Validation ---

export interface LintIssue {
    code: string;
    severity: 'ERROR' | 'WARN';
    message: string;
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

export interface LintingResults {
    passed: boolean;
    has_warnings: boolean;
    issues: LintIssue[];
    similarity_score: number;
    content_hash: string;
    quality_score_breakdown?: QualityScoreBreakdown;
}

export interface ValidationError {
  path: string;
  message: string;
  params?: { [key: string]: string | number };
}

export interface Warning {
  path: string;
  code: string;
  messageKey: string;
  params?: { [key: string]: string | number };
}

// --- Export & Misc ---

export type ExportProfile = 'gutenberg' | 'classic_inline' | 'classic_split' | 'raw_html';

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

export interface Meta {
    companyName?: string;
    street?: string;
    representatives?: string[];
    phone?: string;
    fax?: string;
    email?: string;
    taxId?: string;
    website?: string;
}

export interface Sixpack extends Job {} // Sixpack seems to be an alias for Job

// --- Health Check ---
export type HealthStatus = 'green' | 'yellow' | 'red' | 'neutral';

export interface HealthCheckResult {
    ok: boolean;
    status: HealthStatus;
    message: string;
    latency_ms?: number;
    source?: 'live' | 'mock';
    unresolved?: string[];
    duplicates?: string[];
    remaining?: number;
    quota?: number;
}

export interface RunHistory {
  id: string;
  panels: number;
  tone: string;
  detail: string;
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


// --- Layout Module Types ---
export enum FrameVariant { F1 = 'F1', F2 = 'F2', F3 = 'F3' }
export enum ContentVariant { L1 = 'L1', L2 = 'L2', L3 = 'L3', L4 = 'L4' }
export enum ButtonVariant { PRIMARY = 'primary', SECONDARY = 'secondary', GHOST = 'ghost' }
export enum ButtonPosition { HEADER = 'header', CONTENT = 'content', FOOTER = 'footer' }

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


// --- Validation Service ---
export interface FormState {
    content: string;
    geo: Geo;
    topics: string;
    panelCount: PanelCount;
}

// --- Report Service ---
export interface ValidationReport {
    schemaVersion: string;
    appVersion: string;
    timestamp: string;
    counts: {
        errors: number;
        warnings: number;
    };
    page: {
        title: string;
        slug: string;
        sectionCount: number;
    };
    toggles?: { [key: string]: boolean };
    warnings?: { path: string; code: string }[];
}


// --- dKip CLI Exporter Types ---
export interface DkipCliTheme {
  surface: string;
  text: string;
  accent: string;
  radius: number;
  blur: number;
}

export interface DkipCliPage {
  title: string;
  slug: string;
  locale: string;
  theme: DkipCliTheme;
}

export interface DkipCliDockItem {
  label: string;
  href: string;
  icon: 'phone' | 'mail' | 'share' | 'map';
}

export type DkipCliSection =
  | { id: string; type: 'Hero'; title: string; subtitle: string; mediaUrl: string; }
  | { id: string; type: 'FAQ'; faqs: Array<{ question: string; answer: string; }>; }
  | { id: string; type: 'HowTo'; steps: Array<{ name: string; text: string; }>; }
  | { id: string; type: 'HTML'; html: string; trusted: true; }
  | { id: string; type: 'Media'; url: string; alt: string; }
  | { id: string; type: 'Downloads'; files: Array<{ label: string; url: string; }>; }
  | { id: string; type: 'Accordion'; items: Array<{ title: string; content: string; }>; };

export interface DkipCliJson {
  page: DkipCliPage;
  dock: DkipCliDockItem[];
  sections: DkipCliSection[];
}


// --- ACF JSON Exporter Types ---
export interface AcfSubField {
  key: string;
  label: string;
  name: string;
  type: string;
  instructions?: string;
  required?: number;
  conditional_logic?: number;
  wrapper?: { width: string; class: string; id: string; };
  sub_fields?: AcfSubField[];
  min?: string | number;
  max?: string | number;
  button_label?: string;
  tabs?: string;
  toolbar?: string;
  [key: string]: any;
}

export interface AcfLayout {
  key: string;
  name: string;
  label: string;
  display: string;
  sub_fields: AcfSubField[];
  min: string;
  max: string;
}

export interface AcfField {
  key: string;
  label: string;
  name: string;
  type: string;
  instructions: string;
  required: number;
  conditional_logic: number;
  wrapper: { width: string; class: string; id: string; };
  layouts?: AcfLayout[];
  button_label?: string;
  min?: string;
  max?: string;
}

export interface AcfFieldGroup {
  key: string;
  title: string;
  fields: AcfField[];
  location: [Array<{ param: string; operator: string; value: string; }>];
  menu_order: number;
  position: string;
  style: string;
  label_placement: string;
  instruction_placement: string;
  hide_on_screen: string[];
  active: boolean;
  description: string;
}

export interface AcfExport {
    field_groups: AcfFieldGroup[];
}

// --- Autosave Draft Types ---
export interface FormDraftData {
  inputType: InputType;
  content: string;
  geo: Geo;
  tone: Tone;
  panelCount: PanelCount;
  contentDepth: ContentDepth;
  keepDesign: boolean;
  topics: string;
  outputFormat: 'onepage' | 'legacy';
  media: JobMedia;
  jsonLdToggles: {
      generateFaqJsonLd: boolean;
      generateHowToJsonLd: boolean;
  };
}

export interface FormDraft {
    formData: FormDraftData;
    timestamp: number;
    appVersion: string;
    schemaVersion: string;
}
