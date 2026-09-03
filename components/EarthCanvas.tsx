'use client'

import React, { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

// Custom Atmosphere Glow Shader
const atmosphereUniforms = {
  color: { value: new THREE.Color('#4a90e2') },
}
const atmosphereVertex = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * vec4(vPosition, 1.0);
  }
`
const atmosphereFragment = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  uniform vec3 color;
  void main() {
    vec3 viewDir = normalize(-vPosition);
    float intensity = pow(0.7 - dot(vNormal, viewDir), 3.0);
    gl_FragColor = vec4(color, max(0.0, intensity * 0.75));
  }
`

// Realistic Earth Sphere Component (Preserved Exactly)
function EarthPlanet({ reducedMotion }: { reducedMotion: boolean }) {
  const earthGroupRef = useRef<THREE.Group>(null!)
  const cloudsRef = useRef<THREE.Mesh>(null!)

  // Load local high-res textures from public/textures/
  const [dayMap, specularMap, normalMap, cloudMap, nightMap] = useTexture([
    '/textures/earth_day.jpg',
    '/textures/earth_specular.jpg',
    '/textures/earth_normal.jpg',
    '/textures/earth_clouds.png',
    '/textures/earth_night.png',
  ])

  // Configure texture color space & filtering
  useMemo(() => {
    dayMap.colorSpace = THREE.SRGBColorSpace
    nightMap.colorSpace = THREE.SRGBColorSpace
    dayMap.anisotropy = 8
  }, [dayMap, nightMap])

  useFrame((_, delta) => {
    if (!reducedMotion) {
      if (earthGroupRef.current) {
        earthGroupRef.current.rotation.y += delta * 0.04
      }
      if (cloudsRef.current) {
        cloudsRef.current.rotation.y += delta * 0.055
      }
    }
  })

  return (
    <group ref={earthGroupRef}>
      {/* Primary Earth Surface */}
      <mesh receiveShadow castShadow>
        <sphereGeometry args={[1.55, 64, 64]} />
        <meshStandardMaterial
          map={dayMap}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(0.25, 0.25)}
          roughnessMap={specularMap}
          roughness={0.65}
          metalness={0.1}
        />
      </mesh>

      {/* Emissive City Night Lights Layer */}
      <mesh>
        <sphereGeometry args={[1.552, 64, 64]} />
        <meshBasicMaterial
          map={nightMap}
          transparent
          blending={THREE.AdditiveBlending}
          opacity={0.55}
        />
      </mesh>

      {/* Dynamic Volumetric Cloud Layer */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[1.57, 64, 64]} />
        <meshStandardMaterial
          map={cloudMap}
          transparent
          opacity={0.35}
          blending={THREE.NormalBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Atmospheric Rim Glow */}
      <mesh>
        <sphereGeometry args={[1.66, 64, 64]} />
        <shaderMaterial
          uniforms={atmosphereUniforms}
          vertexShader={atmosphereVertex}
          fragmentShader={atmosphereFragment}
          transparent
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

// Proportional Orbit & Satellite System (Scaled down ~28% so orbit fits 100% inside container)
function SatelliteAndOrbit({ reducedMotion }: { reducedMotion: boolean }) {
  const satelliteRef = useRef<THREE.Group>(null!)
  const scanBeamRef = useRef<THREE.Mesh>(null!)
  const targetRingRef = useRef<THREE.Mesh>(null!)
  const progressRef = useRef(0.15)

  // Define 3D Inclined Elliptical Orbit Curve (Scaled down rx: 2.05, ry: 1.80)
  const { orbitCurve, orbitLinePrimitive } = useMemo(() => {
    const curve = new THREE.EllipseCurve(
      0, 0,
      2.05, 1.80,
      0, 2 * Math.PI,
      false,
      0
    )

    const pts2D = curve.getPoints(120)
    const pts3D: THREE.Vector3[] = pts2D.map((p: THREE.Vector2) => {
      const vec = new THREE.Vector3(p.x, 0, p.y)
      vec.applyAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI * 0.22)
      vec.applyAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI * 0.12)
      return vec
    })

    const catmullCurve = new THREE.CatmullRomCurve3(pts3D, true)
    const points = catmullCurve.getPoints(200)

    const geo = new THREE.BufferGeometry().setFromPoints(points)
    const mat = new THREE.LineBasicMaterial({
      color: 0x82f4e0,
      transparent: true,
      opacity: 0.35,
      depthTest: true,
    })

    return {
      orbitCurve: catmullCurve,
      orbitLinePrimitive: new THREE.LineLoop(geo, mat),
    }
  }, [])

  useFrame((_, delta) => {
    if (!reducedMotion) {
      progressRef.current = (progressRef.current + delta * 0.04) % 1
    }

    const t = progressRef.current
    const satPos = orbitCurve.getPoint(t)
    const tangent = orbitCurve.getTangent(t)

    if (satelliteRef.current) {
      satelliteRef.current.position.copy(satPos)

      const lookAtMat = new THREE.Matrix4()
      const up = tangent.clone().normalize()
      lookAtMat.lookAt(satPos, new THREE.Vector3(0, 0, 0), up)
      satelliteRef.current.quaternion.setFromRotationMatrix(lookAtMat)
    }

    if (scanBeamRef.current && targetRingRef.current) {
      const earthRadius = 1.555
      const earthTarget = satPos.clone().normalize().multiplyScalar(earthRadius)

      const beamVector = earthTarget.clone().sub(satPos)
      const distance = beamVector.length()
      const midpoint = satPos.clone().add(earthTarget).multiplyScalar(0.5)

      scanBeamRef.current.position.copy(midpoint)
      scanBeamRef.current.scale.set(0.035, distance, 0.035)

      const beamMat = new THREE.Matrix4()
      beamMat.lookAt(satPos, earthTarget, new THREE.Vector3(0, 1, 0))
      beamMat.multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2))
      scanBeamRef.current.quaternion.setFromRotationMatrix(beamMat)

      targetRingRef.current.position.copy(earthTarget)
      targetRingRef.current.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        earthTarget.clone().normalize()
      )
    }
  })

  return (
    <>
      {/* 3D Orbit Path Primitive with True Depth Occlusion */}
      <primitive object={orbitLinePrimitive} />

      {/* Satellite Spacecraft Group (Proportionally scaled) */}
      <group ref={satelliteRef}>
        {/* Central Satellite Body */}
        <mesh castShadow>
          <boxGeometry args={[0.13, 0.13, 0.20]} />
          <meshStandardMaterial
            color="#d4af37"
            roughness={0.3}
            metalness={0.8}
          />
        </mesh>

        {/* Optical Sensor Camera Lens */}
        <mesh position={[0, 0, 0.11]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.05, 0.05, 16]} />
          <meshStandardMaterial color="#111" roughness={0.1} metalness={0.9} />
        </mesh>

        {/* Left Solar Wing */}
        <mesh position={[0.27, 0, 0]}>
          <boxGeometry args={[0.32, 0.11, 0.02]} />
          <meshStandardMaterial
            color="#1d3557"
            roughness={0.2}
            metalness={0.6}
            emissive="#0d1b2a"
          />
        </mesh>

        {/* Right Solar Wing */}
        <mesh position={[-0.27, 0, 0]}>
          <boxGeometry args={[0.32, 0.11, 0.02]} />
          <meshStandardMaterial
            color="#1d3557"
            roughness={0.2}
            metalness={0.6}
            emissive="#0d1b2a"
          />
        </mesh>
      </group>

      {/* Remote Sensing Scan Cone / Beam */}
      <mesh ref={scanBeamRef}>
        <cylinderGeometry args={[0.006, 0.20, 1, 16, 1, true]} />
        <meshBasicMaterial
          color="#82f4e0"
          transparent
          opacity={0.18}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Earth Surface Scanning Focal Ring */}
      <mesh ref={targetRingRef}>
        <ringGeometry args={[0.04, 0.065, 32]} />
        <meshBasicMaterial
          color="#82f4e0"
          transparent
          opacity={0.45}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </>
  )
}

