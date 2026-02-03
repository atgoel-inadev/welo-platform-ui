import { Users, Briefcase, CheckCircle, Activity } from 'lucide-react';

export const AdminDashboard = () => {
  const stats = [
    { label: 'Total Users', value: '0', icon: Users, color: 'bg-blue-500' },
    { label: 'Active Projects', value: '0', icon: Briefcase, color: 'bg-green-500' },
    { label: 'Tasks Completed', value: '0', icon: CheckCircle, color: 'bg-orange-500' },
    { label: 'System Health', value: '100%', icon: Activity, color: 'bg-teal-500' },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">System overview and management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="text-white" size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <p className="text-gray-500 text-center py-8">No recent activity</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">System Alerts</h2>
          <p className="text-gray-500 text-center py-8">No alerts</p>
        </div>
      </div>
    </div>
  );
};
