#!/bin/sh

echo "Updating Route53 Record Set ${RECORD_SET_NAME} in Hosted Zone ${HOSTED_ZONE_ID} on startup"
node /app/update-route53-record-run.mjs  \
  -z ${HOSTED_ZONE_ID} \
  -r ${RECORD_SET_NAME} \
  -i ${UPDATE_IP} >> /var/log/script.log 2>&1
echo "Route53 Record Set ${RECORD_SET_NAME} in Hosted Zone ${HOSTED_ZONE_ID} updated"

echo "Starting crond to keep Route53 Record Set updated every 5min"
crond -f
