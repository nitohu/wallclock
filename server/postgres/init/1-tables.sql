BEGIN;

CREATE TABLE settings (
    id serial,
    create_date timestamp,
    name text,
    passwd text,
    timezone text
);

CREATE TABLE device (
    id serial,
    primary key(id),
    name text,
    ip text,
    active boolean,
    token text,
    -- Last time a connection with device was established
    last_conn timestamp,
    create_date timestamp,
    write_date timestamp,
    mode text,
    color text,
    is_on boolean,
    brightness real
);

COMMIT;