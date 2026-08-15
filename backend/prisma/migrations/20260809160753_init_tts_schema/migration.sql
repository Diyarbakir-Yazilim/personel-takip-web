-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STAFF', 'SUPERVISOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('SCHEDULED', 'PENDING', 'IN_PROGRESS', 'DONE', 'MISSED', 'FLAGGED');

-- CreateEnum
CREATE TYPE "ScanAction" AS ENUM ('AUTO', 'CHECK_IN', 'CHECK_OUT');

-- CreateEnum
CREATE TYPE "ScanMethod" AS ENUM ('DYNAMIC_QR', 'STATIC_QR', 'NFC', 'MANUAL_FALLBACK');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STAFF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zones" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_instances" (
    "id" UUID NOT NULL,
    "zoneId" UUID NOT NULL,
    "userId" UUID,
    "status" "TaskStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "checklist" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scan_events" (
    "id" UUID NOT NULL,
    "idempotencyKey" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "taskId" UUID,
    "token" TEXT NOT NULL,
    "requestedAction" "ScanAction" NOT NULL DEFAULT 'AUTO',
    "resolvedAction" "ScanAction" NOT NULL,
    "method" "ScanMethod" NOT NULL,
    "clientEventId" UUID NOT NULL,
    "clientScannedAt" TIMESTAMP(3) NOT NULL,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "riskFlags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scan_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scan_locations" (
    "id" UUID NOT NULL,
    "scanEventId" UUID NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,

    CONSTRAINT "scan_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_integrities" (
    "id" UUID NOT NULL,
    "scanEventId" UUID NOT NULL,
    "isRooted" BOOLEAN NOT NULL DEFAULT false,
    "isEmulator" BOOLEAN NOT NULL DEFAULT false,
    "isMockLocation" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "device_integrities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "zones_code_key" ON "zones"("code");

-- CreateIndex
CREATE UNIQUE INDEX "scan_events_idempotencyKey_key" ON "scan_events"("idempotencyKey");

-- CreateIndex
CREATE INDEX "scan_events_userId_idx" ON "scan_events"("userId");

-- CreateIndex
CREATE INDEX "scan_events_clientScannedAt_idx" ON "scan_events"("clientScannedAt");

-- CreateIndex
CREATE UNIQUE INDEX "scan_locations_scanEventId_key" ON "scan_locations"("scanEventId");

-- CreateIndex
CREATE UNIQUE INDEX "device_integrities_scanEventId_key" ON "device_integrities"("scanEventId");

-- AddForeignKey
ALTER TABLE "task_instances" ADD CONSTRAINT "task_instances_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_instances" ADD CONSTRAINT "task_instances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_events" ADD CONSTRAINT "scan_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_events" ADD CONSTRAINT "scan_events_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task_instances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_locations" ADD CONSTRAINT "scan_locations_scanEventId_fkey" FOREIGN KEY ("scanEventId") REFERENCES "scan_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_integrities" ADD CONSTRAINT "device_integrities_scanEventId_fkey" FOREIGN KEY ("scanEventId") REFERENCES "scan_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
