
-- CreateEnum
CREATE TYPE "ScaleTaxRegime" AS ENUM ('simples', 'lucro_presumido_real');

-- CreateEnum
CREATE TYPE "ScaleRole" AS ENUM ('farmaceutico', 'gerente', 'subgerente', 'balconista', 'caixa', 'perfumista', 'servicos_gerais', 'entregador', 'comprador', 'conferente', 'atendente_digital', 'expedicao');

-- CreateEnum
CREATE TYPE "ScaleType" AS ENUM ('normal', 'doze_x_trinta_e_seis');

-- CreateEnum
CREATE TYPE "CoverageMode" AS ENUM ('all', 'band');

-- CreateTable
CREATE TABLE "scale_stores" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" CHAR(2) NOT NULL,
    "scale_start_date" DATE NOT NULL,
    "tax_regime" "ScaleTaxRegime" NOT NULL DEFAULT 'simples',
    "config" JSONB NOT NULL DEFAULT '{}',
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "scale_stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scale_store_roles" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "role" "ScaleRole" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "headcount" SMALLINT NOT NULL,
    "monthly_salary" DECIMAL(12,2) NOT NULL,
    "scale_type" "ScaleType" NOT NULL DEFAULT 'normal',
    "min_in_hall" SMALLINT NOT NULL DEFAULT 1,
    "coverage_mode" "CoverageMode" NOT NULL DEFAULT 'all',
    "band_start" TEXT,
    "band_end" TEXT,
    "days_mask" SMALLINT NOT NULL DEFAULT 127,
    "owner_is_pharmacist" BOOLEAN NOT NULL DEFAULT false,
    "motorcycle" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "scale_store_roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scale_stores_group_id_deleted_at_idx" ON "scale_stores"("group_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "scale_store_roles_store_id_role_key" ON "scale_store_roles"("store_id", "role");

-- AddForeignKey
ALTER TABLE "scale_stores" ADD CONSTRAINT "scale_stores_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scale_store_roles" ADD CONSTRAINT "scale_store_roles_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "scale_stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Nome único entre lojas ativas do grupo
CREATE UNIQUE INDEX "scale_stores_group_name_active_key" ON "scale_stores"("group_id", lower("name")) WHERE "deleted_at" IS NULL;

-- Regras de domínio no banco
ALTER TABLE "scale_stores" ADD CONSTRAINT "scale_stores_state_check" CHECK ("state" ~ '^[A-Z]{2}$');
ALTER TABLE "scale_store_roles" ADD CONSTRAINT "scale_store_roles_headcount_check" CHECK ("headcount" BETWEEN 0 AND 200);
ALTER TABLE "scale_store_roles" ADD CONSTRAINT "scale_store_roles_salary_check" CHECK ("monthly_salary" >= 0);
ALTER TABLE "scale_store_roles" ADD CONSTRAINT "scale_store_roles_min_in_hall_check" CHECK ("min_in_hall" BETWEEN 0 AND 50);
ALTER TABLE "scale_store_roles" ADD CONSTRAINT "scale_store_roles_days_mask_check" CHECK ("days_mask" BETWEEN 0 AND 127);
ALTER TABLE "scale_store_roles" ADD CONSTRAINT "scale_store_roles_band_check" CHECK (
  ("coverage_mode" = 'all' AND "band_start" IS NULL AND "band_end" IS NULL)
  OR ("coverage_mode" = 'band' AND "band_start" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND "band_end" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$')
);
