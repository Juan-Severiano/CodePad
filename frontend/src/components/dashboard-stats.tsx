import React from 'react';

export function DashboardStats() {
  const stats = [
    { label: 'Sessions', value: '159' },
    { label: 'Messages', value: '22,769' },
    { label: 'Total tokens', value: '9.8M' },
    { label: 'Active days', value: '28' },
    { label: 'Current streak', value: '6d' },
    { label: 'Longest streak', value: '7d' },
    { label: 'Peak hour', value: '11 AM' },
    { label: 'Favorite model', value: 'Haiku 4.5', isAccent: true },
  ];

  // Placeholder for activity heatmap
  const days = Array.from({ length: 365 });

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-[#1c1c1c] p-4 rounded-xl border border-[#2a2a2a] flex flex-col justify-center shadow-sm hover:border-[#333] transition-colors cursor-default">
            <span className="text-[#a1a1a1] text-[11px] font-semibold uppercase tracking-wider mb-1.5">{stat.label}</span>
            <span className={`text-2xl font-bold tracking-tight ${stat.isAccent ? 'text-[#d97757]' : 'text-white'}`}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>
      
      {/* Activity Heatmap Placeholder */}
      <div className="bg-[#1c1c1c] p-6 rounded-xl border border-[#2a2a2a] flex flex-col shadow-sm">
        <span className="text-[#a1a1a1] text-xs font-semibold uppercase tracking-wider mb-4">Activity Heatmap</span>
        <div className="flex flex-wrap gap-[3px]">
          {days.map((_, i) => {
            const hasActivity = Math.random() > 0.6;
            const intensity = hasActivity ? Math.floor(Math.random() * 4) + 1 : 0;
            
            let colorClass = 'bg-[#2a2a2a]'; // Empty state
            if (intensity === 1) colorClass = 'bg-blue-900';
            if (intensity === 2) colorClass = 'bg-blue-700';
            if (intensity === 3) colorClass = 'bg-blue-500';
            if (intensity === 4) colorClass = 'bg-blue-400';
            
            return (
              <div 
                key={i} 
                className={`w-[10px] h-[10px] rounded-sm ${colorClass} hover:ring-1 hover:ring-white transition-all cursor-pointer`}
                title={`Activity level: ${intensity}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
