import type { AustralianRegionId, ConservationStatus, HabitatType } from '../types/bird';

export const AUSTRALIA_CENTER = { lat: -25.27, lng: 133.77 };
export const DEFAULT_ZOOM = 4;

export const REGION_NAMES: Record<AustralianRegionId, string> = {
  nsw: 'New South Wales',
  vic: 'Victoria',
  qld: 'Queensland',
  wa: 'Western Australia',
  sa: 'South Australia',
  tas: 'Tasmania',
  nt: 'Northern Territory',
  act: 'Australian Capital Territory',
};

export const CONSERVATION_LABELS: Record<ConservationStatus, string> = {
  extinct: 'Extinct',
  critically_endangered: 'Critically Endangered',
  endangered: 'Endangered',
  vulnerable: 'Vulnerable',
  near_threatened: 'Near Threatened',
  least_concern: 'Least Concern',
};

export const CONSERVATION_COLORS: Record<ConservationStatus, string> = {
  extinct: '#6B7280',
  critically_endangered: '#DC4545',
  endangered: '#E85D45',
  vulnerable: '#E8A834',
  near_threatened: '#D4A843',
  least_concern: '#4CAF50',
};

export const HABITAT_LABELS: Record<HabitatType, string> = {
  rainforest: 'Rainforest',
  eucalyptus_forest: 'Eucalyptus Forest',
  wetland: 'Wetland',
  grassland: 'Grassland',
  desert: 'Desert',
  coastal: 'Coastal',
  mangrove: 'Mangrove',
  alpine: 'Alpine',
  urban: 'Urban',
};

export const HABITAT_ICONS: Record<HabitatType, string> = {
  rainforest: '🌿',
  eucalyptus_forest: '🌲',
  wetland: '💧',
  grassland: '🌾',
  desert: '🏜️',
  coastal: '🏖️',
  mangrove: '🌊',
  alpine: '🏔️',
  urban: '🏙️',
};
