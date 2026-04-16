import type { ConservationStatus } from '../../types/bird';
import { CONSERVATION_LABELS, CONSERVATION_COLORS } from '../../lib/constants';

interface Props {
  status: ConservationStatus;
}

export default function ConservationBadge({ status }: Props) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
      style={{ backgroundColor: CONSERVATION_COLORS[status] }}
    >
      {CONSERVATION_LABELS[status]}
    </span>
  );
}
