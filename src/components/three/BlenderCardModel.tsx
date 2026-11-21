"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { withBasePath } from "@/lib/utils";
import type { CardOrientation } from "@/types/tarot";

interface BlenderCardModelProps {
  glbPath: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  revealed?: boolean;
  orientation?: CardOrientation;
  floatSpeed?: number;
  floatAmplitude?: number;
  floatOffset?: number;
  reducedMotion?: boolean;
  onClick?: () => void;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
}

export function BlenderCardModel({
  glbPath,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  revealed = true,
  orientation = "upright",
  floatSpeed = 0,
  floatAmplitude = 0,
  floatOffset = 0,
  reducedMotion = false,
  onClick,
  onPointerOver,
  onPointerOut,
}: BlenderCardModelProps) {
  const fullUrl = withBasePath(glbPath);
  const { scene } = useGLTF(fullUrl);
  const groupRef = useRef<THREE.Group>(null);
  const flipProgressRef = useRef(revealed ? 1 : 0);

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  useEffect(() => {
    return () => {
      clonedScene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material?.dispose();
          }
        }
      });
    };
  }, [clonedScene]);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const targetFlip = revealed ? 1 : 0;
    const diff = targetFlip - flipProgressRef.current;
    if (Math.abs(diff) > 0.002) {
      flipProgressRef.current += diff * Math.min(1, delta * (reducedMotion ? 20 : 6));
    } else {
      flipProgressRef.current = targetFlip;
    }

    const flipAngleY = (1 - flipProgressRef.current) * Math.PI;
    const reversedAngleZ =
      orientation === "reversed" && flipProgressRef.current > 0.5 ? Math.PI : 0;

    group.rotation.x = rotation[0];
    group.rotation.y = rotation[1] + flipAngleY;
    group.rotation.z = rotation[2] + reversedAngleZ;

    if (!reducedMotion && floatSpeed > 0 && floatAmplitude > 0) {
      const t = state.clock.getElapsedTime();
      group.position.y =
        position[1] + Math.sin(t * floatSpeed + floatOffset) * floatAmplitude;
    } else {
      group.position.y = position[1];
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      scale={scale}
      onClick={(e) => {
        if (!onClick) return;
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        if (!onPointerOver) return;
        e.stopPropagation();
        document.body.style.cursor = "pointer";
        onPointerOver();
      }}
      onPointerOut={() => {
        if (!onPointerOut) return;
        document.body.style.cursor = "auto";
        onPointerOut();
      }}
    >
      <primitive object={clonedScene} />
    </group>
  );
}
