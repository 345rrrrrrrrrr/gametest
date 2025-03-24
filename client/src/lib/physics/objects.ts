import * as THREE from 'three';
import { PhysicsShape } from '../../types/physics';

// Create a sphere physics shape
export function createSphereShape(radius: number): PhysicsShape {
  return {
    type: 'sphere',
    parameters: { radius },
    getBoundingSphere: () => ({
      center: new THREE.Vector3(0, 0, 0),
      radius
    })
  };
}

// Create a box physics shape
export function createBoxShape(size: THREE.Vector3): PhysicsShape {
  const boundingSphereRadius = Math.sqrt(
    size.x * size.x + size.y * size.y + size.z * size.z
  ) / 2;
  
  return {
    type: 'box',
    parameters: { size },
    getBoundingSphere: () => ({
      center: new THREE.Vector3(0, 0, 0),
      radius: boundingSphereRadius
    })
  };
}

// Create a cylinder physics shape
export function createCylinderShape(radius: number, height: number): PhysicsShape {
  const boundingSphereRadius = Math.sqrt(radius * radius + height * height / 4);
  
  return {
    type: 'cylinder',
    parameters: { radius, height },
    getBoundingSphere: () => ({
      center: new THREE.Vector3(0, 0, 0),
      radius: boundingSphereRadius
    })
  };
}

// Create a plane physics shape
export function createPlaneShape(normal: THREE.Vector3): PhysicsShape {
  return {
    type: 'plane',
    parameters: { normal: normal.clone().normalize() },
    getBoundingSphere: () => ({
      center: new THREE.Vector3(0, 0, 0),
      radius: Infinity
    })
  };
}

// Create a mesh physics shape (simplified for now)
export function createMeshShape(vertices: THREE.Vector3[], indices: number[]): PhysicsShape {
  // Calculate bounding sphere
  const center = new THREE.Vector3();
  let maxRadiusSq = 0;
  
  for (const vertex of vertices) {
    center.add(vertex);
  }
  
  center.divideScalar(vertices.length);
  
  for (const vertex of vertices) {
    const distSq = center.distanceToSquared(vertex);
    if (distSq > maxRadiusSq) {
      maxRadiusSq = distSq;
    }
  }
  
  return {
    type: 'mesh',
    parameters: { vertices, indices },
    getBoundingSphere: () => ({
      center,
      radius: Math.sqrt(maxRadiusSq)
    })
  };
}

// Create a compound physics shape
export function createCompoundShape(shapes: PhysicsShape[], offsets: THREE.Vector3[]): PhysicsShape {
  // Calculate bounding sphere for the compound shape
  let maxRadius = 0;
  const center = new THREE.Vector3();
  
  for (let i = 0; i < shapes.length; i++) {
    const shape = shapes[i];
    const offset = offsets[i];
    const boundingSphere = shape.getBoundingSphere();
    
    // Add offset to center calculation
    center.add(offset);
    
    // Calculate max radius accounting for the offset
    const offsetDistance = offset.length();
    const totalRadius = boundingSphere.radius + offsetDistance;
    if (totalRadius > maxRadius) {
      maxRadius = totalRadius;
    }
  }
  
  // Average the center
  if (shapes.length > 0) {
    center.divideScalar(shapes.length);
  }
  
  return {
    type: 'compound',
    parameters: { shapes, offsets },
    getBoundingSphere: () => ({
      center,
      radius: maxRadius
    })
  };
}
