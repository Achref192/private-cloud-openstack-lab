#!/bin/bash
# Script de déploiement automatisé pour VM2 (MongoDB)
# Usage: ./deploy-vm2.sh <VM2_IP> <MONGODB_PASSWORD>

set -e

VM2_IP=$1
MONGO_PASSWORD=$2

if [ -z "$VM2_IP" ] || [ -z "$MONGO_PASSWORD" ]; then
    echo "Usage: ./deploy-vm2.sh <VM2_IP> <MONGODB_PASSWORD>"
    exit 1
fi

echo "=== MongoDB Deployment to VM2 ==="
echo "VM2 IP: $VM2_IP"

# 1. Install MongoDB
echo "Installing MongoDB 7.0..."
ssh ubuntu@$VM2_IP "curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
    sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor && \
    echo 'deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse' | \
    sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list && \
    sudo apt update && \
    sudo apt install -y mongodb-org"

# 2. Configure MongoDB to listen on all interfaces
echo "Configuring MongoDB..."
ssh ubuntu@$VM2_IP "sudo sed -i 's/bindIp: 127.0.0.1/bindIp: 0.0.0.0/' /etc/mongod.conf"

# 3. Start MongoDB
echo "Starting MongoDB..."
ssh ubuntu@$VM2_IP "sudo systemctl start mongod && sudo systemctl enable mongod"

# Wait for MongoDB to be ready
sleep 5

# 4. Initialize database
echo "Initializing database..."
scp mongo-init.js ubuntu@$VM2_IP:/tmp/
ssh ubuntu@$VM2_IP "mongosh < /tmp/mongo-init.js"

# 5. Update password
echo "Updating MongoDB password..."
ssh ubuntu@$VM2_IP "mongosh cloudmetrics --eval \"db.updateUser('appuser', {pwd: '${MONGO_PASSWORD}'})\" "

# 6. Verify connection
echo "Verifying MongoDB connection..."
ssh ubuntu@$VM2_IP "mongosh mongodb://appuser:${MONGO_PASSWORD}@localhost:27017/cloudmetrics?authSource=cloudmetrics --eval 'db.runCommand({ ping: 1 })'"

echo ""
echo "=== MongoDB deployment completed successfully! ==="
echo "MongoDB is accessible at: $VM2_IP:27017"
echo "Database: cloudmetrics"
echo "User: appuser"
echo ""
echo "Check logs with:"
echo "  sudo tail -f /var/log/mongodb/mongod.log"
