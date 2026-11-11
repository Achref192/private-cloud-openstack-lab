import { HealthCheck } from '../types';

interface InfrastructureCardProps {
  health: HealthCheck;
  className?: string;
}

export default function InfrastructureCard({ health, className = '' }: InfrastructureCardProps) {
  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Infrastructure
      </h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Hostname</span>
          <span className="text-sm font-mono text-gray-900 dark:text-white">
            {health.hostname}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">MongoDB</span>
          <span className={`px-2 py-1 rounded text-xs font-semibold ${
            health.db === 'connected'
              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
              : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
          }`}>
            {health.db === 'connected' ? 'Connecté' : 'Déconnecté'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Version</span>
          <span className="text-sm font-mono text-gray-900 dark:text-white">
            v{health.version}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Uptime</span>
          <span className="text-sm font-mono text-gray-900 dark:text-white">
            {formatUptime(health.uptime)}
          </span>
        </div>
      </div>
    </div>
  );
}
