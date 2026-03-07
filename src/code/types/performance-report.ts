// Simplified Performance Report Types

export interface TopAction {
  priority: number;
  title: string;
  impact: string;
  fix: string;
  lineNumber?: number;
  codeSnippet?: string;
}

export interface PerformanceReport {
  overallScore: number;
  topActions: TopAction[];
}

