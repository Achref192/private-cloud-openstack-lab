# Structure du projet CloudMetrics Dashboard

```
cloudmetrics-dashboard/
│
├── README.md                           # Documentation principale
├── ARCHITECTURE.md                     # Documentation architecture technique
├── PROJECT_STRUCTURE.md                # Ce fichier - Structure détaillée
├── .gitignore                          # Exclusions Git
│
├── backend/                            # Application backend NestJS
│   ├── src/
│   │   ├── main.ts                     # Point d'entrée de l'API
│   │   │                               # - Bootstrap NestJS
│   │   │                               # - Configuration CORS
│   │   │                               # - Global prefix /api
│   │   │                               # - Écoute sur 0.0.0.0:3000
│   │   │
│   │   ├── app.module.ts               # Module racine
│   │   │                               # - Import des modules métier
│   │   │                               # - Configuration Mongoose async
│   │   │
│   │   ├── seed.ts                     # Script de peuplement de la base
│   │   │                               # - 10 tâches d'exemple
│   │   │                               # - Usage: npm run seed
│   │   │
│   │   ├── config/
│   │   │   └── database.service.ts     # Service de connexion MongoDB
│   │   │                               # - MongooseOptionsFactory
│   │   │                               # - Gestion des événements (connect, disconnect, error)
│   │   │                               # - Reconnexion automatique toutes les 5s
│   │   │                               # - L'API ne crash jamais si MongoDB down
│   │   │
│   │   ├── health/
│   │   │   ├── health.module.ts        # Module Health Check
│   │   │   ├── health.controller.ts    # Controller GET /api/health
│   │   │   └── health.service.ts       # Service Health Check
│   │   │                               # - Retourne : status, hostname, db, uptime, version
│   │   │                               # - os.hostname() pour identifier la VM
│   │   │                               # - mongoose.connection.readyState
│   │   │
│   │   └── tasks/
│   │       ├── tasks.module.ts         # Module Tasks (CRUD)
│   │       │
│   │       ├── task.schema.ts          # Schéma Mongoose
│   │       │                           # - Définition du document Task
│   │       │                           # - Enum TaskStatus : todo | in_progress | done
│   │       │                           # - Enum TaskPriority : low | medium | high
│   │       │                           # - Timestamps automatiques (createdAt, updatedAt)
│   │       │
│   │       ├── tasks.controller.ts     # Controller REST
│   │       │                           # - POST   /api/tasks          (201 Created)
│   │       │                           # - GET    /api/tasks          (200 OK)
│   │       │                           # - GET    /api/tasks/:id      (200 OK ou 404)
│   │       │                           # - PUT    /api/tasks/:id      (200 OK ou 404)
│   │       │                           # - DELETE /api/tasks/:id      (204 No Content ou 404)
│   │       │                           # - GET    /api/tasks/stats    (200 OK)
│   │       │
│   │       ├── tasks.service.ts        # Logique métier
│   │       │                           # - create(dto): Promise<Task>
│   │       │                           # - findAll(): Promise<Task[]>
│   │       │                           # - findOne(id): Promise<Task>
│   │       │                           # - update(id, dto): Promise<Task>
│   │       │                           # - remove(id): Promise<void>
│   │       │                           # - getStats(): Promise<Stats>
│   │       │                           #   * Total, byStatus, completionRate
│   │       │
│   │       └── dto/
│   │           ├── create-task.dto.ts  # DTO de création
│   │           │                       # - Validation avec class-validator
│   │           │                       # - @IsString, @IsNotEmpty, @MinLength(3)
│   │           │                       # - @IsEnum pour status et priority
│   │           │
│   │           └── update-task.dto.ts  # DTO de mise à jour
│   │                                   # - Tous les champs optionnels
│   │                                   # - Mêmes validations que create
│   │
│   ├── package.json                    # Dépendances backend
│   │                                   # - @nestjs/core, @nestjs/mongoose
│   │                                   # - mongoose 8.x
│   │                                   # - class-validator, class-transformer
│   │                                   # - Scripts : build, start, start:dev, seed
│   │
│   ├── tsconfig.json                   # Configuration TypeScript
│   ├── nest-cli.json                   # Configuration NestJS CLI
│   ├── .env                            # Variables d'environnement (local, git ignored)
│   └── .env.example                    # Template des variables
│                                       # PORT=3000
│                                       # MONGO_URI=mongodb://appuser:password@10.0.0.20:27017/cloudmetrics?authSource=cloudmetrics
│                                       # APP_VERSION=1.0.0
│                                       # CORS_ORIGIN=*
│
├── frontend/                           # Application frontend React
│   ├── src/
│   │   ├── main.tsx                    # Point d'entrée React
│   │   │                               # - ReactDOM.createRoot
│   │   │                               # - Render <App /> avec StrictMode
│   │   │
│   │   ├── App.tsx                     # Composant racine
│   │   │                               # - État global (tasks, loading, showForm, editingTask)
│   │   │                               # - Handlers CRUD (create, update, delete)
│   │   │                               # - Orchestration Dashboard + TaskList + TaskForm
│   │   │
│   │   ├── index.css                   # Styles Tailwind CSS
│   │   │                               # - @tailwind base, components, utilities
│   │   │                               # - Respect de prefers-color-scheme
│   │   │
│   │   ├── components/
│   │   │   ├── Dashboard.tsx           # Dashboard principal
│   │   │   │                           # - KPIs : total, par statut, taux complétion
│   │   │   │                           # - Carte Infrastructure
│   │   │   │                           # - Polling auto toutes les 5s
│   │   │   │
│   │   │   ├── InfrastructureCard.tsx  # Carte Infrastructure
│   │   │   │                           # - Affichage : hostname, db status, version, uptime
│   │   │   │                           # - Badge connecté/déconnecté pour MongoDB
│   │   │   │
│   │   │   ├── StatsCard.tsx           # Carte KPI réutilisable
│   │   │   │                           # - Props : title, value, color
│   │   │   │                           # - Variants : blue, gray, yellow, green
│   │   │   │
│   │   │   ├── TaskList.tsx            # Liste des tâches
│   │   │   │                           # - Grid responsive (1 col mobile, 3 col desktop)
│   │   │   │                           # - Message vide si aucune tâche
│   │   │   │
│   │   │   ├── TaskCard.tsx            # Carte tâche individuelle
│   │   │   │                           # - Affichage : titre, description, priorité, statut
│   │   │   │                           # - Actions : modifier, supprimer
│   │   │   │                           # - Select inline pour changer le statut
│   │   │   │
│   │   │   └── TaskForm.tsx            # Formulaire modal CRUD
│   │   │                               # - Mode création ou édition
│   │   │                               # - Validation HTML5 (required, minLength)
│   │   │                               # - Champs : title, description, status, priority
│   │   │
│   │   ├── services/
│   │   │   └── api.ts                  # Client HTTP centralisé
│   │   │                               # - Fonction fetchApi générique avec typage
│   │   │                               # - Endpoints :
│   │   │                               #   * getTasks(), getTask(id)
│   │   │                               #   * createTask(task), updateTask(id, task)
│   │   │                               #   * deleteTask(id)
│   │   │                               #   * getStats(), getHealth()
│   │   │                               # - Gestion erreurs HTTP
│   │   │                               # - URLs relatives (/api/...) pour Nginx
│   │   │
│   │   └── types/
│   │       └── index.ts                # Types TypeScript partagés
│   │                                   # - Task, TaskStatus, TaskPriority
│   │                                   # - Stats, HealthCheck
│   │
│   ├── index.html                      # Point d'entrée HTML
│   │                                   # - Root div pour React
│   │                                   # - Import main.tsx via script module
│   │
│   ├── package.json                    # Dépendances frontend
│   │                                   # - react 18, react-dom
│   │                                   # - vite, @vitejs/plugin-react
│   │                                   # - tailwindcss, autoprefixer, postcss
│   │                                   # - Scripts : dev, build, preview
│   │
│   ├── vite.config.ts                  # Configuration Vite
│   │                                   # - Plugin React
│   │                                   # - Proxy /api → http://localhost:3000 (dev)
│   │
│   ├── tailwind.config.js              # Configuration Tailwind CSS
│   │                                   # - Content : src/**/*.{tsx,ts,jsx,js}
│   │                                   # - Dark mode : 'media' (prefers-color-scheme)
│   │
│   ├── postcss.config.js               # Configuration PostCSS
│   │                                   # - Plugins : tailwindcss, autoprefixer
│   │
│   ├── tsconfig.json                   # Configuration TypeScript
│   └── tsconfig.node.json              # Configuration TypeScript pour Vite
│
└── deploy/                             # Fichiers de déploiement
    ├── DEPLOYMENT.md                   # Guide de déploiement détaillé
    │                                   # - Déploiement rapide avec scripts
    │                                   # - Déploiement manuel étape par étape
    │                                   # - Post-déploiement (seed, firewall, HTTPS)
    │                                   # - Monitoring et maintenance
    │                                   # - Troubleshooting
    │
    ├── deploy-vm1.sh                   # Script déploiement VM1 (App + Nginx)
    │                                   # - Build backend + frontend localement
    │                                   # - Transfer vers VM1 via SCP
    │                                   # - Installation dépendances prod
    │                                   # - Configuration systemd
    │                                   # - Configuration Nginx
    │                                   # - Vérification déploiement
    │
    ├── deploy-vm2.sh                   # Script déploiement VM2 (MongoDB)
    │                                   # - Installation MongoDB 7.0
    │                                   # - Configuration bind IP
    │                                   # - Initialisation base cloudmetrics
    │                                   # - Création utilisateur appuser
    │                                   # - Mise à jour mot de passe
    │
    ├── cloud-metrics-app.service       # Unité systemd pour l'API
    │                                   # [Unit]
    │                                   # Description=CloudMetrics API Service
    │                                   # After=network.target
    │                                   #
    │                                   # [Service]
    │                                   # Type=simple
    │                                   # User=ubuntu
    │                                   # WorkingDirectory=/opt/cloud-metrics/backend
    │                                   # EnvironmentFile=/etc/cloud-metrics.env
    │                                   # ExecStart=/usr/bin/node dist/main.js
    │                                   # Restart=always
    │                                   # RestartSec=10
    │                                   # StandardOutput=journal
    │                                   # StandardError=journal
    │                                   #
    │                                   # [Install]
    │                                   # WantedBy=multi-user.target
    │
    ├── nginx.conf                      # Configuration Nginx pour VM
    │                                   # server {
    │                                   #   listen 80;
    │                                   #   location / {
    │                                   #     root /var/www/cloud-metrics;
    │                                   #     try_files $uri /index.html;  # Fallback SPA
    │                                   #   }
    │                                   #   location /api/ {
    │                                   #     proxy_pass http://127.0.0.1:3000;
    │                                   #     proxy_set_header Host $host;
    │                                   #     proxy_set_header X-Real-IP $remote_addr;
    │                                   #     ... autres headers proxy
    │                                   #   }
    │                                   # }
    │
    ├── nginx-docker.conf               # Configuration Nginx pour Docker
    │                                   # (Frontend statique uniquement)
    │
    ├── mongo-init.js                   # Script d'initialisation MongoDB
    │                                   # - Crée la base cloudmetrics
    │                                   # - Crée l'utilisateur appuser
    │                                   # - Attribue le rôle readWrite
    │                                   # - Usage: mongosh < mongo-init.js
    │
    ├── Dockerfile.backend              # Multi-stage build pour backend
    │                                   # Stage 1 (builder) :
    │                                   #   - npm ci, npm run build
    │                                   # Stage 2 (production) :
    │                                   #   - Copie dist/ et node_modules prod uniquement
    │                                   #   - CMD ["node", "dist/main.js"]
    │                                   #   - EXPOSE 3000
    │
    ├── Dockerfile.frontend             # Multi-stage build pour frontend
    │                                   # Stage 1 (builder) :
    │                                   #   - npm ci, npm run build
    │                                   # Stage 2 (production) :
    │                                   #   - Image nginx:alpine
    │                                   #   - Copie dist/ vers /usr/share/nginx/html
    │                                   #   - EXPOSE 80
    │
    └── example-docker-compose.yml      # Docker Compose pour test local (bonus)
                                        # Services :
                                        #   - mongodb : mongo:7.0
                                        #   - api : build du backend
                                        #   - frontend : build du frontend + nginx
                                        # Networks : cloudmetrics-network
                                        # Volumes : mongo-data
```

