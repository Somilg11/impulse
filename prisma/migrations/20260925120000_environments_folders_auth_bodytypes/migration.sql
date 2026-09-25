
-- CreateEnum
CREATE TYPE "BODY_TYPE" AS ENUM ('NONE', 'JSON', 'TEXT', 'XML', 'FORM_DATA', 'URL_ENCODED', 'GRAPHQL');

-- DropIndex
DROP INDEX "Collection_name_workspaceId_key";

-- AlterTable
ALTER TABLE "Collection" ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "auth" JSONB,
ADD COLUMN     "bodyType" "BODY_TYPE" NOT NULL DEFAULT 'JSON',
ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tests" JSONB;

-- AlterTable
ALTER TABLE "RequestRun" ADD COLUMN     "size" INTEGER,
ADD COLUMN     "testResults" JSONB,
ADD COLUMN     "via" TEXT;

-- CreateTable
CREATE TABLE "Environment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "variables" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Environment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Environment_workspaceId_idx" ON "Environment"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Environment_name_workspaceId_key" ON "Environment"("name", "workspaceId");

-- CreateIndex
CREATE INDEX "Collection_workspaceId_idx" ON "Collection"("workspaceId");

-- CreateIndex
CREATE INDEX "Collection_parentId_idx" ON "Collection"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_name_workspaceId_parentId_key" ON "Collection"("name", "workspaceId", "parentId");

-- CreateIndex
CREATE INDEX "Request_collectionId_idx" ON "Request"("collectionId");

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Environment" ADD CONSTRAINT "Environment_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

