import { HERO_SKILL_TREE } from '../game/heroSkills';
import '../styles/hero-skill-tree.css';

export function HeroSkillTree() {
  const [innerManual, ...activeSkills] = HERO_SKILL_TREE;

  return (
    <section className="hero-skill-tree" aria-labelledby="hero-skill-tree-title">
      <header className="hero-skill-tree__heading">
        <div>
          <span className="sv-kicker">TIỂU MÔNG · VÕ HỌC SÔNG NƯỚC</span>
          <h1 id="hero-skill-tree-title">Cây kỹ năng & bộ chiêu thức</h1>
          <p>Đường võ công lấy cảm hứng từ nhịp nước, cách săn mồi và tự vệ của linh vật vùng sông đầm.</p>
        </div>
        <aside className="hero-skill-tree__notice" role="note">
          <strong>Bản thiết kế kỹ năng</strong>
          <span>Các thông số dưới đây là đề xuất theo lượt; chưa được áp dụng vào giao chiến trong game.</span>
        </aside>
      </header>

      <article className="hero-skill-node hero-skill-node--manual">
        <span className="hero-skill-node__icon" aria-hidden="true">{innerManual.icon}</span>
        <div className="hero-skill-node__body">
          <div className="hero-skill-node__meta"><span>{innerManual.kind}</span><span>{innerManual.branch}</span></div>
          <h2>{innerManual.name}</h2>
          <p>{innerManual.action}</p>
          <div className="hero-skill-node__effect"><strong>Nội tại địa hình</strong><span>{innerManual.effect}</span></div>
        </div>
        <span className="hero-skill-node__unlock">{innerManual.unlock}</span>
      </article>

      <div className="hero-skill-tree__trunk" aria-hidden="true"><span /></div>
      <div className="hero-skill-tree__branches">
        {activeSkills.map((skill, index) => (
          <article className={`hero-skill-node${index === activeSkills.length - 1 ? ' hero-skill-node--ultimate' : ''}`} key={skill.id}>
            <span className="hero-skill-node__icon" aria-hidden="true">{skill.icon}</span>
            <div className="hero-skill-node__body">
              <div className="hero-skill-node__meta"><span>Chiêu {index + 1}</span><span>{skill.branch}</span></div>
              <h2>{skill.name}</h2>
              <p>{skill.action}</p>
              <div className="hero-skill-node__stats">
                <span>🔹 {skill.innerForce} Nội Lực</span>
                <span>⏱ Hồi {skill.cooldown} lượt</span>
              </div>
              <div className="hero-skill-node__effect"><strong>Hiệu ứng</strong><span>{skill.effect}</span></div>
            </div>
            <span className="hero-skill-node__unlock">{skill.unlock}</span>
          </article>
        ))}
      </div>
      <footer className="hero-skill-tree__footer">
        <strong>Nguyên tắc cân bằng</strong>
        <span>Hồi chiêu tính theo lượt của nhân vật. Mỗi chiêu có vai trò riêng; hiệu ứng khống chế với thủ lĩnh được giảm để tránh khóa trận quá lâu.</span>
      </footer>
    </section>
  );
}
