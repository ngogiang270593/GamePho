import { useMemo, useRef, useState, type KeyboardEvent, type TouchEvent } from 'react';
import { CharacterItemPreview } from '../components/CharacterItemPreview';
import { CharacterSprite } from '../components/CharacterSprite';
import type { CharacterAppearance } from '../game/character';
import type { PlayableCharacterId } from '../game/startingCharacters';
import {
  CHARACTER_ITEMS,
  type CharacterCustomization,
  type CharacterItem,
  type CharacterItemCategory,
  type EquippedCharacterItems,
} from '../game/characterCustomization';

const equipmentSlots: { id: CharacterItemCategory; label: string; icon: string }[] = [
  { id: 'hair', label: 'Tóc', icon: '✂' },
  { id: 'hat', label: 'Nón', icon: '👒' },
  { id: 'clothes', label: 'Áo', icon: '👘' },
  { id: 'bottoms', label: 'Quần / váy', icon: '👖' },
  { id: 'shoes', label: 'Giày dép', icon: '👞' },
  { id: 'wings', label: 'Cánh', icon: '🦋' },
  { id: 'back', label: 'Phụ kiện lưng', icon: '🎒' },
  { id: 'front', label: 'Phụ kiện tay', icon: '🏮' },
  { id: 'mount', label: 'Thú cưỡi', icon: '🐃' },
  { id: 'effect', label: 'Hiệu ứng', icon: '✨' },
];

const inventoryTabs: { id: string; label: string; categories: CharacterItemCategory[] | null }[] = [
  { id: 'all', label: 'Tất cả', categories: null },
  { id: 'hair', label: 'Tóc', categories: ['hair'] },
  { id: 'hat', label: 'Nón', categories: ['hat'] },
  { id: 'clothes', label: 'Trang phục', categories: ['clothes', 'bottoms'] },
  { id: 'shoes', label: 'Giày dép', categories: ['shoes'] },
  { id: 'wings', label: 'Cánh', categories: ['wings'] },
  { id: 'accessories', label: 'Phụ kiện', categories: ['back', 'front', 'effect'] },
  { id: 'mount', label: 'Thú cưỡi', categories: ['mount'] },
];

const rarityNames = { Common: 'Phổ thông', Rare: 'Hiếm', Epic: 'Sử thi', Legendary: 'Huyền thoại' };

function slotTab(item: CharacterItemCategory) {
  return inventoryTabs.find(tab => tab.categories?.includes(item))?.id ?? 'all';
}

function CharacterPreview({ appearance, customization, startingCharacterId, name, onFacingChange }: {
  appearance: CharacterAppearance;
  customization: CharacterCustomization;
  startingCharacterId?: PlayableCharacterId;
  name: string;
  onFacingChange: () => void;
}) {
  const [walking, setWalking] = useState(false);
  return <section className="character-dressing-room" aria-label="Xem trước nhân vật">
    <div className="character-dressing-room__scene">
      <div className="character-dressing-room__sun" aria-hidden="true" />
      <CharacterSprite
        className="character-dressing-room__sprite"
        appearance={appearance}
        customization={customization}
        startingCharacter={startingCharacterId}
        facing="down"
        walking={walking}
        role="img"
        aria-label={`Nhân vật ${name || 'của bạn'}${walking ? ' đang bước đi' : ''}`}
      />
      <span className="character-dressing-room__name">{name || 'Nhân vật của bạn'}</span>
    </div>
    <button className="character-facing-toggle" type="button" onClick={onFacingChange} aria-label="Xoay nhân vật">
      ⟳ {customization.facing === 'three-quarter' ? 'Góc 3/4' : 'Chính diện'}
    </button>
    <button className="sprite-walk-toggle character-walk-toggle" type="button" aria-pressed={walking} onClick={() => setWalking(value => !value)}>
      {walking ? 'Ⅱ Dừng bước' : '▷ Xem bước đi'}
    </button>
  </section>;
}

