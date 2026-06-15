import { Package, MapPin, Clock, Activity, Keyboard, ArrowDownToLine, ArrowUpFromLine, Upload, Download, ClipboardCheck, Settings, Target, Bot, Hand, Filter, RotateCcw } from 'lucide-react';
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
                  const canLocate = !!log.slotId || !!log.taskId;
                  return (
                    <div
                      key={log.id}
                      onClick={() => canLocate && handleLogClick(log)}
                      className={`group text-xs p-1.5 rounded transition-all ${
                        canLocate
                          ? 'cursor-pointer hover:bg-white/10 hover:translate-x-0.5'
                          : ''
                      } ${idx === 0 ? 'bg-white/5' : ''}`}
                    >
                      <div className="flex items-start gap-1.5">
                        <div className={`mt-0.5 ${config.color} opacity-70`}>
                          {config.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${config.color} bg-white/10`}>
                              {config.label}
                            </span>
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
                          </div>
                        </div>
                      </div>
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
