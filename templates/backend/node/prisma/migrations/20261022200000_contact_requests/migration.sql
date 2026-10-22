-- Pedidos de contato e leads de PDF (specs/001-calculadora-impacto-escala/data-model.md).
-- CreateEnum
CREATE TYPE "ContactSource" AS ENUM ('consultor', 'pdf');

-- CreateEnum
CREATE TYPE "ContactMode" AS ENUM ('rapido', 'detalhado');

-- CreateTable
CREATE TABLE "contact_requests" (
    "id" UUID NOT NULL,
    "source" "ContactSource" NOT NULL,
    "mode" "ContactMode" NOT NULL,
    "name" TEXT NOT NULL,
    "role_title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "sector" TEXT,
    "privacy_accepted_at" TIMESTAMPTZ(3) NOT NULL,
    "profile" JSONB NOT NULL,
    "result" JSONB NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "utm" TEXT,
    "anonymized_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contact_requests_idempotency_key_key" ON "contact_requests"("idempotency_key");

-- CreateIndex
CREATE INDEX "contact_requests_created_at_idx" ON "contact_requests"("created_at" DESC);
