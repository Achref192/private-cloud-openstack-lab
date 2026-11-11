# Guide de déploiement CloudMetrics Dashboard

## Prérequis

- 2 VMs Ubuntu 24.04 provisionnées sur OpenStack
- Accès SSH avec clé publique configurée
- VM1 : 1,5 Go RAM minimum
- VM2 : 1 Go RAM minimum
- Réseau privé configuré entre les VMs

## Déploiement rapide avec scripts

### 1. Préparer les VMs

Sur les deux VMs :

```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation Node.js (VM1 uniquement)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Installation Nginx (VM1 uniquement)
sudo apt install -y nginx
```

### 2. Déployer MongoDB (VM2)

```bash
cd deploy
chmod +x deploy-vm2.sh
./deploy-vm2.sh <VM2_IP> <VOTRE_MOT_DE_PASSE_SECURISE>
```

Ce script :
- Installe MongoDB 7.0
- Configure le binding sur 0.0.0.0
- Crée la base `cloudmetrics` et l'utilisateur `appuser`
- Configure le mot de passe

### 3. Déployer l'application (VM1)

```bash
cd deploy
chmod +x deploy-vm1.sh
./deploy-vm1.sh <VM1_PUBLIC_IP> <VM2_PRIVATE_IP> <MOT_DE_PASSE_MONGODB>
```

Ce script :
- Build le backend et le frontend localement
- Transfère les fichiers vers VM1
- Installe les dépendances de production
- Configure le service systemd
- Configure Nginx
- Démarre l'application

### 4. Vérification

```bash
# Test de l'API
curl http://<VM1_IP>/api/health

# Résultat attendu :
{
  "status": "ok",
  "hostname": "vm-app-01",
  "db": "connected",
  "uptime": 5,
  "version": "1.0.0"
}
```

Accédez à l'application : `http://<VM1_PUBLIC_IP>`

## Déploiement manuel

Voir le [README.md](../README.md) section "Déploiement manuel sur OpenStack" pour les étapes détaillées.

## Post-déploiement

### Seed des données (optionnel)

```bash
ssh ubuntu@<VM1_IP>
cd /opt/cloud-metrics/backend
MONGO_URI=mongodb://appuser:<PASSWORD>@<VM2_IP>:27017/cloudmetrics?authSource=cloudmetrics node -e "$(cat src/seed.ts)"
```

### Configuration du firewall

**VM2 (MongoDB) :**
```bash
# Autoriser uniquement la VM1
sudo ufw allow from <VM1_PRIVATE_IP> to any port 27017
sudo ufw enable
```

**VM1 (Application) :**
```bash
# Ouvrir HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

### HTTPS avec Let's Encrypt (recommandé)

```bash
ssh ubuntu@<VM1_IP>

# Installer Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtenir un certificat (remplacer par votre domaine)
sudo certbot --nginx -d cloudmetrics.example.com

# Renouvellement automatique (déjà configuré par défaut)
sudo certbot renew --dry-run
```

### Monitoring

**Vérifier les logs :**

```bash
# Logs de l'API
ssh ubuntu@<VM1_IP>
sudo journalctl -u cloud-metrics-app -f

# Logs Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Logs MongoDB
ssh ubuntu@<VM2_IP>
sudo tail -f /var/log/mongodb/mongod.log
```

**Vérifier l'état des services :**

```bash
# VM1
sudo systemctl status cloud-metrics-app
sudo systemctl status nginx

# VM2
sudo systemctl status mongod
```

### Backup MongoDB

**Configuration des backups automatiques :**

```bash
ssh ubuntu@<VM2_IP>

# Créer le répertoire de backup
sudo mkdir -p /backup/mongodb
sudo chown ubuntu:ubuntu /backup/mongodb

# Créer le script de backup
cat > /home/ubuntu/backup-mongodb.sh <<'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/mongodb"
MONGO_URI="mongodb://appuser:PASSWORD@localhost:27017/cloudmetrics?authSource=cloudmetrics"

mongodump --uri="$MONGO_URI" --out="$BACKUP_DIR/$DATE"

# Garder seulement les 7 derniers backups
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} +

echo "Backup completed: $BACKUP_DIR/$DATE"
EOF

chmod +x /home/ubuntu/backup-mongodb.sh

# Ajouter au cron (tous les jours à 2h du matin)
(crontab -l 2>/dev/null; echo "0 2 * * * /home/ubuntu/backup-mongodb.sh >> /var/log/mongodb-backup.log 2>&1") | crontab -
```

**Restauration d'un backup :**

```bash
mongorestore --uri="mongodb://appuser:PASSWORD@localhost:27017/cloudmetrics?authSource=cloudmetrics" /backup/mongodb/20261111_020000/cloudmetrics
```

## Mise à jour de l'application

### Mise à jour du backend

```bash
# Sur votre machine locale
cd backend
npm ci
npm run build

