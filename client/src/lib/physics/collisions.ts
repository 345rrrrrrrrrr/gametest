import * as THREE from 'three';
import { PhysicsObject, CollisionEvent } from '../../types/physics';
import { MATERIAL_PROPERTIES } from '../constants';

// Helper function to detect collision between two physics objects
export function detectCollision(
  bodyA: PhysicsObject,
  bodyB: PhysicsObject
): { point: THREE.Vector3; normal: THREE.Vector3 } | null {
  if (bodyA.type === 'sphere' && bodyB.type === 'sphere') {
    return detectSphereSphereCollision(bodyA, bodyB);
  } else if (bodyA.type === 'sphere' && bodyB.type === 'box') {
    return detectSphereBoxCollision(bodyA, bodyB);
  } else if (bodyA.type === 'box' && bodyB.type === 'sphere') {
    const result = detectSphereBoxCollision(bodyB, bodyA);
    if (result) {
      // Flip the normal direction
      result.normal.negate();
      return result;
    }
    return null;
  } else if (bodyA.type === 'box' && bodyB.type === 'box') {
    return detectBoxBoxCollision(bodyA, bodyB);
  } else if (bodyA.type === 'sphere' && bodyB.type === 'plane') {
    return detectSpherePlaneCollision(bodyA, bodyB);
  } else if (bodyA.type === 'plane' && bodyB.type === 'sphere') {
    const result = detectSpherePlaneCollision(bodyB, bodyA);
    if (result) {
      // Flip the normal direction
      result.normal.negate();
      return result;
    }
    return null;
  } else if (bodyA.type === 'box' && bodyB.type === 'plane') {
    return detectBoxPlaneCollision(bodyA, bodyB);
  } else if (bodyA.type === 'plane' && bodyB.type === 'box') {
    const result = detectBoxPlaneCollision(bodyB, bodyA);
    if (result) {
      // Flip the normal direction
      result.normal.negate();
      return result;
    }
    return null;
  } else if (bodyA.type === 'cylinder' || bodyB.type === 'cylinder') {
    // For simplicity, treat cylinders as boxes or spheres for collision
    // In a real implementation, you'd have specific cylinder collision logic
    return approximateCylinderCollision(bodyA, bodyB);
  }
  
  // Other collision types not implemented
  return null;
}

// Resolve collision between two physics objects
export function resolveCollision(
  bodyA: PhysicsObject,
  bodyB: PhysicsObject,
  point: THREE.Vector3,
  normal: THREE.Vector3
): number {
  // If either body is a trigger, no physical resolution
  if (bodyA.properties.isTrigger || bodyB.properties.isTrigger) {
    return 0;
  }
  
  // Calculate relative velocity at collision point
  const relativeVelocity = new THREE.Vector3().subVectors(
    getPointVelocity(bodyB, point),
    getPointVelocity(bodyA, point)
  );
  
  // Calculate relative velocity along the normal
  const normalVelocity = normal.dot(relativeVelocity);
  
  // If objects are moving away from each other, no collision response needed
  if (normalVelocity > 0) {
    return 0;
  }
  
  // Calculate restitution (bounciness)
  const restitution = Math.max(
    bodyA.properties.restitution,
    bodyB.properties.restitution
  );
  
  // Calculate friction
  const friction = Math.min(
    bodyA.properties.friction,
    bodyB.properties.friction
  );
  
  // Calculate impulse scalar
  let j = -(1 + restitution) * normalVelocity;
  const invMassA = bodyA.properties.isKinematic ? 0 : 1 / bodyA.properties.mass;
  const invMassB = bodyB.properties.isKinematic ? 0 : 1 / bodyB.properties.mass;
  j /= invMassA + invMassB;
  
  // Apply impulse along the normal
  const impulse = new THREE.Vector3().copy(normal).multiplyScalar(j);
  
  if (!bodyA.properties.isKinematic) {
    bodyA.applyImpulse(impulse.clone().negate(), point);
  }
  
  if (!bodyB.properties.isKinematic) {
    bodyB.applyImpulse(impulse, point);
  }
  
  // Apply friction (simplified tangent impulse)
  const tangent = new THREE.Vector3().copy(relativeVelocity);
  tangent.addScaledVector(normal, -normal.dot(relativeVelocity));
  
  // Only apply if there's a tangential component
  const tangentLength = tangent.length();
  if (tangentLength > 0.0001) {
    tangent.normalize();
    
    // Calculate tangent impulse scalar
    let jt = -relativeVelocity.dot(tangent) * friction;
    jt /= invMassA + invMassB;
    
    // Apply tangent impulse for friction
    const tangentImpulse = new THREE.Vector3().copy(tangent).multiplyScalar(jt);
    
    if (!bodyA.properties.isKinematic) {
      bodyA.applyImpulse(tangentImpulse.clone().negate(), point);
    }
    
    if (!bodyB.properties.isKinematic) {
      bodyB.applyImpulse(tangentImpulse, point);
    }
  }
  
  // Position correction to prevent sinking (primitive but effective)
  const correction = 0.2; // Baumgarte scale factor
  const slop = 0.01; // Penetration allowed
  const penetration = -normalVelocity; // Approximation
  
  if (penetration > slop) {
    const correctionAmount = Math.max(penetration - slop, 0) * correction;
    const correctionVector = normal.clone().multiplyScalar(correctionAmount);
    
    const massSum = invMassA + invMassB;
    if (massSum > 0) {
      if (!bodyA.properties.isKinematic) {
        bodyA.state.position.addScaledVector(correctionVector, -invMassA / massSum);
      }
      
      if (!bodyB.properties.isKinematic) {
        bodyB.state.position.addScaledVector(correctionVector, invMassB / massSum);
      }
    }
  }
  
  return j; // Return the impulse magnitude
}

