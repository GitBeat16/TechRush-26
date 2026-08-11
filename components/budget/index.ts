/**
 * Smart Budget Planner.
 *
 * Three questions, in the order a first-time visitor asks them:
 *   what does this cost → what is it made of → how do I make it cheaper
 *
 * Per-category editing and what-if modelling sit behind FineTuneDrawer,
 * closed by default. Health is a chip inside the hero rather than a section,
 * and the spend ranking lives in the allocation legend rather than a second
 * chart of the same numbers.
 */

export { TripIntelligenceHero } from "./TripIntelligenceHero";
export type { TripIntelligenceHeroProps } from "./TripIntelligenceHero";

export { BudgetAllocationStudio } from "./BudgetAllocationStudio";
export type { BudgetAllocationStudioProps } from "./BudgetAllocationStudio";

export { AssistantRecommendations } from "./AssistantRecommendations";
export type { AssistantRecommendationsProps } from "./AssistantRecommendations";

export { FineTuneDrawer } from "./FineTuneDrawer";
export type { FineTuneDrawerProps } from "./FineTuneDrawer";

export { WhatIfSimulator } from "./WhatIfSimulator";
export type { WhatIfSimulatorProps } from "./WhatIfSimulator";

export { CategoryEditors } from "./CategoryEditors";
export type { CategoryEditorsProps } from "./CategoryEditors";

/* Shared primitives */

export { AnimatedNumber } from "./AnimatedNumber";
export type { AnimatedNumberProps } from "./AnimatedNumber";

export { ClayDropdown, ClaySelect } from "./ClaySelect";
export type { ClayOption, ClaySelectProps } from "./ClaySelect";

export { BudgetIcon } from "./BudgetIcons";
export type { BudgetIconProps } from "./BudgetIcons";
