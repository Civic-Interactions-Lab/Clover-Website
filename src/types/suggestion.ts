export interface BaseSuggestion {
  id: string;
  createdAt: string;
  prompt: string;
  hasBug: boolean;
  shownBug?: boolean;
  duration: number;
  model: string;
  vendor: string;
  language?: string;
  refinedPrompt?: string;
  explanations?: string[];
}

export interface CodeBlockSuggestion extends BaseSuggestion {
  suggestionArray: string[];
  explanation?: string;
}

export interface LineByLineSuggestion extends BaseSuggestion {
  correctLine?: string;
  incorrectLine?: string;
  shownBug: boolean;
  lineIndex?: number;
  suggestions: Array<{
    correctLine: string;
    incorrectLine: string;
  }>;
}

export interface CodeSelectionSuggestion extends BaseSuggestion {
  suggestionText: string;
  explanation?: string;
}

export type SuggestionData =
  | CodeBlockSuggestion
  | LineByLineSuggestion
  | CodeSelectionSuggestion;

interface BaseLogResponse {
  id: string;
  event: string;
  duration: number;
  userId: string;
  classId?: string;
  createdAt: string;
  hasBug?: boolean;
  type?: string;
  classTitle?: string;
  classCode?: string;
}

export interface BlockSuggestionLogResponse extends BaseLogResponse {
  suggestionId: string;
}

export interface LineSuggestionLogResponse extends BaseLogResponse {
  lineSuggestionId: string;
  suggestions: LineByLineSuggestion;
}

export interface SelectionSuggestionLogResponse extends BaseLogResponse {
  selectionSuggestionItemId: string;
}

export type UserActivityLogItem =
  | BlockSuggestionLogResponse
  | LineSuggestionLogResponse
  | SelectionSuggestionLogResponse;

export type ActivityLogResponse = UserActivityLogItem[];

export interface AIStats {
  id: string;
  created_at: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  model: string;
  latency_seconds: number;
  provider: string;
}
