-- Conta, grupos, lojas e equipes (specs/001-calculadora-impacto-escala/data-model.md).
-- Colunas novas de "users" nascem opcionais (expand): linhas antigas do esqueleto não têm senha nem grupo.
-- Ordenação em português (ICU pt-BR) para nomes de grupos, lojas e cidades.
CREATE COLLATION IF NOT EXISTS pt_br (provider = icu, locale = 'pt-BR', deterministic = true);

-- CreateEnum
CREATE TYPE "TaxRegime" AS ENUM ('real', 'presumido', 'simples');

-- CreateEnum
CREATE TYPE "StoreProfile" AS ENUM ('rua', 'shopping', '24h');

-- CreateEnum
CREATE TYPE "StoreRoleKind" AS ENUM ('farmaceutico', 'balconista', 'caixa', 'estoquista');

-- CreateEnum
CREATE TYPE "EmailTokenKind" AS ENUM ('verify', 'reset');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_verified_at" TIMESTAMPTZ(3),
ADD COLUMN     "group_id" UUID,
ADD COLUMN     "password_hash" TEXT,
ADD COLUMN     "privacy_accepted_at" TIMESTAMPTZ(3);

-- CreateTable
CREATE TABLE "groups" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "tax_regime" "TaxRegime" NOT NULL DEFAULT 'real',
    "annual_revenue" DECIMAL(16,2),
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "revoked_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "kind" "EmailTokenKind" NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "used_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stores" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "profile" "StoreProfile" NOT NULL,
    "opening_hours" JSONB NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_roles" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "role" "StoreRoleKind" NOT NULL,
    "min_per_shift" SMALLINT NOT NULL,
    "headcount" SMALLINT NOT NULL,
    "weekly_hours" DECIMAL(4,1) NOT NULL,
    "monthly_salary" DECIMAL(12,2) NOT NULL,
    "absence_rate" DECIMAL(4,3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "store_roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "email_tokens_token_hash_key" ON "email_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "email_tokens_user_id_kind_idx" ON "email_tokens"("user_id", "kind");

-- CreateIndex
CREATE INDEX "stores_group_id_deleted_at_idx" ON "stores"("group_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "store_roles_store_id_role_key" ON "store_roles"("store_id", "role");

-- CreateIndex
CREATE INDEX "users_group_id_idx" ON "users"("group_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_tokens" ADD CONSTRAINT "email_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_roles" ADD CONSTRAINT "store_roles_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Collation pt_br nos textos mostrados a pessoas (o Prisma não declara collation no schema).
ALTER TABLE "groups" ALTER COLUMN "name" TYPE TEXT COLLATE "pt_br";
ALTER TABLE "stores" ALTER COLUMN "name" TYPE TEXT COLLATE "pt_br";
ALTER TABLE "stores" ALTER COLUMN "city" TYPE TEXT COLLATE "pt_br";

-- Nome da loja único entre lojas ativas do mesmo grupo (índice parcial: escrito à mão).
CREATE UNIQUE INDEX "stores_group_name_active_uidx" ON "stores"("group_id", lower("name")) WHERE "deleted_at" IS NULL;

-- Regras de domínio no banco (defesa em profundidade; a API valida antes).
ALTER TABLE "store_roles"
  ADD CONSTRAINT "store_roles_min_per_shift_check" CHECK ("min_per_shift" >= 0),
  ADD CONSTRAINT "store_roles_headcount_check" CHECK ("headcount" >= 0),
  ADD CONSTRAINT "store_roles_weekly_hours_check" CHECK ("weekly_hours" >= 1 AND "weekly_hours" <= 44),
  ADD CONSTRAINT "store_roles_monthly_salary_check" CHECK ("monthly_salary" > 0),
  ADD CONSTRAINT "store_roles_absence_rate_check" CHECK ("absence_rate" IS NULL OR ("absence_rate" >= 0 AND "absence_rate" <= 0.5)),
  ADD CONSTRAINT "store_roles_pharmacist_present_check" CHECK ("role" <> 'farmaceutico' OR "min_per_shift" >= 1);
