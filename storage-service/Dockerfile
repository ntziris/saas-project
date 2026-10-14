FROM minio/minio:latest

# Copy MinIO client and setup script
COPY mc /usr/local/bin/
COPY minio_setup.sh /usr/local/bin/

# Make both files executable
RUN chmod +x /usr/local/bin/mc /usr/local/bin/minio_setup.sh

# Set the entrypoint to our custom script
ENTRYPOINT ["/usr/local/bin/minio_setup.sh"]

CMD ["server", "/data", "--console-address", ":9001"]