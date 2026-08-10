import datetime

def nullify_old_gps_data(db_conn, retention_days=30):
    cutoff_date = datetime.date.today() - datetime.timedelta(days=retention_days)
    db_conn.execute('UPDATE locations SET lat=NULL, lng=NULL WHERE created_at < ?', (cutoff_date,))
    db_conn.commit()