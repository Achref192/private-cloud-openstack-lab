# CloudMetrics Dashboard

Application web full-stack de gestion de tâches de déploiement d'infrastructure cloud, conçue pour être déployée sur OpenStack avec séparation App/DB.

## Architecture

```
┌─────────────┐
│  Navigateur │
└──────┬──────┘
       │ HTTP
       ▼
┌─────────────┐     ┌──────────────────┐
│    Nginx    │────▶│   API NestJS     │
│   (Port 80) │     │   (Port 3000)    │
│             │     │                  │
│  - Frontend │     │  - /api/tasks    │
│    Static   │     │  - /api/stats    │
│    Files    │     │  - /api/health   │
└─────────────┘     └────────┬─────────┘
                             │ MongoDB URI
                             ▼
                    ┌──────────────────┐
                    │     MongoDB      │
                    │   (Port 27017)   │
                    │  Base: cloudmetrics
                    └──────────────────┘
```

**Déploiement OpenStack:**
- **VM 1** (1,5 Go RAM): Nginx + API NestJS (service systemd)
- **VM 2**: MongoDB (accessible via IP privée)

## Stack technique

- **Backend**: NestJS (TypeScript), Mongoose, class-validator
- **Frontend**: React 18, Vite, Tailwind CSS, TypeScript
- **Base de données**: MongoDB 7.0+
- **Serveur web**: Nginx
- **Runtime**: Node.js 20+

## Fonctionnalités

### CRUD Tasks
- Créer, lire, mettre à jour et supprimer des tâches de déploiement
- Champs: titre, description, statut (todo/in_progress/done), priorité (low/medium/high)
- Validation des entrées avec codes HTTP appropriés

### Dashboard KPIs
- Nombre total de tâches
- Répartition par statut (todo, en cours, terminé)
- Taux de complétion en pourcentage
- Graphiques et cartes visuelles

### Carte Infrastructure
- Hostname de la machine hébergeant l'API
- État de connexion MongoDB (connected/disconnected)
- Version de l'application
- Uptime du service
- Rafraîchissement automatique toutes les 5 secondes

### Health Check
- Endpoint `GET /api/health`
- L'API reste opérationnelle même si MongoDB est indisponible
- Tentatives de reconnexion automatiques toutes les 5 secondes

## Variables d'environnement

| Variable      | Description                      | Défaut    | Requis |
|---------------|----------------------------------|-----------|--------|
| `PORT`        | Port d'écoute de l'API          | 3000      | Non    |
| `MONGO_URI`   | URI de connexion MongoDB        | -         | Oui    |
| `APP_VERSION` | Version de l'application        | 1.0.0     | Non    |
| `CORS_ORIGIN` | Origine CORS autorisée          | *         | Non    |

**Exemple** (voir `backend/.env.example`):
```bash
PORT=3000
MONGO_URI=mongodb://appuser:password@10.0.0.20:27017/cloudmetrics?authSource=cloudmetrics
APP_VERSION=1.0.0
CORS_ORIGIN=*
```

## API Endpoints

Tous les endpoints sont préfixés par `/api`.

| Méthode | Endpoint          | Description                    |
|---------|-------------------|--------------------------------|
| GET     | /api/tasks        | Liste toutes les tâches       |
| POST    | /api/tasks        | Crée une nouvelle tâche       |
| GET     | /api/tasks/:id    | Récupère une tâche par ID     |
| PUT     | /api/tasks/:id    | Met à jour une tâche          |
| DELETE  | /api/tasks/:id    | Supprime une tâche            |
| GET     | /api/tasks/stats  | Statistiques des tâches       |
| GET     | /api/health       | Health check de l'API         |

## Développement local

### Prérequis
- Node.js 20+
- MongoDB 7.0+ (local ou Docker)
- npm ou yarn

### 1. Installation

```bash
# Clone du projet
git clone <repository-url>
cd cloudmetrics-dashboard

# Installation backend
cd backend
npm install

# Installation frontend
cd ../frontend
npm install
```

### 2. Configuration MongoDB locale

**Avec Docker:**
```bash
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=admin \
  mongo:7.0
```

**Configuration de la base:**
```bash
# Se connecter à MongoDB
mongosh mongodb://localhost:27017

# Copier le contenu de deploy/mongo-init.js et l'exécuter
```

### 3. Configuration Backend

```bash
cd backend
cp .env.example .env

# Éditer .env avec vos valeurs
# Pour dev local: MONGO_URI=mongodb://appuser:password@localhost:27017/cloudmetrics?authSource=cloudmetrics
```

