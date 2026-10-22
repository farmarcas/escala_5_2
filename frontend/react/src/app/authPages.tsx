import {
  ForgotPasswordForm,
  LoginForm,
  RegisterForm,
  ResetPasswordForm,
  VerifyEmail,
} from '@/features/auth';

export const LoginPage = () => <LoginForm />;
export const RegisterPage = () => <RegisterForm />;
export const ForgotPasswordPage = () => <ForgotPasswordForm />;
export const ResetPasswordPage = () => <ResetPasswordForm />;
export const VerifyEmailPage = () => <VerifyEmail />;
