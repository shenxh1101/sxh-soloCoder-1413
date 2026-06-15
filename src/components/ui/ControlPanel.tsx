import { useRef } from 'react';
import {
  Warehouse,
  ArrowDownToLine,
  ArrowUpFromLine,
  ClipboardList,
  Upload,
  Download,
  Thermometer,
  Bot,
  Hand,
  Layers,
} from 'lucide-react';
import { useStore } from '../../store/useStore';

export function ControlPanel() {
  const stacker = useStore(state => state.stacker);
  const showHeatmap = useStore(state => state.showHeatmap);
  const toggleHeatmap = useStore(state => state.toggleHeatmap);
  const setStackerMode = useStore(state => state.setStackerMode);
  const openModal = useStore(state => state.openModal);
  const importCSV = useStore(state => state.importCSV);
  const exportCSV = useStore(state => state.exportCSV);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!window.confirm('导入CSV将清空当前所有库存并重建，是否继续？\n\n（本操作不可撤销，建议先导出备份）')) {
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        importCSV(content);
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExport = () => {
    const csv = exportCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inventory_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl px-4 py-3 shadow-2xl border border-white/20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-white">
            <Warehouse className="w-6 h-6 text-orange-400" />
            <span className="font-bold text-lg tracking-wider">自动化立体仓库</span>
          </div>

          <div className="w-px h-8 bg-white/30" />

          <button
            onClick={() => openModal('outbound')}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <ArrowUpFromLine className="w-4 h-4" />
            <span className="text-sm font-medium">出库</span>
          </button>

          <button
            onClick={() => openModal('waveOutbound')}
            className="flex items-center gap-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <Layers className="w-4 h-4" />
            <span className="text-sm font-medium">波次出库</span>
          </button>

          <button
            onClick={() => openModal('inventory')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <ClipboardList className="w-4 h-4" />
            <span className="text-sm font-medium">盘点</span>
          </button>

          <div className="w-px h-8 bg-white/30" />

          <button
            onClick={toggleHeatmap}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 ${
              showHeatmap
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
          >
            <Thermometer className="w-4 h-4" />
            <span className="text-sm font-medium">热力图</span>
          </button>

          <div className="w-px h-8 bg-white/30" />

          <div className="flex rounded-lg overflow-hidden">
            <button
              onClick={() => setStackerMode('auto')}
              className={`flex items-center gap-2 px-4 py-2 transition-all duration-200 ${
                stacker.mode === 'auto'
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span className="text-sm font-medium">自动</span>
            </button>
            <button
              onClick={() => setStackerMode('manual')}
              className={`flex items-center gap-2 px-4 py-2 transition-all duration-200 ${
                stacker.mode === 'manual'
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
            >
              <Hand className="w-4 h-4" />
              <span className="text-sm font-medium">手动</span>
            </button>
          </div>

          <div className="w-px h-8 bg-white/30" />

          <button
            onClick={handleImportClick}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span className="text-sm font-medium">导入</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">导出</span>
          </button>
        </div>
      </div>
    </div>
  );
}
