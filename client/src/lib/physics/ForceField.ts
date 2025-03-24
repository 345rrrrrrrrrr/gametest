import * as THREE from 'three';

// Force field configuration
export interface ForceFieldConfig {
  position: THREE.Vector3;
  type: 'radial' | 'directional' | 'vortex' | 'magnetic';
  strength: number;
  radius: number;
  decay: number;
  direction?: THREE.Vector3;
  duration?: number;
}

// Force field class for applying different types of forces to physics objects
export class ForceField {
  private position: THREE.Vector3;
  private type: 'radial' | 'directional' | 'vortex' | 'magnetic';
  private strength: number;
  private radius: number;
  private decay: number;
  private direction: THREE.Vector3;
  private creationTime: number;
  private duration: number;
  
  constructor(config: ForceFieldConfig) {
    this.position = config.position;
    this.type = config.type;
    this.strength = config.strength;
    this.radius = config.radius;
    this.decay = config.decay;
    this.direction = config.direction || new THREE.Vector3(0, 1, 0);
    this.creationTime = Date.now();
    this.duration = config.duration || Infinity;
  }
  
  // Apply force to an object based on its position and properties
  public applyToObject(object: any, deltaTime: number): void {
    if (!object.position || !object.velocity) return;
    
    // Check if force field has expired
    const age = (Date.now() - this.creationTime) / 1000;
    if (age > this.duration) return;
    
    // Calculate distance from object to force field center
    const distance = object.position.distanceTo(this.position);
    
    // Check if object is within radius
    if (distance > this.radius) return;
    
    // Calculate normalized distance (0 at center, 1 at edge)
    const normalizedDistance = distance / this.radius;
    
    // Calculate force magnitude based on distance and decay
    const forceMagnitude = this.strength * Math.pow(1 - normalizedDistance, this.decay) * deltaTime;
    
    // Apply different force calculations based on field type
    switch (this.type) {
      case 'radial':
        this.applyRadialForce(object, distance, forceMagnitude);
        break;
      case 'directional':
        this.applyDirectionalForce(object, normalizedDistance, forceMagnitude);
        break;
      case 'vortex':
        this.applyVortexForce(object, distance, normalizedDistance, forceMagnitude);
        break;
      case 'magnetic':
        this.applyMagneticForce(object, distance, forceMagnitude);
        break;
    }
  }
  
  // Radial force pushes/pulls objects from the center
  private applyRadialForce(object: any, distance: number, forceMagnitude: number): void {
    // Direction from force field to object
    const forceDirection = new THREE.Vector3()
      .subVectors(object.position, this.position)
      .normalize();
    
    // Create force vector (negative for attraction, positive for repulsion)
    const force = forceDirection.multiplyScalar(forceMagnitude);
    
    // Apply force to object's velocity
    object.velocity.add(force);
  }
  
  // Directional force pushes objects in a specific direction
  private applyDirectionalForce(object: any, normalizedDistance: number, forceMagnitude: number): void {
    // Create force vector in the specified direction
    const force = this.direction.clone().normalize().multiplyScalar(forceMagnitude);
    
    // Apply force to object's velocity
    object.velocity.add(force);
  }
  
  // Vortex force creates a swirling motion around the center
  private applyVortexForce(object: any, distance: number, normalizedDistance: number, forceMagnitude: number): void {
    // Vector from center to object
    const toObject = new THREE.Vector3().subVectors(object.position, this.position);
    
    // Calculate tangent vector (perpendicular to radius)
    const tangent = new THREE.Vector3(-toObject.z, 0, toObject.x).normalize();
    
    // Create force vector along tangent
    const force = tangent.multiplyScalar(forceMagnitude);
    
    // Apply force to object's velocity
    object.velocity.add(force);
  }
  
  // Magnetic force attracts objects with 'magnetic' property
  private applyMagneticForce(object: any, distance: number, forceMagnitude: number): void {
    // Direction from object to force field
    const forceDirection = new THREE.Vector3()
      .subVectors(this.position, object.position)
      .normalize();
    
    // Adjust force magnitude based on object properties
    let adjustedMagnitude = forceMagnitude;
    
    // If object is magnetic, increase force
    if (object.special === 'magnetic') {
      adjustedMagnitude *= 3;
    }
    
    // Create force vector (attraction)
    const force = forceDirection.multiplyScalar(adjustedMagnitude);
    
    // Apply force to object's velocity
    object.velocity.add(force);
  }
  
  // Check if the force field is still active
  public isActive(): boolean {
    const age = (Date.now() - this.creationTime) / 1000;
    return age <= this.duration;
  }
  
  // Get remaining lifetime as percentage
  public getRemainingLifetime(): number {
    if (this.duration === Infinity) return 1;
    
    const age = (Date.now() - this.creationTime) / 1000;
    return Math.max(0, 1 - (age / this.duration));
  }
  
  // Update force field properties
  public update(properties: Partial<ForceFieldConfig>): void {
    if (properties.position) this.position = properties.position;
    if (properties.strength !== undefined) this.strength = properties.strength;
    if (properties.radius !== undefined) this.radius = properties.radius;
    if (properties.decay !== undefined) this.decay = properties.decay;
    if (properties.direction) this.direction = properties.direction;
    if (properties.duration !== undefined) this.duration = properties.duration;
  }
}
