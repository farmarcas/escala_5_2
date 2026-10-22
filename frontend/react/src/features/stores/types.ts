export type RoleKind = 'farmaceutico' | 'balconista' | 'caixa' | 'estoquista';
export type StoreProfileKind = 'rua' | 'shopping' | '24h';

export type StoreRole = {
  role: RoleKind;
  minPerShift: number;
  headcount: number;
  weeklyHours: number;
  monthlySalary: number;
  absenceRate: number | null;
};

export type OpeningHour = { weekday: number; opensAt: string; closesAt: string };

export type Store = {
  id: string;
  name: string;
  city: string;
  profile: StoreProfileKind;
  openingHours: OpeningHour[];
  roles: StoreRole[];
  createdAt: string;
  updatedAt: string;
};

export type StoreRequest = {
  name: string;
  city: string;
  profile: StoreProfileKind;
  openingHours: OpeningHour[];
  roles: StoreRole[];
};

export type StoreListResponse = {
  data: Store[];
  meta: { page: number; pageSize: number; total: number };
};
