// Script d'initialisation MongoDB
// Exécuter avec: mongosh --host localhost --port 27017 < mongo-init.js

use admin;

// Créer la base de données cloudmetrics
db = db.getSiblingDB('cloudmetrics');

// Créer l'utilisateur avec les droits readWrite sur cloudmetrics uniquement
db.createUser({
  user: 'appuser',
  pwd: 'CHANGE_ME_IN_PRODUCTION',
  roles: [
    {
      role: 'readWrite',
      db: 'cloudmetrics'
    }
  ]
});

print('MongoDB initialization completed');
print('Database: cloudmetrics');
print('User: appuser with readWrite role');
print('IMPORTANT: Change the password in production!');
