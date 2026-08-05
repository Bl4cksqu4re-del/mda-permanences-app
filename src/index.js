import React from 'react';
import ReactDOM from 'react-dom/client';
import App, { ErrorBoundary } from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
