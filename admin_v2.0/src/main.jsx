import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { AuthContextProvider } from './context/AuthContext.jsx';
import { DarkModeContextProvider } from './context/darkModeContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthContextProvider>
      <DarkModeContextProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </DarkModeContextProvider>
    </AuthContextProvider>
  </StrictMode>,
);
