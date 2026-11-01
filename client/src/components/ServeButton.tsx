interface ServeButtonProps {
  canServe: boolean;
  isLoading: boolean;
  onServe: () => void;
}

export function ServeButton({ canServe, isLoading, onServe }: ServeButtonProps) {
  return (
    <button type="button" className="serve-button" disabled={!canServe || isLoading} onClick={onServe}>
      {isLoading ? <><span className="button-spinner" /> Đang phục vụ...</> : 'Phục vụ khách'}
    </button>
  );
}
