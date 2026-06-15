import { create } from 'zustand';
import {
  AppState,
  AppActions,
  StorageSlot,
  StackerState,
  OperationLog,
  InventoryRecord,
  SLOT_CONFIG,
  STACKER_CONFIG,
} from '../types';

const generateId = (): string => Math.random().toString(36).substring(2, 11);

const createInitialSlots = (): StorageSlot[] => {
  const slots: StorageSlot[] = [];
  const { LAYERS, POSITIONS, SLOT_WIDTH, SLOT_HEIGHT, SLOT_DEPTH, SLOT_GAP, SHELF_X_START, SHELF_Z_START } = SLOT_CONFIG;

  for (let layer = 1; layer <= LAYERS; layer++) {
    for (let position = 1; position <= POSITIONS; position++) {
      const x = SHELF_X_START + (position - 1) * (SLOT_WIDTH + SLOT_GAP) + SLOT_WIDTH / 2;
      const y = (layer - 1) * (SLOT_HEIGHT + SLOT_GAP) + SLOT_HEIGHT / 2;
      const z = SHELF_Z_START;

      slots.push({
        id: `L${layer}-P${position}`,
        layer,
        position,
        isOccupied: false,
        goodsName: '',
        quantity: 0,
        x,
        y,
        z,
      });
    }
  }
  return slots;
};

const initialStacker: StackerState = {
  x: STACKER_CONFIG.HOME_X,
  y: STACKER_CONFIG.HOME_Y,
  z: STACKER_CONFIG.HOME_Z,
  isBusy: false,
  mode: 'auto',
  hasGoods: false,
  currentGoods: null,
};