function EquipmentSlots({ appearance, customization, startingCharacterId, selectedCategory, onSelect }: {
  appearance: CharacterAppearance;
  customization: CharacterCustomization;
  startingCharacterId?: PlayableCharacterId;
  selectedCategory: CharacterItemCategory;
  onSelect: (category: CharacterItemCategory) => void;
}) {
  return <section className="character-equipment" aria-label="Ô trang bị">
    <header><h2>Trang bị</h2><span>{Object.keys(customization.equipped).length} món đang dùng</span></header>
    <div className="character-equipment__grid">
      {equipmentSlots.map(slot => {
        const equipped = CHARACTER_ITEMS.find(item => item.id === customization.equipped[slot.id]);
        return <button
          key={slot.id}
          type="button"
          className={`character-equipment__slot${selectedCategory === slot.id ? ' is-selected' : ''}${equipped ? ` rarity-${equipped.rarity.toLowerCase()}` : ''}`}
          aria-label={`${slot.label}: ${equipped?.name ?? 'Chưa trang bị'} · chọn nhóm`}
          aria-pressed={selectedCategory === slot.id}
          onClick={() => onSelect(slot.id)}
        >
          <span className="character-equipment__icon">{equipped ? <CharacterItemPreview item={equipped} appearance={appearance} customization={customization} startingCharacterId={startingCharacterId} /> : slot.icon}</span>
          <small>{slot.label}</small>
          <strong>{equipped?.name ?? '+ Thêm'}</strong>
        </button>;
      })}
    </div>
  </section>;
}

function InventoryTabs({ selectedTab, ownedCount, onSelect }: {
  selectedTab: string;
  ownedCount: number;
  onSelect: (tab: string) => void;
}) {
  return <div className="character-inventory-tabs" role="tablist" aria-label="Danh mục túi đồ">
    {inventoryTabs.map(tab => <button
      key={tab.id}
      id={`character-tab-${tab.id}`}
      type="button"
      role="tab"
      aria-selected={selectedTab === tab.id}
      aria-controls="character-inventory-panel"
      onClick={() => onSelect(tab.id)}
    >
      {tab.label}{tab.id === 'all' && <span>{ownedCount}</span>}
    </button>)}
  </div>;
}

function EquipButton({ item, equipped, onClick }: { item?: CharacterItem; equipped: boolean; onClick: () => void }) {
  return <button
    type="button"
    className={`character-equip-button${equipped ? ' is-equipped' : ''}`}
    disabled={!item}
    onClick={onClick}
  >
    {!item ? 'Chưa có vật phẩm' : equipped ? 'Tháo trang bị' : 'Trang bị'}
  </button>;
}

function ItemDetail({ item, equipped, receivedAt, appearance, customization, startingCharacterId, onToggle }: {
  item: CharacterItem | undefined;
  equipped: boolean;
  receivedAt: number | undefined;
  appearance: CharacterAppearance;
  customization: CharacterCustomization;
  startingCharacterId?: PlayableCharacterId;
  onToggle: () => void;
}) {
  if (!item) return <div className="character-item-detail is-empty"><span aria-hidden="true">✦</span><p>Chọn một vật phẩm để xem chi tiết.</p></div>;
  return <section className={`character-item-detail rarity-${item.rarity.toLowerCase()}`} aria-label="Chi tiết vật phẩm">
    <div className="character-item-detail__art"><CharacterItemPreview item={item} appearance={appearance} customization={customization} startingCharacterId={startingCharacterId} /></div>
    <div className="character-item-detail__copy">
      <span>{rarityNames[item.rarity]}</span>
      <h3>{item.name}</h3>
      <p>{item.description}</p>
      <small>{receivedAt ? `Nhận ngày ${new Date(receivedAt).toLocaleDateString('vi-VN')}` : 'Vật phẩm mặc định'}</small>
    </div>
    <EquipButton item={item} equipped={equipped} onClick={onToggle} />
  </section>;
}

function InventoryGrid({ items, selectedId, equipped, appearance, customization, startingCharacterId, onSelect }: {
  items: CharacterItem[];
  selectedId: string | null;
  equipped: EquippedCharacterItems;
  appearance: CharacterAppearance;
  customization: CharacterCustomization;
  startingCharacterId?: PlayableCharacterId;
  onSelect: (item: CharacterItem) => void;
}) {
  if (!items.length) return <p className="character-inventory-empty">Chưa có vật phẩm trong nhóm này.</p>;
  return <div className="character-inventory-grid">
    {items.map(item => <button
      key={item.id}
      type="button"
      className={`character-inventory-item rarity-${item.rarity.toLowerCase()}${selectedId === item.id ? ' is-selected' : ''}${equipped[item.category] === item.id ? ' is-equipped' : ''}`}
      aria-pressed={selectedId === item.id}
      onClick={() => onSelect(item)}
    >
      <span className="character-inventory-item__art"><CharacterItemPreview item={item} appearance={appearance} customization={customization} startingCharacterId={startingCharacterId} /></span>
      <strong>{item.name}</strong>
      <small>{rarityNames[item.rarity]}</small>
      <span className="character-inventory-item__status">{equipped[item.category] === item.id ? '✓ Đang dùng' : 'Trong túi'}</span>
    </button>)}
  </div>;
}

function SaveCharacter({ onSave }: { onSave: () => void }) {
  return <button className="character-save-button" type="button" onClick={onSave}>Lưu nhân vật <span aria-hidden="true">→</span></button>;
}