// Scene Container with Mouse Parallax & Cinematic Lighting
function SceneContent({ reducedMotion }: { reducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null!)

  useFrame((state) => {
    if (!reducedMotion && groupRef.current) {
      const targetX = state.pointer.x * 0.12
      const targetY = state.pointer.y * 0.08
      groupRef.current.rotation.y += (targetX - groupRef.current.rotation.y) * 0.04
      groupRef.current.rotation.x += (-targetY - groupRef.current.rotation.x) * 0.04
    }
  })

  return (
    <group ref={groupRef}>
      {/* Primary Directional Sunlight */}
      <directionalLight
        position={[5, 2.5, 4.5]}
        intensity={2.8}
        color="#fffaf0"
        castShadow
      />
      {/* Deep Space Fill Light */}
      <ambientLight intensity={0.2} color="#0c1e2b" />
      
      {/* Soft Rim Light */}
      <directionalLight position={[-4, -2, -4]} intensity={0.4} color="#3ecdb5" />

      {/* Earth & Orbit Systems */}
      <EarthPlanet reducedMotion={reducedMotion} />
      <SatelliteAndOrbit reducedMotion={reducedMotion} />
    </group>
  )
}

export default function EarthCanvas() {
  const [reducedMotion, setReducedMotion] = useState(false)
  const [cameraZ, setCameraZ] = useState(6.1)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(query.matches)
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    query.addEventListener('change', listener)

    const handleResize = () => {
      const w = window.innerWidth
      if (w < 768) {
        setCameraZ(6.8)
      } else if (w < 1024) {
        setCameraZ(6.4)
      } else {
        setCameraZ(6.1)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => {
      query.removeEventListener('change', listener)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <div className="relative flex size-full min-h-[540px] items-center justify-center p-2 lg:min-h-[640px]">
      <Canvas
        camera={{ position: [0, 0, cameraZ], fov: 42 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
        }}
        className="size-full overflow-visible"
      >
        <React.Suspense fallback={null}>
          <SceneContent reducedMotion={reducedMotion} />
        </React.Suspense>
      </Canvas>

      {/* Telemetry Badge Overlay */}
      <div className="pointer-events-none absolute bottom-2 right-2 flex items-center gap-2 border border-line bg-ink/75 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-cyan backdrop-blur-md">
        <span className="size-1.5 animate-pulse rounded-full bg-cyan" />
        <span>Sentinel-2 Orbit / 3D Simulation</span>
      </div>
    </div>
  )
}
