import { Route, Routes } from 'react-router-dom';
import { AccountPage } from './AccountPage';
import { AppLayout } from './AppLayout';
import { HomeRedirect } from './HomeRedirect';
import { PrivacyPage } from './PrivacyPage';
import { ProtectedRoute } from './ProtectedRoute';
import {
  CompareSimulationsPage,
  SavedSimulationPage,
  SavedSimulationsPage,
} from './SavedSimulationsPages';
import { SimulationPage } from './SimulationPage';
import { StoreEditorPage } from './StoreEditorPage';
import { StoresPage } from './StoresPage';
import {
  ForgotPasswordPage,
  LoginPage,
  RegisterPage,
  ResetPasswordPage,
  VerifyEmailPage,
} from './authPages';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/entrar" element={<LoginPage />} />
        <Route path="/cadastrar" element={<RegisterPage />} />
        <Route path="/confirmar-email" element={<VerifyEmailPage />} />
        <Route path="/esqueci-a-senha" element={<ForgotPasswordPage />} />
        <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
        <Route path="/privacidade" element={<PrivacyPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/conta" element={<AccountPage />} />
          <Route path="/lojas" element={<StoresPage />} />
          <Route path="/lojas/nova" element={<StoreEditorPage />} />
          <Route path="/simulacao" element={<SimulationPage />} />
          <Route path="/simulacoes" element={<SavedSimulationsPage />} />
          <Route path="/simulacoes/comparar" element={<CompareSimulationsPage />} />
          <Route path="/simulacoes/:id" element={<SavedSimulationPage />} />
          <Route path="/lojas/:id" element={<StoreEditorPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
