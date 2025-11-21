import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './i18n/i18n'; // Import to initialize i18next

// --- SERVICE WORKER KILL SWITCH (NUCLEAR OPTION) ---
// This is critical for fixing the "Double Call" / 429 Rate Limit issue.
// Old Service Workers from previous deployments act as proxies, duplicating requests.
const nukeServiceWorkers = async () => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      let wasControlling = false;

      // 1. Unregister all found workers
      for (const registration of registrations) {
        console.warn('🚨 Killing Zombie Service Worker:', registration.scope);
        await registration.unregister();
        wasControlling = true;
      }

      // 2. Check if the page is currently controlled by a SW
      if (navigator.serviceWorker.controller || wasControlling) {
        console.warn('🚨 Page was controlled by a Zombie Worker. Reloading to clear network hooks...');
        // 3. Force a hard reload to ensure the next network request bypasses the dead worker
        window.location.reload();
      }
    } catch (err) {
      console.warn('SW Kill Switch encountered an error:', err);
    }
  }
};

// Execute immediately
nukeServiceWorkers();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {/* 
      React.Suspense is used here to provide a fallback UI (a loading message) 
      while the main App component and its children are being loaded. This is especially
      useful for code-splitting or if the i18n translations are loaded asynchronously.
    */}
    <React.Suspense fallback={<div className="bg-[#003a70] h-screen w-screen flex items-center justify-center text-white">Loading...</div>}>
      <App />
    </React.Suspense>
  </React.StrictMode>
);