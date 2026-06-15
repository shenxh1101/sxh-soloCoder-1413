import { useEffect } from 'react';
import { Scene } from '../components/three/Scene';
import { ControlPanel } from '../components/ui/ControlPanel';
import { InfoPanel } from '../components/ui/InfoPanel';
import { InboundModal, OutboundModal, InventoryModal } from '../components/ui/Modal';
import { useKeyboardControl } from '../hooks/useKeyboardControl';
import { useStore } from '../store/useStore';

export default function Home() {
  useKeyboardControl();

  useEffect(() => {
    useStore.getState().initSlots();
  }, []);

  return (
    <div className="w-full h-screen overflow-hidden relative">
      <div className="w-full h-full">
        <Scene />
      </div>

      <ControlPanel />
      <InfoPanel />

      <InboundModal />
      <OutboundModal />
      <InventoryModal />

      <div className="fixed bottom-4 left-4 bg-white/10 backdrop-blur-lg rounded-lg px-4 py-2 border border-white/20">
        <div className="text-gray-300 text-xs">
          <span className="text-gray-500">提示：</span>
          鼠标左键旋转 · 滚轮缩放 · 右键平移
        </div>
      </div>
    </div>
  );
}
