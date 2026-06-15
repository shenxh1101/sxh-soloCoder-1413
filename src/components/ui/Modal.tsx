import { X, Package, ArrowUpFromLine, ClipboardList, Download, Search, Filter, Minus, Plus, ArrowDownToLine } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { StorageSlot, SlotDetailRecord } from '../../types';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  width?: string;
}

function Modal({ isOpen, onClose, title, icon, children, width = 'max-w-md' }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={`relative bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 w-full mx-4 transform transition-all duration-300 animate-in fade-in zoom-in-95 ${width}`}>
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
  const addInboundTask = useStore(state => state.addInboundTask);
  const taskQueue = useStore(state => state.taskQueue);

  const [goodsName, setGoodsName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const onClose = () => closeModal('inbound');

  useEffect(() => {
    if (isOpen) {
      setGoodsName('');
      setQuantity(1);
      setIsProcessing(false);
    }
  }, [isOpen]);

  const pendingCount = taskQueue.filter(t => t.status === 'pending' || t.status === 'running').length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !goodsName.trim() || quantity <= 0) return;
    setIsProcessing(true);
    addInboundTask(selectedSlot.layer, selectedSlot.position, goodsName.trim(), quantity);
    setTimeout(() => {
      setIsProcessing(false);
      onClose();
    }, 300);
  };

  if (!selectedSlot) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="货物入库"
      icon={<ArrowDownToLine className="w-6 h-6 text-green-400" />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white/5 rounded-lg p-4 mb-4 border border-green-500/30">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-400">目标货位</div>
            {pendingCount > 0 && (
              <div className="text-xs text-yellow-400 flex items-center gap-1">
                <Package className="w-3 h-3" />
                队列前还有 {pendingCount} 个任务
              </div>
            )}
          </div>
          <div className="text-white font-bold text-lg flex items-center gap-2">
            <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-sm">
              {selectedSlot.id}
            </span>
          </div>
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
            >
              <Minus className="w-5 h-5" />
            </button>
            <input
              type="number"
              value={quantity}
              onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              className="flex-1 px-4 py-3 text-center text-xl font-bold bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              required
            />
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex gap-2 mt-2">
            {[10, 50, 100].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => setQuantity(num)}
                className="flex-1 py-1 text-xs bg-white/5 hover:bg-white/10 text-gray-300 rounded transition-all"
              >
                +{num}
              </button>
            ))}
          </div>
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
            {isProcessing ? '加入队列中...' : '加入入库队列'}
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
  const addOutboundTask = useStore(state => state.addOutboundTask);

  const [selectedSlot, setSelectedSlot] = useState<StorageSlot | null>(null);
  const [outboundQuantity, setOutboundQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [taskQuantities, setTaskQuantities] = useState<Record<string, number>>({});

  const onClose = () => closeModal('outbound');

  useEffect(() => {
    if (isOpen) {
      setSelectedSlot(null);
      setOutboundQuantity(1);
      setIsProcessing(false);
      setHasSearched(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedSlot) {
      setOutboundQuantity(Math.min(outboundQuantity, selectedSlot.quantity));
      setTaskQuantities(prev => ({
        ...prev,
        [selectedSlot.id]: Math.min(
          prev[selectedSlot.id] || 1,
          selectedSlot.quantity
        ),
      }));
    }
  }, [selectedSlot]);

  const handleSearch = () => {
    if (!outboundGoodsName.trim()) return;
    findGoods(outboundGoodsName.trim());
    setHasSearched(true);
  };

  const handleSingleOutbound = () => {
    if (!selectedSlot) return;
    const qty = taskQuantities[selectedSlot.id] || 1;
    setIsProcessing(true);
    addOutboundTask(selectedSlot.layer, selectedSlot.position, qty);
    setTimeout(() => {
      setIsProcessing(false);
      setSelectedSlot(null);
    }, 300);
  };

  const handleBatchOutbound = () => {
    setIsProcessing(true);
    foundSlots.forEach(slot => {
      const qty = taskQuantities[slot.id] || slot.quantity;
      addOutboundTask(slot.layer, slot.position, qty);
    });
    setTimeout(() => {
      setIsProcessing(false);
      onClose();
    }, 300);
  };

  const updateSlotQty = (slotId: string, qty: number) => {
    const slot = foundSlots.find(s => s.id === slotId);
    if (!slot) return;
    const validQty = Math.max(1, Math.min(qty, slot.quantity));
    setTaskQuantities(prev => ({ ...prev, [slotId]: validQty }));
    if (selectedSlot?.id === slotId) {
      setOutboundQuantity(validQty);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="货物出库"
      icon={<ArrowUpFromLine className="w-6 h-6 text-orange-400" />}
      width="max-w-xl"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            货物名称
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={outboundGoodsName}
                onChange={e => setOutboundGoodsName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="请输入货物名称搜索"
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                autoFocus
              />
            </div>
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
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-400">
                找到 <span className="text-white font-bold">{foundSlots.length}</span> 个货位
                {foundSlots.length > 0 && (
                  <span className="ml-2">
                    共 <span className="text-orange-400 font-bold">{foundSlots.reduce((s, x) => s + x.quantity, 0)}</span> 件
                  </span>
                )}
              </div>
              {foundSlots.length > 1 && (
                <button
                  onClick={handleBatchOutbound}
                  disabled={isProcessing}
                  className="text-xs px-3 py-1 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded transition-all"
                >
                  全部出库
                </button>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 rounded-lg border border-white/10">
              {foundSlots.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>未找到匹配的货物</p>
                </div>
              ) : (
                foundSlots.map(slot => {
                  const qty = taskQuantities[slot.id] || slot.quantity;
                  const isSlotSelected = selectedSlot?.id === slot.id;
                  return (
                    <div
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-3 cursor-pointer transition-all border-b border-white/5 last:border-0 ${
                        isSlotSelected ? 'bg-orange-500/10' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all`}
                            style={{
                              borderColor: isSlotSelected ? '#f97316' : 'rgba(255,255,255,0.3)',
                              backgroundColor: isSlotSelected ? '#f97316' : 'transparent',
                            }}
                          >
                            {isSlotSelected && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </div>
                          <div>
                            <div className="text-white font-medium">{slot.id}</div>
                            <div className="text-gray-500 text-xs">
                              第{slot.layer}层 · 第{slot.position}号
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-orange-400 font-bold">
                            {slot.goodsName}
                          </div>
                          <div className="text-gray-400 text-xs">库存 {slot.quantity} 件</div>
                        </div>
                      </div>

                      {isSlotSelected && (
                        <div className="mt-3 pt-3 border-t border-white/10 pl-7">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-gray-400">出库数量:</span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={e => { e.stopPropagation(); updateSlotQty(slot.id, qty - 1); }}
                                className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded transition-all"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <input
                                type="number"
                                value={qty}
                                onClick={e => e.stopPropagation()}
                                onChange={e => { e.stopPropagation(); updateSlotQty(slot.id, parseInt(e.target.value) || 1); }}
                                className="w-16 px-2 py-1 text-center text-sm font-bold bg-white/10 border border-white/20 rounded text-white"
                                min={1}
                                max={slot.quantity}
                              />
                              <button
                                onClick={e => { e.stopPropagation(); updateSlotQty(slot.id, qty + 1); }}
                                className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded transition-all"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              <button
                                onClick={e => { e.stopPropagation(); updateSlotQty(slot.id, slot.quantity); }}
                                className="ml-2 px-2 py-1 text-xs bg-white/5 hover:bg-white/10 text-gray-300 rounded transition-all"
                              >
                                全部
                              </button>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={e => { e.stopPropagation(); }}
                              className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded text-sm transition-all"
                            >
                              仅此货位
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); handleSingleOutbound(); }}
                              disabled={isProcessing}
                              className="flex-1 px-3 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white rounded text-sm font-medium transition-all"
                            >
                              {isProcessing ? '处理中...' : '加入出库队列'}
                            </button>
                          </div>
                        </div>
                      )}

                      {!isSlotSelected && slot.quantity > 1 && (
                        <div className="pl-7 mt-2 text-xs text-gray-500">
                          点击选择以调整出库数量
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-white/10">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all"
          >
            关闭
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function InventoryModal() {
  const isOpen = useStore(state => state.modals.inventory);
  const closeModal = useStore(state => state.closeModal);
  const exportCSV = useStore(state => state.exportCSV);
  const setHighlightedSlotId = useStore(state => state.setHighlightedSlotId);
  const onClose = () => closeModal('inventory');

  const [filterName, setFilterName] = useState('');
  const [filterLayer, setFilterLayer] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'layer' | 'quantity'>('layer');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const records = useMemo<SlotDetailRecord[]>(() => {
    return useStore.getState().getSlotDetailList();
  }, [isOpen]);

  const filteredRecords = useMemo(() => {
    let result = [...records];

    if (filterName.trim()) {
      const keyword = filterName.trim().toLowerCase();
      result = result.filter(r => r.goodsName.toLowerCase().includes(keyword));
    }

    if (filterLayer) {
      result = result.filter(r => r.layer === parseInt(filterLayer));
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'name':
          cmp = a.goodsName.localeCompare(b.goodsName, 'zh');
          break;
        case 'layer':
          cmp = a.layer - b.layer || a.position - b.position;
          break;
        case 'quantity':
          cmp = a.quantity - b.quantity;
          break;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [records, filterName, filterLayer, sortBy, sortOrder]);

  const summary = useMemo(() => {
    const totalQty = filteredRecords.reduce((s, r) => s + r.quantity, 0);
    const nameSet = new Set(filteredRecords.map(r => r.goodsName));
    return {
      count: filteredRecords.length,
      totalQty,
      types: nameSet.size,
    };
  }, [filteredRecords]);

  const handleExport = () => {
    const csv = exportCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inventory_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: typeof sortBy }) => {
    if (sortBy !== field) return <Filter className="w-3 h-3 opacity-30" />;
    return (
      <span className="text-blue-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
    );
  };

  const layerOptions = Array.from({ length: 5 }, (_, i) => (i + 1).toString());

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="库存盘点 - 货位明细"
      icon={<ClipboardList className="w-6 h-6 text-blue-400" />}
      width="max-w-4xl"
    >
      <div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-500/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-400">{summary.count}</div>
            <div className="text-xs text-gray-400">占用货位</div>
          </div>
          <div className="bg-orange-500/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-orange-400">{summary.types}</div>
            <div className="text-xs text-gray-400">货物种类</div>
          </div>
          <div className="bg-green-500/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-400">{summary.totalQty}</div>
            <div className="text-xs text-gray-400">总件数</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={filterName}
              onChange={e => setFilterName(e.target.value)}
              placeholder="搜索货物名称..."
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <select
            value={filterLayer}
            onChange={e => setFilterLayer(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="" className="bg-gray-800">全部层</option>
            {layerOptions.map(layer => (
              <option key={layer} value={layer} className="bg-gray-800">
                第 {layer} 层
              </option>
            ))}
          </select>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-all"
          >
            <Download className="w-4 h-4" />
            导出CSV
          </button>
        </div>

        <div className="max-h-[420px] overflow-y-auto rounded-lg border border-white/10">
          <table className="w-full">
            <thead className="bg-white/5 sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                <th
                  onClick={() => toggleSort('name')}
                  className="px-4 py-3 text-left text-sm font-medium text-gray-300 cursor-pointer hover:bg-white/5"
                >
                  <div className="flex items-center gap-1">
                    货物名称 <SortIcon field="name" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('layer')}
                  className="px-4 py-3 text-center text-sm font-medium text-gray-300 cursor-pointer hover:bg-white/5"
                >
                  <div className="flex items-center justify-center gap-1">
                    层号/货位号 <SortIcon field="layer" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('quantity')}
                  className="px-4 py-3 text-right text-sm font-medium text-gray-300 cursor-pointer hover:bg-white/5"
                >
                  <div className="flex items-center justify-end gap-1">
                    当前数量 <SortIcon field="quantity" />
                  </div>
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-300 w-20">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center text-gray-500">
                      <Package className="w-12 h-12 mb-2 opacity-50" />
                      <p>暂无匹配的库存数据</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map(record => (
                  <tr
                    key={record.id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center">
                          <Package className="w-4 h-4 text-green-400" />
                        </div>
                        <span className="text-white font-medium">{record.goodsName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-sm font-mono">
                          L{record.layer}
                        </span>
                        <span className="text-gray-400">/</span>
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-sm font-mono">
                          P{record.position}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-block min-w-[60px] px-3 py-1 rounded text-right font-bold ${
                          record.quantity > 200
                            ? 'bg-green-500/30 text-green-400'
                            : record.quantity > 100
                            ? 'bg-green-500/20 text-green-400'
                            : record.quantity > 50
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-gray-500/20 text-gray-300'
                        }`}
                      >
                        {record.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setHighlightedSlotId(record.id);
                          setTimeout(() => onClose(), 100);
                        }}
                        className="px-3 py-1 text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded transition-all"
                      >
                        定位
                      </button>
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