export const useStore = create<AppState & AppActions>((set, get) => ({
  slots: [],
  stacker: initialStacker,
  logs: [],
  showHeatmap: false,
  selectedSlot: null,
  modals: {
    inbound: false,
    outbound: false,
    inventory: false,
  },
  outboundGoodsName: '',
  foundSlots: [],

  initSlots: () => {
    const saved = localStorage.getItem('warehouse-slots');
    if (saved) {
      try {
        const slots = JSON.parse(saved);
        set({ slots });
        return;
      } catch (e) {
        console.error('Failed to load slots from storage', e);
      }
    }
    set({ slots: createInitialSlots() });
  },

  addGoods: (layer: number, position: number, name: string, quantity: number): boolean => {
    const { slots } = get();
    const slotIndex = slots.findIndex(s => s.layer === layer && s.position === position);
    if (slotIndex === -1 || slots[slotIndex].isOccupied) return false;

    const newSlots = [...slots];
    newSlots[slotIndex] = {
      ...newSlots[slotIndex],
      isOccupied: true,
      goodsName: name,
      quantity,
    };

    set({ slots: newSlots });
    get().addLog('inbound', `入库: ${name} x${quantity} -> ${newSlots[slotIndex].id}`);
    get().saveToStorage();
    return true;
  },

  removeGoods: (layer: number, position: number): boolean => {
    const { slots } = get();
    const slotIndex = slots.findIndex(s => s.layer === layer && s.position === position);
    if (slotIndex === -1 || !slots[slotIndex].isOccupied) return false;

    const slot = slots[slotIndex];
    const newSlots = [...slots];
    newSlots[slotIndex] = {
      ...newSlots[slotIndex],
      isOccupied: false,
      goodsName: '',
      quantity: 0,
    };

    set({ slots: newSlots });
    get().addLog('outbound', `出库: ${slot.goodsName} x${slot.quantity} <- ${slot.id}`);
    get().saveToStorage();
    return true;
  },

  findGoods: (name: string): StorageSlot[] => {
    const { slots } = get();
    const found = slots.filter(s => s.isOccupied && s.goodsName.toLowerCase().includes(name.toLowerCase()));
    set({ foundSlots: found });
    return found;
  },

  getInventoryList: (): InventoryRecord[] => {
    const { slots } = get();
    const occupiedSlots = slots.filter(s => s.isOccupied);
    const inventoryMap = new Map<string, { total: number; locations: string[] }>();

    occupiedSlots.forEach(slot => {
      const existing = inventoryMap.get(slot.goodsName);
      if (existing) {
        existing.total += slot.quantity;
        existing.locations.push(slot.id);
      } else {
        inventoryMap.set(slot.goodsName, {
          total: slot.quantity,
          locations: [slot.id],
        });
      }
    });

    const records: InventoryRecord[] = [];
    inventoryMap.forEach((value, key) => {
      records.push({
        goodsName: key,
        totalQuantity: value.total,
        locations: value.locations,
      });
    });

    get().addLog('check', `盘点完成，共 ${records.length} 种货物，${occupiedSlots.length} 个货位`);
    return records;
  },

  setStackerPosition: (x: number, y: number, z: number) => {
    set(state => ({
      stacker: { ...state.stacker, x, y, z },
    }));
  },

  setStackerBusy: (busy: boolean) => {
    set(state => ({
      stacker: { ...state.stacker, isBusy: busy },
    }));
  },

  setStackerMode: (mode: 'auto' | 'manual') => {
    set(state => ({
      stacker: { ...state.stacker, mode },
    }));
    get().addLog(mode === 'auto' ? 'inbound' : 'check', `切换为${mode === 'auto' ? '自动' : '手动'}模式`);
  },

  setStackerHasGoods: (hasGoods: boolean, goods?: { name: string; quantity: number } | null) => {
    set(state => ({
      stacker: {
        ...state.stacker,
        hasGoods,
        currentGoods: hasGoods && goods ? goods : null,
      },
    }));
  },

  moveStackerManual: (direction: 'up' | 'down' | 'left' | 'right') => {
    const { stacker } = get();
    if (stacker.mode !== 'manual' || stacker.isBusy) return;

    const step = 1;
    let { x, y } = stacker;

    switch (direction) {
      case 'up':
        y = Math.min(y + step, (SLOT_CONFIG.LAYERS - 1) * (SLOT_CONFIG.SLOT_HEIGHT + SLOT_CONFIG.SLOT_GAP) + SLOT_CONFIG.SLOT_HEIGHT / 2);
        break;
      case 'down':
        y = Math.max(y - step, 0.5);
        break;
      case 'left':
        x = Math.max(x - step, SLOT_CONFIG.SHELF_X_START - 2);
        break;
      case 'right':
        x = Math.min(x + step, SLOT_CONFIG.SHELF_X_START + SLOT_CONFIG.POSITIONS * (SLOT_CONFIG.SLOT_WIDTH + SLOT_CONFIG.SLOT_GAP) + 2);
        break;
    }

    set(state => ({
      stacker: { ...state.stacker, x, y },
    }));
  },

  toggleHeatmap: () => {
    set(state => ({ showHeatmap: !state.showHeatmap }));
  },

  setSelectedSlot: (slot: StorageSlot | null) => {
    set({ selectedSlot: slot });
  },

  openModal: (modal: 'inbound' | 'outbound' | 'inventory') => {
    set(state => ({
      modals: { ...state.modals, [modal]: true },
    }));
  },

  closeModal: (modal: 'inbound' | 'outbound' | 'inventory') => {
    set(state => ({
      modals: { ...state.modals, [modal]: false },
    }));
    if (modal === 'outbound') {
      set({ outboundGoodsName: '', foundSlots: [] });
    }
    if (modal === 'inbound') {
      set({ selectedSlot: null });
    }
  },

  setOutboundGoodsName: (name: string) => {
    set({ outboundGoodsName: name });
  },

  addLog: (type: OperationLog['type'], message: string) => {
    const log: OperationLog = {
      id: generateId(),
      timestamp: Date.now(),
      type,
      message,
    };
    set(state => ({
      logs: [log, ...state.logs].slice(0, 100),
    }));
  },

  importCSV: (csvContent: string): boolean => {
    try {
      const lines = csvContent.trim().split('\n');
      if (lines.length < 2) return false;

      const headers = lines[0].split(',').map(h => h.trim());
      const layerIdx = headers.indexOf('layer');
      const positionIdx = headers.indexOf('position');
      const goodsNameIdx = headers.indexOf('goodsName');
      const quantityIdx = headers.indexOf('quantity');

      if (layerIdx === -1 || positionIdx === -1 || goodsNameIdx === -1 || quantityIdx === -1) {
        return false;
      }

      const { slots } = get();
      const newSlots = [...slots];
      let count = 0;

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length < 4) continue;

        const layer = parseInt(values[layerIdx]);
        const position = parseInt(values[positionIdx]);
        const goodsName = values[goodsNameIdx];
        const quantity = parseInt(values[quantityIdx]);

        if (isNaN(layer) || isNaN(position) || isNaN(quantity) || !goodsName) continue;

        const slotIndex = newSlots.findIndex(s => s.layer === layer && s.position === position);
        if (slotIndex !== -1) {
          newSlots[slotIndex] = {
            ...newSlots[slotIndex],
            isOccupied: true,
            goodsName,
            quantity,
          };
          count++;
        }
      }

      set({ slots: newSlots });
      get().addLog('import', `CSV导入成功，共导入 ${count} 条记录`);
      get().saveToStorage();
      return true;
    } catch (e) {
      console.error('CSV import failed', e);
      return false;
    }
  },

  exportCSV: (): string => {
    const { slots } = get();
    const occupiedSlots = slots.filter(s => s.isOccupied);

    const headers = ['layer', 'position', 'goodsName', 'quantity'];
    const rows = occupiedSlots.map(s => [s.layer, s.position, s.goodsName, s.quantity]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    get().addLog('export', `CSV导出成功，共 ${rows.length} 条记录`);
    return csv;
  },

  saveToStorage: () => {
    const { slots } = get();
    localStorage.setItem('warehouse-slots', JSON.stringify(slots));
  },

  loadFromStorage: () => {
    const saved = localStorage.getItem('warehouse-slots');
    if (saved) {
      try {
        const slots = JSON.parse(saved);
        set({ slots });
      } catch (e) {
        console.error('Failed to load from storage', e);
      }
    }
  },
}));
