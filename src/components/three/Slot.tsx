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
  const highlightedSlotId = useStore(state => state.highlightedSlotId);
  const isSelected = selectedSlot?.id === slot.id;
  const isHighlighted = highlightedSlotId === slot.id;

  const baseColor = getHeatmapColor(slot.quantity, showHeatmap);
  let displayColor = baseColor;
  let emissiveColor = '#000000';
  let emissiveIntensity = 0;

  if (hovered) {
    displayColor = '#ffeb3b';
    emissiveColor = '#ffeb3b';
    emissiveIntensity = 0.25;
  } else if (isSelected) {
    displayColor = '#ff9800';
    emissiveColor = '#ff9800';
    emissiveIntensity = 0.35;
  } else if (isHighlighted) {
    displayColor = '#e91e63';
    emissiveColor = '#e91e63';
    emissiveIntensity = 0.5;
  }

  useFrame((_, delta) => {
    if (meshRef.current) {
      const targetScale = hovered || isSelected || isHighlighted ? 1.08 : 1;
      meshRef.current.scale.lerp({ x: targetScale, y: targetScale, z: targetScale }, delta * 10);
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
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
          transparent
          opacity={0.92}
        />
      </mesh>

      {slot.isOccupied && (
        <mesh position={[0, 0, SLOT_CONFIG.SLOT_DEPTH * 0.08]}>
          <boxGeometry
            args={[
              SLOT_CONFIG.SLOT_WIDTH * 0.68,
              SLOT_CONFIG.SLOT_HEIGHT * 0.55,
              SLOT_CONFIG.SLOT_DEPTH * 0.55,
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
