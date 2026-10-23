-- Simulações salvas (specs/001-calculadora-impacto-escala/data-model.md).
-- CreateTable
CREATE TABLE "simulations" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "premises" JSONB NOT NULL,
    "input" JSONB NOT NULL,
    "mitigations" JSONB NOT NULL,
    "result" JSONB NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "simulations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "simulations_group_id_created_at_idx" ON "simulations"("group_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Collation pt_br no nome e nome único entre simulações ativas do grupo (índice parcial: escrito à mão).
ALTER TABLE "simulations" ALTER COLUMN "name" TYPE TEXT COLLATE "pt_br";
CREATE UNIQUE INDEX "simulations_group_name_active_uidx" ON "simulations"("group_id", lower("name")) WHERE "deleted_at" IS NULL;
