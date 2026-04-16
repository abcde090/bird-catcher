import type { HabitatType } from '../../types/bird';
import { HABITAT_LABELS, HABITAT_ICONS } from '../../lib/constants';

interface Props {
  habitat: HabitatType;
}

export default function HabitatTag({ habitat }: Props) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-sand-200 px-2 py-0.5 text-xs font-medium text-bark-700">
      <span aria-hidden="true">{HABITAT_ICONS[habitat]}</span>
      {HABITAT_LABELS[habitat]}
    </span>
  );
}
