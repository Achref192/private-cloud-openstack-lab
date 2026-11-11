import * as mongoose from 'mongoose';
import { TaskStatus, TaskPriority } from './tasks/task.schema';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cloudmetrics';

const seedTasks = [
  {
    title: 'Provisionner serveurs OpenStack',
    description: 'Créer 3 instances Ubuntu 24.04 avec 2 vCPU et 4 Go RAM',
    status: TaskStatus.DONE,
    priority: TaskPriority.HIGH,
  },
  {
    title: 'Configurer réseau privé',
    description: 'Mettre en place le réseau privé 10.0.0.0/24 entre les VMs',
    status: TaskStatus.DONE,
    priority: TaskPriority.HIGH,
  },
  {
    title: 'Installer MongoDB',
    description: 'Déployer MongoDB 7.0 sur la VM database',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
  },
  {
    title: 'Configurer Nginx',
    description: 'Installer et configurer Nginx comme reverse proxy',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.MEDIUM,
  },
  {
    title: 'Déployer API NestJS',
    description: 'Compiler et déployer l\'API en tant que service systemd',
    status: TaskStatus.TODO,
    priority: TaskPriority.HIGH,
  },
  {
    title: 'Créer groupe de sécurité',
    description: 'Configurer les règles firewall OpenStack pour HTTP/HTTPS',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
  },
  {
    title: 'Configurer monitoring',
    description: 'Mettre en place la surveillance avec CloudWatch ou équivalent',
    status: TaskStatus.TODO,
    priority: TaskPriority.LOW,
  },
  {
    title: 'Backup base de données',
    description: 'Configurer les snapshots automatiques de MongoDB',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
  },
  {
    title: 'Tests de charge',
    description: 'Exécuter tests de performance avec 1000 requêtes/s',
    status: TaskStatus.TODO,
    priority: TaskPriority.LOW,
  },
  {
    title: 'Documentation technique',
    description: 'Rédiger la documentation d\'architecture et de déploiement',
    status: TaskStatus.TODO,
    priority: TaskPriority.LOW,
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const TaskModel = mongoose.model('Task', new mongoose.Schema({
      title: String,
      description: String,
      status: String,
      priority: String,
    }, { timestamps: true }));

    await TaskModel.deleteMany({});
    console.log('Cleared existing tasks');

    await TaskModel.insertMany(seedTasks);
    console.log(`Inserted ${seedTasks.length} tasks`);

    await mongoose.disconnect();
    console.log('Seed completed successfully');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
