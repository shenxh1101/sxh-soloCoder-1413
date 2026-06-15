import { X, Package, ArrowUpFromLine, ClipboardList, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { StorageSlot, InventoryRecord } from '../../types';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function Modal({ isOpen, onClose, title, icon, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 w-full max-w-md mx-4 transform transition-all duration-300 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            {icon}
            <h2 className="text-xl font-bold text-white">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function InboundModal() {
  const isOpen = useStore(state => state.modals.inbound);
  const closeModal = useStore(state => state.closeModal);
  const selectedSlot = useStore(state => state.selectedSlot);
  const addGoods = useStore(state => state.addGoods);
  const setStackerBusy = useStore(state => state.setStackerBusy);
  const setStackerHasGoods = useStore(state => state.setStackerHasGoods);

  const onClose = () => closeModal('inbound');

  const [goodsName, setGoodsName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setGoodsName('');
      setQuantity(1);
      setIsProcessing(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !goodsName.trim() || quantity <= 0) return;

    setIsProcessing(true);
    setStackerBusy(true);

    const moveStackerTo = (window as unknown as { moveStackerTo?: (x: number, y: number, z: number) => Promise<void> }).moveStackerTo;

    if (moveStackerTo) {
      await moveStackerTo(selectedSlot.x - 2, selectedSlot.y, selectedSlot.z);
      setStackerHasGoods(true, { name: goodsName, quantity });

      await new Promise(resolve => setTimeout(resolve, 500));

      addGoods(selectedSlot.layer, selectedSlot.position, goodsName.trim(), quantity);
      setStackerHasGoods(false);

      await moveStackerTo(-12, 0.5, 0);
    }

    setStackerBusy(false);
    onClose();
  };

  if (!selectedSlot) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="货物入库"
      icon={<Package className="w-6 h-6 text-green-400" />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white/5 rounded-lg p-4 mb-4">
          <div className="text-sm text-gray-400 mb-2">目标货位</div>
          <div className="text-white font-bold text-lg">{selectedSlot.id}</div>
          <div className="text-gray-400 text-sm">
            第 {selectedSlot.layer} 层 · 第 {selectedSlot.position} 号
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            货物名称
          </label>
          <input
            type="text"
            value={goodsName}
            onChange={e => setGoodsName(e.target.value)}
            placeholder="请输入货物名称"
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            autoFocus
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            入库数量
          </label>
          <input
            type="number"
            value={quantity}
            onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            min="1"
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            required
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={isProcessing || !goodsName.trim()}
            className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all"
          >
            {isProcessing ? '入库中...' : '确认入库'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function OutboundModal() {
  const isOpen = useStore(state => state.modals.outbound);
  const closeModal = useStore(state => state.closeModal);
  const outboundGoodsName = useStore(state => state.outboundGoodsName);
  const setOutboundGoodsName = useStore(state => state.setOutboundGoodsName);
  const foundSlots = useStore(state => state.foundSlots);
  const findGoods = useStore(state => state.findGoods);
  const removeGoods = useStore(state => state.removeGoods);
  const setStackerBusy = useStore(state => state.setStackerBusy);
  const setStackerHasGoods = useStore(state => state.setStackerHasGoods);
  const STACKER_CONFIG = { OUTPUT_X: 12, OUTPUT_Y: 0.5, OUTPUT_Z: 0 };

  const onClose = () => closeModal('outbound');

  const [selectedSlot, setSelectedSlot] = useState<StorageSlot | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedSlot(null);
      setIsProcessing(false);
      setHasSearched(false);
    }
  }, [isOpen]);

  const handleSearch = () => {
    if (!outboundGoodsName.trim()) return;
    findGoods(outboundGoodsName.trim());
    setHasSearched(true);
  };

  const handleOutbound = async () => {
    if (!selectedSlot) return;

    setIsProcessing(true);
    setStackerBusy(true);

    const moveStackerTo = (window as unknown as { moveStackerTo?: (x: number, y: number, z: number) => Promise<void> }).moveStackerTo;

    if (moveStackerTo) {
      await moveStackerTo(selectedSlot.x - 2, selectedSlot.y, selectedSlot.z);

      setStackerHasGoods(true, { name: selectedSlot.goodsName, quantity: selectedSlot.quantity });
      removeGoods(selectedSlot.layer, selectedSlot.position);

      await new Promise(resolve => setTimeout(resolve, 500));

      await moveStackerTo(STACKER_CONFIG.OUTPUT_X, STACKER_CONFIG.OUTPUT_Y, STACKER_CONFIG.OUTPUT_Z);

      setStackerHasGoods(false);

      await moveStackerTo(-12, 0.5, 0);
    }

    setStackerBusy(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="货物出库"
      icon={<ArrowUpFromLine className="w-6 h-6 text-orange-400" />}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            货物名称
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={outboundGoodsName}
              onChange={e => setOutboundGoodsName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="请输入货物名称"
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              autoFocus
            />
            <button
              onClick={handleSearch}
              disabled={!outboundGoodsName.trim()}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all"
            >
              查找
            </button>
          </div>
        </div>

        {hasSearched && (
          <div>
            <div className="text-sm text-gray-400 mb-2">
              找到 {foundSlots.length} 个货位
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {foundSlots.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  未找到匹配的货物
                </div>
              ) : (
                foundSlots.map(slot => (
                  <div
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      selectedSlot?.id === slot.id
                        ? 'bg-orange-500/30 border border-orange-500'
                        : 'bg-white/5 hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-white font-medium">{slot.id}</span>
                      <span className="text-orange-400 text-sm">
                        {slot.goodsName} x{slot.quantity}
                      </span>
                    </div>
                    <div className="text-gray-400 text-xs mt-1">
                      第 {slot.layer} 层 · 第 {slot.position} 号
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all"
          >
            取消
          </button>
          <button
            onClick={handleOutbound}
            disabled={isProcessing || !selectedSlot}
            className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all"
          >
            {isProcessing ? '出库中...' : '确认出库'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function InventoryModal() {
  const isOpen = useStore(state => state.modals.inventory);
  const closeModal = useStore(state => state.closeModal);
  const getInventoryList = useStore(state => state.getInventoryList);
  const exportCSV = useStore(state => state.exportCSV);

  const onClose = () => closeModal('inventory');

  const [inventory, setInventory] = useState<InventoryRecord[]>([]);

  useEffect(() => {
    if (isOpen) {
      setInventory(useStore.getState().getInventoryList());
    }
  }, [isOpen]);

  const handleExport = () => {
    const csv = exportCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inventory_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="库存盘点"
      icon={<ClipboardList className="w-6 h-6 text-blue-400" />}
    >
      <div>
        <div className="flex justify-between items-center mb-4">
          <div className="text-gray-400 text-sm">
            共 {inventory.length} 种货物
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-all"
          >
            <Download className="w-4 h-4" />
            导出CSV
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto rounded-lg border border-white/10">
          <table className="w-full">
            <thead className="bg-white/5 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">货物名称</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">总数量</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">存放位置</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                    暂无库存数据
                  </td>
                </tr>
              ) : (
                inventory.map((item, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{item.goodsName}</td>
                    <td className="px-4 py-3 text-center text-orange-400 font-bold">
                      {item.totalQuantity}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 text-sm">
                      {item.locations.join(', ')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-all"
          >
            关闭
          </button>
        </div>
      </div>
    </Modal>
  );
}
