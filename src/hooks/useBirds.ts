import { useMemo } from 'react';
import { useBirdStore } from '../stores/useBirdStore';
import { useFilterStore } from '../stores/useFilterStore';
import type { BirdSpecies, ConservationStatus } from '../types/bird';

const STATUS_SEVERITY: Record<ConservationStatus, number> = {
  extinct: 0,
  critically_endangered: 1,
  endangered: 2,
  vulnerable: 3,
  near_threatened: 4,
  least_concern: 5,
};

export function useBirds(): BirdSpecies[] {
  const birds = useBirdStore((s) => s.birds);
  const filters = useFilterStore((s) => s.filters);

  return useMemo(() => {
    let result = [...birds];

    // Filter by search query
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.commonName.toLowerCase().includes(q) ||
          b.scientificName.toLowerCase().includes(q),
      );
    }

    // Filter by regions (intersection: bird must be in at least one selected region)
    if (filters.regions.length > 0) {
      result = result.filter((b) =>
        filters.regions.some((r) => b.regions.includes(r)),
      );
    }

    // Filter by habitats (intersection: bird must have at least one selected habitat)
    if (filters.habitats.length > 0) {
      result = result.filter((b) =>
        filters.habitats.some((h) => b.habitats.includes(h)),
      );
    }

    // Filter by conservation statuses
    if (filters.conservationStatuses.length > 0) {
      result = result.filter((b) =>
        filters.conservationStatuses.includes(b.conservationStatus),
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (filters.sortBy) {
        case 'name':
          return a.commonName.localeCompare(b.commonName);
        case 'status':
          return STATUS_SEVERITY[a.conservationStatus] - STATUS_SEVERITY[b.conservationStatus];
        case 'population':
          return a.population.current - b.population.current;
        default:
          return 0;
      }
    });

    if (filters.sortDirection === 'desc') {
      result.reverse();
    }

    return result;
  }, [birds, filters]);
}
