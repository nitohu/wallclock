BEGIN;

CREATE TABLE device (
    id serial,
    primary key(id),
    name text,
    ip text
);

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