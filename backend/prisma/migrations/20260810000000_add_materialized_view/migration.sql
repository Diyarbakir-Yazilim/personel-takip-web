CREATE MATERIALIZED VIEW mv_daily_zone_summary AS
SELECT
  DATE(t."scheduledFor" AT TIME ZONE 'Europe/Istanbul') AS gun,
  z.id AS zone_id,
  z.name AS zone_name,
  COUNT(*) FILTER (WHERE t.status = 'FLAGGED') AS supheli
FROM task_instances t
JOIN zones z ON z.id = t."zoneId"
GROUP BY 1, 2, 3;

CREATE UNIQUE INDEX ON mv_daily_zone_summary (gun, zone_id);
