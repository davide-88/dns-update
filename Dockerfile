FROM node:22.5.1-alpine3.20

ENV HOSTED_ZONE_ID ""
ENV RECORD_NAME ""
ENV UPDATE_IP "ipv4"
ENV AWS_REGION "eu-west-1"
ENV AWS_ACCESS_KEY_ID ""
ENV AWS_SECRET_ACCESS_KEY ""
ENV AWS_EXTERNAL_ID ""
ENV AWS_ROLE_ARN ""
ENV LOG_LEVEL "INFO"

COPY cron/ /
RUN /usr/bin/crontab /etc/crontabs/crontab

RUN \
      echo "**** install packages ****" && \
      apk add --no-cache \
        bind-tools

COPY entrypoint.sh /entrypoint.sh
RUN chmod 755 /entrypoint.sh

COPY dist/ /app/

ENTRYPOINT ["/entrypoint.sh"]