## Flux de données

### 1. Requête utilisateur (GET /api/tasks)

```
Browser                 Nginx               NestJS API          MongoDB
  │                      │                      │                  │
  │  GET /api/tasks      │                      │                  │
  ├─────────────────────►│                      │                  │
  │                      │  proxy_pass          │                  │
  │                      ├─────────────────────►│                  │
  │                      │                      │  find()          │
  │                      │                      ├─────────────────►│
  │                      │                      │  [tasks]         │
  │                      │                      ◄─────────────────┤
  │                      │  JSON Response       │                  │
  │                      ◄─────────────────────┤                  │
  │  200 OK + JSON       │                      │                  │
  ◄─────────────────────┤                      │                  │
```

### 2. Création de tâche (POST /api/tasks)

```
Browser                 Nginx               NestJS API          MongoDB
  │                      │                      │                  │
  │  POST /api/tasks     │                      │                  │
  │  + JSON body         │                      │                  │
  ├─────────────────────►│                      │                  │
  │                      │  proxy_pass          │                  │
  │                      ├─────────────────────►│                  │
  │                      │                      │ ValidationPipe   │
  │                      │                      │ (DTO validation) │
  │                      │                      │                  │
  │                      │                      │  insertOne()     │
  │                      │                      ├─────────────────►│
  │                      │                      │  {task}          │
  │                      │                      ◄─────────────────┤
  │                      │  201 Created         │                  │
  │                      ◄─────────────────────┤                  │
  │  201 + JSON          │                      │                  │
  ◄─────────────────────┤                      │                  │
```

