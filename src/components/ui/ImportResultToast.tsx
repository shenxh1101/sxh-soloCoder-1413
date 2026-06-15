import { CheckCircle2, XCircle, AlertTriangle, X } from 'lucide-react';
import { useStore } from '../../store/useStore';

export function ImportResultToast() {
  const importResult = useStore(state => state.importResult);
  const showImportResult = useStore(state => state.showImportResult);
  const setImportResult = useStore(state => state.setImportResult);

  if (!importResult || !showImportResult) return null;

  const { success, skipped, errors } = importResult;
  const total = success + skipped + errors;

  const getIcon = () => {
    if (errors > 0 || (errors === 0 && success === 0)) {
      return <XCircle className="w-6 h-6 text-red-400" />;
    }
    if (skipped > 0) {
      return <AlertTriangle className="w-6 h-6 text-yellow-400" />;
    }
    return <CheckCircle2 className="w-6 h-6 text-green-400" />;
  };

  return (
    <div className="fixed top-24 right-4 z-50 animate-in slide-in fade-in">
      <div className="bg-white/15 backdrop-blur-xl rounded-xl shadow-2xl border border-white/20 p-4 min-w-[300px]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {getIcon()}
            <div>
              <div className="text-white font-bold">CSV导入完成</div>
              <div className="text-gray-400 text-xs mt-0.5">共处理 {total} 条记录</div>
            </div>
          </div>
          <button
            onClick={() => setImportResult(null, false)}
            className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/10">
          <div className="text-center p-2 bg-green-500/15 rounded-lg">
            <div className="text-green-400 font-bold text-xl">{success}</div>
            <div className="text-green-400/70 text-xs">成功</div>
          </div>
          <div className="text-center p-2 bg-yellow-500/15 rounded-lg">
            <div className="text-yellow-400 font-bold text-xl">{skipped}</div>
            <div className="text-yellow-400/70 text-xs">跳过</div>
          </div>
          <div className="text-center p-2 bg-red-500/15 rounded-lg">
            <div className="text-red-400 font-bold text-xl">{errors}</div>
            <div className="text-red-400/70 text-xs">错误</div>
          </div>
        </div>

        {(skipped > 0 || errors > 0) && (
          <div className="mt-3 p-2 bg-white/5 rounded text-xs text-gray-400">
            <p>跳过原因：格式错误、货位不存在、货位重复、数量≤0等</p>
          </div>
        )}
      </div>
    </div>
  );
}
