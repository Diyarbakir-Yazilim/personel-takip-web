-- AlterTable
ALTER TABLE "task_instances" ADD COLUMN     "durationSec" INTEGER;

-- AlterTable
ALTER TABLE "zones" ADD COLUMN     "floorId" UUID;

-- CreateTable
CREATE TABLE "floors" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "floors_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "zones" ADD CONSTRAINT "zones_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "floors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
