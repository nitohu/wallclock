FROM postgres:12.2

COPY ./init/0-init.sql /docker-entrypoint-initdb.d/
COPY ./init/1-tables.sql /docker-entrypoint-initdb.d/
COPY ./init/2-data.sql /docker-entrypoint-initdb.d/

ENV POSTGRES_PASSWORD "secretpassword"
EXPOSE 5432
