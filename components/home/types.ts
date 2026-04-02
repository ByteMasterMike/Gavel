export type CaseRow = {
  id: string;
  title: string;
  tier: number;
  kind: string;
  category: string;
  parTimeMinutes: number;
  briefSummary: string;
};

export type DailySummary = {
  case: {
    id: string;
    title: string;
    tier: number;
    category: string;
    briefSummary: string;
  };
};
