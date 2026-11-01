import { registerPwa } from './services/pwa';
import { ConnectivityBanner } from './components/InstallAppControl';
import './styles/pwa.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import { JourneyProvider } from './context/JourneyContext';
import { AppRoutes } from './AppRoutes';
import { AccountGate } from './components/AccountGate';
import './styles/global.css';
import './styles/theme.css';
import './styles/world.css';
import './styles/map-hub.css';
import './styles/shop.css';
import './styles/journey.css';
import './styles/kitchen.css';
import './styles/readability.css';

function App() {
  return (
    <><ConnectivityBanner /><GameProvider>
      <JourneyProvider>
      <BrowserRouter>
        <AccountGate>
          <AppRoutes />
        </AccountGate>
      </BrowserRouter>
      </JourneyProvider>
    </GameProvider></>
  );
}

registerPwa();
createRoot(document.getElementById('root')!).render(<App />);
