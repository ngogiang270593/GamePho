interface CookingPotProps {
  isCooking: boolean;
  isSuccess: boolean;
  serviceTimeSeconds: number;
  onStartCooking: () => void;
}

export function CookingPot({ isCooking, isSuccess, serviceTimeSeconds, onStartCooking }: CookingPotProps) {
  return (
    <section className={`cooking-pot${isCooking ? ' cooking' : ''}${isSuccess ? ' success' : ''}`} aria-label="Nồi phở">
      <div className="steam" aria-hidden="true"><i /><i /><i /></div>
      <div className="pot-illustration" aria-hidden="true"><span>🍜</span></div>
      <p>{isSuccess ? 'Tô phở đã sẵn sàng!' : isCooking ? 'Nước dùng đang sôi…' : 'Nồi phở đang chờ bạn'}</p>
      <p className="cook-time">Thời gian phục vụ: {serviceTimeSeconds} giây</p>
      <button type="button" className="pour-button" onClick={onStartCooking} disabled={isCooking || isSuccess}>
        {isSuccess ? 'Đã chan nước dùng ✓' : isCooking ? 'Đang chan...' : 'Chan nước dùng'}
      </button>
    </section>
  );
}
