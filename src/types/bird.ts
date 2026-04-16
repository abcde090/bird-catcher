export type ConservationStatus =
  | 'extinct'
  | 'critically_endangered'
  | 'endangered'
  | 'vulnerable'
  | 'near_threatened'
  | 'least_concern';

export type HabitatType =
  | 'rainforest'
  | 'eucalyptus_forest'
  | 'wetland'
  | 'grassland'
  | 'desert'
  | 'coastal'
  | 'mangrove'
  | 'alpine'
  | 'urban';

export type AustralianRegionId =
  | 'nsw' | 'vic' | 'qld' | 'wa'
  | 'sa'  | 'tas' | 'nt'  | 'act';

export interface BirdSpecies {
  id: string;
  commonName: string;
  scientificName: string;
  family: string;
  order: string;
  category: string;
  description: string;
  conservationStatus: ConservationStatus;
  habitats: HabitatType[];
  regions: AustralianRegionId[];
  imageUrl: string;
  imageCredit: string;
  diet: string;
  size: { lengthCm: number; wingspanCm?: number; weightG?: number };
  funFact: string;
  population: PopulationEstimate;
  coordinates: { lat: number; lng: number };
}

export interface PopulationEstimate {
  current: number;
  trend: 'increasing' | 'stable' | 'decreasing' | 'unknown';
  lastSurveyYear: number;
}

export interface RegionData {
  id: AustralianRegionId;
  name: string;
  speciesCount: number;
  center: { lat: number; lng: number };
}

export interface FilterState {
  searchQuery: string;
  regions: AustralianRegionId[];
  habitats: HabitatType[];
  conservationStatuses: ConservationStatus[];
  sortBy: 'name' | 'status' | 'population';
  sortDirection: 'asc' | 'desc';
}
