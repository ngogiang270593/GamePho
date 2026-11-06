import { onlineGame } from '../services/gameMode';
import { saveAccountProfile } from '../services/online/account';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { CharacterSprite } from '../components/CharacterSprite';
import { CharacterCreationForm } from '../components/CharacterCreationForm';
import { StartingCharacterSelection } from '../components/StartingCharacterSelection';
import {initialInventory} from '../game/characterInventory';
import { MountSprite } from '../components/MountSprite';
import { PetSprite } from '../components/PetSprite';
import { CharacterWardrobe } from './CharacterWardrobe';
import { WorldMap } from '../components/WorldMap';
import { GameSaveControl } from '../components/GameSaveControl';
import { SystemPreferences } from '../components/SystemPreferences';
import '../styles/character-wardrobe.css';
import '../styles/character-screen.css';
import { useGameStore } from '../context/GameContext';
import { OUTFIT_DETAILS } from '../game/outfits';
import type { PlayableCharacterId } from '../game/startingCharacters';
import {
  CHARACTER_ITEMS,
  normalizeCharacterCustomization, type CharacterCustomization, type CharacterItem, type CharacterItemCategory,
} from '../game/characterCustomization';
import { changeEquipment, migrateInventory, receiveInventoryItem } from '../game/characterInventory';
import {
  characterGenders, characterOptions, DEFAULT_APPEARANCES, getAppearanceOptions, normalizeAppearance, randomAppearance,
  type CharacterAppearance, type CharacterGender, type Facing,
} from '../game/character';

const categories = [
  { key: 'hair', label: 'Tóc' }, { key: 'eyes', label: 'Mắt' },
  { key: 'face', label: 'Khuôn mặt' }, { key: 'outfit', label: 'Trang phục' },
  { key: 'accessory', label: 'Phụ kiện' },
  { key: 'pet', label: 'Thú cưng' },
] as const;
const directions: { value: Facing; label: string; arrow: string }[] = [
  { value: 'left', label: 'Bên trái', arrow: '←' },
  { value: 'up', label: 'Mặt sau', arrow: '↑' },
  { value: 'down', label: 'Mặt trước', arrow: '↓' },
  { value: 'right', label: 'Bên phải', arrow: '→' },
];
const RARITY_LABELS = { Common: 'Common · Phổ thông', Rare: 'Rare · Hiếm', Epic: 'Epic · Sử thi', Legendary: 'Legendary · Huyền thoại' };

interface CharacterPageProps {
  expandWardrobe?: boolean;
  initialSetup?: boolean;
  startingTemplateSetup?: boolean;
  onStart?: (profile?: { displayName: string; appearance: CharacterAppearance; customization: CharacterCustomization; promoCodeRedeemed?: boolean; startingCharacterId?: PlayableCharacterId; startingCharacterImage?: string }) => void;
  onBack?: () => void;
  localOnly?: boolean;
  initialDisplayName?: string;
  initialAppearance?: CharacterAppearance;
  heading?: string;
  submitLabel?: string;
  initialCustomization?: CharacterCustomization;
  startingCharacterId?: PlayableCharacterId;
  gold?: number;
  fame?: number;
  onPurchaseItem?: (item: CharacterItem) => boolean;
  onCustomizationChange?: (customization: CharacterCustomization) => void;
}

