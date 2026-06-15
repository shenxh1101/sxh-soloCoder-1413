import { useRef, useState } from 'react';
import { Mesh } from 'three';
import { useFrame } from '@react-three/fiber';
import { StorageSlot, SLOT_CONFIG, getHeatmapColor } from '../../types';
import { useStore } from '../../store/useStore';

interface SlotProps {
  slot: StorageSlot;
  onClick: (slot: StorageSlot) => void;
}

export function Slot({ slot, onClick }: SlotProps) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const showHeatmap = useStore(state => state.showHeatmap);
  const selectedSlot = useStore(state => state.selectedSlot);
  const isSelected = selectedSlot?.id === slot.id;

  const baseColor = getHeatmapColor(slot.quantity, showHeatmap);
  const displayColor = hovered ? '#ffeb3b' : isSelected ? '#ff9800' : baseColor;

  useFrame((_, delta) => {
    if (meshRef.current) {
      const targetScale = hovered || isSelected ? 1.05 : 1;
      meshRef.current.scale.lerp({ x: targetScale, y: targetScale, z: targetScale }, delta * 8);
    }
  });

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    onClick(slot);
  };

  return (
    <group position={[slot.x, slot.y, slot.z]}>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
        castShadow
        receiveShadow
      >
        <boxGeometry
          args={[
            SLOT_CONFIG.SLOT_WIDTH * 0.95,
            SLOT_CONFIG.SLOT_HEIGHT * 0.9,
            SLOT_CONFIG.SLOT_DEPTH * 0.9,
          ]}
        />
        <meshStandardMaterial
          color={displayColor}
          metalness={0.1}
          roughness={0.7}
          emissive={isSelected ? '#ff9800' : hovered ? '#ffeb3b' : '#000000'}
          emissiveIntensity={isSelected ? 0.3 : hovered ? 0.2 : 0}
          transparent
          opacity={0.9}
        />
      </mesh>

      {slot.isOccupied && (
        <mesh position={[0, 0, SLOT_CONFIG.SLOT_DEPTH * 0.1]}>
          <boxGeometry
            args={[
              SLOT_CONFIG.SLOT_WIDTH * 0.7,
              SLOT_CONFIG.SLOT_HEIGHT * 0.6,
              SLOT_CONFIG.SLOT_DEPTH * 0.6,
            ]}
          />
          <meshStandardMaterial
            color="#8b4513"
            metalness={0.2}
            roughness={0.6}
          />
        </mesh>
      )}
    </group>
  );
}
