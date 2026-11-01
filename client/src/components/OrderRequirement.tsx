import type { Customer, PhoMenuItem, Topping } from '../services/gameTypes';

interface OrderRequirementProps {
  customer: Customer | null;
  pho: PhoMenuItem | null;
  toppings: string[];
  availableToppings: Topping[];
  secondsRemaining: number | null;
}

export function OrderRequirement({ customer, pho, toppings, availableToppings, secondsRemaining }: OrderRequirementProps) {
  const required = customer?.requiredToppings.split(',').map(item => item.trim()).filter(Boolean) ?? [];
  const optional = availableToppings.filter(topping => !required.includes(topping.name));
  const toppingCost = new Map(availableToppings.map(topping => [topping.name, topping.price]));
  const estimate = (pho?.basePrice ?? 0) + [...new Set(toppings)].reduce((sum, name) => sum + (toppingCost.get(name) ?? 0), 0);

  return (
    <section className="order-requirement" aria-labelledby="requirements-title">
      <h2 id="requirements-title">Yêu cầu món</h2>
      <p><strong>Loại phở:</strong> {customer?.preferredPhoType === null ? 'Khách chưa yêu cầu món cụ thể' : pho?.name ?? 'Chưa chọn món'}</p>
      <div className="requirement-group mandatory">
        <strong>Bắt buộc phải có</strong>
        <span>{required.length ? required.join(', ') : 'Khách không yêu cầu topping bắt buộc.'}</span>
      </div>
      <div className="requirement-group forbidden">
        <strong>Topping không được thêm</strong>
        <span>Không có topping cấm riêng. Các topping còn lại là tùy chọn, không bắt buộc.</span>
      </div>
      <p><strong>Tùy chọn:</strong> {optional.length ? optional.map(topping => topping.name).join(', ') : 'Không có'}</p>
      <p><strong>Tiền dự kiến:</strong> {estimate.toLocaleString('vi-VN')}đ</p>
      <p className={secondsRemaining !== null && secondsRemaining <= 10 ? 'time-critical' : ''}>
        <strong>Thời gian còn lại:</strong> {secondsRemaining === null ? '—' : `${secondsRemaining} giây`}
      </p>
    </section>
  );
}
