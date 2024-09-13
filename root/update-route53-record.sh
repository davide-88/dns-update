#!/bin/sh

node /app/update-route53-record-run.mjs  \
  -z ${HOSTED_ZONE_ID} \
  -r ${RECORD_SET_NAME} \
  -i ${UPDATE_IP} >> ${LOG_FILE} 2>&1
