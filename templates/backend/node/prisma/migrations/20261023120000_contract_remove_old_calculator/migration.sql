-- Contract: remove as tabelas da calculadora antiga (confirmado pelo responsável do produto em 23/10/2026).

-- DropForeignKey
ALTER TABLE "simulations" DROP CONSTRAINT "simulations_created_by_fkey";

-- DropForeignKey
ALTER TABLE "simulations" DROP CONSTRAINT "simulations_group_id_fkey";

-- DropForeignKey
ALTER TABLE "store_roles" DROP CONSTRAINT "store_roles_store_id_fkey";

-- DropForeignKey
ALTER TABLE "stores" DROP CONSTRAINT "stores_group_id_fkey";

-- DropTable
DROP TABLE "simulations";

-- DropTable
DROP TABLE "store_roles";

-- DropTable
DROP TABLE "stores";

-- DropEnum
DROP TYPE "StoreProfile";

-- DropEnum
DROP TYPE "StoreRoleKind";

-- DropEnum
DROP TYPE "StoreSize";

