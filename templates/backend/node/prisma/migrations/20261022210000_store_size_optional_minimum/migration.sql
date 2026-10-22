-- Quadro atual da loja (specs/003-quadro-atual-da-loja): só acréscimos, nenhum dado é alterado.
-- Tamanho da loja (nulo nas lojas antigas) e "mínimo por turno" opcional.
-- Os CHECK de store_roles continuam valendo quando há valor e passam em nulo.
CREATE TYPE "StoreSize" AS ENUM ('pequena', 'media', 'grande');

ALTER TABLE "store_roles" ALTER COLUMN "min_per_shift" DROP NOT NULL;

ALTER TABLE "stores" ADD COLUMN "size" "StoreSize";
