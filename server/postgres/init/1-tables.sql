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

CREATE TABLE mode_settings (
    device_id int references device(id),
    name text,
    primary key(device_id, name),
    -- Effect speed (e.g. rotation speed for rainbow, fading speed for fade)
    speed integer,
    -- Effect color (hex)
    color text,
    -- Use random colors? (for pulse)
    random_color boolean,
    -- Show seconds?
    show_seconds boolean
);

COMMIT;