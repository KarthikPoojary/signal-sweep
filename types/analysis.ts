export interface RawIssue {
  id: number;
  title: string;
  body: string | null;
  labels: string[];
  created_at: string;
  closed_at: string | null;
  state: 'open' | 'closed';
  url: string;
}

export interface Cluster {
  name: string;
  count: number;
  severity: 'high' | 'medium' | 'low';
  example_titles: string[];
  remediation_theme: string;
}

export interface AnalysisResult {
  top_level_summary: string;
  total_count: number;
  clusters: Cluster[];
  key_insight: string;
}

export interface ExecutiveSummaryResult {
  summary: string;
}
