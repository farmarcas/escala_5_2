import type { ScaleStoreInput } from '../scales/scales.schemas.js';

// O que o modelo pode ver da loja. Fica de fora tudo o que identifica a pessoa, a loja ou o grupo: nome, cidade,
// UF, texto livre da convenção coletiva, nomes de feriados da cidade e identificadores. Entram só quadro,
// salários, horários, regras escolhidas, plantão, feriados (só as quantidades) e vendas.
export function toModelStore(store: ScaleStoreInput) {
  const days = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];
  const overrides = Object.entries(store.hours.overrides).map(([day, o]) => ({
    dia: days[Number(day)],
    ...('closed' in (o ?? {})
      ? { fechado: true }
      : { abre: (o as { start: string }).start, fecha: (o as { end: string }).end }),
  }));
  return {
    regime: store.taxRegime,
    horario: {
      funcionaVinteEQuatroHoras: store.hours.always24h,
      padrao: { abre: store.hours.standard.start, fecha: store.hours.standard.end },
      diasAbertosNoPadrao: days.filter((_, i) => (store.hours.standard.daysMask & (1 << i)) !== 0),
      diasComHorarioProprio: overrides,
    },
    regras: {
      folgaDominical: store.rules.sundayRule,
      almocoMinutos: store.rules.lunchMinutes,
      lancheMinutos: store.rules.snackMinutes,
      provisoes: store.rules.provisions,
      indenizarIntervaloNa12x36: store.rules.indemnifyBreak,
      convencaoColetivaInformada: store.rules.cct.trim() !== '',
      valeTransporte: store.rules.transport,
      outrosBeneficiosPorColaborador: store.rules.benefits,
    },
    plantao: store.plantao,
    feriados: {
      incluirNacionais: store.holidays.national,
      feriadosDaCidadeCadastrados: store.holidays.extra.length,
      rodizio: store.holidays.rotation,
      compensacao: store.holidays.compensation,
      folgaNoFeriadoConta: store.holidays.offOnHolidayCounts,
      lojaAbreNosFeriados: store.holidays.openOnHolidays,
    },
    vendas: store.sales.enabled ? store.sales : null,
    funcoes: store.roles
      .filter((r) => r.enabled)
      .map((r) => ({
        funcao: r.role,
        colaboradoresHoje: r.headcount,
        salarioDeRegistro: r.monthlySalary,
        escala: r.scaleType,
        minimoNoSalao: r.minInHall,
        cobertura: r.coverage,
        diasQueTrabalha: days.filter((_, i) => (r.daysMask & (1 << i)) !== 0),
        donoFarmaceuticoAtuando: r.ownerIsPharmacist,
        entregaDeMoto: r.motorcycle,
      })),
  };
}
