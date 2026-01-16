'use client';

import { AggregatedStats } from '@/lib/types';
import { Clock, TrendingUp, DollarSign, Wrench } from 'lucide-react';

interface QuickStatsProps {
  stats: AggregatedStats;
}

export function QuickStats({ stats }: QuickStatsProps) {
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="bg-gray-1 rounded-lg p-5 border border-gray-4 hover:border-gray-5 transition-colors">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-blue-9" />
          <span className="text-sm text-gray-11">Total Time Spent</span>
        </div>
        <div className="text-2xl font-bold text-blue-9">
          {formatTime(stats.totalTimeSpent)}
        </div>
        <div className="text-xs text-gray-9 mt-1">
          across {stats.totalTasks} tasks
        </div>
      </div>

      <div className="bg-gray-1 rounded-lg p-5 border border-gray-4 hover:border-gray-5 transition-colors">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-purple-9" />
          <span className="text-sm text-gray-11">Avg Task Duration</span>
        </div>
        <div className="text-2xl font-bold text-purple-9">
          {formatTime(stats.avgTaskDuration)}
        </div>
      </div>

      <div className="bg-gray-1 rounded-lg p-5 border border-gray-4 hover:border-gray-5 transition-colors">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-4 h-4 text-green-9" />
          <span className="text-sm text-gray-11">Median Cost</span>
        </div>
        <div className="text-2xl font-bold text-green-9">
          ${stats.medianCost.toFixed(4)}
        </div>
      </div>

      <div className="bg-gray-1 rounded-lg p-5 border border-gray-4 hover:border-gray-5 transition-colors">
        <div className="flex items-center gap-2 mb-2">
          <Wrench className="w-4 h-4 text-orange-9" />
          <span className="text-sm text-gray-11">Most Used Tool</span>
        </div>
        <div className="text-xl font-bold font-mono text-orange-9">
          {stats.mostUsedTool}
        </div>
        <div className="text-xs text-gray-9 mt-1">
          {stats.toolUsage[stats.mostUsedTool]?.toLocaleString()} calls
        </div>
      </div>
    </div>
  );
}
