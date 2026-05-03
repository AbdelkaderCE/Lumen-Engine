import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { 
  OrbitControls, 
  Text, 
  PerspectiveCamera,
  Billboard
} from "@react-three/drei";
import * as THREE from "three";

import { GlassCard, GlassCardContent, GlassCardHeader } from "@/components/ui/GlassCard";
import { SectionTitle, Mono } from "@/components/ui/Typography";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface VizData {
  query_string: string;
  axes: [string, string, string];
  query: [number, number, number];
  documents: {
    filename: string;
    pos: [number, number, number];
    score: number;
  }[];
}

/**
 * A highly optimized, textbook-style vector space visualization.
 * Designed to be lightweight and prevent performance lag.
 */
function Scene({ data }: { data: VizData }) {
  // 1. Calculate safe scale
  const maxVal = useMemo(() => {
    const vals = [
      ...data.query.map(Math.abs),
      ...data.documents.flatMap(d => d.pos.map(Math.abs))
    ];
    const m = Math.max(...vals);
    return m < 0.0001 ? 1 : m;
  }, [data]);
  
  const scale = 5 / maxVal;
  
  // 2. Memoize geometry points to avoid re-renders
  const queryPos = useMemo(() => new THREE.Vector3(...data.query).multiplyScalar(scale), [data.query, scale]);
  
  const docPoints = useMemo(() => {
    return data.documents.map(d => ({
      ...d,
      scaledPos: new THREE.Vector3(...d.pos).multiplyScalar(scale)
    }));
  }, [data.documents, scale]);

  // Determine if we are in dark mode once to set static colors
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const textColor = isDark ? "#cbd5e1" : "#1e293b";

  return (
    <>
      <ambientLight intensity={1} />
      
      {/* Origin Marker */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color={isDark ? "#ffffff" : "#000000"} />
      </mesh>

      {/* Axis Dimensions */}
      <group>
        <SimpleArrow direction={[1, 0, 0]} length={7} label={data.axes[0]} color="#ef4444" textColor={textColor} />
        <SimpleArrow direction={[0, 1, 0]} length={7} label={data.axes[1]} color="#22c55e" textColor={textColor} />
        <SimpleArrow direction={[0, 0, 1]} length={7} label={data.axes[2]} color="#a855f7" textColor={textColor} />
      </group>

      {/* Query Vector */}
      <SimpleArrow 
        direction={data.query as [number, number, number]} 
        length={queryPos.length()} 
        label={`QUERY: ${data.query_string}`} 
        color="#eab308" 
        thickness={0.08} 
        textColor={textColor}
        isQuery={true}
      />

      {/* Document Vectors */}
      {data.documents.slice(0, 5).map((doc) => {
        const scaledPos = new THREE.Vector3(...doc.pos).multiplyScalar(scale);
        return (
          <SimpleArrow 
            key={doc.filename}
            direction={doc.pos as [number, number, number]} 
            length={scaledPos.length()} 
            label={doc.filename.split('/').pop() || ""} 
            color="#06b6d4" 
            thickness={0.04} 
            opacity={0.8}
            textColor={textColor}
            score={doc.score}
          />
        );
      })}

      <OrbitControls makeDefault minDistance={2} maxDistance={20} />
    </>
  );
}

function SimpleArrow({ direction, length, label, color, thickness = 0.04, opacity = 1, textColor, score, isQuery }: any) {
  // Prevent NaN if direction is zero
  const dir = useMemo(() => {
    const v = new THREE.Vector3(...direction);
    if (v.lengthSq() < 0.0001) return new THREE.Vector3(0, 1, 0);
    return v.normalize();
  }, [direction]);

  const quaternion = useMemo(() => {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    return q;
  }, [dir]);

  if (length < 0.05) return null;

  return (
    <group>
      {/* The Arrow itself still rotates */}
      <group quaternion={quaternion}>
        <mesh position={[0, length / 2, 0]}>
          <cylinderGeometry args={[thickness, thickness, length, 8]} />
          <meshBasicMaterial color={color} transparent opacity={opacity} />
        </mesh>
        <mesh position={[0, length, 0]}>
          <coneGeometry args={[thickness * 2.5, thickness * 5, 8]} />
          <meshBasicMaterial color={color} transparent opacity={opacity} />
        </mesh>
      </group>

      {/* The Label uses Billboard to ALWAYS face the camera */}
      <Billboard
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false}
        position={dir.clone().multiplyScalar(length + (isQuery ? 1.0 : 0.6))}
      >
        <Text 
          fontSize={isQuery ? 0.35 : 0.25} 
          color={isQuery ? "#fff" : textColor} 
          anchorX="center"
          anchorY="middle"
          outlineWidth={isQuery ? 0.04 : 0.02}
          outlineColor={color}
          outlineOpacity={isQuery ? 0.8 : 0.2}
          fontWeight={isQuery ? "bold" : "normal"}
        >
          {label}
        </Text>
        {score !== undefined && (
          <Text 
            position={[0, -0.25, 0]} 
            fontSize={0.16} 
            color={textColor} 
            opacity={0.8}
            fontStyle="italic"
          >
            {(score * 100).toFixed(1)}% match
          </Text>
        )}
      </Billboard>
    </group>
  );
}

export function VectorSpaceViz({ data }: { data?: VizData }) {
  if (!data) return null;

  return (
    <GlassCard variant="outline" className="overflow-hidden h-[500px] flex flex-col border-border bg-white dark:bg-slate-950 shadow-sm transition-colors duration-500">
      <GlassCardHeader className="flex items-center justify-between py-3 px-4 border-b border-border bg-slate-50/50 dark:bg-white/5">
        <div className="flex items-center gap-2">
          <SectionTitle className="text-sm">Spatial Vector Projection</SectionTitle>
          <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-widest opacity-60">3D SPACE</Badge>
        </div>
        <div className="flex gap-4">
          {data.axes.map((axis, i) => (
             <div key={axis} className="flex items-center gap-1.5">
                <div className={cn("size-2 rounded-full", i === 0 ? "bg-red-500" : i === 1 ? "bg-green-500" : "bg-blue-500")} />
                <Mono className="text-[10px] uppercase font-bold">{axis}</Mono>
             </div>
          ))}
        </div>
      </GlassCardHeader>
      
      <GlassCardContent className="flex-1 p-0 relative">
        <Canvas 
          flat 
          gl={{ antialias: false, alpha: true }} 
          camera={{ position: [10, 8, 10], fov: 35 }}
        >
          <Scene data={data} />
        </Canvas>
        
        {/* Static Legend */}
        <div className="absolute bottom-4 left-4 flex flex-col gap-2 p-3 rounded-lg bg-white/90 dark:bg-black/40 backdrop-blur-md border border-border z-10 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-6 h-1 rounded-full bg-[#eab308]" />
            <Mono className="text-[10px] font-bold">QUERY</Mono>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-1 rounded-full bg-[#06b6d4]" />
            <Mono className="text-[10px] font-bold">DOCUMENT</Mono>
          </div>
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}
