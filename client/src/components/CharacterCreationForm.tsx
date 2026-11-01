import { useState, type FormEvent } from 'react';
import { CharacterSprite } from './CharacterSprite';
import { characterGenders, getAppearanceOptions, type CharacterAppearance, type CharacterGender, type Facing } from '../game/character';
import type { CharacterCustomization } from '../game/characterCustomization';
import type { StartingCharacterId } from '../game/startingCharacters';
import '../styles/character-creation.css';

const fields = [
  { key: 'face', label: 'Khuôn mặt' },
  { key: 'hair', label: 'Tóc' },
  { key: 'outfit', label: 'Trang phục' },
  { key: 'skin', label: 'Màu da' },
  { key: 'accessory', label: 'Phụ kiện' },
] as const;

const directions: { value: Facing; label: string; arrow: string }[] = [
  { value: 'left', label: 'Bên trái', arrow: '←' },
  { value: 'up', label: 'Mặt sau', arrow: '↑' },
  { value: 'down', label: 'Mặt trước', arrow: '↓' },
  { value: 'right', label: 'Bên phải', arrow: '→' },
];

interface Props {
  appearance: CharacterAppearance;
  customization: CharacterCustomization;
  /** Keep a selected starting archetype's artwork and fitted outfit in the live preview. */
  startingCharacter?: StartingCharacterId;
  name: string;
  onName: (name: string) => void;
  onAppearance: (changes: Partial<CharacterAppearance>) => void;
  onGender: (gender: CharacterGender) => void;
  onRandom: () => void;
  onBack: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  promo?: { value: string; onChange: (value: string) => void };
}

export function CharacterCreationForm({ appearance, customization, startingCharacter, name, onName, onAppearance, onGender, onRandom, onBack, onSubmit, promo }: Props) {
  const [facing, setFacing] = useState<Facing>('down');
  const [walking, setWalking] = useState(false);
  return <section className="character-creation" aria-labelledby="creation-title">
    <div className="creation-shell">
      <header className="creation-header"><h1 id="creation-title">TẠO NHÂN VẬT</h1></header>
      <form className="creation-form" onSubmit={onSubmit}>
        <div className="creation-preview" aria-label="Xem trước nhân vật">
          <div className="creation-stage">
            <CharacterSprite appearance={appearance} customization={customization} startingCharacter={startingCharacter} facing={facing} walking={walking} className="creation-model" role="img" aria-label={`Nhân vật ${appearance.gender === 'male' ? 'nam' : 'nữ'}${walking ? ' đang bước đi' : ''}`} />
          </div>
          <span className="creation-preview-name">{name.trim() || 'Nhân vật của bạn'}</span>
          <div className="creation-genders" role="group" aria-label="Chọn nhân vật">
            {characterGenders.map(option => <button key={option.value} type="button" aria-pressed={appearance.gender === option.value} onClick={() => onGender(option.value)}>{option.label}</button>)}
          </div>
          <div className="creator-preview-controls creation-preview-controls" aria-label="Thử chuyển động">
            <div className="sprite-direction-picker" aria-label="Xoay nhân vật">
              {directions.map(direction => <button key={direction.value} type="button" aria-label={direction.label} aria-pressed={facing === direction.value} onClick={() => setFacing(direction.value)}>{direction.arrow}</button>)}
            </div>
            <button className="sprite-walk-toggle" type="button" aria-pressed={walking} onClick={() => setWalking(value => !value)}>
              {walking ? 'Ⅱ Dừng bước' : '▷ Xem bước đi'}
            </button>
          </div>
        </div>
        <div className="creation-controls">
          <div className="creation-options">
            {fields.map(({ key, label }) => {
              const options = getAppearanceOptions(key, appearance.gender);
              const index = Math.max(0, options.findIndex(option => option.value === appearance[key]));
              const step = (offset: number) => onAppearance({ [key]: options[(index + offset + options.length) % options.length].value });
              return <fieldset className="creation-option" key={key}>
                <legend>{label}</legend>
                <div className="creation-stepper">
                  <button type="button" onClick={() => step(-1)} aria-label={`${label} trước`}>‹</button>
                  <select aria-label={label} value={appearance[key]} onChange={event => onAppearance({ [key]: event.target.value })}>
                    {options.map(option => <option value={option.value} key={option.value}>{option.label}</option>)}
                  </select>
                  <button type="button" onClick={() => step(1)} aria-label={`${label} tiếp theo`}>›</button>
                </div>
              </fieldset>;
            })}
          </div>
          <label className="creation-name" htmlFor="creation-name">Tên nhân vật
            <input id="creation-name" aria-label="Tên người chơi / Tên nhân vật" value={name} onChange={event => onName(event.target.value)} placeholder="Ví dụ: Út Mận" minLength={2} maxLength={24} required autoComplete="nickname" aria-describedby="creation-name-help" />
          </label>
          <small id="creation-name-help" className="creation-help">Tên từ 2 đến 24 ký tự.</small>
          {promo && <details className="creation-promo"><summary>Mã quà tặng (nếu có)</summary>
            <label htmlFor="creation-promo">Nhập mã (không bắt buộc)</label>
            <input id="creation-promo" value={promo.value} onChange={event => promo.onChange(event.target.value)} autoComplete="off" />
            {promo.value.trim() && <small role="status">{promo.value.trim().toUpperCase() === 'CODEX500' ? 'Mã hợp lệ! Nhận 10.000 xu và 10.000 danh vọng khi xác nhận.' : 'Mã chưa đúng. Kiểm tra lại hoặc để trống.'}</small>}
          </details>}
        </div>
        <footer className="creation-actions">
          <button className="creation-back" type="button" onClick={onBack}>QUAY LẠI</button>
          <button className="creation-random" type="button" onClick={onRandom}>NGẪU NHIÊN</button>
          <button className="creation-confirm" type="submit">XÁC NHẬN</button>
        </footer>
      </form>
    </div>
  </section>;
}
