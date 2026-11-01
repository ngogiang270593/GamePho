import { useEffect, useState } from 'react';
import { useGameStore } from '../context/GameContext';
import { getOrderHistory, getRevenueHistory, getStatistics } from '../services/gameService';
import type { GameStatistics, OrderHistory, RevenueHistory } from '../services/gameTypes';
import { VillageIllustration } from '../components/VillageIllustration';

export function StatisticsPage() {
  const gameState = useGameStore().gameState;
  const player = gameState?.player;
  const [statistics, setStatistics] = useState<GameStatistics | null>(null);
  const [revenue, setRevenue] = useState<RevenueHistory[]>([]);
  const [orders, setOrders] = useState<OrderHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getStatistics(), getRevenueHistory(), getOrderHistory()])
      .then(([stats, revenueHistory, orderHistory]) => {
        setStatistics(stats);
        setRevenue(revenueHistory);
        setOrders(orderHistory);
      })
      .catch(cause => setError(cause instanceof Error ? cause.message : 'Không thể tải thống kê.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <section className="page-card subpage"><h1>Thống kê 📊</h1><p>Đang tổng hợp sổ quán...</p></section>;
  if (error) return <section className="page-card subpage"><h1>Thống kê 📊</h1><p role="alert">{error}</p></section>;

  return <section className="village-page"><VillageIllustration kind="statistics" title="Sổ thu chi của xóm" subtitle="BÁC SÁU GHI ĐỦ · KHÔNG ĐỂ TIỀN ĐI LẠC" /><div className="village-ledger">
    <div className="statistics-grid">
      <article><span>Tổng đơn</span><strong>{statistics?.totalOrders ?? 0}</strong></article>
      <article><span>Đơn đúng</span><strong>{statistics?.correctOrders ?? 0}</strong></article>
      <article><span>Doanh thu tích lũy</span><strong>{(statistics?.totalRevenue ?? 0).toLocaleString('vi-VN')}đ</strong></article>
      <article><span>Bàn thắng</span><strong>{statistics?.totalGoals ?? 0}</strong></article>
      <article><span>Chuỗi ngày chuẩn món</span><strong>{statistics?.currentStreak ?? 0}</strong></article>
      <article><span>Cấp quán</span><strong>{statistics?.shopLevel ?? player?.level ?? 1}</strong></article>
    </div>
    <h2>Tiến độ phát triển quán</h2>
    {player && <><p>{player.viralProgress}/{player.viralProgress + player.viralToNextLevel} viral · Còn {player.viralToNextLevel} viral để lên cấp</p>
      <div className="meter" role="progressbar" aria-label="Tiến độ lên cấp" aria-valuenow={player.viralProgress} aria-valuemin={0} aria-valuemax={player.viralProgress + player.viralToNextLevel}>
        <span className="hunger-meter" style={{ width: `${player.viralProgress}%` }} />
      </div></>}
    <h2>Tính năng đã mở khóa</h2>
    {gameState?.unlockedFeatures.length ? <ul>{gameState.unlockedFeatures.map(feature => <li key={feature.level}><strong>Cấp {feature.level}: {feature.name}.</strong> {feature.description}</li>)}</ul> : <p>Chưa có tính năng nào được mở khóa.</p>}
    <h2>Lịch sử doanh thu</h2>
    {revenue.length > 0 && <svg className="revenue-drawing" viewBox="0 0 700 220" role="img" aria-label="Biểu đồ doanh thu bảy mốc gần nhất">{revenue.slice(-7).map((item,i,all) => { const height = item.revenue / Math.max(1,...all.map(x => x.revenue)) * 145; const width = 600 / all.length; return <g key={item.date} transform={`translate(${50+i*width} 175)`}><path d="M0 0H600" stroke="#d9cca6" /><rect x="10" y={-height} width={Math.max(12,width-22)} height={height} rx="5" fill="#9aa77a" /><text x={width/2} y={-height-8} textAnchor="middle" fontSize="11" fill="#94825d">{Math.round(item.revenue/1000)}k</text><text x={width/2} y="23" textAnchor="middle" fontSize="10" fill="#a38e68">{item.date.slice(5,10)}</text></g>; })}</svg>}
    {revenue.length ? <div className="table-scroll"><table><thead><tr><th>Ngày</th><th>Doanh thu</th></tr></thead><tbody>{revenue.map(item => <tr key={item.date}><td>{item.date}</td><td>{item.revenue.toLocaleString('vi-VN')}đ</td></tr>)}</tbody></table></div> : <p>Chưa có doanh thu được ghi nhận.</p>}
    <h2>Lịch sử đơn hàng</h2>
    {orders.length ? <div className="table-scroll"><table><thead><tr><th>Khách</th><th>Món</th><th>Kết quả</th><th>Giá</th><th>Thời gian</th></tr></thead><tbody>{orders.map(order => <tr key={order.id}><td>{order.customerName}</td><td>{order.phoType}</td><td>{order.isCorrect ? 'Đúng' : 'Sai'}</td><td>{order.price.toLocaleString('vi-VN')}đ</td><td>{new Date(order.createdAt).toLocaleString('vi-VN')}</td></tr>)}</tbody></table></div> : <p>Chưa có đơn hàng nào.</p>}
  </div></section>;
}
