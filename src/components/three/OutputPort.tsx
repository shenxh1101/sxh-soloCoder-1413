import { useMemo } from 'react';
import * as THREE from 'three';
import { STACKER_CONFIG } from '../../types';

export function OutputPort() {
  const portGroup = useMemo(() => {
    const group = new THREE.Group();

    const baseMaterial = new THREE.MeshStandardMaterial({
      color: '#ff6b35',
      metalness: 0.3,
      roughness: 0.5,
      emissive: '#ff6b35',
      emissiveIntensity: 0.2,
    });

    const platformGeometry = new THREE.BoxGeometry(3, 0.2, 2);
    const platform = new THREE.Mesh(platformGeometry, baseMaterial);
    platform.position.y = 0.1;
    platform.receiveShadow = true;
    group.add(platform);

    const borderMaterial = new THREE.MeshStandardMaterial({
      color: '#e65100',
      metalness: 0.5,
      roughness: 0.3,
    });

    const borderGeometry1 = new THREE.BoxGeometry(3.2, 0.3, 0.2);
    const border1 = new THREE.Mesh(borderGeometry1, borderMaterial);
    border1.position.set(0, 0.15, 1);
    border1.castShadow = true;
    group.add(border1);

    const border2 = new THREE.Mesh(borderGeometry1, borderMaterial);
    border2.position.set(0, 0.15, -1);
    border2.castShadow = true;
    group.add(border2);

    const borderGeometry2 = new THREE.BoxGeometry(0.2, 0.3, 2);
    const border3 = new THREE.Mesh(borderGeometry2, borderMaterial);
    border3.position.set(1.5, 0.15, 0);
    border3.castShadow = true;
    group.add(border3);

    group.position.set(STACKER_CONFIG.OUTPUT_X, 0, STACKER_CONFIG.OUTPUT_Z);

    return group;
  }, []);

  return (
    <group>
      <primitive object={portGroup} />

      <mesh position={[STACKER_CONFIG.OUTPUT_X, 0.02, STACKER_CONFIG.OUTPUT_Z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.2, 1.5, 32]} />
        <meshBasicMaterial color="#ff6b35" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}
