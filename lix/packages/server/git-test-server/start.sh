#!/bin/bash
rm -f /home/fcgiwrap.socket > /dev/null
chgrp -R nginx /home
chmod -R 770 /home
sudo -u nginx -g nginx /usr/sbin/fcgiwrap -s unix:/home/fcgiwrap.socket &
chgrp nginx /home/fcgiwrap.socket
chmod g+w /home/fcgiwrap.socket
echo "fcgiwrap started"
/docker-entrypoint.sh nginx -g "daemon off;"
