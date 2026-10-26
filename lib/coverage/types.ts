export type CoverageFocus = "any" | "5g" | "fibre";

export type CoverageStep =
  | "idle"
  | "ask_location"
  | "location_entered"
  | "location_confirmed"
  | "checking"
  | "available"
  | "complex"
  | "error";

export type CoverageScenarioId = "full" | "partial" | "complex" | "centurion";

export type CoverageLocation = {
  line1: string;
  suburb: string;
  city: string;
  formatted: string;
  lat: number;
  lng: number;
  scenarioId: CoverageScenarioId;
};

export type CoverageFlags = {
  fiveG: boolean;
  fourG: boolean;
  lte: boolean;
  fibre: boolean;
};

export type CoverageApiCoverage = {
  "5g": boolean;
  "4g": boolean;
  lte: boolean;
  fibre: boolean;
};

export type CoverageCheckResponse = {
  address: string;
  status: "AVAILABLE" | "COMPLEX";
  coverage?: CoverageApiCoverage;
  requiresOfficialCheck?: boolean;
  /** "live" = real flags from Vodacom GIS · "demo" = mock scenario table */
  source?: "live" | "demo";
};

export type CoverageState = {
  step: CoverageStep;
  focus: CoverageFocus;
  location: CoverageLocation | null;
  result: CoverageCheckResponse | null;
};

export const VODACOM_COVERAGE_MAP_URL =
  "https://myvodacom.secure.vodacom.co.za";
export const VODACOM_5G_EXPLORE_URL = VODACOM_COVERAGE_MAP_URL;
export const VODACOM_FIBRE_EXPLORE_URL = VODACOM_COVERAGE_MAP_URL;
