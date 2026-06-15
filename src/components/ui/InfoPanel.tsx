import { Package, MapPin, Clock, Activity, Keyboard, ArrowDownToLine, ArrowUpFromLine, Upload, Download, ClipboardCheck, Settings, Target, Bot, Hand, Filter, RotateCcw, ChevronDown, ChevronRight, ListTodo, Map, FileText } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { SLOT_CONFIG, HEATMAP_COLORS, OperationLog, LogType } from '../../types';

const logTypeConfig: Record<LogType, { label: string; icon: React.ReactNode; color: string }> = {
  inbound: {
    label: '入库',
    icon: <ArrowDownToLine className="w-3 h-3" />,
    color: 'text-green-400',
  },
  outbound: {
    label: '出库',
    icon: <ArrowUpFromLine className="w-3 h-3" />,
    color: 'text-orange-400',
  },
  import: {
    label: '导入',
    icon: <Upload className="w-3 h-3" />,
    color: 'text-blue-400',
  },
  export: {
    label: '导出',
    icon: <Download className="w-3 h-3" />,
    color: 'text-purple-400',
  },
  check: {
    label: '盘点',
    icon: <ClipboardCheck className="w-3 h-3" />,
    color: 'text-yellow-400',
  },
  task: {
    label: '任务',
    icon: <Settings className="w-3 h-3" />,
    color: 'text-cyan-400',
  },
  mode: {
    label: '模式',
    icon: <Bot className="w-3 h-3" />,
    color: 'text-pink-400',
  },
};

