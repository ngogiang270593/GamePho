import type { PhoMenuItem } from '../services/gameTypes';

const phoEmojis = ['🥩', '🍖', '🐓', '🍜'];

interface PhoSelectorProps {
  menu: PhoMenuItem[];
  selectedPho: PhoMenuItem | null;
  onSelect: (pho: PhoMenuItem) => void;
}

export function PhoSelector({ menu, selectedPho, onSelect }: PhoSelectorProps) {
  const phoTypes = [0, 1, 2, 3];
  const items = phoTypes.map(type => menu.find(item => item.phoType === type)).filter((item): item is PhoMenuItem => Boolean(item));

  return (
    <section className="pho-selector" aria-labelledby="pho-title">
      <h2 id="pho-title">Chọn món phở</h2>
      <div className="pho-options">
        {items.map((pho, index) => (
          <button
            type="button"
            key={pho.id}
            className={`pho-option${selectedPho?.id === pho.id ? ' selected' : ''}`}
            onClick={() => onSelect(pho)}
            aria-pressed={selectedPho?.id === pho.id}
          >
            <span aria-hidden="true">{phoEmojis[index]}</span>
            <strong>{pho.name}{pho.isDailySpecial ? ' ⭐' : ''}</strong>
            <small>{pho.basePrice.toLocaleString('vi-VN')}đ</small>
            {pho.isDailySpecial && <small>Món đặc biệt hôm nay · thưởng thêm 5.000đ khi phục vụ đúng</small>}
          </button>
        ))}
      </div>
      {!items.length && <p>Chưa có món phở khả dụng.</p>}
    </section>
  );
}
