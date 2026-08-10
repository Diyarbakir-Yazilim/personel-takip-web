CREATE MATERIALIZED VIEW mv_daily_zone_summary AS
SELECT zone_id, date, count(*) as checkins FROM checkin_logs GROUP BY zone_id, date;