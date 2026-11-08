import aCau from '../../assets/nhan-vat/a-cau.png';
import aSang from '../../assets/nhan-vat/a-sang.png';
import baMeQue from '../../assets/nhan-vat/ba-me-que.png';
import villageCaptain from '../../assets/nhan-vat/doi-truong-ho-vuong-lang.png';
import giao from '../../assets/nhan-vat/giao.png';
import hacLang from '../../assets/nhan-vat/hac-lang.png';
import hacLao from '../../assets/nhan-vat/hac-lao.png';
import bloodBlade from '../../assets/nhan-vat/huyet-dao-phuong.png';
import herbalist from '../../assets/nhan-vat/lao-lang-trung.png';
import woodcutter from '../../assets/nhan-vat/lao-tieu-phu.png';
import singer from '../../assets/nhan-vat/le-nuong.png';
import poisonWitch from '../../assets/nhan-vat/mu-doc-ba.png';
import taxOfficial from '../../assets/nhan-vat/quan-gia-trieu.png';
import tao from '../../assets/nhan-vat/tao.png';
import blacksmith from '../../assets/nhan-vat/thiet-chuy.png';
import fruitSeller from '../../assets/nhan-vat/thim-tu.png';
import toySeller from '../../assets/nhan-vat/tieu-muoi-ban-do-choi.png';
import innServer from '../../assets/nhan-vat/tieu-nhi-quan-rap.png';
import gateGuard from '../../assets/nhan-vat/truong-doi-tuan-tra.png';
import patrolArcher from '../../assets/nhan-vat/linh-tuan-tra-cung.png';
import patrolSwordsman from '../../assets/nhan-vat/linh-tuan-tra-dao.png';
import martialArtist from '../../assets/nhan-vat/vo-su-nuong.png';
import youngVillagerGirl from '../../assets/nhan-vat/thon-dan-tre.png';
import youngVillagerFarmer from '../../assets/nhan-vat/nong-dan-tre.png';
import elderVillagerFarmer from '../../assets/nhan-vat/nong-dan.png';

export type OpeningMapNpcArtworkId =
  | 'a-cau' | 'a-sang' | 'ba-me-que' | 'doi-truong-ho-vuong-lang' | 'giao'
  | 'hac-lang' | 'hac-lao' | 'huyet-dao-phuong' | 'lao-lang-trung' | 'lao-tieu-phu'
  | 'le-nuong' | 'mu-doc-ba' | 'quan-gia-trieu' | 'tao' | 'thiet-chuy'
  | 'thim-tu' | 'tieu-muoi-ban-do-choi' | 'tieu-nhi-quan-rap'
  | 'linh-tuan-tra-cung' | 'linh-tuan-tra-dao'
  | 'truong-doi-tuan-tra' | 'vo-su-nuong' | 'thon-dan-tre' | 'nong-dan-tre' | 'nong-dan'
  | 'elder' | 'fisherman' | 'martial-artist' | 'messenger' | 'guard';

export const OPENING_MAP_NPC_ARTWORKS = {
  'a-cau': { label: 'A Cẩu', src: aCau },
  'a-sang': { label: 'A Sáng', src: aSang },
  'ba-me-que': { label: 'Bà mẹ quê', src: baMeQue },
  'doi-truong-ho-vuong-lang': { label: 'Đội Trưởng Hộ Vệ Làng', src: villageCaptain },
  giao: { label: 'Giao', src: giao },
  'hac-lang': { label: 'Hắc Lang', src: hacLang },
  'hac-lao': { label: 'Hạc Lão', src: hacLao },
  'huyet-dao-phuong': { label: 'Huyết Đao Phượng', src: bloodBlade },
  'lao-lang-trung': { label: 'Lão Lang Trung', src: herbalist },
  'lao-tieu-phu': { label: 'Lão Tiều Phu', src: woodcutter },
  'le-nuong': { label: 'Lệ Nương', src: singer },
  'mu-doc-ba': { label: 'Mụ Độc Bà', src: poisonWitch },
  'quan-gia-trieu': { label: 'Quản Gia Triệu', src: taxOfficial },
  tao: { label: 'Tảo', src: tao },
  'thiet-chuy': { label: 'Thiết Chủy', src: blacksmith },
  'thim-tu': { label: 'Thím Tư', src: fruitSeller },
  'tieu-muoi-ban-do-choi': { label: 'Tiểu Muội Bán Đồ Chơi', src: toySeller },
  'tieu-nhi-quan-rap': { label: 'Tiểu Nhị Quán Rạp', src: innServer },
  'linh-tuan-tra-cung': { label: 'Lính Tuần Tra Cung', src: patrolArcher },
  'linh-tuan-tra-dao': { label: 'Lính Tuần Tra Đao', src: patrolSwordsman },
  'truong-doi-tuan-tra': { label: 'Trưởng Đội Tuần Tra', src: gateGuard },
  'vo-su-nuong': { label: 'Võ Sư Nương', src: martialArtist },
  'thon-dan-tre': { label: 'Bé Thảo', src: youngVillagerGirl },
  'nong-dan-tre': { label: 'Cậu Tùng', src: youngVillagerFarmer },
  'nong-dan': { label: 'Bác Hòa', src: elderVillagerFarmer },
  elder: { label: 'Bà mẹ quê', src: baMeQue },
  fisherman: { label: 'Tảo', src: tao },
  'martial-artist': { label: 'Võ Sư Nương', src: martialArtist },
  messenger: { label: 'Giao', src: giao },
  guard: { label: 'Trưởng Đội Tuần Tra', src: gateGuard },
} as const satisfies Record<OpeningMapNpcArtworkId, { label: string; src: string }>;

const ARTWORK_IDS = [
  'a-cau', 'a-sang', 'ba-me-que', 'doi-truong-ho-vuong-lang', 'giao',
  'hac-lang', 'hac-lao', 'huyet-dao-phuong', 'lao-lang-trung', 'lao-tieu-phu',
  'le-nuong', 'mu-doc-ba', 'nong-dan', 'nong-dan-tre', 'quan-gia-trieu', 'tao', 'thon-dan-tre', 'thiet-chuy', 'thim-tu',
  'tieu-muoi-ban-do-choi', 'tieu-nhi-quan-rap', 'linh-tuan-tra-cung', 'linh-tuan-tra-dao', 'truong-doi-tuan-tra', 'vo-su-nuong',
] as const satisfies readonly OpeningMapNpcArtworkId[];

export const OPENING_MAP_NPC_ARTWORK_OPTIONS = ARTWORK_IDS.map(id => [
  id,
  OPENING_MAP_NPC_ARTWORKS[id],
] as const);