### 3. Polling Infrastructure (toutes les 5s)

```
Browser                 Nginx               NestJS API
  │                      │                      │
  │  setInterval(5000)   │                      │
  ├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┤                      │
  │  GET /api/health     │                      │
  ├─────────────────────►│                      │
  │                      ├─────────────────────►│
  │                      │                      │ os.hostname()
  │                      │                      │ uptime calculation
  │                      │                      │ mongoose.connection.readyState
  │                      │                      │
  │                      │  {status, hostname,  │
  │                      │   db, uptime, version}
  │                      ◄─────────────────────┤
  │  200 OK + JSON       │                      │
  ◄─────────────────────┤                      │
  │                      │                      │
  │  Update UI           │                      │
  │  (InfrastructureCard)│                      │
```

## Empreinte mémoire (estimations VM1)

```
Nginx             :  ~10-20 Mo
Node.js (runtime) :  ~30-50 Mo
NestJS (loaded)   :  ~50-100 Mo
Mongoose          :  ~20-30 Mo
Connections       :  ~10-20 Mo
──────────────────────────────
Total API         :  ~120-220 Mo
Total avec Nginx  :  ~130-240 Mo

Marge disponible sur VM 1,5 Go : Confortable
```

## Empreinte disque

```
Backend (dist/)              : ~5-10 Mo
Backend (node_modules prod)  : ~50-80 Mo
Frontend (dist/)             : ~1-2 Mo
Total                        : ~60-100 Mo
```

