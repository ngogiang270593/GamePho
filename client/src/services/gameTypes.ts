export type PhoType = number;
export type CustomerType = number;

export interface Player {
  id: number;
  displayName: string;
  money: number;
  reputation: number;
  viralScore: number;
  level: number;
  currentDay: number;
  customersServedToday: number;
  viralProgress: number;
  viralToNextLevel: number;
}

export interface PlayerCharacter {
  displayName: string;
  avatar: string;
  appearance?: import('../game/character').CharacterAppearance;
}

export interface Customer {
  personaKey?: string;
  secondsRemaining?: number | null;
  id: number;
  name: string;
  customerType: CustomerType;
  hunger: number;
  patience: number;
  preferredPhoType: PhoType | null;
  requiredToppings: string;
  arrivedAt: string;
  dialogue: string;
}

export interface PhoMenuItem {
  id: number;
  name: string;
  phoType: PhoType;
  basePrice: number;
  isAvailable: boolean;
  isDailySpecial: boolean;
  description: string;
}

export interface Topping {
  id: number;
  name: string;
  price: number;
}

export interface Upgrade {
  id: number;
  name: string;
  description: string;
  category: string;
  level: number;
  maxLevel: number;
  cost: number;
  effectValue: number;
  isPurchased: boolean;
}

export interface EventOption {
  id: number;
  text: string;
  moneyChange?: number;
  reputationChange?: number;
  viralChange?: number;
  path?: string;
}

export interface RandomEvent {
  actor?: string;
  id: number;
  title: string;
  description: string;
  eventType: string;
  options: EventOption[];
}

export interface ResolveEventResult { resultText: string; money: number; reputation: number; viralScore: number }

export interface Achievement {
  id: number;
  name: string;
  description: string;
  code: string;
  targetValue: number;
  currentValue: number;
  isUnlocked: boolean;
  unlockedAt: string | null;
}

export interface GameState {
  journey?: import('../game/journey').Journey;
  player: Player;
  waitingCustomers: Customer[];
  menu: PhoMenuItem[];
  toppings: Topping[];
  upgrades: Upgrade[];
  purchasedUpgrades: Pick<Upgrade, 'id' | 'name' | 'level' | 'maxLevel' | 'isPurchased'>[];
  randomEvents: RandomEvent[];
  achievements: Achievement[];
  unlockedFeatures: { level: number; name: string; description: string }[];
}

export interface PhoOrder {
  id: number;
  price: number;
  isCorrect: boolean;
  reputationChange: number;
  viralChange: number;
  createdAt: string;
  requestedServiceTimeSeconds: number;
  effectiveServiceTimeSeconds: number;
  serviceTimeReductionSeconds: number;
  bonusMoney: number;
  moneyChange: number;
  dramaTriggered: boolean;
  message: string;
}

export interface CreatePhoOrderRequest {
  customerId: number;
  phoType: PhoType;
  toppings: string;
  serviceTimeSeconds: number;
}

export interface FootballResult {
  isGoal: boolean;
  score: number;
  moneyReward: number;
  viralReward: number;
  commentary: string;
}

export interface FootballPlayRequest {
  shotPower: number;
  shotAngle: number;
  timingScore: number;
}

export interface StartDayResult {
  currentDay: number;
  operatingCost: number;
  remainingMoney: number;
  customers: Customer[];
  event: RandomEvent | null;
  message: string;
}

export interface GameStatistics {
  totalOrders: number;
  correctOrders: number;
  totalRevenue: number;
  totalGoals: number;
  currentStreak: number;
  shopLevel: number;
}

export interface RevenueHistory {
  date: string;
  revenue: number;
}

export interface OrderHistory {
  id: number;
  customerName: string;
  phoType: string;
  toppings: string;
  price: number;
  isCorrect: boolean;
  serviceTimeSeconds: number;
  createdAt: string;
}

export interface EventHistory {
  id: number;
  actionType: string;
  summary: string;
  moneyChange: number;
  reputationChange: number;
  viralChange: number;
  createdAt: string;
}
