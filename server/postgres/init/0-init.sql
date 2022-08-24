CREATE USER wallclock WITH PASSWORD 'secretpassword';
ALTER USER wallclock CREATEDB SUPERUSER;

CREATE DATABASE wallclock OWNER "wallclock";
