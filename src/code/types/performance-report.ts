export interface ReportMeta {
  reportType: string;
  scope: string;
  analysisMode: string;
  generatedFrom: string;
  confidence: string;
  lineNumberMode: string;
  limitations: string[];
}

export interface CoreWebVitalsReadiness {
  lcp: number;
  cls: number;
  inp: number;
}

export interface EstimatedScores {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  coreWebVitalsReadiness: CoreWebVitalsReadiness;
}

export interface WebVitalAssessment {
  status: string;
  summary: string;
  likelyDrivers: string[];
  recommendedActions: string[];
}

export interface CoreWebVitalsAssessment {
  lcp: WebVitalAssessment;
  cls: WebVitalAssessment;
  inp: WebVitalAssessment;
}

export interface FormatAssessment {
  good: string[];
  concerns: string[];
}

export interface ImageAnalysisSummary {
  totalImagePattern: string;
  aboveTheFoldCriticalImages: number;
  belowTheFoldImages: string;
  declaredFormatsDetectedInUrls: string[];
  querystringTransformationHintDetected: boolean;
  likelyServedModernFormats: boolean;
  formatAssessment: FormatAssessment;
}

export interface DeclaredDimensions {
  width: number | null;
  height: number | null;
}

export interface CriticalImage {
  id: string;
  markupLineApprox: number;
  selectorHint: string;
  url: string;
  role: string;
  declaredFormatFromPath: string;
  likelyServedFormat: string;
  declaredDimensions: DeclaredDimensions;
  loading: string;
  fetchPriority: string;
  weightBytes: number | null;
  weightStatus: string;
  risk: string;
  analysis: string;
  suggestedFix: string;
}

export interface FormatRecommendation {
  issue: string;
  recommendation: string;
}

export interface ImageAnalysis {
  summary: ImageAnalysisSummary;
  criticalImages: CriticalImage[];
  formatRecommendations: FormatRecommendation[];
}

export interface Issue {
  id: string;
  category: string;
  severity: string;
  metricImpact: string[];
  title: string;
  markupLineApprox: number;
  selectorHint: string;
  evidenceSnippet: string;
  problem: string;
  whyItMatters: string;
  suggestedFix: string;
  fixExample: string;
  priority: string;
}

export interface QuickWin {
  id: string;
  title: string;
  impact: string[];
  effort: string;
  relatedLineApprox: number;
}

export interface StrategicRecommendation {
  id: string;
  title: string;
  description: string;
  expectedImpact: string[];
  priority: string;
}

export interface PriorityRoadmap {
  P1: string[];
  P2: string[];
  P3: string[];
}

export interface NextStepRecommendation {
  bestNextAction: string;
  why: string;
}

export interface PerformanceReport {
  reportMeta: ReportMeta;
  estimatedScores: EstimatedScores;
  coreWebVitalsAssessment: CoreWebVitalsAssessment;
  imageAnalysis: ImageAnalysis;
  issues: Issue[];
  quickWins: QuickWin[];
  strategicRecommendations: StrategicRecommendation[];
  priorityRoadmap: PriorityRoadmap;
  nextStepRecommendation: NextStepRecommendation;
}
