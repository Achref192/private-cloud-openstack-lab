#!/bin/bash
# Script de déploiement automatisé pour VM1 (Application + Nginx)
# Usage: ./deploy-vm1.sh <VM1_IP> <VM2_PRIVATE_IP> <MONGODB_PASSWORD>

set -e

VM1_IP=$1
VM2_IP=$2
MONGO_PASSWORD=$3

if [ -z "$VM1_IP" ] || [ -z "$VM2_IP" ] || [ -z "$MONGO_PASSWORD" ]; then
    echo "Usage: ./deploy-vm1.sh <VM1_IP> <VM2_PRIVATE_IP> <MONGODB_PASSWORD>"
    exit 1
fi

echo "=== CloudMetrics Deployment to VM1 ==="
echo "VM1 IP: $VM1_IP"
echo "MongoDB IP: $VM2_IP"

# 1. Build backend locally
echo "Building backend..."
cd ../backend
npm ci
npm run build

# 2. Build frontend locally
echo "Building frontend..."
cd ../frontend
npm ci
npm run build

# 3. Transfer backend
echo "Transferring backend to VM1..."
ssh ubuntu@$VM1_IP "sudo mkdir -p /opt/cloud-metrics/backend && sudo chown ubuntu:ubuntu /opt/cloud-metrics/backend"
scp -r dist package.json package-lock.json ubuntu@$VM1_IP:/opt/cloud-metrics/backend/

# 4. Install backend dependencies on VM1
echo "Installing backend dependencies on VM1..."
ssh ubuntu@$VM1_IP "cd /opt/cloud-metrics/backend && npm ci --omit=dev"

# 5. Create environment file
echo "Creating environment file..."
ssh ubuntu@$VM1_IP "sudo tee /etc/cloud-metrics.env > /dev/null" <<EOF
PORT=3000
MONGO_URI=mongodb://appuser:${MONGO_PASSWORD}@${VM2_IP}:27017/cloudmetrics?authSource=cloudmetrics
APP_VERSION=1.0.0
CORS_ORIGIN=*
EOF

# 6. Setup systemd service
echo "Setting up systemd service..."
scp ../deploy/cloud-metrics-app.service ubuntu@$VM1_IP:/tmp/
ssh ubuntu@$VM1_IP "sudo mv /tmp/cloud-metrics-app.service /etc/systemd/system/ && \
    sudo systemctl daemon-reload && \
    sudo systemctl enable cloud-metrics-app && \
    sudo systemctl restart cloud-metrics-app"

# 7. Transfer frontend
echo "Transferring frontend to VM1..."
ssh ubuntu@$VM1_IP "sudo mkdir -p /var/www/cloud-metrics"
scp -r dist/* ubuntu@$VM1_IP:/tmp/frontend-dist/
ssh ubuntu@$VM1_IP "sudo mv /tmp/frontend-dist/* /var/www/cloud-metrics/ && \
    sudo chown -R www-data:www-data /var/www/cloud-metrics"

# 8. Setup Nginx
echo "Setting up Nginx..."
scp ../deploy/nginx.conf ubuntu@$VM1_IP:/tmp/
ssh ubuntu@$VM1_IP "sudo mv /tmp/nginx.conf /etc/nginx/sites-available/cloud-metrics && \
    sudo ln -sf /etc/nginx/sites-available/cloud-metrics /etc/nginx/sites-enabled/ && \
    sudo rm -f /etc/nginx/sites-enabled/default && \
    sudo nginx -t && \
    sudo systemctl restart nginx"

# 9. Verify deployment
echo "Verifying deployment..."
sleep 5
ssh ubuntu@$VM1_IP "curl -s http://localhost:3000/api/health"

echo ""
echo "=== Deployment completed successfully! ==="
echo "Access your application at: http://$VM1_IP"
echo ""
echo "Check logs with:"
echo "  sudo journalctl -u cloud-metrics-app -f"
