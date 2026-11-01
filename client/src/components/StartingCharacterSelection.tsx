import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { CharacterSprite } from './CharacterSprite';
import { ForestKeeperActionSprite, type CharacterPreviewAction } from './ForestKeeperActionSprite';
import type { CharacterAppearance, CharacterGender, Facing } from '../game/character';
import { startingCharacterInventory } from '../game/characterInventory';
import { STARTING_CHARACTERS, STARTING_SKILLS, rollStartingSkills, startingCharacterAppearance, startingCharacterImageAsset, type StartingCharacterId, type StartingSkills } from '../game/startingCharacters';
import type { CharacterCustomization } from '../game/characterCustomization';
import '../styles/character-creation.css';

const PREVIEW_ACTION = [
  { facing: 'down', movement: 'idle', duration: 600 },
  { facing: 'right', movement: 'walk', duration: 3200 },
  { facing: 'down', movement: 'turn', duration: 2400 },
  { facing: 'right', movement: 'run', duration: 2800 },
  { facing: 'down', movement: 'jump', duration: 1200 },
] as const satisfies readonly { facing: Facing; movement: CharacterPreviewAction; duration: number }[];

const ACTION_LABELS: Record<CharacterPreviewAction, string> = {
  idle: 'đứng chờ', walk: 'đang đi bộ', turn: 'đang xoay người', run: 'đang chạy', jump: 'đang nhảy',
};

interface Props {
  name: string;
  promoCode: string;
  onName: (name: string) => void;
  onPromoCode: (code: string) => void;
  onBack: () => void;
  onConfirm: (profile: {
    displayName: string;
    appearance: CharacterAppearance;
    customization: CharacterCustomization;
    startingCharacterId: StartingCharacterId;
    startingCharacterImage: string;
    startingSkills: StartingSkills;
    developmentPath: string;
    promoCodeRedeemed: boolean;
  }) => void;
}

