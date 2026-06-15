import { useMemo } from 'react';
import * as THREE from 'three';

export function Ground() {
  const groundGroup = useMemo(() => {
    const group = new THREE.Group();

    const groundGeometry = new THREE.PlaneGeometry(50, 40);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: '#424242',
      metalness: 0.1,
      roughness: 0.9,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    group.add(ground);

    const gridHelper = new THREE.GridHelper(50, 50, '#616161', '#757575');
    gridHelper.position.y = 0.01;
    group.add(gridHelper);

    return group;
  }, []);

  return <primitive object={groundGroup} />;
}