// Helper to get the velocity of a point on a rigid body
function getPointVelocity(body: PhysicsObject, point: THREE.Vector3): THREE.Vector3 {
  const relativePoint = new THREE.Vector3().subVectors(point, body.state.position);
  const angularVelocityEffect = new THREE.Vector3().crossVectors(
    body.state.angularVelocity,
    relativePoint
  );
  
  return new THREE.Vector3()
    .copy(body.state.velocity)
    .add(angularVelocityEffect);
}

// Specific collision detection functions
function detectSphereSphereCollision(
  sphereA: PhysicsObject,
  sphereB: PhysicsObject
): { point: THREE.Vector3; normal: THREE.Vector3 } | null {
  const radiusA = (sphereA.shape.parameters as any).radius;
  const radiusB = (sphereB.shape.parameters as any).radius;
  
  const posA = sphereA.state.position;
  const posB = sphereB.state.position;
  
  const direction = new THREE.Vector3().subVectors(posB, posA);
  const distance = direction.length();
  const radiusSum = radiusA + radiusB;
  
  if (distance >= radiusSum) {
    return null; // No collision
  }
  
  // Calculate normal and contact point
  const normal = direction.clone().normalize();
  const penetration = radiusSum - distance;
  const contactPoint = normal.clone()
    .multiplyScalar(radiusA - penetration * 0.5)
    .add(posA);
  
  return {
    point: contactPoint,
    normal: normal
  };
}

function detectSphereBoxCollision(
  sphere: PhysicsObject,
  box: PhysicsObject
): { point: THREE.Vector3; normal: THREE.Vector3 } | null {
  const sphereRadius = (sphere.shape.parameters as any).radius;
  const boxSize = (box.shape.parameters as any).size.clone();
  const halfBoxSize = boxSize.clone().multiplyScalar(0.5);
  
  // Convert sphere position to box's local space
  const boxWorldToLocal = new THREE.Matrix4()
    .makeRotationFromQuaternion(box.state.rotation)
    .transpose();
  
  const sphereLocalPos = new THREE.Vector3()
    .subVectors(sphere.state.position, box.state.position)
    .applyMatrix4(boxWorldToLocal);
  
  // Find closest point on box to sphere
  const closestPoint = new THREE.Vector3(
    Math.max(-halfBoxSize.x, Math.min(sphereLocalPos.x, halfBoxSize.x)),
    Math.max(-halfBoxSize.y, Math.min(sphereLocalPos.y, halfBoxSize.y)),
    Math.max(-halfBoxSize.z, Math.min(sphereLocalPos.z, halfBoxSize.z))
  );
  
  // Calculate squared distance
  const distanceSquared = closestPoint.clone().sub(sphereLocalPos).lengthSq();
  
  if (distanceSquared > sphereRadius * sphereRadius) {
    return null; // No collision
  }
  
  // Calculate normal and contact point in world space
  const localNormal = new THREE.Vector3()
    .subVectors(sphereLocalPos, closestPoint)
    .normalize();
  
  // If sphere center is inside box, find the minimum penetration axis
  if (distanceSquared < 0.0001) {
    // Find the face with minimum penetration
    const penetrationX = halfBoxSize.x - Math.abs(sphereLocalPos.x);
    const penetrationY = halfBoxSize.y - Math.abs(sphereLocalPos.y);
    const penetrationZ = halfBoxSize.z - Math.abs(sphereLocalPos.z);
    
    if (penetrationX < penetrationY && penetrationX < penetrationZ) {
      localNormal.set(Math.sign(sphereLocalPos.x), 0, 0);
    } else if (penetrationY < penetrationZ) {
      localNormal.set(0, Math.sign(sphereLocalPos.y), 0);
    } else {
      localNormal.set(0, 0, Math.sign(sphereLocalPos.z));
    }
  }
  
  // Convert normal back to world space
  const worldToLocalRotation = new THREE.Matrix4().makeRotationFromQuaternion(box.state.rotation);
  const worldNormal = localNormal.clone().applyMatrix4(worldToLocalRotation).normalize();
  
  // Calculate contact point
  const distance = Math.sqrt(distanceSquared);
  const penetration = sphereRadius - distance;
  const contactPoint = new THREE.Vector3()
    .copy(sphere.state.position)
    .addScaledVector(worldNormal, -sphereRadius + penetration * 0.5);
  
  return {
    point: contactPoint,
    normal: worldNormal
  };
}

