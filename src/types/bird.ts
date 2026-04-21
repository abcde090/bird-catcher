export type ConservationStatus =
  | "least_concern"
  | "near_threatened"
  | "vulnerable"
  | "endangered"
  | "critically_endangered";

export type AustralianStateId =
  | "nsw"
  | "vic"
  | "qld"
  | "wa"
  | "sa"
  | "tas"
  | "nt"
  | "act";

export interface BirdSpecies {
  id: string;
  name: string;
  scientific: string;
  category: string;
  status: ConservationStatus;
  habitats: string[];
  regions: AustralianStateId[];
  diet: string;
  funFact: string;
  size: number;
  population: string;
  imageUrl: string;
  /** Optional — local path to a Wikipedia-sourced distribution map. */
  rangeMapUrl?: string;
}
