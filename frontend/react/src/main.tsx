import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from '@/app/routes';
import { AuthProvider } from '@/features/auth';
import '@/styles/globals.css';

const root = document.getElementById('root');
if (!root) throw new Error('Elemento #root não encontrado');

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
