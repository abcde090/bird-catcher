export type ConservationStatus =
  | "least_concern"
  | "near_threatened"
  | "vulnerable"
  | "endangered"
  | "critically_endangered";

export interface BirdSpecies {
  id: string;
  name: string;
  scientific: string;
  category: string;
  status: ConservationStatus;
  habitats: string[];
  diet: string;
  funFact: string;
  size: number;
  population: string;
  imageUrl: string;
}