function detectBoxBoxCollision(
  boxA: PhysicsObject,
  boxB: PhysicsObject
): { point: THREE.Vector3; normal: THREE.Vector3 } | null {
  // This is a simplified version that doesn't handle rotations correctly
  // For production, you'd use the Separating Axis Theorem (SAT)
  
  const sizeA = (boxA.shape.parameters as any).size.clone().multiplyScalar(0.5);
  const sizeB = (boxB.shape.parameters as any).size.clone().multiplyScalar(0.5);
  
  const posA = boxA.state.position;
  const posB = boxB.state.position;
  
  // Check overlap for each axis
  const diff = new THREE.Vector3().subVectors(posB, posA);
  
  // Calculate min and max for each box on each axis
  const aMin = new THREE.Vector3().subVectors(posA, sizeA);
  const aMax = new THREE.Vector3().addVectors(posA, sizeA);
  const bMin = new THREE.Vector3().subVectors(posB, sizeB);
  const bMax = new THREE.Vector3().addVectors(posB, sizeB);
  
  // Check for overlap on each axis
  if (aMax.x < bMin.x || aMin.x > bMax.x) return null;
  if (aMax.y < bMin.y || aMin.y > bMax.y) return null;
  if (aMax.z < bMin.z || aMin.z > bMax.z) return null;
  
  // There is a collision, now find the penetration axis
  const penetrations = [
    bMax.x - aMin.x, // A right, B left
    aMax.x - bMin.x, // A left, B right
    bMax.y - aMin.y, // A top, B bottom
    aMax.y - bMin.y, // A bottom, B top
    bMax.z - aMin.z, // A front, B back
    aMax.z - bMin.z, // A back, B front
  ];
  
  // Find minimum penetration axis
  let minPenetration = penetrations[0];
  let minAxis = 0;
  
  for (let i = 1; i < penetrations.length; i++) {
    if (penetrations[i] < minPenetration) {
      minPenetration = penetrations[i];
      minAxis = i;
    }
  }
  
  // Calculate normal and contact point
  let normal: THREE.Vector3;
  switch (minAxis) {
    case 0: normal = new THREE.Vector3(-1, 0, 0); break; // A right
    case 1: normal = new THREE.Vector3(1, 0, 0); break;  // A left
    case 2: normal = new THREE.Vector3(0, -1, 0); break; // A top
    case 3: normal = new THREE.Vector3(0, 1, 0); break;  // A bottom
    case 4: normal = new THREE.Vector3(0, 0, -1); break; // A front
    case 5: normal = new THREE.Vector3(0, 0, 1); break;  // A back
    default: normal = new THREE.Vector3(1, 0, 0);
  }
  
  // Approximate contact point (not accurate for rotated boxes)
  const contactPoint = new THREE.Vector3()
    .addVectors(posA, posB)
    .multiplyScalar(0.5);
  
  return {
    normal,
    point: contactPoint
  };
}

function detectSpherePlaneCollision(
  sphere: PhysicsObject,
  plane: PhysicsObject
): { point: THREE.Vector3; normal: THREE.Vector3 } | null {
  const sphereRadius = (sphere.shape.parameters as any).radius;
  const planeNormal = (plane.shape.parameters as any).normal.clone().normalize();
  const planePoint = plane.state.position.clone();
  
  // Calculate distance from sphere center to plane
  const spherePoint = sphere.state.position.clone();
  const vector = new THREE.Vector3().subVectors(spherePoint, planePoint);
  const distance = vector.dot(planeNormal);
  
  if (distance > sphereRadius) {
    return null; // No collision
  }
  
  // Calculate contact point
  const contactPoint = new THREE.Vector3()
    .copy(spherePoint)
    .addScaledVector(planeNormal, -distance);
  
  return {
    point: contactPoint,
    normal: planeNormal.clone()
  };
}