## Temps de build

```
Backend (npm run build)   : ~20-40s
Frontend (npm run build)  : ~10-20s
Total                     : ~30-60s
```

## Variables d'environnement par composant

### Backend (API NestJS)

| Variable      | Défaut | Requis | Utilisation                    |
|---------------|--------|--------|--------------------------------|
| PORT          | 3000   | Non    | Port d'écoute de l'API        |
| MONGO_URI     | -      | Oui    | URI de connexion MongoDB      |
| APP_VERSION   | 1.0.0  | Non    | Version exposée dans /health  |
| CORS_ORIGIN   | *      | Non    | Origine CORS autorisée        |

### Frontend (React)

Pas de variables d'environnement runtime. Configuration au build uniquement via `vite.config.ts` (proxy dev).

### MongoDB

| Variable             | Valeur                  |
|----------------------|-------------------------|
| MONGO_INITDB_DATABASE| cloudmetrics           |
| User                 | appuser                |
| Password             | (défini au déploiement)|
| Role                 | readWrite sur cloudmetrics |

## Fichiers de configuration

### Backend

- `tsconfig.json` : Compilation TypeScript
- `nest-cli.json` : CLI NestJS
- `package.json` : Dépendances et scripts
- `.env` : Variables d'environnement (local, ignoré par Git)

### Frontend

- `tsconfig.json` : Compilation TypeScript
- `vite.config.ts` : Build et dev server
- `tailwind.config.js` : Configuration Tailwind CSS
- `postcss.config.js` : PostCSS avec Tailwind
- `package.json` : Dépendances et scripts

### Déploiement

- `cloud-metrics-app.service` : Systemd unit
- `nginx.conf` : Configuration Nginx VM
- `mongo-init.js` : Initialisation MongoDB
- `/etc/cloud-metrics.env` : Variables d'environnement sur VM1

