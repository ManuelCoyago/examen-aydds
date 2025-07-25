FROM postgres:17.5

RUN apt update && \
    apt install -y rclone ca-certificates && \
    mkdir -p /app /backups

COPY backup.sh /app/backup.sh
RUN chmod +x /app/backup.sh

WORKDIR /app

CMD ["/app/backup.sh"]
