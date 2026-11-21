import {
  CheckCircle2,
  ClipboardList,
  Flame,
  Hand,
  Ruler,
  Sparkles,
  Wrench,
} from 'lucide-react';
import type { StepIconKey } from '../types/tutorial.ts';

interface StepIconProps {
  iconKey: StepIconKey;
  className?: string;
}

export function StepIcon({ iconKey, className = 'w-5 h-5' }: StepIconProps) {
  switch (iconKey) {
    case 'prepare':
      return <ClipboardList className={className} aria-hidden="true" />;
    case 'hand':
      return <Hand className={className} aria-hidden="true" />;
    case 'tool':
      return <Wrench className={className} aria-hidden="true" />;
    case 'measure':
      return <Ruler className={className} aria-hidden="true" />;
    case 'heat':
      return <Flame className={className} aria-hidden="true" />;
    case 'check':
      return <CheckCircle2 className={className} aria-hidden="true" />;
    case 'finish':
      return <Sparkles className={className} aria-hidden="true" />;
    default:
      return <Hand className={className} aria-hidden="true" />;
  }
}
