```sql
-- Convert a regular table to a hypertable (time-series)
CREATE TABLE sensor_data (
    time TIMESTAMP NOT NULL,
    sensor_id INTEGER,
    temperature DOUBLE PRECISION,
    humidity DOUBLE PRECISION
);

SELECT create_hypertable('sensor_data', 'time');

-- Query with time-based aggregation
SELECT time_bucket('1 hour', time) AS hour,
       AVG(temperature) AS avg_temp,
       MAX(temperature) AS max_temp
FROM sensor_data
WHERE time > NOW() - INTERVAL '7 days'
GROUP BY hour
ORDER BY hour;
```