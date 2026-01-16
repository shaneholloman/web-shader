'use client';

import { AggregatedStats } from '@/lib/types';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface CompletionMetricsProps {
  stats: AggregatedStats;
}

export function CompletionMetrics({ stats }: CompletionMetricsProps) {
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-12">Success & Completion Metrics</h3>
      
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-gray-1 rounded-lg p-4 border border-gray-4 hover:border-gray-5 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-9" />
            <span className="text-sm text-gray-11">Completion Rate</span>
          </div>
          <div className="text-2xl font-bold text-green-9">
            {stats.completionRate.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-9 mt-1">
            {stats.completedTasks} of {stats.totalTasks} tasks
          </div>
        </div>

        <div className="bg-gray-1 rounded-lg p-4 border border-gray-4 hover:border-gray-5 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-red-9" />
            <span className="text-sm text-gray-11">Incomplete</span>
          </div>
          <div className="text-2xl font-bold text-red-9">
            {stats.incompleteTasks}
          </div>
          <div className="text-xs text-gray-9 mt-1">
            tasks without done
          </div>
        </div>

        <div className="bg-gray-1 rounded-lg p-4 border border-gray-4 hover:border-gray-5 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-9" />
            <span className="text-sm text-gray-11">Avg Iterations</span>
          </div>
          <div className="text-2xl font-bold text-blue-9">
            {stats.avgIterationsToCompletion.toFixed(1)}
          </div>
          <div className="text-xs text-gray-9 mt-1">
            to completion
          </div>
        </div>

        <div className="bg-gray-1 rounded-lg p-4 border border-gray-4 hover:border-gray-5 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-purple-9" />
            <span className="text-sm text-gray-11">Avg Time</span>
          </div>
          <div className="text-2xl font-bold text-purple-9">
            {formatTime(stats.avgTimeToCompletion)}
          </div>
          <div className="text-xs text-gray-9 mt-1">
            to completion
          </div>
        </div>

        <div className="bg-gray-1 rounded-lg p-4 border border-gray-4 hover:border-gray-5 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-9" />
            <span className="text-sm text-gray-11">Stuck Frequency</span>
          </div>
          <div className="text-2xl font-bold text-amber-9">
            {stats.stuckFrequency.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-9 mt-1">
            of iterations
          </div>
        </div>
      </div>
    </div>
  );
}
