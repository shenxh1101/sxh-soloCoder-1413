import { Package, MapPin, Clock, Activity, Keyboard } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { SLOT_CONFIG, HEATMAP_COLORS } from '../../types';

export function InfoPanel() {
  const slots = useStore(state => state.slots);
  const stacker = useStore(state => state.stacker);
  const logs = useStore(state => state.logs);
  const showHeatmap = useStore(state => state.showHeatmap);

  const totalSlots = SLOT_CONFIG.LAYERS * SLOT_CONFIG.POSITIONS;
  const occupiedSlots = slots.filter(s => s.isOccupied).length;
  const totalGoods = slots.reduce((sum, s) => sum + s.quantity, 0);
  const utilizationRate = ((occupiedSlots / totalSlots) * 100).toFixed(1);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'inbound':
        return 'text-green-400';
      case 'outbound':
        return 'text-orange-400';
      case 'import':
        return 'text-blue-400';
      case 'export':
        return 'text-purple-400';
      case 'check':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

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
              <div className="text-gray-400 text-xs">使用率 {utilizationRate}%</div>
            </div>

            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                <MapPin className="w-3 h-3" />
                货物总数
              </div>
              <div className="text-white font-bold text-xl">{totalGoods}</div>
              <div className="text-gray-400 text-xs">件</div>
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400 text-sm">堆垛机状态</span>
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${
                  stacker.isBusy
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-green-500/20 text-green-400'
                }`}
              >
                {stacker.isBusy ? '运行中' : '空闲'}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">模式</span>
              <span className="text-white font-medium">
                {stacker.mode === 'auto' ? '自动模式' : '手动模式'}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm mt-1">
              <span className="text-gray-400">位置</span>
              <span className="text-white font-mono text-sm">
                X: {stacker.x.toFixed(1)}, Y: {stacker.y.toFixed(1)}
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
            </div>
          )}

          {showHeatmap && (
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-gray-400 text-sm mb-2">热力图图例</div>
              <div className="flex items-center gap-1">
                {HEATMAP_COLORS.map((level, idx) => (
                  <div key={idx} className="flex-1 text-center">
                    <div
                      className="h-6 rounded"
                      style={{ backgroundColor: level.color }}
                    />
                    <div className="text-xs text-gray-400 mt-1">
                      {level.max === Infinity ? '200+' : level.max}
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-500 text-center mt-1">货物数量</div>
            </div>
          )}

          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <Clock className="w-4 h-4" />
              操作日志
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {logs.slice(0, 10).map(log => (
                <div key={log.id} className="text-xs">
                  <span className="text-gray-500">{formatTime(log.timestamp)}</span>
                  <span className={`ml-2 ${getLogColor(log.type)}`}>
                    {log.message}
                  </span>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-gray-500 text-xs text-center py-2">
                  暂无操作记录
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl border border-white/20 p-4">
        <div className="text-gray-300 text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-gray-400" />
            <span>空闲货位 - 点击可入库</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-green-500" />
            <span>已占用货位</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-orange-500" />
            <span>出库口</span>
          </div>
        </div>
      </div>
    </div>
  );
}
