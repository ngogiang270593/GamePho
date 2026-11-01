import { useEffect, useMemo, useState } from 'react';
import { CharacterItemPreview } from './CharacterItemPreview';
import { RARITY_NAMES, SHOP_CATEGORIES, SHOP_PRODUCTS, type ShopProduct } from '../game/villageShop';
import type { HistoryProgress } from '../services/historyProgress';
import type { HistoryProfile } from '../services/historyProfile';
import { villageState, type VillageCommand } from '../services/villageGame';

export function VillageShop({progress,profile,onCommand,initialCategory='all'}:{progress:HistoryProgress;profile:HistoryProfile;onCommand:(command:VillageCommand)=>boolean;initialCategory?:string}) {
  const [category,setCategory]=useState(initialCategory);
  const [search,setSearch]=useState('');
  const [rarity,setRarity]=useState('all');
  const [price,setPrice]=useState('all');
  const [sort,setSort]=useState('asc');
  const [pending,setPending]=useState<ShopProduct|null>(null);
  const [limit,setLimit]=useState(12);
  useEffect(()=>setLimit(12),[category,rarity,price,search,sort]);
  const inventory=villageState(progress).inventory;
  const products=useMemo(()=>SHOP_PRODUCTS.filter(item=>(category==='all'||item.category===category||(category==='accessories'&&['back','front'].includes(item.category)))
    &&(rarity==='all'||item.rarity===rarity)
    &&(price==='all'||(price==='free' ? item.price===0 : price==='under100' ? item.price<=100 : item.price>100))
    &&`${item.name} ${item.description}`.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g,'').includes(search.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g,'')))
    .sort((a,b)=>sort==='asc' ? a.price-b.price : b.price-a.price),[category,rarity,price,search,sort]);
  return <div className="village-shop">
    <p className="village-wallet">🪙 <strong>{progress.gold.toLocaleString('vi-VN')} xu</strong> · ⭐ {progress.fame} danh vọng · 🎟️ {progress.freeUnoTickets} vé</p>
    <p className="village-muted">Chú Tư bán bằng xu trong game. Không dùng tiền thật.</p>
    <div className="village-shop-filters">
      <label>Tìm sản phẩm<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm nón, áo, thú cưỡi…" /></label>
      <label>Danh mục<select value={category} onChange={e=>setCategory(e.target.value)}><option value="all">Tất cả</option>{SHOP_CATEGORIES.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      <label>Độ hiếm<select value={rarity} onChange={e=>setRarity(e.target.value)}><option value="all">Tất cả độ hiếm</option>{Object.entries(RARITY_NAMES).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
      <label>Khoảng giá<select value={price} onChange={e=>setPrice(e.target.value)}><option value="all">Tất cả giá</option><option value="free">Miễn phí</option><option value="under100">Tối đa 100 xu</option><option value="over100">Trên 100 xu</option></select></label>
      <label>Sắp xếp<select value={sort} onChange={e=>setSort(e.target.value)}><option value="asc">Giá tăng dần</option><option value="desc">Giá giảm dần</option></select></label>
    </div>
    {pending && <section className="village-purchase-confirm" role="alertdialog" aria-label="Xác nhận mua" aria-describedby="village-purchase-description">
      <p id="village-purchase-description">Mua <strong>{pending.name}</strong> với <b>{pending.price} xu</b>?</p>
      <p>Còn lại: {progress.gold-pending.price} xu</p>
      <div className="village-row"><button autoFocus type="button" onClick={()=>{if(onCommand({type:'buy',id:pending.id}))setPending(null);}}>Xác nhận mua</button><button type="button" onClick={()=>setPending(null)}>Hủy</button></div>
    </section>}
    <p className="village-muted">{products.length} sản phẩm</p>
    <div className="village-products">{products.slice(0,limit).map(item=>{
      const owned=item.equipment ? profile.customization.unlockedItems.includes(item.id) : (inventory[item.id]??0)>0;
      const equipped=item.equipment && profile.customization.equipped[item.equipment.category]===item.id;
      const locked=progress.fame<item.fame;
      return <article key={item.id} className={`village-product rarity-${item.rarity.toLowerCase()}`}>
        <div className="village-product-art" role="img" aria-label={item.name}>{item.equipment ? <CharacterItemPreview item={item.equipment} /> : <span>{item.icon}</span>}</div>
        <div><h3>{item.name}</h3><p>{item.description}</p><small>{RARITY_NAMES[item.rarity]} · {item.price} xu</small><p className="village-product-status">{equipped ? 'Đang trang bị' : owned ? 'Đã sở hữu' : locked ? `Chưa mở khóa · ${item.fame} danh vọng` : 'Chưa sở hữu'}</p>
          {item.rewardOnly ? <small>Nhận từ nhiệm vụ và quà trên map</small> : owned ? item.equipment ? <button type="button" aria-label={`${equipped?'Tháo ra':'Trang bị'} · ${item.name}`} onClick={()=>onCommand({type:equipped?'unequip':'equip',id:item.id})}>{equipped?'Tháo ra':'Trang bị'}</button> : <span>Trong kho: {inventory[item.id]}{item.tickets ? ' · Vé đã cộng vào UNO' : ''}</span>
          : <button type="button" aria-label={`Mua · ${item.name}`} onClick={()=>{if(locked||progress.gold<item.price){onCommand({type:'buy',id:item.id});return;}setPending(item);}}>Mua · {item.price} xu</button>}
        </div>
      </article>;
    })}</div>
    {products.length>limit&&<button className="village-load-more" type="button" onClick={()=>setLimit(value=>value+12)}>Xem thêm sản phẩm</button>}
    {!products.length&&<p>Không có sản phẩm phù hợp. Hãy đổi bộ lọc.</p>}
  </div>;
}
