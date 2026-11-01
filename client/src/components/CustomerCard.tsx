import type { Customer } from '../services/gameTypes';

const customerKinds = ['Hàng xóm', 'Shipper', 'Cầu thủ phủi', 'TikToker', 'Bà Tám', 'Sinh viên cuối tháng', 'Khách khó tính', 'Gia đình', 'Khách VIP'];
const customerFaces = ['🧑‍🌾', '🛵', '⚽', '📱', '👵', '🎒', '😤', '👨‍👩‍👧‍👦', '🕴️'];
const customerQuotes = [
  'Cho tôi tô phở ngon, còn chuyện trong hẻm kể sau nhé!',
  'Nhanh giúp tôi, đơn giao hàng đang réo!',
  'Ăn xong mình bàn tiếp trận đấu nha!',
  'Món lên hình đẹp là tôi đăng liền đó!',
  'Tôi chỉ hỏi thăm một chút thôi…',
  'Cuối tháng rồi, có tô nào vừa túi tiền không?',
  'Nhớ đúng từng món tôi dặn đó!',
  'Cả nhà đang đói bụng lắm rồi!',
];

interface CustomerCardProps {
  customer: Customer;
  isSelected: boolean;
  onSelect: () => void;
}

function getRemainingPercent(customer: Customer, now: number) {
  const arrivedAt = new Date(customer.arrivedAt).getTime();
  const elapsedSeconds = arrivedAt < Date.UTC(2000, 0, 1) ? 0 : Math.max(0, (now - arrivedAt) / 1000);
  return Math.max(0, Math.min(100, (1 - elapsedSeconds / Math.max(1, customer.patience)) * 100));
}

export function getCustomerTimeRemaining(customer: Customer, now = Date.now()) {
  if (typeof customer.secondsRemaining === 'number') return Math.max(0, Math.ceil(customer.secondsRemaining));
  const arrivedAt = new Date(customer.arrivedAt).getTime();
  const elapsedSeconds = arrivedAt < Date.UTC(2000, 0, 1) ? 0 : Math.max(0, (now - arrivedAt) / 1000);
  return Math.max(0, Math.ceil(customer.patience - elapsedSeconds));
}

export function CustomerCard({ customer, isSelected, onSelect }: CustomerCardProps) {
  const type = customer.customerType;
  const hunger = Math.max(0, Math.min(100, customer.hunger));
  const patiencePercent = getRemainingPercent(customer, Date.now());
  const typeIndex = typeof type === 'number' ? type : 0;
  const phoName = ['Phở tái', 'Phở bò chín', 'Phở gà', 'Phở đặc biệt'][customer.preferredPhoType ?? 0];

  return (
    <button
      type="button"
      className={`customer-card${isSelected ? ' selected' : ''}${patiencePercent < 30 ? ' patience-warning' : ''}`}
      onClick={onSelect}
      aria-pressed={isSelected}
    >
      <span className="customer-avatar" aria-hidden="true">{customerFaces[typeIndex] ?? '🙂'}</span>
      <span className="customer-card-content">
        <strong>{customer.name}</strong>
        <span className="customer-type">{customerKinds[typeIndex] ?? 'Khách'}</span>
        <span className="meter-label">Độ đói <b>{hunger}%</b></span>
        <span className="meter"><span className="hunger-meter" style={{ width: `${hunger}%` }} /></span>
        <span className="meter-label">Kiên nhẫn <b>{Math.round(patiencePercent)}%</b></span>
        <span className="meter"><span className={`patience-meter${patiencePercent < 30 ? ' low' : ''}`} style={{ width: `${patiencePercent}%` }} /></span>
        <span className="customer-dish">Muốn gọi: {customer.preferredPhoType === null ? 'Khách chưa dặn món' : phoName}</span>
        <span className="customer-quote">“{customer.dialogue || customerQuotes[typeIndex] || 'Cho tôi một tô thật ngon nhé!'}”</span>
      </span>
    </button>
  );
}
