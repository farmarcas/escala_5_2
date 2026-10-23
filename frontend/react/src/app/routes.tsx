import { Route, Routes } from 'react-router-dom';
import { AccountPage } from './AccountPage';
import { AppLayout } from './AppLayout';
import { HomeRedirect } from './HomeRedirect';
import { PrivacyPage } from './PrivacyPage';
import { ProtectedRoute } from './ProtectedRoute';
import {
  NewStoreScreen,
  RulesTab,
  StoreDataTab,
  StoreDiagnosticTab,
  StoreIndexRedirect,
  StoreRosterTab,
  StorePanelLayout,
  StoresHome,
} from '@/features/scales';
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
          <Route path="/painel" element={<StoresHome />} />
          <Route path="/painel/lojas/nova" element={<NewStoreScreen />} />
          <Route path="/painel/lojas/:id" element={<StorePanelLayout />}>
            <Route index element={<StoreIndexRedirect />} />
            <Route path="dados" element={<StoreDataTab />} />
            <Route path="escala" element={<StoreRosterTab />} />
            <Route path="diagnostico" element={<StoreDiagnosticTab />} />
            <Route path="regras" element={<RulesTab />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
