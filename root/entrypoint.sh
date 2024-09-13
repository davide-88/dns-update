#!/bin/sh

touch "${LOG_FILE}"
echo "${LOG_FILE} {
  rotate 5
  size 100k
  compress
}" > /etc/logrotate.conf
/usr/sbin/logrotate -s /etc/logrotate.status /etc/logrotate.conf

echo "Updating Route53 Record Set ${RECORD_SET_NAME} in Hosted Zone ${HOSTED_ZONE_ID} on startup"
sh /update-route53-record.sh
echo "Route53 Record Set ${RECORD_SET_NAME} in Hosted Zone ${HOSTED_ZONE_ID} updated"

echo "Starting crond to keep Route53 Record Set updated every 5min"
crond -f
