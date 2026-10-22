import { Link } from 'react-router-dom';

export function PrivacyPage() {
  return (
    <article className="bg-background border-border mx-auto flex max-w-2xl flex-col gap-3 rounded-lg border p-6 text-sm leading-relaxed">
      <h1 className="text-xl font-bold">Política de privacidade</h1>
      <p className="bg-warning-background text-warning rounded-md p-3">
        Texto provisório, em revisão pelo jurídico da Farmarcas.
      </p>
      <p>
        Coletamos apenas os dados necessários para a calculadora: nome, e-mail, empresa, telefone e
        as informações das lojas que você cadastra. Usamos esses dados para fazer as simulações e,
        se você pedir, para um consultor da Farmarcas entrar em contato.
      </p>
      <p>
        Você pode pedir a exclusão da sua conta e dos dados do seu grupo a qualquer momento. Não
        usamos seus dados para outra finalidade sem avisar antes.
      </p>
      <Link to="/" className="text-primary font-medium underline">
        Voltar para a calculadora
      </Link>
    </article>
  );
}
