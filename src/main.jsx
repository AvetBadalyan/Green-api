import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Self-hosted Roboto — matches web.max.ru rendering on all platforms (incl. Linux where it isn't installed)
import '@fontsource/roboto/latin-400.css';
import '@fontsource/roboto/latin-500.css';
import '@fontsource/roboto/latin-600.css';
import './index.scss';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