# Transférer
scp -r dist package.json package-lock.json ubuntu@<VM1_IP>:/opt/cloud-metrics/backend/

# Sur VM1
ssh ubuntu@<VM1_IP>
cd /opt/cloud-metrics/backend
npm ci --omit=dev
sudo systemctl restart cloud-metrics-app

# Vérifier
sudo systemctl status cloud-metrics-app
```

### Mise à jour du frontend

```bash
# Sur votre machine locale
cd frontend
npm ci
npm run build

# Transférer
scp -r dist/* ubuntu@<VM1_IP>:/tmp/frontend-update/

# Sur VM1
ssh ubuntu@<VM1_IP>
sudo rm -rf /var/www/cloud-metrics/*
sudo mv /tmp/frontend-update/* /var/www/cloud-metrics/
sudo chown -R www-data:www-data /var/www/cloud-metrics
sudo systemctl reload nginx
```

## Rollback

### Backend

```bash
ssh ubuntu@<VM1_IP>

# Restaurer depuis un backup précédent
sudo cp -r /opt/cloud-metrics/backend.backup/* /opt/cloud-metrics/backend/
sudo systemctl restart cloud-metrics-app
```

### Frontend

```bash
ssh ubuntu@<VM1_IP>

# Restaurer depuis un backup précédent
sudo cp -r /var/www/cloud-metrics.backup/* /var/www/cloud-metrics/
sudo systemctl reload nginx
```

## Troubleshooting

### L'API ne démarre pas

```bash
# Vérifier les logs
sudo journalctl -u cloud-metrics-app -n 50

# Erreurs courantes :
# - MongoDB inaccessible : vérifier MONGO_URI dans /etc/cloud-metrics.env
# - Port 3000 déjà utilisé : sudo lsof -i :3000
# - Permissions : sudo chown -R ubuntu:ubuntu /opt/cloud-metrics
```

### MongoDB déconnecté

```bash
# Sur VM2, vérifier que MongoDB est démarré
sudo systemctl status mongod

# Vérifier les connexions réseau
sudo netstat -tlnp | grep 27017

# Tester depuis VM1
telnet <VM2_IP> 27017

# Vérifier les credentials
mongosh "mongodb://appuser:PASSWORD@<VM2_IP>:27017/cloudmetrics?authSource=cloudmetrics"
```

### Nginx ne sert pas le frontend

```bash
# Vérifier la configuration
sudo nginx -t

# Vérifier les permissions
ls -la /var/www/cloud-metrics

# Vérifier les logs d'erreur
sudo tail -f /var/log/nginx/error.log

# Recharger Nginx
sudo systemctl reload nginx
```

### L'application est lente

```bash
# Vérifier l'utilisation des ressources
htop

# Vérifier la connexion MongoDB
mongosh "mongodb://appuser:PASSWORD@<VM2_IP>:27017/cloudmetrics?authSource=cloudmetrics" --eval "db.currentOp()"

# Créer des index MongoDB
mongosh "mongodb://appuser:PASSWORD@<VM2_IP>:27017/cloudmetrics?authSource=cloudmetrics"
db.tasks.createIndex({ status: 1 })
db.tasks.createIndex({ createdAt: -1 })
```

## Sécurité en production

### Checklist avant mise en production

- [ ] Mot de passe MongoDB changé (pas celui par défaut)
- [ ] CORS_ORIGIN configuré avec le domaine spécifique
- [ ] HTTPS activé avec Let's Encrypt
- [ ] Firewall activé sur les deux VMs
- [ ] Backup automatique MongoDB configuré
- [ ] Monitoring / alerting configuré
- [ ] SSH sécurisé (clés uniquement, pas de mot de passe)
- [ ] fail2ban installé et configuré
- [ ] Logs centralisés (optionnel)
- [ ] Rate limiting configuré (optionnel)

### Durcissement additionnel

```bash
# Désactiver l'authentification par mot de passe SSH
sudo nano /etc/ssh/sshd_config
# Modifier : PasswordAuthentication no
sudo systemctl restart sshd

# Installer fail2ban
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Configuration fail2ban pour Nginx
sudo tee /etc/fail2ban/jail.local <<EOF
[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
EOF

sudo systemctl restart fail2ban
```

## Support

Pour toute question ou problème :
1. Vérifier les logs (voir section Monitoring)
2. Consulter le README.md et ARCHITECTURE.md
3. Vérifier la connectivité réseau entre les VMs
4. S'assurer que toutes les variables d'environnement sont correctement configurées
