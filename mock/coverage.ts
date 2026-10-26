import type {
  CoverageFlags,
  CoverageLocation,
  CoverageScenarioId,
} from "@/lib/coverage/types";

export type CoverageScenario = {
  id: CoverageScenarioId;
  location: CoverageLocation;
  status: "AVAILABLE" | "COMPLEX";
  coverage?: CoverageFlags;
  requiresOfficialCheck?: boolean;
  keywords: string[];
};

export const coverageScenarios: Record<CoverageScenarioId, CoverageScenario> = {
  full: {
    id: "full",
    location: {
      line1: "14 Oxford Road",
      suburb: "Rosebank",
      city: "Johannesburg",
      formatted: "14 Oxford Road, Rosebank, Johannesburg",
      lat: -26.146,
      lng: 28.036,
      scenarioId: "full",
    },
    status: "AVAILABLE",
    coverage: {
      fiveG: true,
      fourG: true,
      lte: true,
      fibre: true,
    },
    keywords: ["oxford", "rosebank", "14 oxford"],
  },
  partial: {
    id: "partial",
    location: {
      line1: "83 Rivonia Road",
      suburb: "Sandton",
      city: "Johannesburg",
      formatted: "83 Rivonia Road, Sandton, Johannesburg",
      lat: -26.107,
      lng: 28.056,
      scenarioId: "partial",
    },
    status: "AVAILABLE",
    coverage: {
      fiveG: false,
      fourG: true,
      lte: true,
      fibre: true,
    },
    keywords: ["rivonia", "sandton", "83 rivonia"],
  },
  complex: {
    id: "complex",
    location: {
      line1: "Farm 42, R354",
      suburb: "Sutherland",
      city: "Northern Cape",
      formatted: "Farm 42, R354, Sutherland, Northern Cape",
      lat: -32.398,
      lng: 20.66,
      scenarioId: "complex",
    },
    status: "COMPLEX",
    requiresOfficialCheck: true,
    keywords: ["sutherland", "farm 42", "r354", "northern cape", "complex"],
  },
  centurion: {
    id: "centurion",
    location: {
      line1: "Centurion Mall",
      suburb: "Centurion",
      city: "Pretoria",
      formatted: "Centurion Mall, Centurion, Pretoria",
      lat: -25.8603,
      lng: 28.1894,
      scenarioId: "centurion",
    },
    status: "AVAILABLE",
    coverage: {
      fiveG: true,
      fourG: true,
      lte: true,
      fibre: false,
    },
    keywords: ["centurion", "pretoria", "centurion mall"],
  },
};

export const coverageSuggestions: Array<{
  id: CoverageScenarioId;
  label: string;
}> = [
  { id: "full", label: coverageScenarios.full.location.formatted },
  { id: "partial", label: coverageScenarios.partial.location.formatted },
  { id: "centurion", label: coverageScenarios.centurion.location.formatted },
  { id: "complex", label: coverageScenarios.complex.location.formatted },
];
