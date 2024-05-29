#!/bin/bash
# rm -f /home/fcgiwrap.socket > /dev/null
# chgrp -R nginx /home
# chmod -R 770 /home
# sudo -u nginx -g nginx /usr/sbin/fcgiwrap -s unix:/home/fcgiwrap.socket &
# chgrp nginx /home/fcgiwrap.socket
# chmod g+w /home/fcgiwrap.socket
# echo "fcgiwrap started"
/docker-entrypoint.sh nginx -g "daemon off;"

# docker compose:
  # git:
  #   restart: always
  #   container_name: git
  #   image: git:10
  #   hostname: git
  #   ports: [ "8000" ]
  #   labels: [ dev.orbstack.domains=git.local ]
  #   entrypoint: /start.sh
  #   # stdin_open: true
  #   # tty: true
  #   # entrypoint: /bin/bash
  #   build:
  #     context: ./server/git-test-server
  #     dockerfile: Dockerfile
  #   networks:
  #     - lix
  #   user: root
  #   # env_file:
  #   #   - ./.env