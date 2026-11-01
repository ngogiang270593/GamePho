export const CARD_COLORS = ['red', 'blue', 'green', 'yellow'] as const;
export type CardColor = typeof CARD_COLORS[number];
export type CardFace = `${number}` | 'reverse' | 'skip' | 'draw2' | 'wild' | 'draw4' | 'random' | 'swap' | 'everyone' | 'shield';
export interface PlayingCard { id: number; color: CardColor | null; face: CardFace }
export type CardMode = 'quick' | 'adventure' | 'bots' | 'friends' | 'daily';
export type CardDifficulty = 'easy' | 'medium' | 'hard';
export type CardRoom = 'cafe' | 'beach' | 'living' | 'roof';
export interface CardRules { stack: boolean; turnSeconds: number; initialCards: number; targetScore?: number; variant?: 'basic' | 'expanded' }
export interface CardPerson { name: string; character: string; human: boolean; hand: PlayingCard[]; shield: boolean; declared: boolean; expression: 'neutral' | 'happy' | 'surprised'; line: string }
export interface CardMatch {
  wager?: { stake: number; pot: number; settled: boolean; payout: number }; missionMode?: boolean; forfeitedBy?: number;
  unoVulnerable?: number; roundPoints?: number; totals?: number[]; round?: number; champion?: number | null;
  id: number; mode: CardMode; difficulty: CardDifficulty; room: CardRoom; rules: CardRules; stage: number; dailyDate: string | null;
  players: CardPerson[]; deck: PlayingCard[]; discard: PlayingCard[]; color: CardColor; turn: number; direction: 1 | -1;
  pending: number; drawn: number | null; didDraw: boolean; status: 'playing' | 'finished' | 'abandoned'; winner: number | null;
  handoff: boolean; onePending: { player: number; deadline: number } | null; deadline: number | null; nextBotAt: number;
  seed: number; moves: number; revision: number; log: string[];
}
export interface CardProgress { wins: number; played: number; losses?: number; adventureStage: number; unlockedCharacters: string[]; unlockedRooms: CardRoom[]; dailyWins: string[]; active: CardMatch | null }
export interface CardSnapshot { progress: CardProgress; now: number; revision: number; money?: number; daily: { date: string; title: string; rules: CardRules } }
export const COLOR_NAMES: Record<CardColor, string> = { red: 'Đỏ', blue: 'Xanh dương', green: 'Xanh lá', yellow: 'Vàng' };
export const COLOR_SHAPES: Record<CardColor, string> = { red: '♥', blue: '◆', green: '♣', yellow: '●' };
export const FACE_NAMES: Record<string, string> = { reverse: 'Đổi chiều', skip: 'Mất lượt', draw2: 'Rút 2', wild: 'Đổi màu', draw4: 'Rút 4', random: 'Màu ngẫu nhiên', swap: 'Hoán đổi bài', everyone: 'Tất cả rút 1', shield: 'Khiên bảo vệ' };
export const FACE_MARKS: Record<string, string> = { reverse: '⇄', skip: '⊘', draw2: '+2', wild: '✦', draw4: '+4', random: '⟳', swap: '⇆', everyone: '+1∀', shield: '⬡' };
export const CARD_ROOMS: { id: CardRoom; name: string; unlock: number }[] = [{ id: 'cafe', name: 'Cà phê đầu hẻm', unlock: 0 }, { id: 'living', name: 'Phòng khách', unlock: 0 }, { id: 'beach', name: 'Bãi biển', unlock: 2 }, { id: 'roof', name: 'Sân thượng', unlock: 4 }];
export const CARD_CAST = [
  { id: 'co-ba', name: 'Cô Ba', unlock: 0, style: 'Điềm đạm, nhớ bài rất kỹ' },
  { id: 'ti', name: 'Tí', unlock: 1, style: 'Nhanh tay, thích đánh lá phạt' },
  { id: 'man', name: 'Mận', unlock: 2, style: 'Khéo đổi màu, khó đoán đường đi' },
  { id: 'chu-tu', name: 'Chú Tư', unlock: 4, style: 'Giữ khiên để lật ngược tình thế' },
  { id: 'bac-sau', name: 'Bác Sáu', unlock: 6, style: 'Bình tĩnh đến lá cuối cùng' },
];
export const CARD_PLAY_STYLES = [
  'Xả lá điểm cao, đánh nhanh',
  'Giữ màu lợi thế, đổi màu khéo',
  'Ưu tiên lá chức năng, chặn đối thủ',
] as const;
export function cardPlayStyleIndex(characterId: string): number {
  return [...characterId].reduce((score, character) => score + character.charCodeAt(0), 0) % CARD_PLAY_STYLES.length;
}
export function cardName(card: PlayingCard) { return `${card.color ? COLOR_NAMES[card.color] + ' · ' : ''}${FACE_NAMES[card.face] ?? card.face}`; }
export function canPlayCard(m: CardMatch, player: number, card: PlayingCard): boolean {
  if (m.status !== 'playing' || m.turn !== player || m.handoff || m.onePending) return false;
  const topCard = m.discard[m.discard.length - 1];
  if (!topCard) return false;
  if (m.pending > 0) return card.face === 'shield' || (m.rules.stack && (card.face === 'draw2' || card.face === 'draw4'));
  if (m.didDraw && m.drawn !== card.id) return false;
  if (m.rules.variant === 'basic' && card.face === 'draw4' && m.players[player].hand.some(c => c.color === m.color)) return false;
  return card.color === null || card.color === m.color || card.face === topCard.face;
}
