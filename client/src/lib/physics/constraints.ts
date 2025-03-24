import * as THREE from 'three';
import { 
  PhysicsObject, PhysicsConstraint, ConstraintOptions 
} from '../../types/physics';
import { generateUUID } from '../utils/helpers';

// Base constraint class
export abstract class BaseConstraint implements PhysicsConstraint {
  id: string;
  type: string;
  bodyA: PhysicsObject;
  bodyB?: PhysicsObject;
  options: ConstraintOptions;
  isEnabled: boolean;
  
  constructor(options: ConstraintOptions) {
    this.id = generateUUID();
    this.type = options.type;
    this.bodyA = options.bodyA;
    this.bodyB = options.bodyB;
    this.options = options;
    this.isEnabled = true;
  }
  
  abstract update(): void;
  abstract applyConstraint(): void;
  
  disable(): void {
    this.isEnabled = false;
  }
  
  enable(): void {
    this.isEnabled = true;
  }
}

// Distance constraint - keeps two bodies at a specified distance
export class DistanceConstraint extends BaseConstraint {
  private distance: number;
  
  constructor(options: ConstraintOptions) {
    super({
      type: 'distance',
      ...options
    });
    
    // Calculate initial distance if not specified
    if (options.minDistance !== undefined && options.maxDistance !== undefined) {
      // Use the average of min and max distance
      this.distance = (options.minDistance + options.maxDistance) / 2;
    } else if (options.bodyB) {
      // Use current distance between bodies
      this.distance = this.bodyA.state.position.distanceTo(this.bodyB.state.position);
    } else {
      this.distance = 1; // Default
    }
  }
  
  update(): void {
    // Update constraint parameters if needed
  }
  
  applyConstraint(): void {
    if (!this.isEnabled || !this.bodyB) return;
    
    const direction = new THREE.Vector3().subVectors(
      this.bodyB.state.position,
      this.bodyA.state.position
    );
    
    const currentDistance = direction.length();
    if (currentDistance === 0) return; // Avoid division by zero
    
    let correction = 0;
    
    // Check if we're within min/max bounds
    if (this.options.minDistance !== undefined && currentDistance < this.options.minDistance) {
      correction = (this.options.minDistance - currentDistance) / currentDistance;
    } else if (this.options.maxDistance !== undefined && currentDistance > this.options.maxDistance) {
      correction = (this.options.maxDistance - currentDistance) / currentDistance;
    } else {
      return; // No correction needed
    }
    
    // Calculate correction vector
    const correctionVector = direction.multiplyScalar(correction);
    
    // Apply stiffness factor if specified
    if (this.options.stiffness !== undefined) {
      correctionVector.multiplyScalar(this.options.stiffness);
    }
    
    const invMassA = this.bodyA.properties.isKinematic ? 0 : 1 / this.bodyA.properties.mass;
    const invMassB = this.bodyB.properties.isKinematic ? 0 : 1 / this.bodyB.properties.mass;
    const totalInvMass = invMassA + invMassB;
    
    if (totalInvMass === 0) return; // Both bodies are kinematic
    
    // Apply correction based on mass ratio
    if (!this.bodyA.properties.isKinematic) {
      this.bodyA.state.position.addScaledVector(
        correctionVector, 
        -invMassA / totalInvMass
      );
    }
    
    if (!this.bodyB.properties.isKinematic) {
      this.bodyB.state.position.addScaledVector(
        correctionVector, 
        invMassB / totalInvMass
      );
    }
  }
}

// Point-to-point constraint - connects a point on bodyA to a point on bodyB
export class PointToPointConstraint extends BaseConstraint {
  private pivotA: THREE.Vector3;
  private pivotB: THREE.Vector3;
  
  constructor(options: ConstraintOptions) {
    super({
      type: 'point-to-point',
      ...options
    });
    
    this.pivotA = options.pivotA || new THREE.Vector3();
    this.pivotB = options.pivotB || new THREE.Vector3();
  }
  
  update(): void {
    // Update constraint parameters if needed
  }
  
