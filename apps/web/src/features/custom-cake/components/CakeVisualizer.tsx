import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { useCakeSpec, type CakeSpec } from '../hooks/useCakeSpec';
import { FLAVOR_MATERIALS, TOPPING_COLORS } from './flavorMaterials';

/**
 * 3D visualizer. Pure function of the cake spec.
 * Implements knowledge-base rules VR-01..VR-08 from docs/rules.md.
 */
export function CakeVisualizer() {
  const spec = useCakeSpec((s) => s.spec);
  return (
    <Canvas camera={{ position: [0, 1.8, 4], fov: 45 }} shadows>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 6, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-4, 4, -3]} intensity={0.4} />
      <CakeMesh spec={spec} />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[10, 10]} />
        <shadowMaterial opacity={0.15} />
      </mesh>
      <OrbitControls enablePan={false} minDistance={2.5} maxDistance={7} />
    </Canvas>
  );
}

function CakeMesh({ spec }: { spec: CakeSpec }) {
  const baseRadius = spec.size === 'small' ? 0.7 : spec.size === 'large' ? 1.2 : 1.0;
  const layerHeight = 0.4;

  const layers = spec.layers.map((layer, i) => {
    // VR-02: each upper tier scales to 85% of the tier below
    const scale = Math.pow(0.85, i);
    const radius = baseRadius * scale;
    const y = layerHeight / 2 + i * layerHeight;
    const flavor = FLAVOR_MATERIALS[layer.flavor] ?? FLAVOR_MATERIALS.vanilla;
    return { i, radius, y, flavor };
  });

  const topY = layers[layers.length - 1].y + layerHeight / 2;
  const topRadius = layers[layers.length - 1].radius;

  return (
    <group>
      {layers.map((l) => (
        <TierMesh
          key={l.i}
          shape={spec.shape}
          radius={l.radius}
          height={layerHeight}
          y={l.y}
          flavorColor={l.flavor.color}
          frostingColor={spec.colorHex}
          isOutermost={l.i === 0}
        />
      ))}

      {/* Toppings — VR-05: scattered on top tier */}
      <Toppings toppings={spec.toppings} radius={topRadius * 0.85} y={topY + 0.05} />

      {/* Message decal — VR-07 */}
      {spec.messageText && (
        <Text
          position={[0, layers[0].y, layers[0].radius + 0.01]}
          fontSize={0.12}
          color="#5b2e0a"
          maxWidth={baseRadius * 1.6}
          anchorX="center"
          anchorY="middle"
        >
          {spec.messageText}
        </Text>
      )}
    </group>
  );
}

function TierMesh({
  shape,
  radius,
  height,
  y,
  flavorColor,
  frostingColor,
  isOutermost,
}: {
  shape: CakeSpec['shape'];
  radius: number;
  height: number;
  y: number;
  flavorColor: string;
  frostingColor: string;
  isOutermost: boolean;
}) {
  // The outer face is frosting (tinted). The "flavor" colour is the sponge —
  // a simplified visual cue, shown as a thin band at the bottom of each tier.
  const frostingMat = (
    <meshStandardMaterial color={frostingColor} roughness={0.55} />
  );

  return (
    <group position={[0, y, 0]} castShadow receiveShadow>
      {shape === 'round' && (
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[radius, radius, height, 48]} />
          {frostingMat}
        </mesh>
      )}
      {shape === 'square' && (
        <mesh castShadow receiveShadow>
          <boxGeometry args={[radius * 2, height, radius * 2]} />
          {frostingMat}
        </mesh>
      )}
      {shape === 'heart' && <HeartTier radius={radius} height={height} mat={frostingMat} />}

      {/* sponge band cue */}
      <mesh position={[0, -height * 0.35, 0]}>
        {shape === 'round' ? (
          <cylinderGeometry args={[radius * 1.001, radius * 1.001, height * 0.18, 48]} />
        ) : (
          <boxGeometry args={[radius * 2.002, height * 0.18, radius * 2.002]} />
        )}
        <meshStandardMaterial color={flavorColor} roughness={0.7} />
      </mesh>

      {isOutermost && null}
    </group>
  );
}

function HeartTier({
  radius,
  height,
  mat,
}: {
  radius: number;
  height: number;
  mat: JSX.Element;
}) {
  // Simple heart approximation: two cylinders + a rotated box.
  const r = radius * 0.55;
  return (
    <group>
      <mesh position={[-r * 0.55, 0, 0]} castShadow>
        <cylinderGeometry args={[r, r, height, 32]} />
        {mat}
      </mesh>
      <mesh position={[r * 0.55, 0, 0]} castShadow>
        <cylinderGeometry args={[r, r, height, 32]} />
        {mat}
      </mesh>
      <mesh position={[0, 0, r * 0.7]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <boxGeometry args={[r * 1.55, height, r * 1.55]} />
        {mat}
      </mesh>
    </group>
  );
}

function Toppings({
  toppings,
  radius,
  y,
}: {
  toppings: string[];
  radius: number;
  y: number;
}) {
  if (toppings.length === 0) return null;
  const hasCaramel = toppings.includes('caramel');
  const otherToppings = toppings.filter((t) => t !== 'caramel');
  return (
    <group position={[0, y, 0]}>
      {/* VR-05c: caramel renders as a drizzle layer, not spheres */}
      {hasCaramel && <CaramelDrizzle radius={radius} />}
      {/* VR-05: all other toppings scatter as spheres */}
      <SphereToppings toppings={otherToppings} radius={radius} />
    </group>
  );
}

/** Caramel drizzle: two concentric torus rings + four radial lines. */
function CaramelDrizzle({ radius }: { radius: number }) {
  const color = '#b06a2a';
  const mat = <meshStandardMaterial color={color} roughness={0.25} metalness={0.1} />;
  return (
    <group>
      {/* outer ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 0.72, 0.022, 8, 48]} />
        {mat}
      </mesh>
      {/* inner ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 0.38, 0.018, 8, 32]} />
        {mat}
      </mesh>
      {/* 4 radial drizzle lines */}
      {[0, 45, 90, 135].map((deg) => (
        <mesh key={deg} rotation={[Math.PI / 2, 0, (deg * Math.PI) / 180]}>
          <boxGeometry args={[radius * 1.1, 0.022, 0.028]} />
          {mat}
        </mesh>
      ))}
    </group>
  );
}

/** All non-caramel toppings scattered as small spheres (deterministic). */
function SphereToppings({ toppings, radius }: { toppings: string[]; radius: number }) {
  if (toppings.length === 0) return null;
  const dots: { x: number; z: number; color: string; size: number }[] = [];
  toppings.forEach((t, ti) => {
    const color = TOPPING_COLORS[t] ?? '#ffffff';
    const size = t === 'gold-flakes' ? 0.04 : 0.05;
    for (let i = 0; i < 12; i++) {
      const seed = ti * 31 + i * 17;
      const angle = (seed % 360) * (Math.PI / 180);
      const r = radius * (0.2 + ((seed * 13) % 80) / 100);
      dots.push({ x: Math.cos(angle) * r, z: Math.sin(angle) * r, color, size });
    }
  });
  return (
    <>
      {dots.map((d, i) => (
        <mesh key={i} position={[d.x, 0, d.z]} castShadow>
          <sphereGeometry args={[d.size, 12, 12]} />
          <meshStandardMaterial color={d.color} roughness={0.4} />
        </mesh>
      ))}
    </>
  );
}
