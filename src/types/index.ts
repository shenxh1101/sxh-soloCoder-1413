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

export interface SlotDetailRecord {
  id: string;
  layer: number;
  position: number;
  goodsName: string;
  quantity: number;
}

export type TaskType = 'inbound' | 'outbound';
export type TaskStatus = 'pending' | 'running' | 'completed' | 'cancelled';
export type TaskPriority = 'normal' | 'urgent';

export interface BaseTask {
  id: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  slotId: string;
  layer: number;
  position: number;
}

export interface InboundTask extends BaseTask {
  type: 'inbound';
  goodsName: string;
  quantity: number;
}

export interface OutboundTask extends BaseTask {
  type: 'outbound';
  goodsName: string;
  quantity: number;
  totalQuantity: number;
}

export type WarehouseTask = InboundTask | OutboundTask;

export type LogType = 'inbound' | 'outbound' | 'import' | 'export' | 'check' | 'task' | 'mode';

export interface OperationLog {
  id: string;
  timestamp: number;
  type: LogType;
  message: string;
  slotId?: string;
  taskId?: string;
  details?: {
    layer?: number;
    position?: number;
    goodsName?: string;
    quantity?: number;
    taskType?: TaskType;
  };
}

export interface ImportResult {
  success: number;
  skipped: number;
  errors: number;
}

export interface WaveOutboundItem {
  goodsName: string;
  totalAvailable: number;
  requestedQuantity: number;
  slots: { slotId: string; layer: number; position: number; availableQty: number; allocatedQty: number }[];
}

export interface WaveOutboundResult {
  waveId: string;
  items: WaveOutboundItem[];
  taskIds: string[];
  completedAt?: number;
  results: { slotId: string; goodsName: string; actualQty: number; status: 'success' | 'failed' }[];
}

export interface LogFilter {
  types: LogType[];
  startTime?: number;
  endTime?: number;
}

export interface AppState {
  slots: StorageSlot[];
  stacker: StackerState;
  logs: OperationLog[];
  taskQueue: WarehouseTask[];
  isQueuePaused: boolean;
  showHeatmap: boolean;
  selectedSlot: StorageSlot | null;
  highlightedSlotId: string | null;
  modals: {
    inbound: boolean;
    outbound: boolean;
    inventory: boolean;
    waveOutbound: boolean;
  };
  outboundGoodsName: string;
  foundSlots: StorageSlot[];
  importResult: ImportResult | null;
  showImportResult: boolean;
  logFilter: LogFilter;
  waveOutboundResult: WaveOutboundResult | null;
}

export interface AppActions {
  initSlots: () => void;
  addGoods: (layer: number, position: number, name: string, quantity: number) => boolean;
  removeGoodsPartial: (layer: number, position: number, quantity: number) => boolean;
  removeGoods: (layer: number, position: number) => boolean;
  findGoods: (name: string) => StorageSlot[];
  getInventoryList: () => InventoryRecord[];
  getSlotDetailList: () => SlotDetailRecord[];
  setStackerPosition: (x: number, y: number, z: number) => void;
  setStackerBusy: (busy: boolean) => void;
  setStackerMode: (mode: 'auto' | 'manual') => void;
  setStackerHasGoods: (hasGoods: boolean, goods?: { name: string; quantity: number } | null) => void;
  moveStackerManual: (direction: 'up' | 'down' | 'left' | 'right') => void;
  toggleHeatmap: () => void;
  setSelectedSlot: (slot: StorageSlot | null) => void;
  setHighlightedSlotId: (slotId: string | null) => void;
  openModal: (modal: 'inbound' | 'outbound' | 'inventory' | 'waveOutbound') => void;
  closeModal: (modal: 'inbound' | 'outbound' | 'inventory' | 'waveOutbound') => void;
  setOutboundGoodsName: (name: string) => void;
  addLog: (log: Omit<OperationLog, 'id' | 'timestamp'>) => void;
  addInboundTask: (layer: number, position: number, name: string, quantity: number, priority?: TaskPriority) => string;
  addOutboundTask: (layer: number, position: number, quantity: number, priority?: TaskPriority) => string;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  processNextTask: () => void;
  cancelTask: (taskId: string) => void;
  clearCompletedTasks: () => void;
  pauseQueue: () => void;
  resumeQueue: () => void;
  moveTaskToFront: (taskId: string) => void;
  importCSV: (data: string) => ImportResult;
  exportCSV: () => string;
  setImportResult: (result: ImportResult | null, show: boolean) => void;
  saveToStorage: () => void;
  loadFromStorage: () => void;
  locateLog: (log: OperationLog) => void;
  setLogFilter: (filter: Partial<LogFilter>) => void;
  createWaveOutbound: (items: { goodsName: string; quantity: number }[]) => WaveOutboundResult;
  executeWaveOutbound: (waveId: string, priority?: TaskPriority) => string[];
  setWaveOutboundResult: (result: WaveOutboundResult | null) => void;
  recordWaveResult: (taskId: string, actualQty: number, success: boolean) => void;
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

export const TASK_STORAGE_KEY = 'warehouse-tasks';
export const LOGS_STORAGE_KEY = 'warehouse-logs';
