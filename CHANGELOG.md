# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

## [1.0.0] - 2026-11-11

### 🎉 Version initiale

#### Ajouté

**Backend (NestJS)**
- Architecture modulaire avec modules Tasks et Health
- CRUD complet sur les tâches (title, description, status, priority)
- Endpoint `/api/tasks/stats` pour les statistiques (total, par statut, taux de complétion)
- Endpoint `/api/health` pour le health check (status, hostname, db, uptime, version)
- Validation automatique des DTOs avec class-validator
- Service de connexion MongoDB avec reconnexion automatique (5s)
- Résilience : l'API reste opérationnelle même si MongoDB est down
- Logs structurés en JSON lines sur stdout
- Configuration 12-factor via variables d'environnement
- Script de seed avec 10 tâches d'exemple
- Support des codes HTTP appropriés (201, 204, 404)

**Frontend (React + Vite + Tailwind)**
- Dashboard avec 4 KPIs : total, à faire, en cours, terminé
- Carte taux de complétion avec barre de progression
- Carte Infrastructure avec polling automatique (5s)
  - Affichage hostname de la VM
  - État de connexion MongoDB (badge connecté/déconnecté)
  - Version de l'application
  - Uptime du service
- Liste des tâches en grid responsive (1-3 colonnes)
- Cartes individuelles par tâche avec priorité et statut
- Formulaire modal pour créer/modifier des tâches
- Validation HTML5 des formulaires
- Dark mode automatique (prefers-color-scheme)
- Design responsive (mobile, tablette, desktop)
- Client API centralisé avec typage TypeScript

**Database (MongoDB)**
- Schéma Task avec timestamps automatiques
- Enums pour status (todo, in_progress, done) et priority (low, medium, high)
- Script d'initialisation avec création de base et utilisateur
- Utilisateur avec droits minimaux (readWrite uniquement)

**Infrastructure et déploiement**
- Configuration Nginx pour reverse proxy et fichiers statiques
- Unité systemd pour l'API (restart automatique, logs via journald)
- Scripts de déploiement automatisés (deploy-vm1.sh, deploy-vm2.sh)
- Dockerfiles multi-stage pour backend et frontend (bonus)
- Docker Compose pour test local
- Configuration pour déploiement OpenStack (2 VMs)

**Documentation**
- README.md : documentation principale complète
- QUICKSTART.md : guide de démarrage rapide (5 minutes)
- ARCHITECTURE.md : architecture technique détaillée
- PROJECT_STRUCTURE.md : structure du projet et flux de données
- deploy/DEPLOYMENT.md : guide de déploiement pas à pas
- STRUCTURE.txt : arborescence et récapitulatif
- Exemples de configuration pour toutes les variables

**Sécurité**
- Validation stricte des entrées (backend + frontend)
- CORS configurable
- Secrets externalisés (variables d'environnement)
- Utilisateur MongoDB avec privilèges minimaux
- .gitignore pour éviter de committer les secrets

**Performance**
- Build optimisé avec code splitting et tree shaking
- Empreinte mémoire backend < 200 Mo
- Fichiers statiques servis par Nginx (pas par Node.js)
- Connection pooling MongoDB automatique

#### Caractéristiques techniques

- **Backend** : NestJS 10.x, TypeScript, Mongoose 8.x, class-validator
- **Frontend** : React 18, Vite 5, Tailwind CSS 3, TypeScript
- **Database** : MongoDB 7.0+
- **Infrastructure** : Nginx, Systemd, Ubuntu 24.04
- **Cloud** : OpenStack (2 VMs)
- **Node.js** : 20+

#### Contraintes respectées

✅ 2 VMs Ubuntu 24.04 sur OpenStack  
✅ VM1 (1,5 Go RAM) : Nginx + API NestJS (systemd)  
✅ VM2 : MongoDB accessible sur IP privée  
✅ Pas de Docker sur les VMs (fourni en bonus pour CI)  
✅ Build hors VM, run avec `node dist/main.js`  
✅ Empreinte mémoire < 200 Mo  
✅ Configuration 12-factor (variables d'environnement)  
✅ CRUD complet avec validation  
✅ KPIs et statistiques  
✅ Health check avec hostname, état DB, uptime, version  
✅ Polling automatique toutes les 5 secondes  
✅ Résilience : API ne crash jamais si MongoDB down  
✅ Dark mode responsive  
✅ CORS configurable  
✅ Logs JSON sur stdout  

#### Endpoints API

- `POST /api/tasks` - Créer une tâche (201 Created)
- `GET /api/tasks` - Lister les tâches (200 OK)
- `GET /api/tasks/:id` - Récupérer une tâche (200 OK ou 404)
- `PUT /api/tasks/:id` - Mettre à jour une tâche (200 OK ou 404)
- `DELETE /api/tasks/:id` - Supprimer une tâche (204 No Content ou 404)
- `GET /api/tasks/stats` - Statistiques (200 OK)
- `GET /api/health` - Health check (200 OK)

#### Variables d'environnement

- `PORT` - Port d'écoute de l'API (défaut: 3000)
- `MONGO_URI` - URI de connexion MongoDB (requis)
- `APP_VERSION` - Version de l'application (défaut: 1.0.0)
- `CORS_ORIGIN` - Origine CORS autorisée (défaut: *)

#### Structure des fichiers

```
51 fichiers créés :
- 11 fichiers source backend (TypeScript)
- 13 fichiers source frontend (TypeScript/TSX)
- 10 fichiers de déploiement
- 12 fichiers de configuration
- 5 fichiers de documentation
```

#### Commandes principales

**Développement :**
```bash
cd backend && npm install && npm run start:dev
cd frontend && npm install && npm run dev
cd backend && npm run seed
```

**Build production :**
```bash
cd backend && npm ci && npm run build
cd frontend && npm ci && npm run build
```

**Déploiement OpenStack :**
```bash
./deploy/deploy-vm2.sh <VM2_IP> <PASSWORD>
./deploy/deploy-vm1.sh <VM1_IP> <VM2_PRIVATE_IP> <PASSWORD>
```

#### Notes de version

Cette version initiale est complète et prête pour le déploiement en production sur OpenStack. L'application respecte tous les standards de l'industrie et les bonnes pratiques :

- Architecture modulaire et maintenable
- Séparation des préoccupations (modules, services, controllers)
- Validation stricte des données
- Résilience et gestion d'erreurs
- Logs structurés pour l'observabilité
- Configuration externalisée
- Documentation exhaustive
- Scripts de déploiement automatisés

---

## Format des versions

Le projet suit le [Semantic Versioning](https://semver.org/):
- **MAJOR** : changements incompatibles de l'API
- **MINOR** : nouvelles fonctionnalités rétrocompatibles
- **PATCH** : corrections de bugs rétrocompatibles

## Catégories de changements

- **Ajouté** : nouvelles fonctionnalités
- **Modifié** : changements de fonctionnalités existantes
- **Déprécié** : fonctionnalités bientôt supprimées
- **Supprimé** : fonctionnalités supprimées
- **Corrigé** : corrections de bugs
- **Sécurité** : corrections de vulnérabilités
