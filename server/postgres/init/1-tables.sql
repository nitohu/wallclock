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
    ip text
);

-- Merge w/ device or rename to e.g. device_settings
CREATE TABLE auth (
    id serial,
    primary key(id),
    active boolean,
    name text,
    token text,
    device_token boolean,
    device_id int references device(id)
);

COMMIT;