import type { RosterCell, ShiftKind } from '../types';

export const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export const KIND_LABEL: Record<ShiftKind, string> = {
  abertura: 'Abertura',
  meio: 'Meio',
  fechamento: 'Fechamento',
  unico: 'Turno único',
  plantao: 'Plantão noturno',
};

// Cor por tipo de turno; o texto do tipo sempre acompanha (não depende só da cor).
export const KIND_CLASS: Record<ShiftKind, string> = {
  abertura: 'bg-shift-a text-shift-a-fg',
  meio: 'bg-shift-b text-shift-b-fg',
  fechamento: 'bg-shift-c text-shift-c-fg',
  unico: 'bg-shift-d text-shift-d-fg',
  plantao: 'bg-shift-plantao text-shift-plantao-fg',
};

export const formatDayMonth = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

export const formatMinutes = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
};

export const cellSummary = (cell: RosterCell) =>
  `${cell.start}–${cell.end}${cell.lunch ? ` · almoço ${cell.lunch.start}` : ''}`;