export function InfoPanel() {
  const slots = useStore(state => state.slots);
  const stacker = useStore(state => state.stacker);
  const logs = useStore(state => state.logs);
  const showHeatmap = useStore(state => state.showHeatmap);
  const locateLog = useStore(state => state.locateLog);
  const logFilter = useStore(state => state.logFilter);
  const setLogFilter = useStore(state => state.setLogFilter);

  const [timeRange, setTimeRange] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const totalSlots = SLOT_CONFIG.LAYERS * SLOT_CONFIG.POSITIONS;
  const occupiedSlots = slots.filter(s => s.isOccupied).length;
  const totalGoods = slots.reduce((sum, s) => sum + s.quantity, 0);
  const utilizationRate = ((occupiedSlots / totalSlots) * 100).toFixed(1);

  const pendingTasks = useStore(state =>
    state.taskQueue.filter(t => t.status === 'pending' || t.status === 'running').length
  );

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
    });
  };

  const handleLogClick = (log: OperationLog) => {
    locateLog(log);
  };

  const toggleLogExpanded = useStore(state => state.toggleLogExpanded);
  const taskQueue = useStore(state => state.taskQueue);
  const getSlotOperationHistory = useStore(state => state.getSlotOperationHistory);
  const setHighlightedSlotId = useStore(state => state.setHighlightedSlotId);
  const setHighlightedTaskId = useStore(state => state.setHighlightedTaskId);
  const setSelectedSlot = useStore(state => state.setSelectedSlot);

  const handleLocateSlot = (slotId: string) => {
    const slot = slots.find(s => s.id === slotId);
    if (slot) {
      setSelectedSlot(slot);
      setHighlightedSlotId(slotId);
      setTimeout(() => setHighlightedSlotId(null), 5000);
    }
  };

  const handleLocateTask = (taskId: string) => {
    setHighlightedTaskId(taskId);
    setTimeout(() => setHighlightedTaskId(null), 5000);
    const task = taskQueue.find(t => t.id === taskId);
    if (task) {
      handleLocateSlot(task.slotId);
    }
  };

  const toggleTypeFilter = (type: LogType) => {
    const currentTypes = logFilter.types || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    setLogFilter({ types: newTypes });
  };

  const resetFilters = () => {
    setTimeRange('all');
    setLogFilter({ types: [], startTime: undefined, endTime: undefined });
  };

  const filteredLogs = useMemo(() => {
    let result = [...logs];

    if (logFilter.types && logFilter.types.length > 0) {
      result = result.filter(log => logFilter.types.includes(log.type));
    }

    let startTime: number | undefined;
    const now = Date.now();
    switch (timeRange) {
      case '1h':
        startTime = now - 60 * 60 * 1000;
        break;
      case '6h':
        startTime = now - 6 * 60 * 60 * 1000;
        break;
      case '24h':
        startTime = now - 24 * 60 * 60 * 1000;
        break;
      case '7d':
        startTime = now - 7 * 24 * 60 * 60 * 1000;
        break;
    }

    if (startTime) {
      result = result.filter(log => log.timestamp >= startTime);
    }

    return result;
  }, [logs, logFilter.types, timeRange]);

  const logTypeList: LogType[] = ['inbound', 'outbound', 'import', 'export', 'check', 'task', 'mode'];

  return (
    <div className="fixed top-20 right-4 w-80 z-40">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl border border-white/20 overflow-hidden">
        <div className="px-4 py-3 bg-white/5 border-b border-white/10">
          <h3 className="text-white font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-orange-400" />
            系统状态
          </h3>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                <Package className="w-3 h-3" />
                货位占用
              </div>
              <div className="text-white font-bold text-xl">
                {occupiedSlots} / {totalSlots}
              </div>
              <div className="h-1 bg-white/10 rounded mt-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded transition-all"
                  style={{ width: `${utilizationRate}%` }}
                />
              </div>
              <div className="text-gray-400 text-xs mt-1">使用率 {utilizationRate}%</div>
            </div>

            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                <MapPin className="w-3 h-3" />
                货物总数
              </div>
              <div className="text-white font-bold text-xl">{totalGoods}</div>
              <div className="text-gray-400 text-xs">件</div>
              {pendingTasks > 0 && (
                <div className="mt-2 pt-2 border-t border-white/5">
                  <div className="flex items-center gap-1 text-yellow-400 text-xs">
                    <Settings className="w-3 h-3 animate-pulse" />
                    队列: {pendingTasks} 个任务
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400 text-sm">堆垛机状态</span>
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${
                  stacker.isBusy
                    ? 'bg-red-500/20 text-red-400 animate-pulse'
                    : 'bg-green-500/20 text-green-400'
                }`}
              >
                {stacker.isBusy ? '运行中' : '空闲'}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400 flex items-center gap-1">
                {stacker.mode === 'auto' ? (
                  <><Bot className="w-3.5 h-3.5" /> 自动模式</>
                ) : (
                  <><Hand className="w-3.5 h-3.5" /> 手动模式</>
                )}
              </span>
              <span className="text-white font-mono text-sm">
                X: {stacker.x.toFixed(1)} Y: {stacker.y.toFixed(1)}
              </span>
            </div>
            {stacker.hasGoods && stacker.currentGoods && (
              <div className="mt-2 p-2 bg-orange-500/20 rounded text-orange-300 text-sm">
                载具: {stacker.currentGoods.name} x{stacker.currentGoods.quantity}
              </div>
            )}
          </div>

          {stacker.mode === 'manual' && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2 text-blue-400 text-sm mb-2">
                <Keyboard className="w-4 h-4" />
                键盘控制
              </div>
              <div className="grid grid-cols-3 gap-1 text-center text-xs text-gray-300">
                <div />
                <div className="bg-white/10 rounded py-1">W ↑</div>
                <div />
                <div className="bg-white/10 rounded py-1">A ←</div>
                <div className="bg-white/10 rounded py-1">S ↓</div>
                <div className="bg-white/10 rounded py-1">D →</div>
              </div>
              <div className="text-xs text-gray-500 mt-2 text-center">
                方向键也可控制移动
              </div>
            </div>
          )}

          {showHeatmap && (
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-gray-400 text-sm mb-2 flex items-center gap-2">
                热力图图例
              </div>
              <div className="flex items-center gap-1">
                {HEATMAP_COLORS.map((level, idx) => (
                  <div key={idx} className="flex-1 text-center">
                    <div
                      className="h-6 rounded shadow-inner"
                      style={{ backgroundColor: level.color }}
                    />
                    <div className="text-xs text-gray-400 mt-1">
                      {level.max === Infinity ? '200+' : level.max}
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-500 text-center mt-2">货物数量（件）</div>
            </div>
          )}

          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Clock className="w-4 h-4" />
                操作日志
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-all ${
                    showFilters || (logFilter.types?.length || 0) > 0 || timeRange !== 'all'
                      ? 'bg-blue-500/30 text-blue-400'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Filter className="w-3 h-3" />
                  筛选
                </button>
                <span className="text-xs text-gray-500">{filteredLogs.length}/{logs.length}</span>
              </div>
            </div>

            {showFilters && (
              <div className="mb-3 p-2 bg-black/20 rounded-lg space-y-2">
                <div>
                  <div className="text-xs text-gray-400 mb-1.5">按类型筛选</div>
                  <div className="flex flex-wrap gap-1">
                    {logTypeList.map(type => {
                      const config = logTypeConfig[type];
                      const isActive = logFilter.types?.includes(type);
                      return (
                        <button
                          key={type}
                          onClick={() => toggleTypeFilter(type)}
                          className={`px-2 py-0.5 rounded text-xs transition-all flex items-center gap-1 ${
                            isActive
                              ? `${config.color} bg-white/20`
                              : 'text-gray-500 hover:text-gray-300 hover:bg-white/10'
                          }`}
                        >
                          {config.icon}
                          {config.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-400 mb-1.5">按时间筛选</div>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { key: 'all', label: '全部' },
                      { key: '1h', label: '1小时内' },
                      { key: '6h', label: '6小时内' },
                      { key: '24h', label: '24小时内' },
                      { key: '7d', label: '7天内' },
                    ].map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => setTimeRange(opt.key)}
                        className={`px-2 py-0.5 rounded text-xs transition-all ${
                          timeRange === opt.key
                            ? 'bg-green-500/30 text-green-400'
                            : 'text-gray-500 hover:text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={resetFilters}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-xs text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <RotateCcw className="w-3 h-3" />
                    重置筛选
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-1 max-h-56 overflow-y-auto pr-1 -mr-1">
              {filteredLogs.length === 0 ? (
                <div className="text-gray-500 text-xs text-center py-4">
                  暂无匹配的操作记录
                </div>
              ) : (
                filteredLogs.slice(0, 30).map((log, idx) => {
                  const config = logTypeConfig[log.type];
                  const canLocate = !!log.slotId || !!log.taskId || (!!log.slotIds && log.slotIds.length > 0) || (!!log.taskIds && log.taskIds.length > 0);
                  const hasDetails = !!log.slotId || !!log.taskId || (!!log.slotIds && log.slotIds.length > 0) || (!!log.taskIds && log.taskIds.length > 0) || log.details;
                  const isExpanded = log.expanded;
                  const relatedSlotIds = Array.from(new Set([log.slotId, ...(log.slotIds || [])].filter(Boolean) as string[]));
                  const relatedTaskIds = Array.from(new Set([log.taskId, ...(log.taskIds || [])].filter(Boolean) as string[]));
                  const slotHistory = log.slotId ? getSlotOperationHistory(log.slotId) : [];

                  return (
                    <div
                      key={log.id}
                      className={`group text-xs rounded transition-all ${idx === 0 ? 'bg-white/5' : ''} ${isExpanded ? 'bg-white/10' : ''}`}
                    >
                      <div
                        className={`p-1.5 ${canLocate ? 'cursor-pointer hover:bg-white/5 hover:translate-x-0.5' : ''}`}
                        onClick={() => {
                          if (canLocate) handleLogClick(log);
                          if (hasDetails) toggleLogExpanded(log.id);
                        }}
                      >
                        <div className="flex items-start gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (hasDetails) toggleLogExpanded(log.id);
                            }}
                            className={`mt-0.5 w-4 h-4 flex items-center justify-center flex-shrink-0 rounded ${hasDetails ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'invisible'}`}
                          >
                            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          </button>
                          <div className={`mt-0.5 ${config.color} opacity-70`}>
                            {config.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${config.color} bg-white/10`}>
                                {config.label}
                              </span>
                              {relatedSlotIds.length > 0 && (
                                <span className="flex items-center gap-0.5 text-[10px] text-gray-500">
                                  <Map className="w-2.5 h-2.5" />
                                  {relatedSlotIds.length}
                                </span>
                              )}
                              {relatedTaskIds.length > 0 && (
                                <span className="flex items-center gap-0.5 text-[10px] text-gray-500">
                                  <ListTodo className="w-2.5 h-2.5" />
                                  {relatedTaskIds.length}
                                </span>
                              )}
                            </div>
                            <div className="text-gray-300 break-words leading-snug mt-0.5">
                              {log.message}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-gray-600">
                                {formatDate(log.timestamp)} {formatTime(log.timestamp)}
                              </span>
                              {canLocate && (
                                <span className="inline-flex items-center gap-0.5 text-blue-400/70 group-hover:text-blue-400 transition-colors">
                                  <Target className="w-2.5 h-2.5" />
                                  定位
                                </span>
                              )}
                              {hasDetails && (
                                <span className="inline-flex items-center gap-0.5 text-purple-400/70">
                                  <FileText className="w-2.5 h-2.5" />
                                  {isExpanded ? '收起' : '详情'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {isExpanded && hasDetails && (
                        <div className="mx-2 mb-1.5 p-2 bg-black/30 rounded-lg border-l-2 border-purple-500/50 space-y-2" onClick={(e) => e.stopPropagation()}>
                          {log.details && (
                            <div className="space-y-0.5 text-[11px]">
                              <div className="text-gray-500 font-medium mb-1 flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                详细信息
                              </div>
                              {log.details.summary && (
                                <div className="text-gray-300 bg-white/5 px-2 py-1 rounded">
                                  {log.details.summary}
                                </div>
                              )}
                              {log.details.goodsName && (
                                <div className="flex items-center justify-between px-2 py-0.5">
                                  <span className="text-gray-500">货物名称</span>
                                  <span className="text-white font-medium">{log.details.goodsName}</span>
                                </div>
                              )}
                              {log.details.quantity !== undefined && (
                                <div className="flex items-center justify-between px-2 py-0.5">
                                  <span className="text-gray-500">数量</span>
                                  <span className="text-orange-400 font-mono">x{log.details.quantity}</span>
                                </div>
                              )}
                              {log.details.layer !== undefined && log.details.position !== undefined && (
                                <div className="flex items-center justify-between px-2 py-0.5">
                                  <span className="text-gray-500">目标货位</span>
                                  <span
                                    onClick={() => handleLocateSlot(`L${log.details!.layer}-P${log.details!.position}`)}
                                    className="text-blue-400 font-mono cursor-pointer hover:text-blue-300 hover:underline"
                                  >
                                    L{log.details.layer}-P{log.details.position}
                                  </span>
                                </div>
                              )}
                              {log.details.taskType && (
                                <div className="flex items-center justify-between px-2 py-0.5">
                                  <span className="text-gray-500">任务类型</span>
                                  <span className="text-white">{log.details.taskType === 'inbound' ? '入库' : '出库'}</span>
                                </div>
                              )}
                              {log.details.totalRecords !== undefined && (
                                <div className="flex items-center justify-between px-2 py-0.5">
                                  <span className="text-gray-500">记录总数</span>
                                  <span className="text-gray-300">{log.details.totalRecords} 条</span>
                                </div>
                              )}
                              {log.details.changedCount !== undefined && (
                                <div className="flex items-center justify-between px-2 py-0.5">
                                  <span className="text-gray-500">货位变更</span>
                                  <span className="text-yellow-400">{log.details.changedCount} 个</span>
                                </div>
                              )}
                              {log.details.cancelledCount !== undefined && (
                                <div className="flex items-center justify-between px-2 py-0.5">
                                  <span className="text-gray-500">清理任务</span>
                                  <span className="text-red-400">{log.details.cancelledCount} 个</span>
                                </div>
                              )}
                            </div>
                          )}

                          {relatedSlotIds.length > 0 && (
                            <div className="space-y-0.5 text-[11px]">
                              <div className="text-gray-500 font-medium mb-1 flex items-center gap-1">
                                <Map className="w-3 h-3" />
                                相关货位 ({relatedSlotIds.length})
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {relatedSlotIds.slice(0, 15).map(slotId => {
                                  const slot = slots.find(s => s.id === slotId);
                                  return (
                                    <button
                                      key={slotId}
                                      onClick={() => handleLocateSlot(slotId)}
                                      className={`px-1.5 py-0.5 rounded font-mono text-[10px] transition-all ${
                                        slot?.isOccupied
                                          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                          : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                                      }`}
                                    >
                                      {slotId}
                                      {slot?.isOccupied && <span className="opacity-60"> ({slot.quantity})</span>}
                                    </button>
                                  );
                                })}
                                {relatedSlotIds.length > 15 && (
                                  <span className="text-gray-500 px-1.5 py-0.5 text-[10px]">
                                    +{relatedSlotIds.length - 15}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {relatedTaskIds.length > 0 && (
                            <div className="space-y-0.5 text-[11px]">
                              <div className="text-gray-500 font-medium mb-1 flex items-center gap-1">
                                <ListTodo className="w-3 h-3" />
                                关联任务 ({relatedTaskIds.length})
                              </div>
                              <div className="flex flex-col gap-0.5 max-h-20 overflow-y-auto">
                                {relatedTaskIds.slice(0, 10).map(taskId => {
                                  const task = taskQueue.find(t => t.id === taskId);
                                  return (
                                    <button
                                      key={taskId}
                                      onClick={() => handleLocateTask(taskId)}
                                      className="flex items-center justify-between gap-2 px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-left transition-all"
                                    >
                                      <div className="flex items-center gap-1 min-w-0">
                                        <span className={task?.type === 'inbound' ? 'text-green-400' : 'text-orange-400'}>
                                          {task?.type === 'inbound' ? '↓' : '↑'}
                                        </span>
                                        <span className="text-gray-300 truncate">{task?.goodsName || '任务'}</span>
                                      </div>
                                      <div className="flex items-center gap-1 flex-shrink-0">
                                        <span className="text-gray-500 font-mono text-[10px]">
                                          {task?.slotId}
                                        </span>
                                        <span className={`px-1 rounded text-[10px] ${
                                          task?.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                          task?.status === 'running' ? 'bg-blue-500/20 text-blue-400' :
                                          task?.status === 'paused' ? 'bg-amber-500/20 text-amber-400' :
                                          task?.status === 'cancelled' ? 'bg-gray-500/20 text-gray-400' :
                                          'bg-yellow-500/20 text-yellow-400'
                                        }`}>
                                          {task?.status === 'completed' ? '已完成' :
                                           task?.status === 'running' ? '执行中' :
                                           task?.status === 'paused' ? '已暂停' :
                                           task?.status === 'cancelled' ? '已取消' : '等待中'}
                                        </span>
                                      </div>
                                    </button>
                                  );
                                })}
                                {relatedTaskIds.length > 10 && (
                                  <span className="text-gray-500 px-1.5 py-0.5 text-[10px] text-center">
                                    +{relatedTaskIds.length - 10} 更多任务...
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {log.slotId && slotHistory.length > 1 && (
                            <div className="space-y-0.5 text-[11px]">
                              <div className="text-gray-500 font-medium mb-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {log.slotId} 同货位最近操作 ({slotHistory.length})
                              </div>
                              <div className="space-y-0.5 max-h-24 overflow-y-auto">
                                {slotHistory.slice(0, 8).map((hlog, hIdx) => {
                                  const hconfig = logTypeConfig[hlog.type];
                                  return (
                                    <div key={hlog.id} className="flex items-start gap-1 px-1.5 py-0.5 rounded hover:bg-white/5">
                                      <span className={`mt-0.5 ${hconfig.color}`}>
                                        {hconfig.icon}
                                      </span>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-gray-400 truncate">{hlog.message}</div>
                                        <div className="text-gray-600 text-[10px]">
                                          {formatTime(hlog.timestamp)}
                                          {hIdx === 0 && <span className="ml-1 text-purple-400">← 当前</span>}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {log.slotId && (
                            (() => {
                              const slot = slots.find(s => s.id === log.slotId);
                              if (!slot) return null;
                              return (
                                <div className="text-[11px] bg-blue-500/10 border border-blue-500/30 rounded px-2 py-1.5 space-y-0.5">
                                  <div className="text-blue-400 font-medium flex items-center gap-1">
                                    <Package className="w-3 h-3" />
                                    {log.slotId} 当前库存快照
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-500">状态</span>
                                    <span className={slot.isOccupied ? 'text-green-400' : 'text-gray-400'}>
                                      {slot.isOccupied ? '已占用' : '空闲'}
                                    </span>
                                  </div>
                                  {slot.isOccupied && (
                                    <>
                                      <div className="flex items-center justify-between">
                                        <span className="text-gray-500">货物</span>
                                        <span className="text-white">{slot.goodsName}</span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-gray-500">数量</span>
                                        <span className="text-orange-400 font-mono font-bold">{slot.quantity}</span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              );
                            })()
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            {logs.length > 0 && (
              <div className="mt-2 pt-2 border-t border-white/5 text-xs text-gray-500 text-center">
                刷新页面后可继续查看最近200条记录
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl border border-white/20 p-4">
        <div className="text-gray-300 text-xs space-y-1.5">
          <div className="text-gray-400 font-medium mb-2">操作说明</div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-gray-400 flex-shrink-0" />
            <span>空闲货位 - 点击入库加入队列</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-green-500 flex-shrink-0" />
            <span>已占用货位</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-pink-500 flex-shrink-0" />
            <span>高亮定位 - 点击日志/盘点定位</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-orange-500 flex-shrink-0" />
            <span>出库口（右侧区域）</span>
          </div>
        </div>
      </div>
    </div>
  );
}
