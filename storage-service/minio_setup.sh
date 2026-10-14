#!/bin/sh

# Start MinIO in the background
minio server /data --console-address ":9001" &

# Function to check if MinIO is ready
is_minio_ready() {
    mc ready local
}

# Wait for MinIO to be ready
echo "Waiting for MinIO to be ready..."
while ! is_minio_ready; do
    echo "MinIO not ready yet. Waiting..."
    sleep 2
done

echo "MinIO is up - Initializing..."

# Configure mc
mc alias set myminio http://localhost:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"

# Check if the user already exists
if mc admin user info myminio "$STORAGE_ACCESS_KEY" > /dev/null 2>&1; then
    echo "Access key $STORAGE_ACCESS_KEY already exists"
else
    # Create the user with the specified access key and secret key
    mc admin user add myminio "$STORAGE_ACCESS_KEY" "$STORAGE_SECRET_KEY"

    # Attach a policy to this user (e.g., readwrite)
    mc admin policy attach myminio readwrite --user="$STORAGE_ACCESS_KEY"
fi

echo "MinIO setup completed"

# Wait for the MinIO process to finish
wait
