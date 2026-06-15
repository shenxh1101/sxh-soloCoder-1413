import { create } from 'zustand';
import {
  AppState,
  AppActions,
  StorageSlot,
  StackerState,
  OperationLog,
  InventoryRecord,
  SlotDetailRecord,
  WarehouseTask,
  InboundTask,
  OutboundTask,
  TaskStatus,
  TaskPriority,
  TaskExecutionPhase,
  ImportResult,
  WaveOutboundResult,
  SLOT_CONFIG,
  STACKER_CONFIG,
  TASK_STORAGE_KEY,
  LOGS_STORAGE_KEY,
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
  taskQueue: [],
  isQueuePaused: false,
  pauseRequested: false,
  showHeatmap: false,
  selectedSlot: null,
  highlightedSlotId: null,
  highlightedTaskId: null,
  modals: {
    inbound: false,
    outbound: false,
    inventory: false,
    waveOutbound: false,
  },
  outboundGoodsName: '',
  foundSlots: [],
  importResult: null,
  showImportResult: false,
  logFilter: { types: [] },
  waveOutboundResult: null,

  initSlots: () => {
    const savedSlots = localStorage.getItem('warehouse-slots');
    const savedLogs = localStorage.getItem(LOGS_STORAGE_KEY);
    const savedTasks = localStorage.getItem(TASK_STORAGE_KEY);

    if (savedSlots) {
      try {
        const slots = JSON.parse(savedSlots);
        set({ slots });
      } catch (e) {
        console.error('Failed to load slots from storage', e);
        set({ slots: createInitialSlots() });
      }
    } else {
      set({ slots: createInitialSlots() });
    }

    if (savedLogs) {
      try {
        const logs = JSON.parse(savedLogs);
        set({ logs });
      } catch (e) {
        console.error('Failed to load logs from storage', e);
      }
    }

    if (savedTasks) {
      try {
        const tasks = JSON.parse(savedTasks);
        const pendingTasks = tasks.map((t: WarehouseTask) => ({
          ...t,
          status: (t.status === 'running' ? 'pending' : t.status) as TaskStatus,
        }));
        set({ taskQueue: pendingTasks });
      } catch (e) {
        console.error('Failed to load tasks from storage', e);
      }
    }
  },

  addGoods: (layer: number, position: number, name: string, quantity: number): boolean => {
    const { slots } = get();
    const slotIndex = slots.findIndex(s => s.layer === layer && s.position === position);
    if (slotIndex === -1 || slots[slotIndex].isOccupied) return false;

    const newSlots = [...slots];
    const slotId = newSlots[slotIndex].id;
    newSlots[slotIndex] = {
      ...newSlots[slotIndex],
      isOccupied: true,
      goodsName: name,
      quantity,
    };

    set({ slots: newSlots });
    get().addLog({
      type: 'inbound',
      message: `入库: ${name} x${quantity} -> ${slotId}`,
      slotId,
      details: { layer, position, goodsName: name, quantity },
    });
    get().saveToStorage();
    return true;
  },

  removeGoodsPartial: (layer: number, position: number, quantity: number): boolean => {
    const { slots } = get();
    const slotIndex = slots.findIndex(s => s.layer === layer && s.position === position);
    if (slotIndex === -1 || !slots[slotIndex].isOccupied) return false;

    const slot = slots[slotIndex];
    if (quantity > slot.quantity) return false;

    const newSlots = [...slots];
    const remainingQuantity = slot.quantity - quantity;
    const isFullyRemoved = remainingQuantity === 0;

    newSlots[slotIndex] = {
      ...newSlots[slotIndex],
      isOccupied: !isFullyRemoved,
      goodsName: isFullyRemoved ? '' : slot.goodsName,
      quantity: remainingQuantity,
    };

    set({ slots: newSlots });
    get().addLog({
      type: 'outbound',
      message: isFullyRemoved
        ? `出库(全取): ${slot.goodsName} x${quantity} <- ${slot.id}`
        : `出库(部分): ${slot.goodsName} x${quantity} (剩余${remainingQuantity}) <- ${slot.id}`,
      slotId: slot.id,
      details: { layer, position, goodsName: slot.goodsName, quantity },
    });
    get().saveToStorage();
    return true;
  },

  removeGoods: (layer: number, position: number): boolean => {
    const { slots } = get();
    const slotIndex = slots.findIndex(s => s.layer === layer && s.position === position);
    if (slotIndex === -1 || !slots[slotIndex].isOccupied) return false;
    return get().removeGoodsPartial(layer, position, slots[slotIndex].quantity);
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

    get().addLog({
      type: 'check',
      message: `盘点完成，共 ${records.length} 种货物，${occupiedSlots.length} 个货位`,
    });
    return records;
  },

  getSlotDetailList: (): SlotDetailRecord[] => {
    const { slots } = get();
    return slots
      .filter(s => s.isOccupied)
      .map(s => ({
        id: s.id,
        layer: s.layer,
        position: s.position,
        goodsName: s.goodsName,
        quantity: s.quantity,
      }));
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
    get().addLog({
      type: 'mode',
      message: `切换为${mode === 'auto' ? '自动' : '手动'}模式`,
    });
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

  setHighlightedSlotId: (slotId: string | null) => {
    set({ highlightedSlotId: slotId });
    if (slotId) {
      setTimeout(() => set({ highlightedSlotId: null }), 3000);
    }
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

  addLog: (logData: Omit<OperationLog, 'id' | 'timestamp'>) => {
    const log: OperationLog = {
      id: generateId(),
      timestamp: Date.now(),
      ...logData,
    };
    set(state => {
      const newLogs = [log, ...state.logs].slice(0, 200);
      localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(newLogs));
      return { logs: newLogs };
    });
  },

  addInboundTask: (layer: number, position: number, name: string, quantity: number, priority: TaskPriority = 'normal'): string => {
    const taskId = generateId();
    const slotId = `L${layer}-P${position}`;
    const task: InboundTask = {
      id: taskId,
      type: 'inbound',
      status: 'pending',
      priority,
      createdAt: Date.now(),
      slotId,
      layer,
      position,
      goodsName: name,
      quantity,
    };

    set(state => {
      const pendingTasks = state.taskQueue.filter(t => t.status === 'pending');
      const otherTasks = state.taskQueue.filter(t => t.status !== 'pending');
      let newQueue: WarehouseTask[];
      
      if (priority === 'urgent') {
        const urgentTasks = pendingTasks.filter(t => t.priority === 'urgent');
        const normalTasks = pendingTasks.filter(t => t.priority === 'normal');
        newQueue = [...otherTasks, ...urgentTasks, task, ...normalTasks];
      } else {
        newQueue = [...state.taskQueue, task];
      }
      
      localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(newQueue));
      return { taskQueue: newQueue };
    });

    get().addLog({
      type: 'task',
      message: `${priority === 'urgent' ? '[紧急] ' : ''}入库任务已加入队列: ${name} x${quantity} -> ${slotId}`,
      taskId,
      slotId,
      details: { layer, position, goodsName: name, quantity, taskType: 'inbound' },
    });

    setTimeout(() => get().processNextTask(), 100);
    return taskId;
  },

  addOutboundTask: (layer: number, position: number, quantity: number, priority: TaskPriority = 'normal'): string => {
    const { slots } = get();
    const slot = slots.find(s => s.layer === layer && s.position === position);
    if (!slot || !slot.isOccupied) return '';

    const taskId = generateId();
    const actualQty = Math.min(quantity, slot.quantity);
    const task: OutboundTask = {
      id: taskId,
      type: 'outbound',
      status: 'pending',
      priority,
      createdAt: Date.now(),
      slotId: slot.id,
      layer,
      position,
      goodsName: slot.goodsName,
      quantity: actualQty,
      totalQuantity: slot.quantity,
    };

    set(state => {
      const pendingTasks = state.taskQueue.filter(t => t.status === 'pending');
      const otherTasks = state.taskQueue.filter(t => t.status !== 'pending');
      let newQueue: WarehouseTask[];
      
      if (priority === 'urgent') {
        const urgentTasks = pendingTasks.filter(t => t.priority === 'urgent');
        const normalTasks = pendingTasks.filter(t => t.priority === 'normal');
        newQueue = [...otherTasks, ...urgentTasks, task, ...normalTasks];
      } else {
        newQueue = [...state.taskQueue, task];
      }
      
      localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(newQueue));
      return { taskQueue: newQueue };
    });

    get().addLog({
      type: 'task',
      message: `${priority === 'urgent' ? '[紧急] ' : ''}出库任务已加入队列: ${slot.goodsName} x${actualQty} <- ${slot.id}`,
      taskId,
      slotId: slot.id,
      details: { layer, position, goodsName: slot.goodsName, quantity: actualQty, taskType: 'outbound' },
    });

    setTimeout(() => get().processNextTask(), 100);
    return taskId;
  },

  updateTaskStatus: (taskId: string, status: TaskStatus, phase?: TaskExecutionPhase) => {
    set(state => {
      const newQueue = state.taskQueue.map(t => {
        if (t.id === taskId) {
          const updated = { ...t, status } as WarehouseTask;
          if (status === 'running') updated.startedAt = Date.now();
          if (status === 'completed' || status === 'cancelled') updated.completedAt = Date.now();
          if (phase) updated.executionPhase = phase;
          if (status === 'paused' && phase) {
            updated.pausedAt = { phase, timestamp: Date.now() };
          }
          return updated;
        }
        return t;
      });
      localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(newQueue));
      return { taskQueue: newQueue };
    });
  },

  updateTaskExecutionPhase: (taskId: string, phase: TaskExecutionPhase) => {
    set(state => {
      const newQueue = state.taskQueue.map(t => {
        if (t.id === taskId) {
          return { ...t, executionPhase: phase } as WarehouseTask;
        }
        return t;
      });
      localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(newQueue));
      return { taskQueue: newQueue };
    });
  },

  setHighlightedTaskId: (taskId: string | null) => {
    set({ highlightedTaskId: taskId });
  },

  toggleLogExpanded: (logId: string) => {
    set(state => ({
      logs: state.logs.map(log =>
        log.id === logId ? { ...log, expanded: !log.expanded } : log
      ),
    }));
  },

  processNextTask: () => {
    const state = get();
    if (state.stacker.isBusy || state.stacker.mode !== 'auto' || state.isQueuePaused) return;

    const pendingTask = state.taskQueue.find(t => t.status === 'pending');
    if (!pendingTask) return;

    const moveStackerTo = (window as unknown as { moveStackerTo?: (x: number, y: number, z: number) => Promise<void> }).moveStackerTo;
    if (!moveStackerTo) return;

    get().updateTaskStatus(pendingTask.id, 'running');
    get().setStackerBusy(true);

    const executeTask = async () => {
      try {
        const targetSlot = state.slots.find(s => s.id === pendingTask.slotId);
        if (!targetSlot) {
          get().updateTaskStatus(pendingTask.id, 'cancelled');
          get().setStackerBusy(false);
          setTimeout(() => get().processNextTask(), 200);
          return;
        }

        if (pendingTask.type === 'inbound') {
          await moveStackerTo(targetSlot.x - 2, targetSlot.y, targetSlot.z);
          get().setStackerHasGoods(true, { name: pendingTask.goodsName, quantity: pendingTask.quantity });
          await new Promise(r => setTimeout(r, 400));
          get().addGoods(pendingTask.layer, pendingTask.position, pendingTask.goodsName, pendingTask.quantity);
          get().setStackerHasGoods(false);
          await new Promise(r => setTimeout(r, 300));
          await moveStackerTo(STACKER_CONFIG.HOME_X, STACKER_CONFIG.HOME_Y, STACKER_CONFIG.HOME_Z);
        } else {
          await moveStackerTo(targetSlot.x - 2, targetSlot.y, targetSlot.z);
          await new Promise(r => setTimeout(r, 300));
          const outboundQty = pendingTask.quantity;
          get().setStackerHasGoods(true, { name: pendingTask.goodsName, quantity: outboundQty });
          get().removeGoodsPartial(pendingTask.layer, pendingTask.position, outboundQty);
          await new Promise(r => setTimeout(r, 400));
          await moveStackerTo(STACKER_CONFIG.OUTPUT_X, STACKER_CONFIG.OUTPUT_Y, STACKER_CONFIG.OUTPUT_Z);
          await new Promise(r => setTimeout(r, 300));
          get().setStackerHasGoods(false);
          await new Promise(r => setTimeout(r, 300));
          await moveStackerTo(STACKER_CONFIG.HOME_X, STACKER_CONFIG.HOME_Y, STACKER_CONFIG.HOME_Z);
        }

        get().updateTaskStatus(pendingTask.id, 'completed');
        if (pendingTask.type === 'outbound') {
          get().recordWaveResult(pendingTask.id, pendingTask.quantity, true);
        }
      } catch (error) {
        console.error('Task execution failed:', error);
        get().updateTaskStatus(pendingTask.id, 'cancelled');
        if (pendingTask.type === 'outbound') {
          get().recordWaveResult(pendingTask.id, 0, false);
        }
      } finally {
        get().setStackerBusy(false);
        setTimeout(() => get().processNextTask(), 300);
      }
    };

    executeTask();
  },

  cancelTask: (taskId: string) => {
    const task = get().taskQueue.find(t => t.id === taskId);
    if (!task || task.status === 'running') return;

    get().updateTaskStatus(taskId, 'cancelled');
    get().addLog({
      type: 'task',
      message: `任务已取消: ${task.type === 'inbound' ? '入库' : '出库'} ${task.goodsName}`,
      taskId,
      slotId: task.slotId,
    });
  },

  clearCompletedTasks: () => {
    set(state => {
      const newQueue = state.taskQueue.filter(t => t.status === 'pending' || t.status === 'running');
      localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(newQueue));
      return { taskQueue: newQueue };
    });
  },

  pauseQueue: () => {
    set({ isQueuePaused: true });
    get().addLog({
      type: 'task',
      message: '作业队列已暂停',
    });
  },

  resumeQueue: () => {
    set({ isQueuePaused: false });
    get().addLog({
      type: 'task',
      message: '作业队列已恢复',
    });
    setTimeout(() => get().processNextTask(), 200);
  },

  moveTaskToFront: (taskId: string) => {
    set(state => {
      const task = state.taskQueue.find(t => t.id === taskId);
      if (!task || task.status !== 'pending') return state;
      
      const otherTasks = state.taskQueue.filter(t => t.id !== taskId);
      const runningTasks = otherTasks.filter(t => t.status === 'running');
      const pendingTasks = otherTasks.filter(t => t.status === 'pending');
      const completedTasks = otherTasks.filter(t => t.status === 'completed' || t.status === 'cancelled');
      
      const urgentTask = { ...task, priority: 'urgent' as TaskPriority };
      const newQueue = [...runningTasks, urgentTask, ...pendingTasks, ...completedTasks];
      localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(newQueue));
      return { taskQueue: newQueue };
    });
    
    const task = get().taskQueue.find(t => t.id === taskId);
    if (task) {
      get().addLog({
        type: 'task',
        message: `任务已提升优先级: ${task.goodsName}`,
        taskId,
        slotId: task.slotId,
      });
    }
  },

  setLogFilter: (filter: Partial<LogFilter>) => {
    set(state => ({
      logFilter: { ...state.logFilter, ...filter },
    }));
  },

  createWaveOutbound: (items: { goodsName: string; quantity: number }[]): WaveOutboundResult => {
    const { slots } = get();
    const waveId = 'WAVE-' + Date.now().toString(36).toUpperCase();
    const waveItems: WaveOutboundItem[] = [];
    const results: WaveOutboundResult['results'] = [];

    items.forEach(item => {
      const occupiedSlots = slots
        .filter(s => s.isOccupied && s.goodsName.toLowerCase() === item.goodsName.toLowerCase())
        .sort((a, b) => b.quantity - a.quantity);

      const totalAvailable = occupiedSlots.reduce((sum, s) => sum + s.quantity, 0);
      let remaining = item.quantity;
      const slotAllocations: WaveOutboundItem['slots'] = [];

      occupiedSlots.forEach(slot => {
        if (remaining <= 0) return;
        const allocate = Math.min(remaining, slot.quantity);
        slotAllocations.push({
          slotId: slot.id,
          layer: slot.layer,
          position: slot.position,
          availableQty: slot.quantity,
          allocatedQty: allocate,
        });
        remaining -= allocate;
        results.push({
          slotId: slot.id,
          goodsName: item.goodsName,
          actualQty: 0,
          status: 'success',
        });
      });

      waveItems.push({
        goodsName: item.goodsName,
        totalAvailable,
        requestedQuantity: item.quantity,
        slots: slotAllocations,
      });
    });

    const waveResult: WaveOutboundResult = {
      waveId,
      items: waveItems,
      taskIds: [],
      results,
    };

    set({ waveOutboundResult: waveResult });
    return waveResult;
  },

  executeWaveOutbound: (waveId: string, priority: TaskPriority = 'normal'): string[] => {
    const state = get();
    const wave = state.waveOutboundResult;
    if (!wave || wave.waveId !== waveId) return [];

    const taskIds: string[] = [];
    wave.items.forEach(item => {
      item.slots.forEach(slotAlloc => {
        const taskId = get().addOutboundTask(slotAlloc.layer, slotAlloc.position, slotAlloc.allocatedQty, priority);
        if (taskId) taskIds.push(taskId);
      });
    });

    set(state => ({
      waveOutboundResult: state.waveOutboundResult ? { ...state.waveOutboundResult, taskIds } : null,
    }));

    get().addLog({
      type: 'task',
      message: `波次出库 ${waveId} 已启动，共 ${taskIds.length} 个任务`,
      details: { taskType: 'outbound' },
    });

    return taskIds;
  },

  setWaveOutboundResult: (result: WaveOutboundResult | null) => {
    set({ waveOutboundResult: result });
  },

  recordWaveResult: (taskId: string, actualQty: number, success: boolean) => {
    set(state => {
      if (!state.waveOutboundResult) return state;
      const task = state.taskQueue.find(t => t.id === taskId);
      if (!task) return state;

      const newResults = state.waveOutboundResult.results.map(r => {
        if (r.slotId === task.slotId && r.goodsName === task.goodsName) {
          return { ...r, actualQty: success ? actualQty : 0, status: success ? 'success' : 'failed' };
        }
        return r;
      });

      const allDone = state.waveOutboundResult.taskIds.every(tid => {
        const t = state.taskQueue.find(t => t.id === tid);
        return t && (t.status === 'completed' || t.status === 'cancelled');
      });

      return {
        waveOutboundResult: {
          ...state.waveOutboundResult,
          results: newResults,
          completedAt: allDone ? Date.now() : undefined,
        },
      };
    });
  },

  importCSV: (csvContent: string): ImportResult => {
    const result: ImportResult = { success: 0, skipped: 0, errors: 0 };

    try {
      const lines = csvContent.trim().split('\n');
      if (lines.length < 2) {
        result.errors = 1;
        get().setImportResult(result, true);
        return result;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const layerIdx = headers.indexOf('layer');
      const positionIdx = headers.indexOf('position');
      const goodsNameIdx = headers.indexOf('goodsName');
      const quantityIdx = headers.indexOf('quantity');

      if (layerIdx === -1 || positionIdx === -1 || goodsNameIdx === -1 || quantityIdx === -1) {
        result.errors = lines.length - 1;
        get().setImportResult(result, true);
        return result;
      }

      const { LAYERS, POSITIONS, SLOT_WIDTH, SLOT_HEIGHT, SLOT_DEPTH, SLOT_GAP, SHELF_X_START, SHELF_Z_START } = SLOT_CONFIG;
      const newSlots: StorageSlot[] = [];

      for (let layer = 1; layer <= LAYERS; layer++) {
        for (let position = 1; position <= POSITIONS; position++) {
          const x = SHELF_X_START + (position - 1) * (SLOT_WIDTH + SLOT_GAP) + SLOT_WIDTH / 2;
          const y = (layer - 1) * (SLOT_HEIGHT + SLOT_GAP) + SLOT_HEIGHT / 2;
          const z = SHELF_Z_START;
          newSlots.push({
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

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length < 4) {
          result.skipped++;
          continue;
        }

        const layer = parseInt(values[layerIdx]);
        const position = parseInt(values[positionIdx]);
        const goodsName = values[goodsNameIdx];
        const quantity = parseInt(values[quantityIdx]);

        if (isNaN(layer) || isNaN(position) || isNaN(quantity) || !goodsName) {
          result.skipped++;
          continue;
        }

        if (layer < 1 || layer > LAYERS || position < 1 || position > POSITIONS || quantity <= 0) {
          result.skipped++;
          continue;
        }

        const slotIndex = newSlots.findIndex(s => s.layer === layer && s.position === position);
        if (slotIndex !== -1 && !newSlots[slotIndex].isOccupied) {
          newSlots[slotIndex] = {
            ...newSlots[slotIndex],
            isOccupied: true,
            goodsName,
            quantity,
          };
          result.success++;
        } else {
          result.skipped++;
        }
      }

      set({
        slots: newSlots,
        taskQueue: [],
        isQueuePaused: false,
        highlightedSlotId: null,
        selectedSlot: null,
        foundSlots: [],
        outboundGoodsName: '',
        modals: {
          inbound: false,
          outbound: false,
          inventory: false,
          waveOutbound: false,
        },
        waveOutboundResult: null,
      });

      localStorage.removeItem(TASK_STORAGE_KEY);

      get().addLog({
        type: 'import',
        message: `CSV导入完成: 成功${result.success}条, 跳过${result.skipped}条, 错误${result.errors}条 (已清空旧队列)`,
      });
      get().saveToStorage();
      get().setImportResult(result, true);
      return result;
    } catch (e) {
      console.error('CSV import failed', e);
      result.errors = 1;
      get().setImportResult(result, true);
      return result;
    }
  },

  exportCSV: (): string => {
    const { slots } = get();
    const occupiedSlots = slots.filter(s => s.isOccupied);

    const headers = ['layer', 'position', 'goodsName', 'quantity'];
    const rows = occupiedSlots.map(s => [s.layer, s.position, s.goodsName, s.quantity]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    get().addLog({
      type: 'export',
      message: `CSV导出成功，共 ${rows.length} 条记录`,
    });
    return csv;
  },

  setImportResult: (result: ImportResult | null, show: boolean) => {
    set({ importResult: result, showImportResult: show });
    if (show) {
      setTimeout(() => set({ showImportResult: false }), 5000);
    }
  },

  saveToStorage: () => {
    const { slots, taskQueue } = get();
    localStorage.setItem('warehouse-slots', JSON.stringify(slots));
    localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(taskQueue));
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

  locateLog: (log: OperationLog) => {
    if (log.slotId) {
      get().setHighlightedSlotId(log.slotId);
      const slot = get().slots.find(s => s.id === log.slotId);
      if (slot) {
        get().setSelectedSlot(slot);
      }
    }
  },
}));