  applyConstraint(): void {
    if (!this.isEnabled || !this.bodyB) return;
    
    // Calculate world positions of the pivot points
    const worldPivotA = new THREE.Vector3().copy(this.pivotA);
    const worldPivotB = new THREE.Vector3().copy(this.pivotB);
    
    // Apply body rotations to the pivot points
    worldPivotA.applyQuaternion(this.bodyA.state.rotation).add(this.bodyA.state.position);
    worldPivotB.applyQuaternion(this.bodyB.state.rotation).add(this.bodyB.state.position);
    
    // Calculate the error vector
    const errorVector = new THREE.Vector3().subVectors(worldPivotA, worldPivotB);
    
    // Apply stiffness factor if specified
    let stiffness = 1;
    if (this.options.stiffness !== undefined) {
      stiffness = this.options.stiffness;
    }
    
    // Calculate mass-weighted correction
    const invMassA = this.bodyA.properties.isKinematic ? 0 : 1 / this.bodyA.properties.mass;
    const invMassB = this.bodyB.properties.isKinematic ? 0 : 1 / this.bodyB.properties.mass;
    const totalInvMass = invMassA + invMassB;
    
    if (totalInvMass === 0) return; // Both bodies are kinematic
    
    // Apply correction based on mass ratio
    if (!this.bodyA.properties.isKinematic) {
      this.bodyA.state.position.addScaledVector(
        errorVector, 
        -invMassA / totalInvMass * stiffness
      );
    }
    
    if (!this.bodyB.properties.isKinematic) {
      this.bodyB.state.position.addScaledVector(
        errorVector, 
        invMassB / totalInvMass * stiffness
      );
    }
    
    // If this is not an angular-only constraint, also update angular constraints
    if (!this.options.angularOnly) {
      // Apply angular corrections (simplified for now)
      // In a full physics engine, this would account for the torque effect
    }
  }
}

// Hinge constraint - allows rotation around a specific axis
export class HingeConstraint extends BaseConstraint {
  private pivotA: THREE.Vector3;
  private pivotB: THREE.Vector3;
  private axisA: THREE.Vector3;
  private axisB: THREE.Vector3;
  
  constructor(options: ConstraintOptions) {
    super({
      type: 'hinge',
      ...options
    });
    
    this.pivotA = options.pivotA || new THREE.Vector3();
    this.pivotB = options.pivotB || new THREE.Vector3();
    this.axisA = options.axisA || new THREE.Vector3(0, 1, 0);
    this.axisB = options.axisB || new THREE.Vector3(0, 1, 0);
  }
  
  update(): void {
    // Update constraint parameters if needed
  }
  
  applyConstraint(): void {
    if (!this.isEnabled || !this.bodyB) return;
    
    // First, enforce the point-to-point constraint at the pivot
    const pointConstraint = new PointToPointConstraint({
      type: 'point-to-point',
      bodyA: this.bodyA,
      bodyB: this.bodyB,
      pivotA: this.pivotA,
      pivotB: this.pivotB,
      stiffness: this.options.stiffness
    });
    
    pointConstraint.applyConstraint();
    
    // Then, constrain the axes to be aligned
    
    // Transform axes to world space
    const worldAxisA = new THREE.Vector3().copy(this.axisA)
      .applyQuaternion(this.bodyA.state.rotation)
      .normalize();
    
    const worldAxisB = new THREE.Vector3().copy(this.axisB)
      .applyQuaternion(this.bodyB.state.rotation)
      .normalize();
    
    // Calculate the rotation to align axisB with axisA
    const rotationAxis = new THREE.Vector3().crossVectors(worldAxisB, worldAxisA);
    const rotationAngle = Math.asin(rotationAxis.length());
    
    if (rotationAngle < 0.0001) return; // Already aligned
    
    rotationAxis.normalize();
    
    // Create a quaternion for the rotation correction
    const correctionRotation = new THREE.Quaternion()
      .setFromAxisAngle(rotationAxis, rotationAngle);
    
    // Apply stiffness factor if specified
    let stiffness = 1;
    if (this.options.stiffness !== undefined) {
      stiffness = this.options.stiffness;
    }
    
    // Apply the rotation correction scaled by stiffness
    if (!this.bodyB.properties.isKinematic) {
      // Scale the rotation by stiffness
      const scaledRotation = new THREE.Quaternion()
        .slerp(correctionRotation, stiffness);
      
      // Apply the rotation
      this.bodyB.state.rotation.premultiply(scaledRotation);
      this.bodyB.state.rotation.normalize();
    }
  }
}

