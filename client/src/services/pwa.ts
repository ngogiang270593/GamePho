interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
let prompt: InstallPrompt | null = null;
export const hasInstallPrompt = () => prompt !== null;
export async function installApp(): Promise<void> {
  if (!prompt) return;
  const current = prompt; prompt = null;
  await current.prompt(); await current.userChoice;
  window.dispatchEvent(new Event('pho-xom-install-change'));
}
export function registerPwa() {
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault(); prompt = event as InstallPrompt;
    window.dispatchEvent(new Event('pho-xom-install-change'));
  });
  window.addEventListener('appinstalled', () => { prompt = null; window.dispatchEvent(new Event('pho-xom-installed')); });
  if (!import.meta.env.PROD || !('serviceWorker' in navigator) || !window.isSecureContext) return;
  const register = () => { void navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(cause => console.warn('Chưa lưu được giao diện PWA.', cause)); };
  if (document.readyState === 'complete') register(); else window.addEventListener('load', register, { once: true });
}