### 4. Lancement

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Accéder à l'application: http://localhost:5173

### 5. Seed (optionnel)

```bash
cd backend
npm run seed
```
Insère 10 tâches d'exemple dans la base de données.

## Build de production

### Backend

```bash
cd backend
npm ci
npm run build

# Test du build
node dist/main.js
```

Le dossier `dist/` contient le code compilé.

### Frontend

```bash
cd frontend
npm ci
npm run build
```

Le dossier `dist/` contient les fichiers statiques prêts pour Nginx.

## Déploiement manuel sur OpenStack

### VM 2 - Base de données MongoDB

1. **Provisionner la VM Ubuntu 24.04**

2. **Installer MongoDB:**
```bash
# Import de la clé GPG
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Ajout du dépôt
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
   sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Installation
sudo apt update
sudo apt install -y mongodb-org

# Démarrage
sudo systemctl start mongod
sudo systemctl enable mongod
```

3. **Configuration MongoDB:**
```bash
# Éditer /etc/mongod.conf
sudo nano /etc/mongod.conf

# Modifier bindIp pour écouter sur toutes les interfaces
net:
  port: 27017
  bindIp: 0.0.0.0

# Redémarrer
sudo systemctl restart mongod
```

4. **Initialiser la base:**
```bash
# Copier deploy/mongo-init.js sur la VM
scp deploy/mongo-init.js ubuntu@<VM2_IP>:~/

# Exécuter le script
mongosh < ~/mongo-init.js

# Modifier le mot de passe (remplacer CHANGE_ME_IN_PRODUCTION)
mongosh
use cloudmetrics
db.updateUser("appuser", { pwd: "VOTRE_MOT_DE_PASSE_SECURISE" })
```

5. **Firewall (si applicable):**
```bash
# Autoriser uniquement la VM1
sudo ufw allow from <VM1_PRIVATE_IP> to any port 27017
```

### VM 1 - Application et Nginx

1. **Provisionner la VM Ubuntu 24.04 (1,5 Go RAM)**

2. **Installer Node.js:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

3. **Installer Nginx:**
```bash
sudo apt update
sudo apt install -y nginx
```

4. **Créer le répertoire de l'application:**
```bash
sudo mkdir -p /opt/cloud-metrics/backend
sudo chown ubuntu:ubuntu /opt/cloud-metrics/backend
```

5. **Déployer le backend:**
```bash
# Sur votre machine locale, compiler le backend
cd backend
npm ci
npm run build

# Transférer vers la VM
scp -r dist package.json package-lock.json ubuntu@<VM1_IP>:/opt/cloud-metrics/backend/

# Sur la VM, installer les dépendances de production
cd /opt/cloud-metrics/backend
npm ci --omit=dev
```

6. **Configurer les variables d'environnement:**
```bash
sudo nano /etc/cloud-metrics.env

# Contenu:
PORT=3000
MONGO_URI=mongodb://appuser:VOTRE_MOT_DE_PASSE@<VM2_PRIVATE_IP>:27017/cloudmetrics?authSource=cloudmetrics
APP_VERSION=1.0.0
CORS_ORIGIN=*
```

7. **Installer le service systemd:**
```bash
# Copier le fichier service
sudo cp deploy/cloud-metrics-app.service /etc/systemd/system/

# Recharger systemd
sudo systemctl daemon-reload

# Démarrer le service
sudo systemctl start cloud-metrics-app
sudo systemctl enable cloud-metrics-app

# Vérifier le statut
sudo systemctl status cloud-metrics-app

# Voir les logs
sudo journalctl -u cloud-metrics-app -f
```

8. **Déployer le frontend:**
```bash
# Sur votre machine locale, compiler le frontend
cd frontend
npm ci
npm run build

# Créer le répertoire sur la VM
sudo mkdir -p /var/www/cloud-metrics

# Transférer les fichiers
scp -r dist/* ubuntu@<VM1_IP>:~/frontend-dist/

# Sur la VM, déplacer les fichiers
sudo mv ~/frontend-dist/* /var/www/cloud-metrics/
sudo chown -R www-data:www-data /var/www/cloud-metrics
```

9. **Configurer Nginx:**
```bash
# Copier la configuration
sudo cp deploy/nginx.conf /etc/nginx/sites-available/cloud-metrics

# Activer le site
sudo ln -s /etc/nginx/sites-available/cloud-metrics /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Tester la configuration
sudo nginx -t

# Redémarrer Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

10. **Firewall:**
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

11. **Vérification:**
```bash
# Test API
curl http://localhost:3000/api/health

# Test Nginx
curl http://localhost/api/health

