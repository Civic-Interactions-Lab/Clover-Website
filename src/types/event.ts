import { UserMode } from "./user";

export const ACCEPT_EVENTS = [
  "SUGGESTION_ACCEPT",
  "SUGGESTION_LINE_ACCEPT",
  "SUGGESTION_SELECTION_ACCEPT",
  "SUGGESTION_TAB_ACCEPT",
  "SUGGESTION_TAB_CLICKED", // line-by-line accept via tab key
];

export const REJECT_EVENTS = ["SUGGESTION_REJECT", "SUGGESTION_LINE_REJECT"];

export const getEventsForMode = (mode: UserMode) => {
  switch (mode) {
    case UserMode.CODE_BLOCK:
      return {
        accept: ["SUGGESTION_ACCEPT"],
        reject: ["SUGGESTION_REJECT"],
      };
    case UserMode.LINE_BY_LINE:
      return {
        accept: [
          "SUGGESTION_LINE_ACCEPT",
          "SUGGESTION_TAB_ACCEPT",
          "SUGGESTION_TAB_CLICKED",
        ],
        reject: ["SUGGESTION_LINE_REJECT"],
      };
    case UserMode.CODE_SELECTION:
      return {
        accept: ["SUGGESTION_SELECTION_ACCEPT"],
        reject: [],
      };
  }
};
