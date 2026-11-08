export const OPENING_MAP_DELIVERY_QUEST_KEY = 'opening-map-delivery-quest-v1';

export type OpeningMapDeliveryQuestStage = 'available' | 'carrying' | 'delivered' | 'completed' | 'clue-revealed' | 'tao-informed';
export type OpeningMapDeliveryQuestAction = 'accept' | 'deliver' | 'report' | 'reveal-clue' | 'ask-tao';

export interface OpeningMapDeliveryQuestState {
  stage: OpeningMapDeliveryQuestStage;
}

export const INITIAL_OPENING_MAP_DELIVERY_QUEST: OpeningMapDeliveryQuestState = { stage: 'available' };
const OPENING_MAP_DELIVERY_QUEST_STAGES: readonly OpeningMapDeliveryQuestStage[] = [
  'available', 'carrying', 'delivered', 'completed', 'clue-revealed', 'tao-informed',
];

export function readOpeningMapDeliveryQuest(): OpeningMapDeliveryQuestState {
  const raw = localStorage.getItem(OPENING_MAP_DELIVERY_QUEST_KEY);
  if (raw === null) return INITIAL_OPENING_MAP_DELIVERY_QUEST;
  let value: unknown;
  try { value = JSON.parse(raw); }
  catch { throw new Error('Không đọc được tiến độ nhiệm vụ Giao hàng trên thiết bị.'); }
  if (!value || typeof value !== 'object'
    || !OPENING_MAP_DELIVERY_QUEST_STAGES.some(stage => stage === (value as Record<string, unknown>).stage)) {
    throw new Error('Tiến độ nhiệm vụ Giao hàng không hợp lệ.');
  }
  return { stage: (value as { stage: OpeningMapDeliveryQuestStage }).stage };
}

export function advanceOpeningMapDeliveryQuest(
  state: OpeningMapDeliveryQuestState,
  action: OpeningMapDeliveryQuestAction,
): OpeningMapDeliveryQuestState {
  const nextStage: Record<OpeningMapDeliveryQuestAction, OpeningMapDeliveryQuestStage> = {
    accept: 'carrying',
    deliver: 'delivered',
    report: 'completed',
    'reveal-clue': 'clue-revealed',
    'ask-tao': 'tao-informed',
  };
  const requiredStage: Record<OpeningMapDeliveryQuestAction, OpeningMapDeliveryQuestStage> = {
    accept: 'available',
    deliver: 'carrying',
    report: 'delivered',
    'reveal-clue': 'completed',
    'ask-tao': 'clue-revealed',
  };
  if (state.stage !== requiredStage[action]) throw new Error('Nhiệm vụ Giao hàng chưa sẵn sàng cho bước này.');
  return { stage: nextStage[action] };
}

export function saveOpeningMapDeliveryQuest(state: OpeningMapDeliveryQuestState): void {
  localStorage.setItem(OPENING_MAP_DELIVERY_QUEST_KEY, JSON.stringify(state));
}
