import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../../store/useStore';
import { STACKER_CONFIG } from '../../types';
import * as TWEEN from '@tweenjs/tween.js';

export function Stacker() {
  const groupRef = useRef<THREE.Group>(null);
  const forksRef = useRef<THREE.Group>(null);
  const stacker = useStore(state => state.stacker);
  const setStackerPosition = useStore(state => state.setStackerPosition);

  const moveTo = useCallback(async (x: number, y: number, z: number): Promise<void> => {
    return new Promise((resolve) => {
      const state = useStore.getState();
      const currentPos = {
        x: state.stacker.x,
        y: state.stacker.y,
        z: state.stacker.z,
      };
      const targetPos = { x, y, z };

      const horizontalTween = new TWEEN.Tween({ x: currentPos.x, z: currentPos.z })
        .to({ x: targetPos.x, z: targetPos.z }, 1500)
        .easing(TWEEN.Easing.Cubic.InOut)
        .onUpdate((val) => {
          const currentState = useStore.getState();
          setStackerPosition(val.x, currentState.stacker.y, val.z);
        });

      const verticalTween = new TWEEN.Tween({ y: currentPos.y })
        .to({ y: targetPos.y }, 1500)
        .easing(TWEEN.Easing.Cubic.InOut)
        .onUpdate((val) => {
          const currentState = useStore.getState();
          setStackerPosition(currentState.stacker.x, val.y, currentState.stacker.z);
        });

      horizontalTween.start();
      horizontalTween.onComplete(() => {
        verticalTween.start();
        verticalTween.onComplete(() => {
          resolve();
        });
      });
    });
  }, [setStackerPosition]);

  useEffect(() => {
    (window as unknown as { moveStackerTo: typeof moveTo }).moveStackerTo = moveTo;
  }, [moveTo]);

  useFrame((_, delta) => {
    TWEEN.update();
    if (groupRef.current) {
      const targetPos = new THREE.Vector3(stacker.x, 0, stacker.z);
      groupRef.current.position.lerp(targetPos, delta * 10);
    }
    if (forksRef.current) {
      const targetY = stacker.y;
      forksRef.current.position.y = THREE.MathUtils.lerp(
        forksRef.current.position.y,
        targetY,
        delta * 10
      );
    }
  });

  return (
    <group ref={groupRef} position={[STACKER_CONFIG.HOME_X, 0, STACKER_CONFIG.HOME_Z]}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[1.5, 1, 1.5]} />
        <meshStandardMaterial color="#37474f" metalness={0.8} roughness={0.2} />
      </mesh>

      <mesh position={[0, 3, 0]} castShadow>
        <boxGeometry args={[0.3, 6, 0.3]} />
        <meshStandardMaterial color="#546e7a" metalness={0.7} roughness={0.3} />
      </mesh>

      <group ref={forksRef} position={[0, 0.5, 0.8]}>
        <mesh castShadow>
          <boxGeometry args={[0.1, 0.1, 1]} />
          <meshStandardMaterial color="#ff6b35" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[-0.5, 0, 0]} castShadow>
          <boxGeometry args={[0.1, 0.1, 1]} />
          <meshStandardMaterial color="#ff6b35" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0.5, 0, 0]} castShadow>
          <boxGeometry args={[0.1, 0.1, 1]} />
          <meshStandardMaterial color="#ff6b35" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0.3, 0.2]} castShadow>
          <boxGeometry args={[1.2, 0.1, 0.6]} />
          <meshStandardMaterial color="#455a64" metalness={0.7} roughness={0.3} />
        </mesh>

        {stacker.hasGoods && stacker.currentGoods && (
          <mesh position={[0, 0.7, 0.2]} castShadow>
            <boxGeometry args={[1, 0.6, 0.5]} />
            <meshStandardMaterial color="#8b4513" metalness={0.2} roughness={0.6} />
          </mesh>
        )}
      </group>

      <mesh position={[-0.5, 0.2, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
        <meshStandardMaterial color="#212121" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0.5, 0.2, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
        <meshStandardMaterial color="#212121" metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  );
}
