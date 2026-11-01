import type { CharacterAppearance, CharacterGender } from './character';

export type OutfitKind = CharacterAppearance['outfit'];
export interface OutfitPalette { main: string; light: string; dark: string; trim: string; pants: string }

export const OUTFIT_DETAILS: Record<OutfitKind, { origin: string; description: string; accessory: CharacterAppearance['accessory'] }> = {
  aodai: { origin: 'Duyên dáng Việt Nam', description: 'Áo cổ đứng, tà trước và tà sau dài, xẻ hai bên, phối quần sáng màu và họa tiết gấm.', accessory: 'nonla' },
  lotus: { origin: 'Hoa sen Việt', description: 'Áo dài hồng thêu sen, cổ đứng, hai tà mềm và quần màu ngà.', accessory: 'flower' },
  tuthan: { origin: 'Bắc Bộ', description: 'Bốn tà áo nâu, yếm đào, váy đen và dải thắt lưng. Phối cùng khăn mỏ quạ hoặc nón quai thao.', accessory: 'moqua' },
  baba: { origin: 'Nam Bộ', description: 'Áo dáng gọn, hàng cúc cài thẳng giữa thân, hai túi và quần rộng màu sẫm.', accessory: 'nonla' },
  forest: { origin: 'Đồng phục người giữ rừng', description: 'Áo xanh rêu cổ bẻ với túi hộp, quần short túi hộp, bốt da và khăn quấn đầu đi rừng.', accessory: 'none' },
  nhatbinh: { origin: 'Cổ phục cung đình Huế', description: 'Cổ áo hình chữ nhật, tay rộng có dải màu, thân áo thêu hoa và viền sóng nước.', accessory: 'none' },
  nguthan: { origin: 'Cổ phục thời Nguyễn · Nam & Nữ', description: 'Dáng áo ngũ thân suông, cổ đứng, vạt cài bên phải và năm khuy áo.', accessory: 'khandong' },
  apron: { origin: 'Một ngày ở Xóm Nhà Lá', description: 'Áo làm việc, tạp dề màu kem có túi trước và biểu tượng tô phở.', accessory: 'none' },
};

export function getOutfitPalette(outfit: OutfitKind, gender: CharacterGender): OutfitPalette {
  const male = gender === 'male';
  return {
    aodai: male
      ? { main: '#477695', light: '#7a9eac', dark: '#35516d', trim: '#eed39a', pants: '#f6e7c6' }
      : { main: '#c44443', light: '#e46c58', dark: '#8d3039', trim: '#f1cf86', pants: '#fbebc8' },
    baba: male
      ? { main: '#88654f', light: '#b0946c', dark: '#5d4940', trim: '#dfcba1', pants: '#393d47' }
      : { main: '#397f78', light: '#65a18b', dark: '#275c59', trim: '#d8d599', pants: '#393d47' },
    forest: { main: '#66764a', light: '#879565', dark: '#3e4d32', trim: '#b0b17a', pants: '#806148' },
    apron: { main: '#677b97', light: '#91a1ac', dark: '#405671', trim: '#f4dfaf', pants: '#4b4545' },
    lotus: { main: '#dc869f', light: '#edb1b7', dark: '#a75880', trim: '#ffecd4', pants: '#faf0da' },
    nguthan: male
      ? { main: '#3d536d', light: '#687f94', dark: '#293a50', trim: '#e1c48a', pants: '#f4e6c5' }
      : { main: '#717d65', light: '#a4ac82', dark: '#4b6051', trim: '#ead6a3', pants: '#f4e6c5' },
    tuthan: { main: '#7a5b43', light: '#a5855c', dark: '#534339', trim: '#cfbd8a', pants: '#393c43' },
    nhatbinh: { main: '#974c6b', light: '#c27c94', dark: '#6c3759', trim: '#f0d28a', pants: '#f7e8c7' },
  }[outfit];
}