## Commandes principales

### Développement

```bash
# Backend
cd backend
npm install
npm run start:dev          # Dev avec hot reload
npm run build              # Build production
npm run seed               # Peupler la base

# Frontend
cd frontend
npm install
npm run dev                # Dev server (port 5173)
npm run build              # Build production
```

### Production (sur VM)

```bash
# Backend
cd /opt/cloud-metrics/backend
npm ci --omit=dev
node dist/main.js

# Service systemd
sudo systemctl start cloud-metrics-app
sudo systemctl status cloud-metrics-app
sudo systemctl restart cloud-metrics-app
sudo journalctl -u cloud-metrics-app -f

# Frontend (Nginx)
sudo systemctl start nginx
sudo systemctl reload nginx
sudo nginx -t
```

### MongoDB

```bash
# Démarrage
sudo systemctl start mongod
sudo systemctl status mongod

# Connexion
mongosh mongodb://appuser:password@localhost:27017/cloudmetrics?authSource=cloudmetrics

# Backup
mongodump --uri="mongodb://appuser:password@localhost:27017/cloudmetrics?authSource=cloudmetrics" --out=/backup/

# Restore
mongorestore --uri="..." /backup/cloudmetrics
```

## Ports utilisés

| Service     | Port  | Protocole | Exposition         |
|-------------|-------|-----------|-------------------|
| Nginx       | 80    | HTTP      | Public            |
| Nginx       | 443   | HTTPS     | Public (optionnel)|
| API NestJS  | 3000  | HTTP      | Local (127.0.0.1) |
| MongoDB     | 27017 | TCP       | Privé (VM1 only)  |

## Dépendances principales

### Backend (production)

- `@nestjs/core` : Framework NestJS
- `@nestjs/mongoose` : Intégration Mongoose
- `mongoose` : ODM MongoDB
- `class-validator` : Validation DTOs
- `class-transformer` : Transformation DTOs
- `reflect-metadata` : Metadata reflection (required by NestJS)
- `rxjs` : Reactive extensions (required by NestJS)

### Frontend (production)

- `react` : Library React
- `react-dom` : React DOM renderer

### Frontend (dev)

- `vite` : Build tool
- `@vitejs/plugin-react` : Plugin React pour Vite
- `tailwindcss` : Framework CSS utility-first
- `autoprefixer` : PostCSS plugin
- `typescript` : TypeScript compiler

## Standards de code

### Backend

- **Conventions** : NestJS style guide
- **Naming** : PascalCase pour classes, camelCase pour variables/méthodes
- **Structure** : Modules, Controllers, Services, Schemas, DTOs
- **Validation** : Automatique via class-validator decorators
- **Logs** : JSON lines sur stdout

### Frontend

- **Conventions** : React + TypeScript best practices
- **Naming** : PascalCase pour composants, camelCase pour fonctions
- **Props** : Interfaces typées pour tous les composants
- **State** : useState pour état local, useEffect pour side effects
- **Styling** : Tailwind utility classes, pas de CSS custom

## Performance

### Optimisations backend

- Lean queries Mongoose (`.lean()`) si pas besoin des méthodes
- Projection MongoDB (`.select()`) pour limiter les champs
- Index sur `status`, `priority`, `createdAt` (recommandé)
- Connection pooling géré automatiquement par Mongoose

### Optimisations frontend

- Code splitting automatique par Vite
- Tree shaking (élimination code mort)
- Minification et compression
- Assets avec hash pour cache long-terme
- Lazy loading images (si applicable)

## Sécurité

### Backend

- Validation stricte des entrées (class-validator)
- CORS configurable
- Pas d'exposition de stack traces en production
- Logs structurés sans données sensibles

### Frontend

- Validation HTML5 côté client
- Pas de secrets en frontend (tout est public)
- XSS prevention via React (échappement automatique)

### MongoDB

- Utilisateur avec droits minimaux (readWrite uniquement)
- Binding sur IP privée
- Authentification requise
- Firewall pour limiter accès

### Infrastructure

- HTTPS recommandé (Let's Encrypt)
- Firewall UFW actif
- SSH avec clés uniquement
- fail2ban pour protection brute-force

---

**Dernière mise à jour :** 11 novembre 2026  
**Version :** 1.0.0