export function CharacterPage({ expandWardrobe = false, initialSetup = false, startingTemplateSetup = false, onStart, onBack, localOnly = false, initialDisplayName, initialAppearance, heading, submitLabel, initialCustomization, startingCharacterId, gold = 0, fame = 0, onPurchaseItem, onCustomizationChange }: CharacterPageProps) {
  const navigate = useNavigate();
  const { character, saveCharacter } = useGameStore();
  const [displayName, setDisplayName] = useState(initialDisplayName ?? (initialSetup ? '' : character.displayName));
  const [promoCode, setPromoCode] = useState('');
  const [gender, setGender] = useState<CharacterGender>(() => normalizeAppearance(initialAppearance ?? (initialSetup ? DEFAULT_APPEARANCES.female : character.appearance)).gender);
  const [drafts, setDrafts] = useState(() => {
    const saved = normalizeAppearance(initialAppearance ?? (initialSetup ? DEFAULT_APPEARANCES.female : character.appearance));
    return { ...DEFAULT_APPEARANCES, [saved.gender]: saved };
  });
  const appearance = drafts[gender];
  const [category, setCategory] = useState<(typeof categories)[number]['key']>('hair');
  const [facing, setFacing] = useState<Facing>('down');
  const [walking, setWalking] = useState(false);
  const [tryMap, setTryMap] = useState(false);
  const [customization, setCustomization] = useState(() => localOnly
    ? migrateInventory(initialCustomization, normalizeAppearance(initialAppearance ?? character.appearance))
    : normalizeCharacterCustomization(initialCustomization));
  const currentOptions = getAppearanceOptions(category, gender);
  const selectedLabel = currentOptions.find(option => option.value === appearance[category])?.label;
  const skinLabel = characterOptions.skin.find(option => option.value === appearance.skin)?.label;
  const outfitDetail = OUTFIT_DETAILS[appearance.outfit];
  const suggestedAccessory = characterOptions.accessory.find(option => option.value === outfitDetail.accessory);

  function updateAppearance(changes: Partial<CharacterAppearance>) {
    setDrafts(previous => ({ ...previous, [gender]: { ...previous[gender], ...changes, gender } }));
    if (changes.outfit && customization.equipped.clothes) {
      const equipped = { ...customization.equipped };
      delete equipped.clothes;
      updateCustomization({ ...customization, equipped });
    }
  }

  function updateCustomization(next: CharacterCustomization) {
    const synchronized = next.inventory
      ? {
          ...next,
          inventory: {
            ...next.inventory,
            ownedItems: [...new Set([...next.inventory.ownedItems, ...next.unlockedItems])],
            equippedItems: { ...next.equipped },
          },
        }
      : next;
    const normalized = normalizeCharacterCustomization(synchronized);
    setCustomization(normalized);
    onCustomizationChange?.(normalized);
  }

  function unlock(item: CharacterItem) {
    if (customization.unlockedItems.includes(item.id)) return true;
    if (fame < item.fame || gold < item.price || !onPurchaseItem?.(item)) return false;
    updateCustomization(receiveInventoryItem(customization, item.id, Date.now(), true));
    return true;
  }

  function collectOutfit(item: CharacterItem) {
    if (!customization.unlockedItems.includes(item.id)
      && (fame < item.fame || gold < item.price || !onPurchaseItem?.(item))) return;
    const appearanceValue = item.appearanceValue as CharacterAppearance['outfit'];
    setDrafts(previous => ({ ...previous, [gender]: { ...previous[gender], outfit: appearanceValue, gender } }));
    const received = customization.unlockedItems.includes(item.id)
      ? customization
      : receiveInventoryItem(customization, item.id, Date.now(), true);
    updateCustomization(changeEquipment(received, { ...received.equipped, clothes: item.id }));
  }

  function unequip(categoryToClear: CharacterItemCategory) {
    const equipped = { ...customization.equipped };
    delete equipped[categoryToClear];
    updateCustomization({ ...customization, equipped });
  }

  function resetWardrobe() {
    const defaultEquipment = Object.fromEntries((customization.inventory?.defaultItems ?? []).flatMap(id => {
      const item = CHARACTER_ITEMS.find(entry => entry.id === id);
      return item ? [[item.category, id]] : [];
    })) as CharacterCustomization['equipped'];
    updateCustomization(changeEquipment(customization, defaultEquipment));
  }

  async function createCharacter(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const name = displayName.trim();
    const finalCustomization=initialSetup?initialInventory(appearance):customization;
    if (name.length < 2 || name.length > 24) return;
    if (localOnly) {
      onStart?.({ displayName: name, appearance, customization:finalCustomization, promoCodeRedeemed: initialSetup && localOnly && promoCode.trim().toUpperCase() === 'CODEX500' });
      return;
    }
    saveCharacter({ displayName: name, avatar: character.avatar || '🧑‍🍳', appearance });
    localStorage.setItem('pho-xom-started', 'yes');
    if (onlineGame) { try { await saveAccountProfile(); } catch { window.alert('Chưa lưu được nhân vật lên tài khoản. Kiểm tra kết nối và bấm lưu lại nhé.'); return; } }
    window.dispatchEvent(new Event('pho-xom-started'));
    if (onStart) onStart({ displayName: name, appearance, customization:finalCustomization, promoCodeRedeemed: initialSetup && localOnly && promoCode.trim().toUpperCase() === 'CODEX500' });
    else navigate('/map');
  }

  if (localOnly && !initialSetup) return <CharacterWardrobe
    appearance={appearance}
    customization={customization}
    startingCharacterId={startingCharacterId}
    name={displayName}
    gold={gold}
    fame={fame}
    onCustomizationChange={updateCustomization}
    onReset={resetWardrobe}
    onSave={() => { void createCharacter(); }}
    onBack={onBack ?? (() => navigate('/map'))}
  />;

  if (initialSetup && localOnly && startingTemplateSetup) return <StartingCharacterSelection
    name={displayName}
    promoCode={promoCode}
    onName={setDisplayName}
    onPromoCode={setPromoCode}
    onBack={onBack ?? (() => navigate('/'))}
    onConfirm={selected => onStart?.(selected)}
  />;

  if (initialSetup) return <CharacterCreationForm
    appearance={appearance} customization={initialInventory(appearance)} startingCharacter={startingCharacterId} name={displayName} onName={setDisplayName}
    onAppearance={changes => {
      // Catalog hair and hats override base appearance, so clear their layers
      // when selecting a new base option in the creation screen.
      const equipped = { ...customization.equipped };
      if (changes.hair) delete equipped.hair;
      if (changes.accessory) delete equipped.hat;
      if (changes.outfit) delete equipped.clothes;
      updateAppearance(changes);
      if (changes.hair || changes.accessory || changes.outfit) updateCustomization({ ...customization, equipped });
    }}
    onGender={setGender}
    onRandom={() => {
      updateAppearance(randomAppearance(gender, appearance.pet));
      const equipped = { ...customization.equipped };
      delete equipped.hair; delete equipped.clothes; delete equipped.hat;
      updateCustomization({ ...customization, equipped });
    }}
    onBack={onBack ?? (() => navigate('/'))} onSubmit={createCharacter}
    promo={localOnly ? { value: promoCode, onChange: setPromoCode } : undefined}
  />;

  return <section className={`character-creator${localOnly ? ' is-local-wardrobe' : ''}`}><div className="creator-shell">
    <header className="creator-heading">
      <div><p className="eyebrow">CHƠI MỚI / NHÂN VẬT CỦA BẠN</p><h1>{heading ?? 'Tạo nhân vật'}</h1></div>
      <span className="creator-seal" aria-hidden="true">XÓM<br /><strong>NHÀ LÁ</strong><small>TỪ MỘT GÓC HẺM</small></span>
    </header>
    <form className="creator-workshop" onSubmit={createCharacter}>
      <div className="creator-preview-column"><div className="creator-preview-sticky">
        <div className="creator-preview-heading"><span>DIỆN MẠO CỦA BẠN</span><span className="creator-live-dot">Xem trực tiếp</span></div>
        {tryMap ? <div className="creator-test-map"><WorldMap appearance={appearance} customization={customization} startingCharacter={startingCharacterId} playerName={displayName} compact persist={false} /></div> : <div className="creator-studio">
          <svg className="studio-backdrop" viewBox="0 0 440 460" aria-hidden="true">
            <path d="M78 369V164Q78 24 220 24Q362 24 362 164V369Z" fill="#b2c2ad" stroke="#9ab39e" strokeWidth="2" />
            <path d="M91 369V165Q91 40 220 40Q349 40 349 165V369Z" fill="#c7d3ba" />
            <path d="M92 235Q179 154 348 215V369H92Z" fill="#afc5a7" opacity=".5" /><path d="M91 291Q235 235 349 278V369H91Z" fill="#97b29b" opacity=".3" />
            <circle cx="297" cy="135" r="33" fill="#f4dfaf" opacity=".8" /><path d="M95 369H346M75 387H367M56 414H383" stroke="#a6b79e" strokeWidth="1.5" />
            <path d="M42 115V238M398 88V214" stroke="#9e8d69" strokeWidth="1.5" />
            <g fill="#be6751" stroke="#915d4a" strokeWidth="1.5"><ellipse cx="42" cy="253" rx="18" ry="25" /><ellipse cx="398" cy="230" rx="18" ry="25" /></g>
            <path d="M42 228V278M398 205V255M31 229H53M387 206H409M42 280V299M398 257V276" stroke="#e4bc78" strokeWidth="3" />
            <ellipse cx="220" cy="409" rx="111" ry="20" fill="#7e9b8440" /><ellipse cx="220" cy="404" rx="111" ry="20" fill="#ede3c5" stroke="#baa77f" strokeWidth="2" />
          </svg>
          {customization.equipped.mount && <MountSprite mountId={customization.equipped.mount} className="studio-mount" aria-hidden="true" />}
                <CharacterSprite className={`studio-model${appearance.pet !== 'none' ? ' has-companion' : ''}`} appearance={appearance} facing={facing} walking={walking} customization={customization} startingCharacter={startingCharacterId} />
          {appearance.pet !== 'none' && <PetSprite className="studio-companion" pet={appearance.pet} facing={facing} walking={walking} />}
          <span className="studio-outfit-label">{getAppearanceOptions('outfit', gender).find(option => option.value === appearance.outfit)?.label} <span aria-hidden="true">✿</span></span>
        </div>}
        <details className="creator-preview-tools" open={expandWardrobe || undefined}><summary>Xoay & thử nhân vật</summary><div className="creator-preview-controls">
          {!tryMap && <><div className="sprite-direction-picker" aria-label="Xoay nhân vật">{directions.map(direction => <button key={direction.value} type="button" aria-label={direction.label} aria-pressed={facing === direction.value} onClick={() => setFacing(direction.value)}>{direction.arrow}</button>)}</div><button className="sprite-walk-toggle" type="button" aria-pressed={walking} onClick={() => setWalking(value => !value)}>{walking ? 'Ⅱ Dừng bước' : '▷ Xem bước đi'}</button></>}
          <button className="creator-try-map" type="button" aria-pressed={tryMap} onClick={() => setTryMap(value => !value)}>{tryMap ? '← Về phòng thử đồ' : 'Thử đi trong map ↗'}</button>
        </div>
        </details><div className="creator-player-caption"><span className="creator-player-tag">{localOnly ? 'NGƯỜI KHÁM PHÁ' : 'NGƯỜI GIỮ LỬA'}</span><h2>{displayName.trim() || (localOnly ? 'Người kể chuyện' : 'Chủ quán tương lai')}</h2><p>{appearance.pet === 'none' ? localOnly ? 'Sẵn sàng đi dạo xóm làng và gặp gỡ người xưa.' : 'Một chút duyên Việt, một quán phở của riêng mình.' : `Dạo quanh xóm cùng ${characterOptions.pet.find(option => option.value === appearance.pet)?.label.toLowerCase()}.`}</p></div>
      </div></div>
      <div className="creator-customization">
        <label className="creator-name-field" htmlFor="character-name"><span><small>02 / TÊN NHÂN VẬT</small>Tên người chơi</span><input id="character-name" name="displayName" type="text" value={displayName} onChange={event => setDisplayName(event.target.value)} placeholder="Ví dụ: Út Mận" minLength={2} maxLength={24} autoComplete="nickname" required aria-describedby="character-name-hint" /><small id="character-name-hint">Từ 2 đến 24 ký tự. Bạn có thể ghé tiệm may để đổi diện mạo.</small></label>
        {initialSetup && localOnly && <label className="creator-name-field creator-promo-field" htmlFor="character-promo-code"><span><small>MÃ QUÀ TẶNG</small>Nhập mã (không bắt buộc)</span><input id="character-promo-code" name="promoCode" type="text" value={promoCode} onChange={event => setPromoCode(event.target.value)} placeholder="Nhập mã CODEX500" autoComplete="off" aria-describedby="character-promo-code-hint" /><small id="character-promo-code-hint" role={promoCode.trim() ? 'status' : undefined} aria-live="polite">{promoCode.trim().toUpperCase() === 'CODEX500' ? 'Mã hợp lệ! Tạo nhân vật mới để nhận 10.000 xu và 10.000 danh vọng.' : promoCode.trim() ? 'Mã chưa đúng. Kiểm tra lại hoặc để trống để tiếp tục.' : 'Mã đúng sẽ thưởng cho nhân vật mới 10.000 xu và 10.000 danh vọng.'}</small></label>}
        <div className="creator-customization-title"><div><p className="eyebrow">01 / DIỆN MẠO</p><h2>Nhỏ xinh, đậm chất Việt</h2></div><button className="creator-random" type="button" onClick={() => updateAppearance(randomAppearance(gender, appearance.pet))} aria-label="Phối ngẫu nhiên">⤨ <span>Ngẫu nhiên</span></button></div>
        <fieldset className="creator-gender-picker"><legend>Chọn nhân vật</legend><div>{characterGenders.map(option => <button key={option.value} type="button" aria-label={option.label} aria-pressed={gender === option.value} onClick={() => setGender(option.value)}>
          <CharacterSprite appearance={drafts[option.value]} portrait /><span><strong>{option.label}</strong><small>{option.description}</small></span><i aria-hidden="true">{gender === option.value ? '✓' : ''}</i>
        </button>)}</div></fieldset>
        <details className="creator-appearance-details" open={expandWardrobe || undefined}><summary>{expandWardrobe ? 'Diện mạo & tủ đồ 2D' : 'Mở rộng'}</summary><div className="creator-detail-body">
        <section className="character-wardrobe creator-appearance-wardrobe" aria-label="Tủ đồ 2D">
        <header><div><p className="eyebrow">TỦ ĐỒ NHÂN VẬT</p><h3>Tùy chỉnh diện mạo 2D</h3></div></header>
        <fieldset className="creator-skin-picker"><legend>Màu da<span>{skinLabel}</span></legend><div>{characterOptions.skin.map(option => <button key={option.value} type="button" aria-label={option.label} title={option.label} aria-pressed={appearance.skin === option.value} onClick={() => updateAppearance({ skin: option.value })}>
          <span className="skin-swatch" style={{ backgroundColor: option.color }}><span aria-hidden="true">{appearance.skin === option.value ? '✓' : ''}</span></span><small>{option.label.replace('Da ', '')}</small>
        </button>)}</div></fieldset>
        <div className="appearance-categories" role="group" aria-label="Bộ phận nhân vật">{categories.map(item => <button key={item.key} type="button" aria-pressed={category === item.key} onClick={() => setCategory(item.key)}>{item.label}</button>)}</div>
        <fieldset className="appearance-picker"><legend>{categories.find(item => item.key === category)?.label}<span>{selectedLabel}</span></legend>
          <div className="appearance-options" data-category={category} data-count={currentOptions.length}>{currentOptions.map(option => {
            const sample = { ...appearance, [category]: option.value };
            const outfitItem = category === 'outfit'
              ? CHARACTER_ITEMS.find(item => item.category === 'clothes' && item.appearanceValue === option.value)
              : undefined;
            const outfitUnlocked = !outfitItem || customization.unlockedItems.includes(outfitItem.id);
            if (category === 'hair' || category === 'eyes' || category === 'face') sample.accessory = 'none';
            return <div key={option.value} className="appearance-option-entry">
              <button type="button" className={`appearance-option${appearance[category] === option.value ? ' selected' : ''}`} aria-label={option.label} aria-pressed={appearance[category] === option.value} onClick={() => updateAppearance({ [category]: option.value })}>
                {category === 'pet' ? <PetSprite pet={option.value as CharacterAppearance['pet']} /> : <CharacterSprite appearance={sample} portrait={category !== 'outfit'} />}
                <span>{option.label}{category === 'outfit' && outfitItem && <small aria-hidden="true">{outfitUnlocked ? RARITY_LABELS[outfitItem.rarity] : outfitItem.unlockCondition}</small>}</span><i aria-hidden="true">{appearance[category] === option.value ? '✓' : ''}</i>
              </button>
              {outfitItem && !outfitUnlocked && <button type="button" className="wardrobe-action outfit-collect-action" aria-label={`Sưu tầm · ${outfitItem.name}`} disabled={fame < outfitItem.fame || gold < outfitItem.price || !onPurchaseItem} onClick={() => collectOutfit(outfitItem)}>Sưu tầm · {outfitItem.price} xu</button>}
            </div>;
          })}</div>
        </fieldset>
        {category === 'hair' && <fieldset className="appearance-colors"><legend>Màu tóc</legend><div>{characterOptions.hairColor.map(option => <button key={option.value} type="button" aria-label={option.label} title={option.label} aria-pressed={appearance.hairColor === option.value} style={{ backgroundColor: option.color }} onClick={() => updateAppearance({ hairColor: option.value })}><span aria-hidden="true">{appearance.hairColor === option.value ? '✓' : ''}</span></button>)}</div></fieldset>}
        <div className="creator-detail-note"><span aria-hidden="true">✿</span>{category === 'outfit' ? <div className="creator-outfit-info" aria-label="Thông tin trang phục"><strong>{outfitDetail.origin}</strong><p>{outfitDetail.description}</p>{outfitDetail.accessory !== 'none' && <button type="button" onClick={() => updateAppearance({ accessory: outfitDetail.accessory })}>Phối cùng {suggestedAccessory?.label.toLowerCase()} <span aria-hidden="true">↗</span></button>}</div> : <p>{category === 'pet' ? 'Một bạn nhỏ theo chân bạn trong hẻm. Bấm “Thử đi trong map” để cùng đi dạo trước khi lưu.' : category === 'accessory' ? 'Nón lá, khăn đóng, nón quai thao và khăn mỏ quạ theo nhân vật ở cả bốn hướng.' : 'Xoay nhân vật để xem góc trước, góc sau và hai bên. Thử bước đi ngay trong phòng đồ.'}</p>}</div>
        {category === 'outfit' && customization.equipped.clothes && <button className="wardrobe-action" type="button" onClick={() => unequip('clothes')}>Bỏ trang phục trong ô cũ</button>}

        </section>
        </div>
        </details>
        <div className="creator-footer">
          {onBack ? <button className="creator-back" type="button" onClick={onBack}>← Về xóm</button> : <button className="creator-back" type="button" onClick={() => navigate('/map')}>← Về xóm</button>}
          <button className="creator-submit" type="submit">{submitLabel ?? (onStart ? 'Tạo nhân vật & vào xóm' : 'Lưu & vào bản đồ')} <span aria-hidden="true">→</span></button>
        </div>
      </div>
    </form>

  </div></section>;
}
