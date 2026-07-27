import overviewRaw from '../README.md?raw';
import missionRaw from '../business/identity/mission-vision-values.md?raw';
import positioningRaw from '../business/identity/positioning-one-pager.md?raw';
import landscapeRaw from '../marketing/competitive-landscape.md?raw';

export interface ContentSource {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  group: 'Home' | 'Identity' | 'Market';
  sourcePath: string;
  raw: string;
  order: number;
  accent: 'coral' | 'aqua' | 'gold' | 'violet';
}

export const contentSources: ContentSource[] = [
  {
    id: 'overview',
    title: 'Business Home Base',
    shortTitle: 'Overview',
    description: 'How to read the Draft-0 workspace, what is public, and how feedback becomes a decision.',
    group: 'Home',
    sourcePath: 'README.md',
    raw: overviewRaw,
    order: 1,
    accent: 'coral',
  },
  {
    id: 'mission-vision-values',
    title: 'Mission, Vision & Values',
    shortTitle: 'Mission & values',
    description: 'Three sourced directions and four working values, presented as options rather than adopted statements.',
    group: 'Identity',
    sourcePath: 'business/identity/mission-vision-values.md',
    raw: missionRaw,
    order: 2,
    accent: 'aqua',
  },
  {
    id: 'positioning',
    title: 'Positioning',
    shortTitle: 'Positioning',
    description: 'A plain-language account of what Noah is, who it may serve first, and what makes the product different.',
    group: 'Identity',
    sourcePath: 'business/identity/positioning-one-pager.md',
    raw: positioningRaw,
    order: 3,
    accent: 'gold',
  },
  {
    id: 'competitive-landscape',
    title: 'Competitive Landscape',
    shortTitle: 'Market landscape',
    description: 'A sourced comparison of seven wallets and the specific combination Noah brings to the market.',
    group: 'Market',
    sourcePath: 'marketing/competitive-landscape.md',
    raw: landscapeRaw,
    order: 4,
    accent: 'violet',
  },
];

export const excludedReviewPaths: Record<string, true> = {
  'OPEN-QUESTIONS.md': true,
  'business/identity/user-personas.md': true,
  'business/strategy/lean-canvas.md': true,
  'business/strategy/business-plan.md': true,
  'business/strategy/revenue-model-options.md': true,
  'business/ops/operating-cadence.md': true,
  'business/voice/brand-voice-guide.md': true,
  'business/voice/telegram-corpus.md': true,
  'business/strategy/fact-base.md': true,
  'marketing/gtm-plan.md': true,
  'team/telegram-digest.md': true,
  'team/buzz-handoff.md': true,
};
