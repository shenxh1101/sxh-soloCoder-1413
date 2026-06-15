export interface StorageSlot {
  id: string;
  layer: number;
  position: number;
  isOccupied: boolean;
  goodsName: string;
  quantity: number;
  x: number;
  y: number;
  z: number;
}

export interface StackerState {
  x: number;
  y: number;
  z: number;
  isBusy: boolean;
  mode: 'auto' | 'manual';
  hasGoods: boolean;
  currentGoods: {
    name: string;
    quantity: number;
  } | null;
}

export interface InventoryRecord {
  goodsName: string;
  totalQuantity: number;
  locations: string[];
}

export interface OperationLog {
  id: string;
  timestamp: number;
  type: 'inbound' | 'outbound' | 'import' | 'export' | 'check';
  message: string;
}

export interface AppState {
  slots: StorageSlot[];
  stacker: StackerState;
  logs: OperationLog[];
  showHeatmap: boolean;
  selectedSlot: StorageSlot | null;
  modals: {
    inbound: boolean;
    outbound: boolean;
    inventory: boolean;
  };
  outboundGoodsName: string;
  foundSlots: StorageSlot[];
}

export interface AppActions {
  initSlots: () => void;
  addGoods: (layer: number, position: number, name: string, quantity: number) => boolean;
  removeGoods: (layer: number, position: number) => boolean;
  findGoods: (name: string) => StorageSlot[];
  getInventoryList: () => InventoryRecord[];
  setStackerPosition: (x: number, y: number, z: number) => void;
  setStackerBusy: (busy: boolean) => void;
  setStackerMode: (mode: 'auto' | 'manual') => void;
  setStackerHasGoods: (hasGoods: boolean, goods?: { name: string; quantity: number } | null) => void;
  moveStackerManual: (direction: 'up' | 'down' | 'left' | 'right') => void;
  toggleHeatmap: () => void;
  setSelectedSlot: (slot: StorageSlot | null) => void;
  openModal: (modal: 'inbound' | 'outbound' | 'inventory') => void;
  closeModal: (modal: 'inbound' | 'outbound' | 'inventory') => void;
  setOutboundGoodsName: (name: string) => void;
  addLog: (type: OperationLog['type'], message: string) => void;
  importCSV: (data: string) => boolean;
  exportCSV: () => string;
  saveToStorage: () => void;
  loadFromStorage: () => void;
}

export const SLOT_CONFIG = {
  LAYERS: 5,
  POSITIONS: 10,
  SLOT_WIDTH: 1.8,
  SLOT_HEIGHT: 1.2,
  SLOT_DEPTH: 1.8,
  SLOT_GAP: 0.2,
  SHELF_X_START: -10,
  SHELF_Z_START: 0,
} as const;

export const STACKER_CONFIG = {
  HOME_X: -12,
  HOME_Y: 0.5,
  HOME_Z: 0,
  OUTPUT_X: 12,
  OUTPUT_Y: 0.5,
  OUTPUT_Z: 0,
  MOVE_SPEED: 8,
} as const;

export const HEATMAP_COLORS = [
  { max: 0, color: '#e0e0e0' },
  { max: 50, color: '#c8e6c9' },
  { max: 100, color: '#81c784' },
  { max: 200, color: '#4caf50' },
  { max: Infinity, color: '#2e7d32' },
];

export const getHeatmapColor = (quantity: number, showHeatmap: boolean): string => {
  if (!showHeatmap) {
    return quantity > 0 ? '#4caf50' : '#e0e0e0';
  }
  for (const level of HEATMAP_COLORS) {
    if (quantity <= level.max) {
      return level.color;
    }
  }
  return '#2e7d32';
};
