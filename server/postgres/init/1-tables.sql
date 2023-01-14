BEGIN;

CREATE TABLE settings (
    id serial,
    create_date timestamp,
    name text,
    passwd text,
    timezone text,
    use_login_mask boolean,
    dark_mode boolean,
    winter_time boolean
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
    -- Effect color 2 (hex)
    color2 text,
    -- Effect color 3 (hex)
    color3 text,
    -- Effect color 4 (hex)
    color4 text,
    -- Use random colors? (for pulse)
    random_color boolean,
    -- Show seconds? (for simple clock)
    show_seconds boolean,
    -- Rotate? (for rainbow)
    rotate boolean,
    -- Use Gradient? (for gradient clock)
    use_gradient boolean
);

COMMIT;