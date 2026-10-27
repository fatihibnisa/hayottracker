import {
  Atom,
  Bike,
  BookOpen,
  Brain,
  Briefcase,
  Calculator,
  Camera,
  Code2,
  Dumbbell,
  Gamepad2,
  Globe,
  Guitar,
  Heart,
  Languages,
  Mic2,
  Music,
  Paintbrush,
  PenTool,
  Rocket,
  Sparkles,
  Target,
  Utensils,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const SKILL_ICONS: { key: string; icon: LucideIcon }[] = [
  { key: 'code', icon: Code2 },
  { key: 'languages', icon: Languages },
  { key: 'dumbbell', icon: Dumbbell },
  { key: 'music', icon: Music },
  { key: 'guitar', icon: Guitar },
  { key: 'paintbrush', icon: Paintbrush },
  { key: 'book', icon: BookOpen },
  { key: 'brain', icon: Brain },
  { key: 'calculator', icon: Calculator },
  { key: 'camera', icon: Camera },
  { key: 'globe', icon: Globe },
  { key: 'rocket', icon: Rocket },
  { key: 'heart', icon: Heart },
  { key: 'utensils', icon: Utensils },
  { key: 'briefcase', icon: Briefcase },
  { key: 'pen', icon: PenTool },
  { key: 'gamepad', icon: Gamepad2 },
  { key: 'bike', icon: Bike },
  { key: 'target', icon: Target },
  { key: 'mic', icon: Mic2 },
  { key: 'atom', icon: Atom },
  { key: 'sparkles', icon: Sparkles },
];

export function skillIcon(key: string | null | undefined): LucideIcon {
  return SKILL_ICONS.find((s) => s.key === key)?.icon || Sparkles;
}