// Slider constraint - allows movement along a specific axis
export class SliderConstraint extends BaseConstraint {
  private pivotA: THREE.Vector3;
  private pivotB: THREE.Vector3;
  private axisA: THREE.Vector3;
  
  constructor(options: ConstraintOptions) {
    super({
      type: 'slider',
      ...options
    });
    
    this.pivotA = options.pivotA || new THREE.Vector3();
    this.pivotB = options.pivotB || new THREE.Vector3();
    this.axisA = options.axisA || new THREE.Vector3(1, 0, 0);
  }
  
  update(): void {
    // Update constraint parameters if needed
  }
  
  applyConstraint(): void {
    if (!this.isEnabled || !this.bodyB) return;
    
    // Transform pivot and axis to world space
    const worldPivotA = new THREE.Vector3().copy(this.pivotA)
      .applyQuaternion(this.bodyA.state.rotation)
      .add(this.bodyA.state.position);
    
    const worldPivotB = new THREE.Vector3().copy(this.pivotB)
      .applyQuaternion(this.bodyB.state.rotation)
      .add(this.bodyB.state.position);
    
    const worldAxisA = new THREE.Vector3().copy(this.axisA)
      .applyQuaternion(this.bodyA.state.rotation)
      .normalize();
    
    // Calculate the vector from pivotA to pivotB
    const pivotDiff = new THREE.Vector3().subVectors(worldPivotB, worldPivotA);
    
    // Project pivotDiff onto the axis to get the allowed component
    const axisComponent = worldAxisA.clone().multiplyScalar(pivotDiff.dot(worldAxisA));
    
    // Calculate the error vector (the component perpendicular to the axis)
    const errorVector = new THREE.Vector3().subVectors(pivotDiff, axisComponent);
    
    // Apply stiffness factor if specified
    let stiffness = 1;
    if (this.options.stiffness !== undefined) {
      stiffness = this.options.stiffness;
    }
    
    // Apply limits if specified
    if (this.options.minDistance !== undefined || this.options.maxDistance !== undefined) {
      const distance = axisComponent.length();
      const axisDirection = Math.sign(axisComponent.dot(worldAxisA));
      
      let correctionDistance = 0;
      
      if (this.options.minDistance !== undefined && distance < this.options.minDistance) {
        correctionDistance = this.options.minDistance - distance;
      } else if (this.options.maxDistance !== undefined && distance > this.options.maxDistance) {
        correctionDistance = this.options.maxDistance - distance;
      }
      
      if (correctionDistance !== 0) {
        const limitCorrection = worldAxisA.clone()
          .multiplyScalar(correctionDistance * axisDirection * stiffness);
        
        errorVector.add(limitCorrection);
      }
    }
    
    // Calculate mass-weighted correction
    const invMassA = this.bodyA.properties.isKinematic ? 0 : 1 / this.bodyA.properties.mass;
    const invMassB = this.bodyB.properties.isKinematic ? 0 : 1 / this.bodyB.properties.mass;
    const totalInvMass = invMassA + invMassB;
    
    if (totalInvMass === 0) return; // Both bodies are kinematic
    
    // Apply correction based on mass ratio
    if (!this.bodyA.properties.isKinematic) {
      this.bodyA.state.position.addScaledVector(
        errorVector, 
        invMassA / totalInvMass * stiffness
      );
    }
    
    if (!this.bodyB.properties.isKinematic) {
      this.bodyB.state.position.addScaledVector(
        errorVector, 
        -invMassB / totalInvMass * stiffness
      );
    }
  }
}

// Factory function to create constraints
export function createConstraint(options: ConstraintOptions): PhysicsConstraint {
  switch (options.type) {
    case 'distance':
      return new DistanceConstraint(options);
    case 'point-to-point':
      return new PointToPointConstraint(options);
    case 'hinge':
      return new HingeConstraint(options);
    case 'slider':
      return new SliderConstraint(options);
    default:
      throw new Error(`Constraint type ${options.type} not implemented`);
  }
}