export function StartingCharacterSelection({ name, promoCode, onName, onPromoCode, onBack, onConfirm }: Props) {
  const fallbackGender: CharacterGender = 'male';
  const [selectedGender, setSelectedGender] = useState<CharacterGender | null>(null);
  const [selectedId, setSelectedId] = useState<StartingCharacterId | null>(null);
  const [previewStep, setPreviewStep] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  const [pageVisible, setPageVisible] = useState(() => !document.hidden);
  const previewAction = PREVIEW_ACTION[reducedMotion ? 0 : previewStep];
  const previewMovement = previewAction.movement;
  const previewFacing = previewAction.facing;
  useEffect(() => {
    const preference = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReducedMotion(preference?.matches ?? false);
    const updateVisibility = () => setPageVisible(!document.hidden);
    preference?.addEventListener('change', updatePreference);
    document.addEventListener('visibilitychange', updateVisibility);
    return () => {
      preference?.removeEventListener('change', updatePreference);
      document.removeEventListener('visibilitychange', updateVisibility);
    };
  }, []);
  useEffect(() => {
    if (!selectedGender || reducedMotion || !pageVisible) return;
    const timeout = window.setTimeout(() => {
      setPreviewStep(step => (step + 1) % PREVIEW_ACTION.length);
    }, PREVIEW_ACTION[previewStep].duration);
    return () => window.clearTimeout(timeout);
  }, [previewStep, selectedGender, selectedId, reducedMotion, pageVisible]);
  const [skills, setSkills] = useState<Record<StartingCharacterId, StartingSkills>>(() =>
    Object.fromEntries(STARTING_CHARACTERS.map(template => [template.id, rollStartingSkills(template)])) as Record<StartingCharacterId, StartingSkills>);
  const selectedTemplate = STARTING_CHARACTERS.find(template => template.id === selectedId);
  const previewTemplate = selectedTemplate ?? STARTING_CHARACTERS[0];
  const appearance = startingCharacterAppearance(previewTemplate.id, selectedGender ?? fallbackGender);
  const customization = useMemo(
    () => startingCharacterInventory(appearance, previewTemplate),
    [appearance, previewTemplate],
  );
  const validName = name.trim().length >= 2 && name.trim().length <= 24;

  function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedGender || !selectedTemplate || !validName) return;
    const selectedAppearance = startingCharacterAppearance(selectedTemplate.id, selectedGender);
    onConfirm({
      displayName: name.trim(),
      appearance: selectedAppearance,
      customization: startingCharacterInventory(selectedAppearance, selectedTemplate),
      startingCharacterId: selectedTemplate.id,
      startingCharacterImage: startingCharacterImageAsset(selectedTemplate.id, selectedGender),
      startingSkills: skills[selectedTemplate.id],
      developmentPath: selectedTemplate.developmentPath,
      promoCodeRedeemed: promoCode.trim().toUpperCase() === 'CODEX500',
    });
  }

  return <section className="character-creation starting-character-selection" aria-labelledby="creation-title">
    <div className="creation-shell">
      <header className="creation-header">
        <button type="button" className="starting-screen-back" onClick={onBack}>← Quay lại</button>
        <p className="eyebrow">CHỌN HÀNH TRÌNH KHỞI ĐẦU</p>
        <h1 id="creation-title">Tạo nhân vật</h1>
      </header>

      <form className="starting-create-layout" onSubmit={confirm}>
        <aside className="starting-create-preview" aria-label="Xem trước nhân vật">
          <div className="starting-create-stage">
            {!selectedGender
              ? <div className="starting-await-gender">Chọn Nam hoặc Nữ để xem nhân vật</div>
              : <div
                className={`starting-live-character preview-${previewMovement}${!pageVisible ? ' preview-paused' : ''}`}
                data-preview-action={previewMovement}
                role="img"
                aria-label={`${previewTemplate.name} ${selectedGender === 'female' ? 'nữ' : 'nam'} ${ACTION_LABELS[previewMovement]}`}
              >
                {previewTemplate.id === 'forest-keeper' ? <ForestKeeperActionSprite
                  gender={selectedGender} action={previewMovement} facing={previewFacing} className="starting-game-sprite"
                /> : <CharacterSprite
                  appearance={appearance}
                  customization={customization}
                  startingCharacter={previewTemplate.id}
                  facing={previewFacing}
                  walking={previewMovement === 'walk' || previewMovement === 'run'}
                  running={previewMovement === 'run'}
                  className="starting-game-sprite"
                />}
              </div>}
          </div>
          <h2>{name.trim() || 'Nhân vật của bạn'}</h2>
          <p>{selectedTemplate ? previewTemplate.name : selectedGender ? 'Chọn một trong ba mẫu nhân vật' : 'Chọn giới tính để bắt đầu'}</p>
        </aside>

        <div className="starting-create-controls">
          <fieldset className="starting-gender-picker">
            <legend>1. Giới tính</legend>
            <div className="creation-genders" role="group" aria-label="Giới tính">
              {(['male', 'female'] as const).map(value => <button
                key={value}
                type="button"
                aria-pressed={selectedGender === value}
                onClick={() => {
                  setSelectedGender(value);
                  setPreviewStep(0);
                }}
              >{value === 'male' ? 'Nam' : 'Nữ'}</button>)}
            </div>
            <small>Giới tính chỉ thay đổi hình ảnh và diện mạo.</small>
          </fieldset>

          <section className="starting-template-picker" aria-label="Chọn mẫu nhân vật">
            <div className="starting-section-heading">
              <h2>2. Mẫu nhân vật</h2>
              <button type="button" className="starting-reroll" onClick={() => setSkills(
                Object.fromEntries(STARTING_CHARACTERS.map(template => [template.id, rollStartingSkills(template)])) as Record<StartingCharacterId, StartingSkills>,
              )}>🎲 Tạo lại chỉ số</button>
            </div>
            {!selectedGender && <p className="starting-selection-hint">Chọn giới tính trước để xem ba mẫu phù hợp.</p>}
            {selectedGender && <div className="starting-template-grid">
              {STARTING_CHARACTERS.map(template => {
                const imageGender = selectedGender;
                const isSelected = selectedId === template.id;
                const cardAppearance = startingCharacterAppearance(template.id, imageGender);
                const cardCustomization = startingCharacterInventory(cardAppearance, template);
                return <button
                  type="button"
                  key={template.id}
                  className={`starting-template-card${isSelected ? ' is-selected' : ''}`}
                  aria-pressed={isSelected}
                  disabled={!selectedGender}
                  onClick={() => {
                    setSelectedId(template.id);
                    setPreviewStep(0);
                  }}
                >
                  <CharacterSprite
                    className="starting-template-avatar"
                    appearance={cardAppearance}
                    customization={cardCustomization}
                    startingCharacter={template.id}
                  />
                  <span className="starting-template-copy">
                    <strong>{template.name}</strong>
                    <span className="starting-template-description">{template.role}</span>
                    <span className="starting-mini-skills">
                      {STARTING_SKILLS.map(skill => {
                        const value = skills[template.id][skill.id];
                        return <span className="starting-mini-skill" key={skill.id}>
                          <span>{skill.label}</span><b>{value}</b>
                          <span className="starting-skill-track" aria-hidden="true"><span style={{ width: `${value}%` }} /></span>
                        </span>;
                      })}
                    </span>
                  </span>
                </button>;
              })}
            </div>}
          </section>

          <label className="starting-name-field" htmlFor="starting-character-name">
            <span>3. Tên nhân vật</span>
            <input
              id="starting-character-name"
              aria-label="Tên người chơi / Tên nhân vật"
              autoComplete="nickname"
              value={name}
              onChange={event => onName(event.target.value)}
              placeholder="Ví dụ: Út Mận"
              minLength={2}
              maxLength={24}
              required
            />
          </label>

          <section className="starting-selected-details" aria-live="polite">
            <h2>{selectedTemplate ? `Kỹ năng · ${selectedTemplate.name}` : 'Kỹ năng và trang bị'}</h2>
            {selectedTemplate ? <>
              <p className="starting-selected-description">{selectedTemplate.description}</p>
              <div className="starting-selected-skills">
                {STARTING_SKILLS.map(skill => {
                  const value = skills[selectedTemplate.id][skill.id];
                  return <div className="starting-skill" key={skill.id}>
                    <span>{skill.label}</span><strong>{value}</strong>
                    <span className="starting-skill-track" aria-hidden="true"><span style={{ width: `${value}%` }} /></span>
                  </div>;
                })}
              </div>
              <p className="starting-gear"><strong>Trang bị mặc định:</strong> {selectedTemplate.gearNames.join(' · ')}</p>
            </> : <p className="starting-selection-hint">Chọn một mẫu để xem chỉ số và trang bị.</p>}
            <p className="starting-growth-note">Mọi kỹ năng có thể phát triển tới 100; mẫu chỉ tạo lợi thế khởi đầu.</p>
          </section>

          <details className="creation-promo">
            <summary>Mã quà tặng (không bắt buộc)</summary>
            <label htmlFor="starting-character-promo">Nhập mã</label>
            <input id="starting-character-promo" aria-label="Nhập mã (không bắt buộc)" value={promoCode} onChange={event => onPromoCode(event.target.value)} autoComplete="off" />
            {promoCode.trim() && <small role="status">{promoCode.trim().toUpperCase() === 'CODEX500' ? 'Mã hợp lệ! Nhận 10.000 xu và 10.000 danh vọng.' : 'Mã chưa đúng. Kiểm tra lại hoặc để trống.'}</small>}
          </details>

          <footer className="starting-create-actions">
            <button className="creation-confirm" type="submit" disabled={!selectedGender || !selectedTemplate || !validName}>Xác nhận và vào làng</button>
          </footer>
        </div>
      </form>
    </div>
  </section>;
}
