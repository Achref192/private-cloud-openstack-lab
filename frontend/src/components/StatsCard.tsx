interface StatsCardProps {
  title: string;
  value: number;
  color: 'blue' | 'gray' | 'yellow' | 'green';
}

const colorClasses = {
  blue: 'text-blue-600 dark:text-blue-400',
  gray: 'text-gray-600 dark:text-gray-400',
  yellow: 'text-yellow-600 dark:text-yellow-400',
  green: 'text-green-600 dark:text-green-400',
};

export default function StatsCard({ title, value, color }: StatsCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
        {title}
      </h3>
      <p className={`text-3xl font-bold ${colorClasses[color]}`}>
        {value}
      </p>
    </div>
  );
}