interface CharacterWardrobeProps {
  appearance: CharacterAppearance;
  customization: CharacterCustomization;
  startingCharacterId?: PlayableCharacterId;
  name: string;
  gold: number;
  fame: number;
  onCustomizationChange: (customization: CharacterCustomization) => void;
  onReset: () => void;
  onSave: () => void;
  onBack: () => void;
}

export function CharacterWardrobe({ appearance, customization, startingCharacterId, name, gold, fame, onCustomizationChange, onReset, onSave, onBack }: CharacterWardrobeProps) {
  const [selectedCategory, setSelectedCategory] = useState<CharacterItemCategory>('hair');
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(customization.inventory?.ownedItems[0] ?? null);
  const [search, setSearch] = useState('');
  const [rarity, setRarity] = useState('all');
  const [receivedFilter, setReceivedFilter] = useState('all');
  const [mobileView, setMobileView] = useState<'character' | 'inventory'>('character');
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const ownedIds = customization.inventory?.ownedItems ?? customization.unlockedItems;
  const ownedItems = useMemo(() => CHARACTER_ITEMS.filter(item => ownedIds.includes(item.id)), [ownedIds]);
  const selectedItem = ownedItems.find(item => item.id === selectedId);
  const filteredItems = useMemo(() => {
    const categories = inventoryTabs.find(tab => tab.id === selectedTab)?.categories;
    const cutoff = receivedFilter === 'recent'
      ? Date.now() - 7 * 24 * 60 * 60 * 1000
      : receivedFilter === 'older' ? Date.now() - 7 * 24 * 60 * 60 * 1000 : null;
    return ownedItems.filter(item => {
      const receivedAt = customization.inventory?.receivedAt[item.id] ?? 0;
      return (!categories || categories.includes(item.category))
        && (!search.trim() || item.name.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi')))
        && (rarity === 'all' || rarity === item.rarity)
        && (cutoff === null || (receivedFilter === 'recent' ? receivedAt >= cutoff : receivedAt < cutoff));
    }).sort((a, b) => {
      if (receivedFilter === 'all') return a.name.localeCompare(b.name, 'vi');
      return (customization.inventory?.receivedAt[b.id] ?? 0) - (customization.inventory?.receivedAt[a.id] ?? 0);
    });
  }, [customization.inventory?.receivedAt, ownedItems, receivedFilter, rarity, search, selectedTab]);

  function chooseSlot(category: CharacterItemCategory) {
    setSelectedCategory(category);
    const tab = slotTab(category);
    setSelectedTab(tab);
    const equippedId = customization.equipped[category];
    const candidates = ownedItems.filter(item => item.category === category);
    setSelectedId(equippedId ?? candidates[0]?.id ?? null);
    setMobileView('inventory');
  }

  function toggleSelected() {
    if (!selectedItem) return;
    const equipped = { ...customization.equipped };
    if (equipped[selectedItem.category] === selectedItem.id) delete equipped[selectedItem.category];
    else equipped[selectedItem.category] = selectedItem.id;
    onCustomizationChange({ ...customization, equipped });
  }

  function changeMobileView(next: 'character' | 'inventory') {
    setMobileView(next);
    if (next === 'inventory') setSelectedTab(slotTab(selectedCategory));
  }

  function handleMobileTabKeyDown(event: KeyboardEvent<HTMLElement>) {
    const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    const currentIndex = tabs.findIndex(tab => tab === event.target);
    if (currentIndex < 0) return;
    const nextIndex = event.key === 'ArrowRight' || event.key === 'ArrowDown'
      ? (currentIndex + 1) % tabs.length
      : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
        ? (currentIndex - 1 + tabs.length) % tabs.length
        : event.key === 'Home' ? 0
          : event.key === 'End' ? tabs.length - 1 : -1;
    if (nextIndex < 0) return;
    event.preventDefault();
    tabs[nextIndex].focus();
    tabs[nextIndex].click();
  }

  function handleTouchStart(event: TouchEvent<HTMLElement>) {
    const touch = event.changedTouches[0];
    touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
  }

  function handleTouchEnd(event: TouchEvent<HTMLElement>) {
    if (touchStart.current === null) return;
    const touch = event.changedTouches[0];
    if (touch) {
      const distanceX = touch.clientX - touchStart.current.x;
      const distanceY = touch.clientY - touchStart.current.y;
      if (Math.abs(distanceX) > 70 && Math.abs(distanceX) > Math.abs(distanceY)) {
        changeMobileView(distanceX < 0 ? 'inventory' : 'character');
      }
    }
    touchStart.current = null;
  }

  return <section
    className="character-wardrobe-page"
    aria-label="Nhân vật"
    onTouchStart={handleTouchStart}
    onTouchEnd={handleTouchEnd}
  >
    <header className="character-wardrobe-header">
      <button type="button" className="character-wardrobe-back" onClick={onBack}>← Về nhà</button>
      <div><span>NHÂN VẬT CỦA BẠN</span><h1>Nhân vật</h1></div>
      <div className="character-wardrobe-wallet"><span>🪙 {gold.toLocaleString('vi-VN')}</span><span>⭐ {fame.toLocaleString('vi-VN')}</span></div>
    </header>
    <nav className="character-mobile-tabs" role="tablist" aria-label="Màn hình nhân vật" onKeyDown={handleMobileTabKeyDown}>
      <button id="character-mobile-tab-character" type="button" role="tab" aria-controls="character-panel-preview" aria-selected={mobileView === 'character'} tabIndex={mobileView === 'character' ? 0 : -1} onClick={() => changeMobileView('character')}>Nhân vật</button>
      <button id="character-mobile-tab-inventory" type="button" role="tab" aria-controls="character-panel-inventory" aria-selected={mobileView === 'inventory'} tabIndex={mobileView === 'inventory' ? 0 : -1} onClick={() => changeMobileView('inventory')}>Túi đồ <span>{ownedItems.length}</span></button>
    </nav>
    <div className="character-wardrobe-layout">
      <section id="character-panel-preview" className={`character-panel character-panel--preview${mobileView !== 'character' ? ' is-mobile-hidden' : ''}`}>
        <CharacterPreview
          appearance={appearance}
          customization={customization}
          startingCharacterId={startingCharacterId}
          name={name}
          onFacingChange={() => onCustomizationChange({
            ...customization,
            facing: customization.facing === 'front' ? 'three-quarter' : 'front',
          })}
        />
        <EquipmentSlots appearance={appearance} customization={customization} startingCharacterId={startingCharacterId} selectedCategory={selectedCategory} onSelect={chooseSlot} />
        <div className="character-panel-actions">
          <button type="button" className="character-reset-button" onClick={onReset}>Đặt lại trang bị</button>
          <SaveCharacter onSave={onSave} />
        </div>
      </section>
      <section id="character-panel-inventory" className={`character-panel character-panel--inventory${mobileView !== 'inventory' ? ' is-mobile-hidden' : ''}`} aria-label="Túi đồ">
        <header className="character-inventory-heading"><div><span>TỦ ĐỒ CỦA BẠN</span><h2>Túi đồ <small>{ownedItems.length} món</small></h2></div></header>
        <InventoryTabs selectedTab={selectedTab} ownedCount={ownedItems.length} onSelect={setSelectedTab} />
        <div className="character-inventory-filters">
          <label><span className="sr-only">Tìm vật phẩm</span><input aria-label="Tìm vật phẩm" placeholder="⌕ Tìm vật phẩm..." value={search} onChange={event => setSearch(event.target.value)} /></label>
          <label><span className="sr-only">Lọc độ hiếm</span><select aria-label="Lọc độ hiếm" value={rarity} onChange={event => setRarity(event.target.value)}><option value="all">Mọi độ hiếm</option>{Object.entries(rarityNames).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
          <label><span className="sr-only">Lọc ngày nhận</span><select aria-label="Lọc ngày nhận" value={receivedFilter} onChange={event => setReceivedFilter(event.target.value)}><option value="all">Mọi thời điểm</option><option value="recent">7 ngày gần đây</option><option value="older">Trước đó</option></select></label>
        </div>
        <div className="character-inventory-detail">
          <ItemDetail
            item={selectedItem}
            equipped={selectedItem ? customization.equipped[selectedItem.category] === selectedItem.id : false}
            receivedAt={selectedItem ? customization.inventory?.receivedAt[selectedItem.id] : undefined}
            appearance={appearance}
            customization={customization}
            startingCharacterId={startingCharacterId}
            onToggle={toggleSelected}
          />
        </div>
        <div className="character-inventory-scroll" id="character-inventory-panel" role="tabpanel" aria-labelledby={`character-tab-${selectedTab}`}>
          <InventoryGrid items={filteredItems} selectedId={selectedId} equipped={customization.equipped} appearance={appearance} customization={customization} startingCharacterId={startingCharacterId} onSelect={item => setSelectedId(item.id)} />
        </div>
        <div className="character-mobile-equip"><EquipButton item={selectedItem} equipped={selectedItem ? customization.equipped[selectedItem.category] === selectedItem.id : false} onClick={toggleSelected} /></div>
      </section>
    </div>
  </section>;
}
