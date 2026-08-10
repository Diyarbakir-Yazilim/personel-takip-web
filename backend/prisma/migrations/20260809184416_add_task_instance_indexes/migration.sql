-- CreateIndex
CREATE INDEX "task_instances_zoneId_idx" ON "task_instances"("zoneId");

-- CreateIndex
CREATE INDEX "task_instances_userId_idx" ON "task_instances"("userId");

-- CreateIndex
CREATE INDEX "task_instances_scheduledFor_idx" ON "task_instances"("scheduledFor");

-- CreateIndex
CREATE INDEX "task_instances_status_idx" ON "task_instances"("status");
