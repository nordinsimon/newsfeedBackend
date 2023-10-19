#!/bin/bash

# Initialize the database (this is what the default MySQL docker-entrypoint does)
docker-entrypoint.sh mysqld &

# Wait for MySQL to start up
sleep 20

# Run your custom SQL script
mysql -u root -p${MYSQL_ROOT_PASSWORD} < /docker-entrypoint-initdb.d/1_always.sql

# Keep the container running
tail -f /dev/null
