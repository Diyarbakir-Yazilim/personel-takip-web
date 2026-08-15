CREATE MATERIALIZED VIEW mv_daily_zone_summary AS
SELECT
  DATE(t.scheduled_for AT TIME ZONE 'Europe/Istanbul') AS gun,
  z.id AS zone_id, z.name AS zone_name, f.name AS floor_name,
  COUNT(*) FILTER (WHERE t.status = 'DONE')        AS tamamlanan,
  COUNT(*) FILTER (WHERE t.status = 'MISSED')      AS atlanan,
  COUNT(*) FILTER (WHERE t.status = 'FLAGGED')     AS supheli,
  ROUND(AVG(t.duration_sec) FILTER (WHERE t.status = 'DONE'))::INT AS ort_sure_sn,
  MIN(t.duration_sec)                              AS min_sure_sn
FROM task_instances t
JOIN zones z  ON z.id = t.zone_id
JOIN floors f ON f.id = z.floor_id
GROUP BY 1, 2, 3, 4;

CREATE UNIQUE INDEX ON mv_daily_zone_summary (gun, zone_id);