function detectBoxPlaneCollision(
  box: PhysicsObject,
  plane: PhysicsObject
): { point: THREE.Vector3; normal: THREE.Vector3 } | null {
  const boxSize = (box.shape.parameters as any).size.clone().multiplyScalar(0.5);
  const planeNormal = (plane.shape.parameters as any).normal.clone().normalize();
  const planePoint = plane.state.position.clone();
  
  // Find the most extreme point of the box in the direction of the plane normal
  const extremePoint = box.state.position.clone();
  
  // Adjust for box rotation (simplified)
  const rotationMatrix = new THREE.Matrix4().makeRotationFromQuaternion(box.state.rotation);
  const transformedX = new THREE.Vector3(1, 0, 0).applyMatrix4(rotationMatrix).normalize().multiplyScalar(boxSize.x);
  const transformedY = new THREE.Vector3(0, 1, 0).applyMatrix4(rotationMatrix).normalize().multiplyScalar(boxSize.y);
  const transformedZ = new THREE.Vector3(0, 0, 1).applyMatrix4(rotationMatrix).normalize().multiplyScalar(boxSize.z);
  
  if (planeNormal.dot(transformedX) < 0) extremePoint.sub(transformedX);
  else extremePoint.add(transformedX);
  
  if (planeNormal.dot(transformedY) < 0) extremePoint.sub(transformedY);
  else extremePoint.add(transformedY);
  
  if (planeNormal.dot(transformedZ) < 0) extremePoint.sub(transformedZ);
  else extremePoint.add(transformedZ);
  
  // Calculate distance from extreme point to plane
  const vector = new THREE.Vector3().subVectors(extremePoint, planePoint);
  const distance = vector.dot(planeNormal);
  
  if (distance > 0) {
    return null; // No collision
  }
  
  // Calculate contact point
  const contactPoint = new THREE.Vector3()
    .copy(extremePoint)
    .addScaledVector(planeNormal, -distance);
  
  return {
    point: contactPoint,
    normal: planeNormal.clone()
  };
}

function approximateCylinderCollision(
  bodyA: PhysicsObject,
  bodyB: PhysicsObject
): { point: THREE.Vector3; normal: THREE.Vector3 } | null {
  // Use sphere approximation for cylinders
  if (bodyA.type === 'cylinder') {
    const radius = (bodyA.shape.parameters as any).radius;
    const height = (bodyA.shape.parameters as any).height;
    
    // Approximate with largest dimension
    const sphereRadius = Math.max(radius, height / 2);
    
    // Create a temporary sphere body for collision detection
    const tempSphere = {
      ...bodyA,
      type: 'sphere' as any,
      shape: {
        ...bodyA.shape,
        type: 'sphere' as any,
        parameters: { radius: sphereRadius },
        getBoundingSphere: () => ({ center: bodyA.state.position, radius: sphereRadius })
      }
    };
    
    if (bodyB.type === 'sphere') {
      return detectSphereSphereCollision(tempSphere, bodyB);
    } else if (bodyB.type === 'box') {
      return detectSphereBoxCollision(tempSphere, bodyB);
    } else if (bodyB.type === 'plane') {
      return detectSpherePlaneCollision(tempSphere, bodyB);
    }
  } else if (bodyB.type === 'cylinder') {
    const radius = (bodyB.shape.parameters as any).radius;
    const height = (bodyB.shape.parameters as any).height;
    
    // Approximate with largest dimension
    const sphereRadius = Math.max(radius, height / 2);
    
    // Create a temporary sphere body for collision detection
    const tempSphere = {
      ...bodyB,
      type: 'sphere' as any,
      shape: {
        ...bodyB.shape,
        type: 'sphere' as any,
        parameters: { radius: sphereRadius },
        getBoundingSphere: () => ({ center: bodyB.state.position, radius: sphereRadius })
      }
    };
    
    if (bodyA.type === 'sphere') {
      const result = detectSphereSphereCollision(bodyA, tempSphere);
      if (result) {
        result.normal.negate(); // Flip the normal
        return result;
      }
    } else if (bodyA.type === 'box') {
      const result = detectSphereBoxCollision(tempSphere, bodyA);
      if (result) {
        result.normal.negate(); // Flip the normal
        return result;
      }
    } else if (bodyA.type === 'plane') {
      const result = detectSpherePlaneCollision(tempSphere, bodyA);
      if (result) {
        result.normal.negate(); // Flip the normal
        return result;
      }
    }
  }
  
  return null;
}
