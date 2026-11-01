import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return <section className="page-card empty-service"><p className="eyebrow">LẠC HẺM RỒI!</p><h1>404 · Không tìm thấy trang</h1><p>Đường này không dẫn đến quán phở nào cả.</p><Link className="home-link" to="/">Quay về quán</Link></section>;
}
