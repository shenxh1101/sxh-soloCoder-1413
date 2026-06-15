import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Shelf } from './Shelf';
import { Stacker } from './Stacker';
import { Ground } from './Ground';
import { OutputPort } from './OutputPort';

export function Scene() {
  return (
    <Canvas
      shadows
      camera={{ position: [15, 12, 15], fov: 50 }}
      gl={{ antialias: true }}
      style={{ background: 'linear-gradient(to bottom, #1a1a2e, #16213e)' }}
    >
      <fog attach="fog" args={['#1a1a2e', 20, 60]} />

      <ambientLight intensity={0.4} />
      <hemisphereLight args={['#87ceeb', '#362d26', 0.3]} />

      <directionalLight
        position={[10, 20, 10]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
      />

      <directionalLight position={[-10, 10, -10]} intensity={0.3} />

      <Ground />
      <Shelf />
      <Stacker />
      <OutputPort />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={8}
        maxDistance={40}
        maxPolarAngle={Math.PI / 2 - 0.1}
        target={[0, 3, 0]}
      />
    </Canvas>
  );
}
