-- Table: public.tbl_rainfall_aggregated

-- DROP TABLE IF EXISTS public.tbl_rainfall_aggregated;

CREATE TABLE IF NOT EXISTS public.tbl_rainfall_aggregated
(
    stationid text COLLATE pg_catalog."default",
    latitude numeric(38,2),
    longitude numeric(38,2),
    recordeddatetime timestamp without time zone,
    value bigint
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.tbl_rainfall_aggregated
    OWNER to postgres;