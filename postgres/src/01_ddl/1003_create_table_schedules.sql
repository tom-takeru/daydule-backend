CREATE TABLE "schedules"
(
  "id"                      SERIAL      NOT NULL PRIMARY KEY,
  "date"                    DATE        NOT NULL,
  "start_time"              VARCHAR(4)  NOT NULL DEFAULT '0900',
  "end_time"                VARCHAR(4)  NOT NULL DEFAULT '1800',
  "start_time_at_schedule"  VARCHAR(4),
  "end_time_at_schedule"    VARCHAR(4),
  "is_scheduled"            BOOLEAN     NOT NULL DEFAULT FALSE
);