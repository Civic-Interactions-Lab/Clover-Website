import {
  BaseSuggestion,
  BlockSuggestionLogResponse,
  CodeBlockSuggestion,
  CodeSelectionSuggestion,
  LineByLineSuggestion,
  LineSuggestionLogResponse,
  SelectionSuggestionLogResponse,
  UserActivityLogItem,
} from "./suggestion";

const CODE_BLOCK_MODE = {
  route: "code-block",
  logType: {} as BlockSuggestionLogResponse,
  getId: (log: UserActivityLogItem) =>
    (log as BlockSuggestionLogResponse).suggestionId,
  transform: (
    data: { suggestion_array?: string[]; explanations?: string[] },
    base: BaseSuggestion
  ): CodeBlockSuggestion => ({
    ...base,
    suggestionArray: data.suggestion_array || [],
    explanations: data.explanations,
  }),
} as const;

const LINE_BY_LINE_MODE = {
  route: "line-by-line",
  logType: {} as LineSuggestionLogResponse,
  getId: (log: UserActivityLogItem) =>
    (log as LineSuggestionLogResponse).lineSuggestionId,
  transform: (
    data: {
      correct_line?: string;
      incorrect_line?: string;
      shown_bug: boolean;
    },
    base: BaseSuggestion
  ): LineByLineSuggestion => ({
    ...base,
    correctLine: data.correct_line || "",
    incorrectLine: data.incorrect_line || "",
    shownBug: data.shown_bug,
  }),
} as const;

const CODE_SELECTION_MODE = {
  route: "code-selection",
  logType: {} as SelectionSuggestionLogResponse,
  getId: (log: UserActivityLogItem) =>
    (log as SelectionSuggestionLogResponse).selectionSuggestionItemId,
  transform: (
    data: { suggestion_text?: string; explanation?: string },
    base: BaseSuggestion
  ): CodeSelectionSuggestion => ({
    ...base,
    suggestionText: data.suggestion_text || "",
    explanation: data.explanation,
  }),
} as const;

export const MODE_CONFIG = {
  CODE_BLOCK: CODE_BLOCK_MODE,
  LINE_BY_LINE: LINE_BY_LINE_MODE,
  CODE_SELECTION: CODE_SELECTION_MODE,
} as const;

export function getModeComponent<T extends keyof typeof MODE_CONFIG>(
  mode: T,
  component: keyof (typeof MODE_CONFIG)[T]
) {
  return MODE_CONFIG[mode][component];
}
