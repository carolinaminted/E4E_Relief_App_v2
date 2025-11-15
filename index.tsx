import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './i18n/i18n'; // Import to initialize i18next

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
