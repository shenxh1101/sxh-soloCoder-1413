import {
  ListTodo,
  ArrowDownToLine,
  ArrowUpFromLine,
  X,
  Trash2,
  Clock,
  CheckCircle2,
  Loader2,
  XCircle,
  Pause,
  Play,
  AlertTriangle,
  ChevronUp,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { WarehouseTask, TaskStatus, TaskPriority } from '../../types';

const statusConfig: Record<TaskStatus, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  pending: {
    label: '等待中',
    icon: <Clock className="w-3 h-3" />,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/20',
  },
  running: {
    label: '执行中',
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
    color: 'text-blue-400',
    bg: 'bg-blue-500/20',
  },
  completed: {
    label: '已完成',
    icon: <CheckCircle2 className="w-3 h-3" />,
    color: 'text-green-400',
    bg: 'bg-green-500/20',
  },
  cancelled: {
    label: '已取消',
    icon: <XCircle className="w-3 h-3" />,
    color: 'text-gray-500',
    bg: 'bg-gray-500/20',
  },
};

const priorityConfig: Record<TaskPriority, { label: string; color: string; bg: string }> = {
  normal: {
    label: '普通',
    color: 'text-gray-400',
    bg: 'bg-gray-500/20',
  },
  urgent: {
    label: '紧急',
    color: 'text-red-400',
    bg: 'bg-red-500/20',
  },
};

export function TaskQueue() {
  const taskQueue = useStore(state => state.taskQueue);
  const isQueuePaused = useStore(state => state.isQueuePaused);
  const cancelTask = useStore(state => state.cancelTask);
  const clearCompletedTasks = useStore(state => state.clearCompletedTasks);
  const pauseQueue = useStore(state => state.pauseQueue);
  const resumeQueue = useStore(state => state.resumeQueue);
  const moveTaskToFront = useStore(state => state.moveTaskToFront);
  const setHighlightedSlotId = useStore(state => state.setHighlightedSlotId);

  const activeTasks = taskQueue.filter(t => t.status === 'pending' || t.status === 'running');
  const recentCompleted = taskQueue.filter(t => t.status === 'completed' || t.status === 'cancelled').slice(0, 5);
  const hasCompleted = recentCompleted.length > 0;
  const pendingCount = activeTasks.filter(t => t.status === 'pending').length;
  const runningCount = activeTasks.filter(t => t.status === 'running').length;

  const renderTaskItem = (task: WarehouseTask, idx: number, total: number) => {
    const status = statusConfig[task.status];
    const priority = priorityConfig[task.priority];
    const isInbound = task.type === 'inbound';
    const isUrgent = task.priority === 'urgent';

    return (
      <div
        key={task.id}
        className={`flex items-center gap-2 p-2 rounded-lg text-xs transition-all ${
          task.status === 'running'
            ? 'bg-blue-500/20 border border-blue-500/50'
            : task.status === 'pending'
            ? isUrgent
              ? 'bg-red-500/10 border border-red-500/30 hover:bg-red-500/15'
              : 'bg-white/5 hover:bg-white/10'
            : 'bg-white/5 opacity-60'
        }`}
      >
        <div
          className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
            isInbound ? 'bg-green-500/30 text-green-400' : 'bg-orange-500/30 text-orange-400'
          }`}
        >
          {isInbound ? <ArrowDownToLine className="w-3 h-3" /> : <ArrowUpFromLine className="w-3 h-3" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 text-white font-medium truncate">
            {task.status === 'pending' && total > 0 && (
              <span className="text-gray-500 font-mono">#{idx + 1}</span>
            )}
            {isUrgent && (
              <span className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-red-500/30 text-red-300">
                <AlertTriangle className="w-3 h-3" />
                <span>紧急</span>
              </span>
            )}
            <span className="truncate">{task.goodsName}</span>
            <span className="text-orange-400">x{task.quantity}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-400">
            <button
              onClick={() => setHighlightedSlotId(task.slotId)}
              className="font-mono hover:text-blue-400 transition-colors"
              title="点击定位货位"
            >
              {task.slotId}
            </button>
            {task.type === 'outbound' && (task as { totalQuantity?: number }).totalQuantity && (
              <span className="text-gray-500">
                /{(task as { totalQuantity: number }).totalQuantity}
              </span>
            )}
          </div>
        </div>

        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${status.bg} ${status.color} flex-shrink-0`}>
          {status.icon}
          <span>{status.label}</span>
        </div>

        {task.status === 'pending' && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {!isUrgent && (
              <button
                onClick={() => moveTaskToFront(task.id)}
                className="p-1 text-gray-500 hover:text-yellow-400 hover:bg-yellow-500/10 rounded transition-colors"
                title="提升优先级"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => cancelTask(task.id)}
              className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
              title="取消任务"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  };

  if (taskQueue.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl border border-white/20 p-4 max-w-lg min-w-[460px]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-white font-bold">
            <ListTodo className="w-5 h-5 text-purple-400" />
            <span>作业队列</span>
            <span className="text-xs text-gray-400 font-normal">
              ({runningCount} 执行中 · {pendingCount} 等待)
            </span>
            {isQueuePaused && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-yellow-500/30 text-yellow-300 text-xs animate-pulse">
                <Pause className="w-3 h-3" />
                已暂停
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={isQueuePaused ? resumeQueue : pauseQueue}
              className={`flex items-center gap-1 px-3 py-1 text-xs rounded transition-colors ${
                isQueuePaused
                  ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                  : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
              }`}
              title={isQueuePaused ? '恢复队列' : '暂停队列'}
            >
              {isQueuePaused ? (
                <>
                  <Play className="w-3 h-3" />
                  恢复
                </>
              ) : (
                <>
                  <Pause className="w-3 h-3" />
                  暂停
                </>
              )}
            </button>
            {hasCompleted && (
              <button
                onClick={clearCompletedTasks}
                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                清理
              </button>
            )}
          </div>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {activeTasks.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs text-gray-400 px-1">待执行任务</div>
              {activeTasks.map((task, idx) =>
                renderTaskItem(task, idx, pendingCount)
              )}
            </div>
          )}

          {hasCompleted && (
            <div className="space-y-1.5 mt-3 pt-3 border-t border-white/10">
              <div className="text-xs text-gray-500 px-1">最近完成</div>
              {recentCompleted.map((task, idx) => renderTaskItem(task, idx, 0))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
