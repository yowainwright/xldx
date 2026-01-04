export const PLUGIN_NAME = "@xldx/conditional-formatting";
export const PLUGIN_VERSION = "0.0.1";

export const ICON_COUNTS: Record<string, number> = {
  "3Arrows": 3,
  "3ArrowsGray": 3,
  "3Flags": 3,
  "3TrafficLights1": 3,
  "3TrafficLights2": 3,
  "3Signs": 3,
  "3Symbols": 3,
  "3Symbols2": 3,
  "4Arrows": 4,
  "4ArrowsGray": 4,
  "4Rating": 4,
  "4RedToBlack": 4,
  "4TrafficLights": 4,
  "5Arrows": 5,
  "5ArrowsGray": 5,
  "5Rating": 5,
  "5Quarters": 5,
};

export const OPERATOR_MAP: Record<string, string> = {
  equal: "equal",
  notEqual: "notEqual",
  greaterThan: "greaterThan",
  lessThan: "lessThan",
  greaterThanOrEqual: "greaterThanOrEqual",
  lessThanOrEqual: "lessThanOrEqual",
  between: "between",
  notBetween: "notBetween",
};
