import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Stats, HealthCheck } from '../types';
import StatsCard from './StatsCard';
import InfrastructureCard from './InfrastructureCard';

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [health, setHealth] = useState<HealthCheck | null>(null);

  const loadData = async () => {
    try {
      const [statsData, healthData] = await Promise.all([
        api.getStats(),
        api.getHealth(),
      ]);
      setStats(statsData);
      setHealth(healthData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!stats || !health) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400">
        Chargement du dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total"
          value={stats.total}
          color="blue"
        />
        <StatsCard
          title="À faire"
          value={stats.byStatus.todo}
          color="gray"
        />
        <StatsCard
          title="En cours"
          value={stats.byStatus.in_progress}
          color="yellow"
        />
        <StatsCard
          title="Terminé"
          value={stats.byStatus.done}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Taux de complétion
          </h3>
          <div className="flex items-baseline">
            <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              {stats.completionRate}%
            </span>
          </div>
          <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
        </div>

        <InfrastructureCard health={health} className="md:col-span-2" />
      </div>
    </div>
  );
}
