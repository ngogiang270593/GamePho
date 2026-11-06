import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { CharacterSprite } from './CharacterSprite';
import { ForestKeeperActionSprite } from './ForestKeeperActionSprite';
import type { CharacterAppearance, CharacterGender } from '../game/character';
import { startingCharacterInventory } from '../game/characterInventory';
import { STARTING_CHARACTERS, startingCharacterAppearance, startingCharacterImageAsset, type PlayableCharacterId } from '../game/startingCharacters';
import { HERO_ALIGNMENT_PATHS, HERO_BASE_ATTRIBUTES, HERO_BIOGRAPHY, HERO_STARTING_TALENTS, type HeroDevelopment, type HeroTalentId, type HeroAlignmentPath } from '../game/heroDevelopment';
import type { CharacterCustomization } from '../game/characterCustomization';
import { spriteSheetTarget, useAppliedSpriteSheet } from '../game/characterSpriteSheet';
import '../styles/character-creation.css';

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
    startingCharacterId: PlayableCharacterId;
    startingCharacterImage: string;
    promoCodeRedeemed: boolean;
    testGameCodeRedeemed: boolean;
    heroDevelopment: HeroDevelopment;
  }) => void;
}

export function StartingCharacterSelection({ name, promoCode, onName, onPromoCode, onBack, onConfirm }: Props) {
  const selectedGender: CharacterGender = 'male';
  const [selectedTalent, setSelectedTalent] = useState<HeroTalentId | null>(HERO_STARTING_TALENTS[0].id);
  const [alignmentGoal, setAlignmentGoal] = useState<HeroAlignmentPath | null>(null);
  const [testCode, setTestCode] = useState('');
  const [testCodeApplied, setTestCodeApplied] = useState(false);
  const [testCodeFeedback, setTestCodeFeedback] = useState('');
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  const [pageVisible, setPageVisible] = useState(() => !document.hidden);
  const previewMovement = 'walk';
  const previewFacing = 'down';
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
  const template = STARTING_CHARACTERS[0];
  const appearance = startingCharacterAppearance(template.id, selectedGender);
  const customSheet = useAppliedSpriteSheet(spriteSheetTarget(template.id, selectedGender));
  const customization = useMemo(
    () => startingCharacterInventory(appearance, template),
    [appearance, template],
  );
  const validName = name.trim().length >= 2 && name.trim().length <= 24;
  const isDevBuild = import.meta.env.DEV;

  function applyTestCode() {
    if (!isDevBuild) return;
    if (testCode.trim().toUpperCase() === 'TEST-MELINH') {
      setTestCodeApplied(true);
      setTestCodeFeedback('Mã hợp lệ! Bạn sẽ bắt đầu với 10.000 xu và 10.000 danh vọng.');
      return;
    }
    setTestCodeApplied(false);
    setTestCodeFeedback('Mã thử chưa đúng. Hãy kiểm tra lại.');
  }

  function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validName || !selectedTalent) return;
    const selectedAppearance = startingCharacterAppearance(template.id, selectedGender);
    onConfirm({
      displayName: name.trim(),
      appearance: selectedAppearance,
      customization: startingCharacterInventory(selectedAppearance, template),
      startingCharacterId: template.id,
      startingCharacterImage: startingCharacterImageAsset(template.id, selectedGender),
      promoCodeRedeemed: promoCode.trim().toUpperCase() === 'CODEX500',
      testGameCodeRedeemed: isDevBuild && testCodeApplied,
      heroDevelopment: { talent: selectedTalent, alignmentGoal },
    });
  }

  return <section className="character-creation starting-character-selection" aria-labelledby="creation-title">
    <div className="creation-shell">
      <header className="creation-header">
        <button type="button" className="starting-screen-back" onClick={onBack}>← Quay lại</button>
        <p className="eyebrow">KHỞI NGHĨA HAI BÀ TRƯNG · NĂM 40–43</p>
        <h1 id="creation-title">{HERO_BIOGRAPHY.title} · {HERO_BIOGRAPHY.epithet}</h1>
        <p>{HERO_BIOGRAPHY.age} · {HERO_BIOGRAPHY.home}. Câu chuyện theo chân một chàng trai lớn lên bên sông.</p>
      </header>

      <form className="starting-create-layout" onSubmit={confirm}>
        <aside className="starting-create-preview" aria-label="Xem trước nhân vật">
          <div className="starting-create-stage">
            <div
              className={`starting-live-character preview-${previewMovement}${!pageVisible ? ' preview-paused' : ''}`}
              data-preview-action={previewMovement}
              data-preview-facing={previewFacing}
              role="img"
              aria-label="Nhân vật nam đang đi bộ về phía trước"
            >
              {!customSheet ? <ForestKeeperActionSprite
                gender={selectedGender} action={previewMovement} facing={previewFacing} className="starting-game-sprite"
              /> : <CharacterSprite
                appearance={appearance}
                customization={customization}
                startingCharacter={template.id}
                facing={previewFacing}
                walking
                spriteAction={previewMovement}
                spritePlaying={!reducedMotion && pageVisible}
                className="starting-game-sprite"
              />}
            </div>
          </div>
          <h2>{name.trim() || 'Tiểu Mông'}</h2>
          <p>Nam · Lối đánh du kích sông nước</p>
        </aside>

        <div className="starting-create-controls">
          <section className="starting-template-picker" aria-label="Nhân vật chính">
            <h2>Nhân vật khởi đầu</h2>
            <p className="starting-selection-hint">Quen sông nước, cậu dùng dao găm, nỏ tre và bẫy để xoay xở trước đối thủ mạnh hơn.</p>
            <CharacterSprite
              className="starting-template-avatar"
              appearance={appearance}
              customization={customization}
              startingCharacter={template.id}
            />
          </section>

          <details className="hero-biography">
            <summary>Tiểu sử</summary>
            <article>
              <p className="hero-biography-meta">{HERO_BIOGRAPHY.epithet} · {HERO_BIOGRAPHY.age} · {HERO_BIOGRAPHY.home}</p>
              {HERO_BIOGRAPHY.story.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
              <h3>Tính cách</h3><p>{HERO_BIOGRAPHY.personality}</p>
              <h3>Mục tiêu</h3><p>{HERO_BIOGRAPHY.motivation}</p>
              <h3>Hành trình trưởng thành</h3><p>{HERO_BIOGRAPHY.arc}</p>
            </article>
          </details>

          <section className="hero-attributes" aria-labelledby="hero-attributes-title">
            <h2 id="hero-attributes-title">Chỉ số ban đầu</h2>
            <p>Nền tảng cân bằng, thiên về sự nhanh nhẹn và khả năng sinh tồn.</p>
            <div className="hero-attributes-grid">
              {HERO_BASE_ATTRIBUTES.map(attribute => <article className="hero-attribute" key={attribute.id}>
                <div><strong>{attribute.label}</strong><b>{attribute.value} <small>{attribute.unit}</small></b></div>
                <p>{attribute.description}</p>
              </article>)}
            </div>
          </section>

          <fieldset className="hero-talent-picker">
            <legend>Thiên phú · Chọn một</legend>
            <p>Chọn sở trường sẽ đồng hành cùng cậu từ đầu.</p>
            <div className="hero-talent-options">
              {HERO_STARTING_TALENTS.map(talent => <button
                type="button"
                key={talent.id}
                className="hero-choice-card"
                aria-pressed={selectedTalent === talent.id}
                onClick={() => setSelectedTalent(talent.id)}
              >
                <span className="hero-choice-check" aria-hidden="true">{selectedTalent === talent.id ? '✓' : '＋'}</span>
                <strong>{talent.name}</strong>
                <span>{talent.description}</span>
              </button>)}
            </div>
          </fieldset>

          <fieldset className="hero-alignment-picker">
            <legend>Định hướng Chính – Tà</legend>
            <p>Có thể đổi hướng trong hành trình; tâm pháp và thiên phú đặc quyền cần được mở khóa.</p>
            <div className="hero-alignment-options">
              {HERO_ALIGNMENT_PATHS.map(path => {
                const alignmentValue = HERO_BASE_ATTRIBUTES.find(attribute => attribute.id === (path.id === 'righteous' ? 'virtue' : 'corruption'))!.value;
                const meetsAlignment = alignmentValue >= path.alignmentThreshold;
                return <button
                  type="button"
                  key={path.id}
                  className={`hero-alignment-card hero-alignment-card--${path.id}`}
                  aria-pressed={alignmentGoal === path.id}
                  onClick={() => setAlignmentGoal(current => current === path.id ? null : path.id)}
                >
                  <span className="hero-alignment-heading"><strong>{path.name}</strong><small>{path.alignment}</small></span>
                  <span>{path.style}</span>
                  <span className="hero-alignment-requirements">
                    <b>{meetsAlignment ? '✓' : '○'} {path.id === 'righteous' ? 'Đạo Đức' : 'Tà Khí'} ≥ {path.alignmentThreshold}</b>
                    <span>Thiên phú: {path.requiredTalent}</span>
                    <span>Tâm pháp: {path.requiredManual}</span>
                  </span>
                  <span className="hero-alignment-lock">{meetsAlignment ? 'Cần mở khóa thiên phú và tâm pháp trong game' : 'Chưa đủ chỉ số và chưa mở khóa thiên phú/tâm pháp'}</span>
                </button>;
              })}
            </div>
          </fieldset>

          <label className="starting-name-field" htmlFor="starting-character-name">
            <span>Tên nhân vật</span>
            <input
              id="starting-character-name"
              aria-label="Tên người chơi / Tên nhân vật"
              autoComplete="nickname"
              value={name}
              onChange={event => onName(event.target.value)}
              placeholder="Tiểu Mông"
              minLength={2}
              maxLength={24}
              required
            />
          </label>

          <details className="creation-promo">
            <summary>Mã quà tặng (không bắt buộc)</summary>
            <label htmlFor="starting-character-promo">Nhập mã</label>
            <input id="starting-character-promo" aria-label="Nhập mã (không bắt buộc)" value={promoCode} onChange={event => onPromoCode(event.target.value)} autoComplete="off" />
            {promoCode.trim() && <small role="status">{promoCode.trim().toUpperCase() === 'CODEX500' ? 'Mã hợp lệ! Nhận 10.000 xu và 10.000 danh vọng.' : 'Mã chưa đúng. Kiểm tra lại hoặc để trống.'}</small>}
          </details>

          {isDevBuild && <section className="starting-test-code" aria-label="Mã thử game">
            <label htmlFor="starting-test-code-input">Mã thử game <small>Chỉ dùng trong bản phát triển</small></label>
            <div className="starting-test-code__entry">
              <input
                id="starting-test-code-input"
                aria-label="Nhập mã thử game"
                value={testCode}
                onChange={event => {
                  setTestCode(event.target.value);
                  setTestCodeApplied(false);
                  setTestCodeFeedback('');
                }}
                autoComplete="off"
                placeholder="Nhập mã để test nhanh"
              />
              <button type="button" onClick={applyTestCode}>Áp dụng</button>
            </div>
            {testCodeFeedback && <small className={testCodeApplied ? 'is-valid' : 'is-invalid'} role="status">{testCodeFeedback}</small>}
          </section>}

          <footer className="starting-create-actions">
            <button className="creation-confirm" type="submit" disabled={!validName}>Vào game</button>
          </footer>
        </div>
      </form>
    </div>
  </section>;
}
