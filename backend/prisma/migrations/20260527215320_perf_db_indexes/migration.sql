-- CreateIndex
CREATE INDEX "follow_up_records_teacher_id_record_date_idx" ON "public"."follow_up_records"("teacher_id", "record_date");

-- CreateIndex
CREATE INDEX "notifications_centerId_createdAt_idx" ON "public"."notifications"("centerId", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_circleId_createdAt_idx" ON "public"."notifications"("circleId", "createdAt");
