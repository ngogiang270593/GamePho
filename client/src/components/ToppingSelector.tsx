import type { Topping } from '../services/gameTypes';

const MAX_TOPPINGS = 5;

interface ToppingSelectorProps {
  toppings: Topping[];
  requiredToppings: string[];
  selectedToppings: string[];
  onToggle: (name: string) => void;
}

export function ToppingSelector({ toppings, requiredToppings, selectedToppings, onToggle }: ToppingSelectorProps) {
  const uniqueSelected = [...new Set(selectedToppings)];
  const overLimit = uniqueSelected.length > MAX_TOPPINGS;
  const required = new Set(requiredToppings);

  return (
    <section className="topping-selector" aria-labelledby="toppings-title">
      <div className="section-heading">
        <h2 id="toppings-title">Chọn topping</h2>
        <span>{uniqueSelected.length}/{MAX_TOPPINGS} đã chọn</span>
      </div>
      <p className="helper-text">Đánh dấu topping bắt buộc trước; topping khác là tùy chọn.</p>
      <div className="topping-options">
        {toppings.map(topping => {
          const checked = uniqueSelected.includes(topping.name);
          return (
            <button
              type="button"
              key={topping.id}
              className={`topping-option${checked ? ' checked' : ''}${required.has(topping.name) ? ' required' : ''}`}
              role="checkbox"
              aria-checked={checked}
              onClick={() => onToggle(topping.name)}
            >
              <span className="checkbox-mark" aria-hidden="true">{checked ? '✓' : ''}</span>
              <span>{topping.name}{required.has(topping.name) && <small> Bắt buộc</small>}</span>
              <span>{topping.price.toLocaleString('vi-VN')}đ</span>
            </button>
          );
        })}
      </div>
      {overLimit && <p className="inline-warning" role="alert">Vượt giới hạn {MAX_TOPPINGS} topping. Bỏ bớt topping trước khi phục vụ.</p>}
    </section>
  );
}
