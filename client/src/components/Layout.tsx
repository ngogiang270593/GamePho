import { Outlet } from 'react-router-dom';

export function Layout() {
  return <div className="app-shell world-layout">
    <main className="main-content startup-main"><Outlet /></main>
  </div>;
}
