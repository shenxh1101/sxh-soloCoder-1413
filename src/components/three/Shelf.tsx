import { useMemo } from 'react';
import * as THREE from 'three';
import { SLOT_CONFIG } from '../../types';
import { useStore } from '../../store/useStore';
import { Slot } from './Slot';

export function Shelf() {
  const slots = useStore(state => state.slots);
  const setSelectedSlot = useStore(state => state.setSelectedSlot);
  const openModal = useStore(state => state.openModal);
  const stacker = useStore(state => state.stacker);

  const shelfFrame = useMemo(() => {
    const { LAYERS, POSITIONS, SLOT_WIDTH, SLOT_HEIGHT, SLOT_DEPTH, SLOT_GAP } = SLOT_CONFIG;
    const totalWidth = POSITIONS * (SLOT_WIDTH + SLOT_GAP) - SLOT_GAP;
    const totalHeight = LAYERS * (SLOT_HEIGHT + SLOT_GAP) - SLOT_GAP;
    const frameDepth = SLOT_DEPTH + 0.4;

    const group = new THREE.Group();
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: '#78909c',
      metalness: 0.7,
      roughness: 0.3,
    });

    const verticalBeamGeometry = new THREE.BoxGeometry(0.2, totalHeight + 0.4, 0.2);
    const horizontalBeamGeometry = new THREE.BoxGeometry(totalWidth + 0.4, 0.15, frameDepth);
    const shelfGeometry = new THREE.BoxGeometry(totalWidth + 0.2, 0.05, SLOT_DEPTH + 0.1);

    for (let i = 0; i < POSITIONS + 1; i++) {
      const beam = new THREE.Mesh(verticalBeamGeometry, frameMaterial);
      beam.position.set(
        -totalWidth / 2 + i * (SLOT_WIDTH + SLOT_GAP) - SLOT_GAP / 2,
        totalHeight / 2,
        0
      );
      beam.castShadow = true;
      group.add(beam);
    }

    for (let i = 0; i < LAYERS + 1; i++) {
      const beam = new THREE.Mesh(horizontalBeamGeometry, frameMaterial);
      beam.position.set(
        0,
        -totalHeight / 2 + i * (SLOT_HEIGHT + SLOT_GAP) - SLOT_GAP / 2,
        0
      );
      beam.castShadow = true;
      beam.receiveShadow = true;
      group.add(beam);

      if (i < LAYERS) {
        const shelf = new THREE.Mesh(shelfGeometry, frameMaterial);
        shelf.position.set(
          0,
          -totalHeight / 2 + i * (SLOT_HEIGHT + SLOT_GAP) + SLOT_HEIGHT / 2,
          0
        );
        shelf.receiveShadow = true;
        group.add(shelf);
      }
    }

    group.position.set(
      SLOT_CONFIG.SHELF_X_START + totalWidth / 2 - SLOT_WIDTH / 2 - SLOT_GAP / 2,
      -0.2,
      SLOT_CONFIG.SHELF_Z_START
    );

    return group;
  }, []);

  const handleSlotClick = (slot: typeof slots[0]) => {
    if (stacker.isBusy) return;
    if (stacker.mode !== 'auto') return;

    if (!slot.isOccupied) {
      setSelectedSlot(slot);
      openModal('inbound');
    }
  };

  return (
    <group>
      <primitive object={shelfFrame} />
      {slots.map(slot => (
        <Slot key={slot.id} slot={slot} onClick={handleSlotClick} />
      ))}
    </group>
  );
}
