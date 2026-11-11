# Architecture CloudMetrics Dashboard

## Vue d'ensemble

CloudMetrics Dashboard est une application full-stack conçue pour gérer des tâches de déploiement d'infrastructure cloud, avec une architecture séparant clairement les préoccupations entre présentation, logique métier et données.

## Diagramme d'architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     VM 1 - Application                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   Nginx (Port 80)                     │  │
│  │  - Reverse Proxy                                      │  │
│  │  - Serveur de fichiers statiques                     │  │
│  └────────────────┬────────────────────────────────┬─────┘  │
│                   │                                │         │
│       GET /       │                    GET /api/*  │         │
│       *.html      │                                │         │
│       *.js, *.css │                                │         │
│                   │                                │         │
│  ┌────────────────▼───────┐         ┌─────────────▼──────┐  │
│  │  Frontend (React)      │         │  Backend (NestJS)  │  │
│  │  /var/www/cloud-metrics│         │  Port 3000         │  │
│  │                        │         │  (systemd service) │  │
│  │  - Dashboard           │         │                    │  │
│  │  - TaskList            │         │  Modules:          │  │
│  │  - TaskForm            │         │  - TasksModule     │  │
│  │  - Infrastructure Card │         │  - HealthModule    │  │
│  └────────────────────────┘         │  - DatabaseService │  │
│                                     └──────────┬─────────┘  │
│                                                │             │
└────────────────────────────────────────────────┼─────────────┘
                                                 │
                                        MongoDB URI
                                        (IP privée)
                                                 │
                                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                     VM 2 - Database                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              MongoDB 7.0 (Port 27017)               │    │
│  │                                                     │    │
│  │  Database: cloudmetrics                            │    │
│  │  Collections:                                      │    │
│  │    - tasks                                         │    │
│  │                                                     │    │
│  │  User: appuser (readWrite sur cloudmetrics)       │    │
│  │  Auth: SCRAM-SHA-256                              │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Stack technique

### Backend (NestJS)

**Framework:** NestJS 10.x (TypeScript)

**Architecture modulaire:**
```
src/
├── main.ts                 # Point d'entrée, bootstrap de l'application
├── app.module.ts           # Module racine, orchestration
│
├── config/
│   └── database.service.ts # Service de connexion MongoDB avec reconnexion auto
│
├── tasks/                  # Module métier Tasks
│   ├── tasks.module.ts     # Définition du module
│   ├── tasks.controller.ts # Routes HTTP (GET, POST, PUT, DELETE)
│   ├── tasks.service.ts    # Logique métier et accès données
│   ├── task.schema.ts      # Schéma Mongoose (modèle de données)
│   └── dto/                # Data Transfer Objects
│       ├── create-task.dto.ts
│       └── update-task.dto.ts
│
└── health/                 # Module Health Check
    ├── health.module.ts
    ├── health.controller.ts
    └── health.service.ts
```

**Principes:**
- **Injection de dépendances** (DI) via decorators NestJS
- **Validation automatique** avec class-validator
- **Transformation automatique** des DTOs avec class-transformer
- **Résilience** : l'API ne crash jamais, même si MongoDB est down
- **Logs structurés** : JSON lines sur stdout pour agrégation

**Patterns:**
- Repository pattern (via Mongoose Models)
- Service layer pour la logique métier
- Controller layer pour la gestion HTTP
- DTO pattern pour la validation

### Frontend (React + Vite)

**Framework:** React 18 avec TypeScript

**Build tool:** Vite (dev server avec HMR, build optimisé)

**Styling:** Tailwind CSS 3.x (utility-first, dark mode via media query)

**Architecture de composants:**
```
src/
├── main.tsx                    # Point d'entrée React
├── App.tsx                     # Composant racine, orchestration
│
├── components/
│   ├── Dashboard.tsx           # Vue principale avec KPIs
│   ├── InfrastructureCard.tsx  # Carte infrastructure (polling 5s)
│   ├── StatsCard.tsx           # Carte KPI réutilisable
│   ├── TaskList.tsx            # Liste des tâches
│   ├── TaskCard.tsx            # Carte tâche individuelle
│   └── TaskForm.tsx            # Formulaire modal CRUD
│
├── services/
│   └── api.ts                  # Client HTTP centralisé (fetch wrapper)
│
└── types/
    └── index.ts                # Types TypeScript partagés
```

**Principes:**
- **Composants fonctionnels** avec hooks (useState, useEffect)
- **Props drilling minimal** (état local suffisant pour cette taille)
- **API centralisée** : un seul point d'entrée pour les appels HTTP
- **Types partagés** : synchronisation backend/frontend via types TS
- **Responsive design** : mobile-first avec Tailwind breakpoints
- **Dark mode** : respect de `prefers-color-scheme`

### Base de données (MongoDB)

**Version:** MongoDB 7.0+

**Architecture:**
```
cloudmetrics (database)
└── tasks (collection)
    └── Document schema:
        {
          _id: ObjectId,
          title: String (required, min 3 chars),
          description: String (required),
          status: Enum ['todo', 'in_progress', 'done'],
          priority: Enum ['low', 'medium', 'high'],
          createdAt: Date (auto),
          updatedAt: Date (auto)
        }
```

**Sécurité:**
- Utilisateur `appuser` avec droits **readWrite** uniquement sur `cloudmetrics`
- Pas de droits admin
- Authentification SCRAM-SHA-256
- Binding sur IP privée uniquement (10.0.0.x)

**Index recommandés (production):**
```javascript
db.tasks.createIndex({ status: 1 })
db.tasks.createIndex({ priority: 1 })
db.tasks.createIndex({ createdAt: -1 })
```

## Flux de données

### 1. Récupération des tâches (GET /api/tasks)

```
┌──────────┐      GET /api/tasks      ┌──────────────┐
│ Frontend ├────────────────────────►│ TasksController│
└──────────┘                          └───────┬──────┘
                                              │
                                              ▼
                                      ┌──────────────┐
                                      │ TasksService │
                                      └───────┬──────┘
                                              │
                                              ▼
                                      ┌──────────────┐
                                      │ Task Model   │
                                      │ (Mongoose)   │
                                      └───────┬──────┘
                                              │
                                              ▼
                                      ┌──────────────┐
                                      │  MongoDB     │
                                      └───────┬──────┘
                                              │
                                      db.tasks.find()
                                              │
                                              ▼
                                       JSON Response
```

### 2. Création de tâche (POST /api/tasks)

```
┌──────────┐   POST /api/tasks   ┌──────────────┐
│ Frontend ├───────────────────►│ ValidationPipe│
└──────────┘   + JSON body       └───────┬──────┘
                                         │
                                         ▼ Validation DTO
                                 ┌──────────────┐
                                 │TasksController│
                                 └───────┬──────┘
                                         │
                                         ▼
                                 ┌──────────────┐
                                 │ TasksService │
                                 └───────┬──────┘
                                         │
                                         ▼
                                 ┌──────────────┐
                                 │  Task Model  │
                                 └───────┬──────┘
                                         │
                                         ▼
                                 ┌──────────────┐
                                 │  MongoDB     │
                                 │ db.tasks     │
                                 │ .insert()    │
                                 └───────┬──────┘
                                         │
                                         ▼
                                  201 Created + JSON
```

### 3. Health Check avec polling (GET /api/health)

```
┌──────────────┐         5s interval         ┌────────────────┐
│ Infrastructure├────────────────────────────►│HealthController│
│    Card      │   GET /api/health           └────────┬───────┘
└──────────────┘                                      │
                                                      ▼
                                              ┌───────────────┐
                                              │HealthService  │
                                              │ - os.hostname()│
                                              │ - uptime      │
                                              │ - db state    │
                                              └────────┬──────┘
                                                       │
                                                       ▼
                                              ┌────────────────┐
                                              │mongoose        │
                                              │.connection     │
                                              │.readyState     │
                                              └────────┬───────┘
                                                       │
                                                       ▼
                                                {
                                                  status: "ok",
                                                  hostname: "vm-app-01",
                                                  db: "connected",
                                                  uptime: 3600,
                                                  version: "1.0.0"
                                                }
```

## Résilience et disponibilité

### Gestion de la déconnexion MongoDB

**Stratégie:**
1. L'API démarre même si MongoDB est indisponible
2. `serverSelectionTimeoutMS: 5000` : timeout court pour éviter le blocage
3. Événements Mongoose :
   - `connected` : log success, clear reconnect interval
   - `disconnected` : log warn, schedule reconnect
   - `error` : log error
4. Tentatives de reconnexion automatiques toutes les 5 secondes
5. L'API reste UP et répond 200 à `/api/health` avec `db: "disconnected"`

**Code clé (database.service.ts):**
```typescript
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
  this.scheduleReconnect(); // Retry every 5s
});
```

### Contraintes mémoire (VM avec 1,5 Go RAM)

**Backend:**
- Build minimaliste : `npm ci --omit=dev` (pas de devDependencies)
- Node.js seul : ~30-50 Mo
- NestJS runtime : ~50-100 Mo
- Mongoose + connections : ~20-30 Mo
- **Total attendu : < 200 Mo**

**Optimisations:**
- Pas de fichiers statiques servis par Node (Nginx le fait)
- Pas de compilation à la volée (dist/ pré-compilé)
- Logs JSON structurés (pas de pretty-print)

## Sécurité

### Validation des entrées

**Côté backend** (class-validator):
```typescript
export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  title: string;

  @IsEnum(TaskStatus)
  status: TaskStatus;
}
```

**Côté frontend** (HTML5 + validation form):
```tsx
<input
  type="text"
  required
  minLength={3}
  value={title}
/>
```

### CORS

Configuration flexible via variable d'environnement `CORS_ORIGIN`.

**Dev:** `CORS_ORIGIN=*`
**Prod:** `CORS_ORIGIN=https://cloudmetrics.example.com`

### Secrets

Aucun secret en dur dans le code :
- Variables d'environnement via `/etc/cloud-metrics.env`
- `.env` et `.env.local` dans `.gitignore`
- Mot de passe MongoDB changé après initialisation

## Déploiement

### Approche 12-Factor App

1. **Codebase** : Un repo, multiples déploiements
2. **Dependencies** : Explicites via package.json
3. **Config** : Variables d'environnement
4. **Backing services** : MongoDB comme service attaché
5. **Build, release, run** : Séparation stricte (build local, run sur VM)
6. **Processes** : Stateless (état dans MongoDB)
7. **Port binding** : API expose port 3000, frontend via Nginx 80
8. **Concurrency** : Scale horizontal possible (load balancer + multiple VMs)
9. **Disposability** : Démarrage rapide, arrêt gracieux (systemd)
10. **Dev/prod parity** : Même stack (Node, MongoDB)
11. **Logs** : Traités comme flux (stdout → journald)
12. **Admin processes** : Scripts isolés (seed.ts)

### Systemd Service

**Avantages:**
- Auto-restart en cas de crash
- Gestion des logs via journald
- Démarrage automatique au boot
- Isolation utilisateur (user=ubuntu)

**Configuration:**
```ini
[Service]
Type=simple
Restart=always
RestartSec=10
```

### Nginx

**Rôles:**
1. **Serveur de fichiers statiques** : `/var/www/cloud-metrics`
2. **Reverse proxy** : `/api/*` → `http://127.0.0.1:3000`
3. **Fallback SPA** : `try_files $uri /index.html` pour React Router

**Performance:**
- Nginx est ultra-léger (~10-20 Mo RAM)
- Sert les assets statiques sans solliciter Node.js
- Gestion efficace des connexions concurrentes

## Monitoring et Observabilité

### Logs

**Format JSON Lines:**
```json
{"timestamp":"2026-11-11T15:30:00.000Z","level":"info","message":"CloudMetrics API started","port":3000,"version":"1.0.0"}
```

**Collecte:**
- Backend : `journalctl -u cloud-metrics-app -f`
- Nginx : `/var/log/nginx/access.log` et `error.log`
- MongoDB : `/var/log/mongodb/mongod.log`

### Métriques exposées

Endpoint `/api/health` retourne :
```json
{
  "status": "ok",
  "hostname": "vm-app-01",
  "db": "connected",
  "uptime": 3600,
  "version": "1.0.0"
}
```

**Intégrations possibles:**
- Prometheus (scraper /metrics custom)
- Grafana dashboards
- CloudWatch / DataDog agents
- PagerDuty alerting

## Performance

### Frontend

**Build optimisé par Vite:**
- Code splitting automatique
- Tree shaking (dead code elimination)
- Minification + compression
- Assets avec hash pour cache long-terme

**Taille attendue:**
- HTML : ~2 Ko
- JS bundle : ~150-200 Ko (gzipped)
- CSS : ~10-15 Ko (Tailwind purgé)

### Backend

**Optimisations Mongoose:**
- Lean queries : `.lean()` pour éviter la hydratation si pas de méthodes
- Projection : ne récupérer que les champs nécessaires
- Index sur champs fréquemment requêtés

**Exemple:**
```typescript
// Plus rapide
await this.taskModel.find().select('title status').lean().exec();

// vs hydratation complète
await this.taskModel.find().exec();
```

## Évolutivité

### Scale horizontal

**Frontend:**
- Statique → CDN (CloudFront, Cloudflare)
- Cache navigateur (assets hashés)

**Backend:**
- Stateless → load balancer (HAProxy, ALB)
- Session-less (pas de sticky sessions requis)

**Database:**
- MongoDB Replica Set (haute disponibilité)
- Sharding si volume très élevé (millions de tâches)

### Limites actuelles

- Pas de cache Redis (toutes les requêtes vont à MongoDB)
- Pas de pagination (OK pour < 1000 tâches)
- Pas de rate limiting

**Pour scaler:**
1. Ajouter Redis pour cache des stats
2. Implémenter pagination avec `skip` et `limit`
3. Rate limiting avec `@nestjs/throttler`
4. Connexion pooling MongoDB (déjà géré par Mongoose)

## Maintenance

### Mise à jour de l'application

**Backend:**
```bash
# Build local
npm run build

# Transfer
scp -r dist/ ubuntu@vm:/opt/cloud-metrics/backend/

# Restart
sudo systemctl restart cloud-metrics-app
```

**Frontend:**
```bash
# Build local
npm run build

# Transfer
scp -r dist/* ubuntu@vm:/var/www/cloud-metrics/

# Reload Nginx
sudo systemctl reload nginx
```

### Backup MongoDB

**Stratégie recommandée:**
```bash
# Backup manuel
mongodump --uri="mongodb://appuser:password@localhost:27017/cloudmetrics?authSource=cloudmetrics" --out=/backup/$(date +%Y%m%d)

# Restore
mongorestore --uri="..." /backup/20261111/cloudmetrics
```

**Automatisation (cron):**
```bash
0 2 * * * /usr/bin/mongodump --uri="..." --out=/backup/$(date +\%Y\%m\%d) && find /backup -mtime +7 -delete
```

## Conclusion

Cette architecture respecte les principes SOLID, la séparation des préoccupations et les best practices cloud-native. L'application est :

- **Résiliente** : fonctionne même si MongoDB est temporairement indisponible
- **Scalable** : stateless, peut être répliquée horizontalement
- **Maintenable** : code modulaire, logs structurés, configuration externalisée
- **Performante** : optimisations build, serving statique par Nginx, empreinte mémoire réduite
- **Sécurisée** : validation stricte, secrets externalisés, principe du moindre privilège

Prête pour un déploiement en production sur OpenStack avec supervision appropriée.
