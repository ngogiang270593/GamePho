import { startingCharacterArtwork } from '../game/startingCharacterArtwork';
import { CHARACTER_REFERENCES } from '../game/startingCharacters';

export function CharacterReferenceGallery() {
  return <section className="character-reference-gallery sprite-editor__card" aria-labelledby="character-reference-heading">
    <h2 id="character-reference-heading">Mẫu ảnh tham khảo</h2>
    <p className="sprite-editor__hint">Chỉ dùng ảnh gốc làm tư liệu tham khảo; hai mẫu này chưa có nhân vật chơi được hay chuyển động riêng.</p>
    <div className="character-reference-gallery__templates">
      {CHARACTER_REFERENCES.map(reference => <article key={reference.id}>
        <h3>{reference.name}</h3>
        <div className="character-reference-gallery__images">
          {(['male', 'female'] as const).map(gender => <figure key={gender}>
            <img src={startingCharacterArtwork(reference.id, gender)} alt={`${reference.name} · ${gender === 'male' ? 'Nam' : 'Nữ'}`} loading="lazy" />
            <figcaption>{gender === 'male' ? 'Nam' : 'Nữ'}</figcaption>
          </figure>)}
        </div>
      </article>)}
    </div>
  </section>;
}
