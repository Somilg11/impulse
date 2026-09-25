
-- DropIndex
DROP INDEX "account_issuer_accountId_key";

-- AlterTable
ALTER TABLE "account" ALTER COLUMN "issuer" DROP NOT NULL;