# Depuis votre navigateur
http://<VM1_PUBLIC_IP>
```

## Déploiement avec Docker (Bonus)

### Build des images

```bash
# Backend
cd backend
docker build -f ../deploy/Dockerfile.backend -t cloudmetrics-api:latest .

# Frontend
cd frontend
docker build -f ../deploy/Dockerfile.frontend -t cloudmetrics-frontend:latest .
```

### Exemple docker-compose.yml

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_DATABASE: cloudmetrics
    volumes:
      - mongo-data:/data/db

  api:
    image: cloudmetrics-api:latest
    ports:
      - "3000:3000"
    environment:
      PORT: 3000
      MONGO_URI: mongodb://mongodb:27017/cloudmetrics
      APP_VERSION: 1.0.0
    depends_on:
      - mongodb

  frontend:
    image: cloudmetrics-frontend:latest
    ports:
      - "80:80"
    depends_on:
      - api

volumes:
  mongo-data:
```

## Structure du projet

```
cloudmetrics-dashboard/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.service.ts    # Gestion connexion MongoDB
│   │   ├── health/
│   │   │   ├── health.controller.ts   # Endpoint health check
│   │   │   ├── health.service.ts
│   │   │   └── health.module.ts
│   │   ├── tasks/
│   │   │   ├── dto/
│   │   │   │   ├── create-task.dto.ts
│   │   │   │   └── update-task.dto.ts
│   │   │   ├── task.schema.ts         # Schéma Mongoose
│   │   │   ├── tasks.controller.ts    # Routes API
│   │   │   ├── tasks.service.ts       # Logique métier
│   │   │   └── tasks.module.ts
│   │   ├── app.module.ts              # Module racine
│   │   ├── main.ts                    # Point d'entrée
│   │   └── seed.ts                    # Script de seed
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.tsx          # Vue dashboard
│   │   │   ├── InfrastructureCard.tsx # Carte infrastructure
│   │   │   ├── StatsCard.tsx          # Carte KPI
│   │   │   ├── TaskCard.tsx           # Carte tâche
│   │   │   ├── TaskForm.tsx           # Formulaire tâche
│   │   │   └── TaskList.tsx           # Liste des tâches
│   │   ├── services/
│   │   │   └── api.ts                 # Client API
│   │   ├── types/
│   │   │   └── index.ts               # Types TypeScript
│   │   ├── App.tsx                    # Composant racine
│   │   ├── main.tsx                   # Point d'entrée
│   │   └── index.css                  # Styles Tailwind
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── deploy/
│   ├── cloud-metrics-app.service      # Service systemd
│   ├── nginx.conf                     # Config Nginx VM
│   ├── nginx-docker.conf              # Config Nginx Docker
│   ├── mongo-init.js                  # Init MongoDB
│   ├── Dockerfile.backend             # Image backend
│   └── Dockerfile.frontend            # Image frontend
│
├── .gitignore
└── README.md
```

## Maintenance

### Logs

**API (systemd):**
```bash
sudo journalctl -u cloud-metrics-app -f
```

**Nginx:**
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

**MongoDB:**
```bash
sudo tail -f /var/log/mongodb/mongod.log
```

### Redémarrage des services

```bash
# API
sudo systemctl restart cloud-metrics-app

# Nginx
sudo systemctl restart nginx

# MongoDB
sudo systemctl restart mongod
```

### Mise à jour de l'application

```bash
# Backend
cd /opt/cloud-metrics/backend
# Transférer le nouveau dist/ compilé
sudo systemctl restart cloud-metrics-app

# Frontend
# Transférer le nouveau dist/ compilé vers /var/www/cloud-metrics
sudo systemctl reload nginx
```

## Monitoring

L'application expose les métriques suivantes via `/api/health`:

- Status de l'API
- Hostname du serveur
- État de connexion MongoDB
- Uptime en secondes
- Version de l'application

Pour un monitoring avancé, intégrer avec des outils comme Prometheus, Grafana, ou CloudWatch.

## Sécurité

**Recommandations pour la production:**

1. Modifier le mot de passe MongoDB (défaut: `CHANGE_ME_IN_PRODUCTION`)
2. Configurer CORS_ORIGIN avec le domaine spécifique
3. Activer HTTPS avec Let's Encrypt ou certificats SSL
4. Limiter l'accès MongoDB aux IPs autorisées via firewall
5. Mettre en place des backups MongoDB réguliers
6. Utiliser un gestionnaire de secrets (Vault, AWS Secrets Manager)
7. Configurer fail2ban pour protéger SSH

## Licence

MIT
