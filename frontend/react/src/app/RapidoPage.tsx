import { QuickCalculator } from '@/features/quick-calculator';

export function RapidoPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">
          Quanto vale o fim da escala 6x1 para o seu grupo de farmácias?
        </h1>
        <p className="text-muted-foreground mt-2 max-w-3xl text-sm sm:text-base">
          Informe o perfil do grupo e veja uma estimativa do impacto anual de passar de 44h para 40h
          semanais, sem redução de salário.
        </p>
      </div>
      <QuickCalculator />
    </>
  );
}
