import { DEFAULT_APPEARANCES, type CharacterAppearance } from './character';
import type { Customer } from '../services/gameTypes';

export type CustomerProp = 'scarf' | 'helmet' | 'phone' | 'glasses' | 'backpack' | 'cap' | 'flower' | 'none';
export interface CustomerProfile {
  key: string; name: string; role: string; appearance: CharacterAppearance; prop: CustomerProp; color: string; elder: boolean; child: boolean; quirk: string;
}
function person(key: string, name: string, role: string, female: boolean, prop: CustomerProp, color: string, quirk: string, elder = false, child = false): CustomerProfile {
  const seed = [...key].reduce((n, ch) => n + ch.charCodeAt(0), 0);
  return { key, name, role, prop, color, quirk, elder, child,
    appearance: { ...DEFAULT_APPEARANCES[female ? 'female' : 'male'], outfit: 'baba', accessory: 'none',
      hair: female ? elder ? 'bun' : seed % 2 ? 'braid' : 'short' : seed % 2 ? 'crop' : 'sidepart',
      hairColor: seed % 4 ? 'ink' : 'brown', skin: (['peach', 'honey', 'tan', 'bronze'] as const)[seed % 4],
      face: child ? 'round' : seed % 3 ? 'oval' : 'freckles', eyes: elder || child ? 'smile' : 'almond' } };
}
export const CUSTOMER_CAST: CustomerProfile[] = [
  person('bay', 'Chú Bảy Húp Sạch', 'Khách ruột', false, 'scarf', '#89633e', 'Húp sạch tô thay cho lời khen.', true),
  person('ba-gia', 'Cô Ba Xin Thêm Giá', 'Hàng xóm', true, 'scarf', '#687d51', 'Mang rau vườn, mang luôn chuyện vui.', true),
  person('nam-dep', 'Bác Năm Dép Tổ Ong', 'Khách thong thả', false, 'glasses', '#8b745a', 'Dép đi một nơi, bác ngồi một nẻo.', true),
  person('teo', 'Anh Tèo Tốc Hành', 'Shipper', false, 'helmet', '#cf7553', 'Chạy đơn nhanh, ăn phở cũng nhanh.'),
  person('ship-lac', 'Chị Na Không Lạc Đường', 'Shipper', true, 'helmet', '#629282', 'Tìm được mọi ngõ trừ ngõ tắt về nhà.'),
  person('bin-pin', 'Bin Pin Còn Một Vạch', 'Shipper', false, 'helmet', '#d4ac54', 'Cần sạc điện thoại lẫn chiếc bụng.'),
  person('sau', 'Chú Sáu Bù Giờ', 'Mê bóng đá', false, 'cap', '#768b69', 'Bình luận sôi nổi hơn nồi nước dùng.', true),
  person('hung-var', 'Hùng VAR Miệng', 'Cầu thủ phủi', false, 'scarf', '#aa6752', 'Xin xem lại mọi tình huống, kể cả topping.'),
  person('dat-khung', 'Đạt Sút Trúng Khung Cửa', 'Đội bóng đầu hẻm', false, 'cap', '#688c9a', 'Chạy chỗ rất hay, sút bóng rất hên.'),
  person('ti-top', 'Tí Tóp Tóp', 'TikToker', false, 'phone', '#a78baf', 'Máy quay ăn trước nhưng bụng réo to hơn.'),
  person('phuc-review', 'Phúc Rì Viu', 'Người review', false, 'glasses', '#6b8895', 'Quyết tâm nếm trước khi chấm sao.'),
  person('mi-filter', 'Mi Không Cần Filter', 'TikToker', true, 'phone', '#b98783', 'Ánh sáng đẹp là được, phở phải nóng.'),
  person('tam', 'Cô Tám Tin Nóng', 'Hóng chuyện xóm', true, 'glasses', '#a27b70', 'Chỉ kể chuyện trong nhóm… cả xóm.', true),
  person('tu-wifi', 'Dì Tư Wi-Fi Mạnh', 'Trạm tin đầu hẻm', true, 'scarf', '#8b849f', 'Tín hiệu năm vạch, trí nhớ năm sao.', true),
  person('lan-hong', 'Cô Lan Hóng Có Chọn Lọc', 'Hàng xóm vui vẻ', true, 'flower', '#a49968', 'Chuyện vui thì kể, chuyện buồn thì giúp.'),
  person('linh-deadline', 'Linh Chạy Deadline', 'Sinh viên', true, 'backpack', '#909e77', 'Ăn một tô, mở hai mươi tab.'),
  person('khoi-hoc', 'Khôi Học Từ Mai', 'Sinh viên', false, 'backpack', '#7f929c', 'Lần này mai học thật, chắc luôn.'),
  person('vy-cuoi', 'Vy Cuối Tháng', 'Sinh viên', true, 'glasses', '#ad8c64', 'Ví mỏng, tinh thần vẫn dày.'),
  person('chu-binh', 'Chú Bình Soi Topping', 'Khách kỹ tính', false, 'glasses', '#7f8270', 'Kỹ tính chứ không khó thương.', true),
  person('co-hanh', 'Cô Hạnh Không Hành', 'Khách kỹ tính', true, 'flower', '#9e7461', 'Tên có Hạnh, tô không có hành.'),
  person('anh-chuan', 'Anh Chuẩn Từng Sợi', 'Khách kỹ tính', false, 'glasses', '#6b7d77', 'Gọi sao ăn vậy, không thêm bất ngờ.'),
  person('bo', 'Bé Bo Không Hành', 'Thám tử tô phở', false, 'backpack', '#c99d5b', 'Săn hạt hành giỏi hơn săn điểm tốt.', false, true),
  person('me-min', 'Mẹ Mít Và Biệt Đội Đói', 'Gia đình', true, 'scarf', '#bf927a', 'Khi cả nhà im lặng là phở đang ngon.'),
  person('ong-tam', 'Ông Tám Dắt Cháu Đi Chơi', 'Khách quen', false, 'cap', '#958062', 'Cháu hỏi liên tục, ông ăn từ tốn.', true),
  person('co-sen', 'Cô Sen VIP Đi Dép Lào', 'Khách đặc biệt', true, 'flower', '#a18e70', 'VIP nghĩa là Vừa Ý Phở.'),
  person('chu-an', 'Chú An Ăn Ẩn Danh', 'Khách đặc biệt', false, 'glasses', '#7b8e76', 'Ẩn danh nhưng cả hẻm đều biết tên.'),
  person('hai-hat', 'Chị Hai Hạt Michelin Tự Trồng', 'Khách đặc biệt', true, 'flower', '#b79581', 'Có hai chậu hạt, không có hai sao.'),
];
export function customerProfile(customer: Pick<Customer, 'name' | 'personaKey'>) { return CUSTOMER_CAST.find(p => p.key === customer.personaKey || p.name === customer.name); }
