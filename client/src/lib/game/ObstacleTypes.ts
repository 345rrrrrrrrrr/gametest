import * as THREE from 'three';

// Obstacle material types and physical properties
export enum ObstacleMaterial {
  Wood = 'wood',
  Metal = 'metal',
  Glass = 'glass',
  Rubber = 'rubber',
  Bouncy = 'bouncy',
  Ice = 'ice',
  Sticky = 'sticky',
  Magnetic = 'magnetic'
}

// Obstacle behavior types
export enum ObstacleBehavior {
  Static = 'static',
  Kinematic = 'kinematic',
  Moving = 'moving',
  Rotating = 'rotating',
  Swinging = 'swinging',
  Falling = 'falling',
  Breakable = 'breakable',
  Triggerable = 'triggerable'
}

// Obstacle geometry types
export enum ObstacleType {
  Box = 'box',
  Sphere = 'sphere',
  Cylinder = 'cylinder',
  Ramp = 'ramp',
  Platform = 'platform',
  Wall = 'wall',
  Bumper = 'bumper',
  Spinner = 'spinner',
  Bridge = 'bridge',
  Portal = 'portal',
  Door = 'door',
  Button = 'button',
  Lever = 'lever',
  Teleporter = 'teleporter',
  Trampoline = 'trampoline'
}

// Material physical properties
export interface MaterialProperties {
  friction: number;
  bounciness: number;
  density: number;
  roughness: number;
  metalness: number;
  transparency: number;
  breakable: boolean;
  soundEffect: string;
}

// Default physical properties for materials
export const MaterialPhysicsMap: Record<ObstacleMaterial, MaterialProperties> = {
  [ObstacleMaterial.Wood]: {
    friction: 0.7,
    bounciness: 0.3,
    density: 0.8,
    roughness: 0.7,
    metalness: 0.1,
    transparency: 0,
    breakable: true,
    soundEffect: 'wood_hit'
  },
  [ObstacleMaterial.Metal]: {
    friction: 0.5,
    bounciness: 0.5,
    density: 1.5,
    roughness: 0.1,
    metalness: 0.9,
    transparency: 0,
    breakable: false,
    soundEffect: 'metal_hit'
  },
  [ObstacleMaterial.Glass]: {
    friction: 0.2,
    bounciness: 0.7,
    density: 1.0,
    roughness: 0.1,
    metalness: 0.1,
    transparency: 0.7,
    breakable: true,
    soundEffect: 'glass_hit'
  },
  [ObstacleMaterial.Rubber]: {
    friction: 0.9,
    bounciness: 0.7,
    density: 0.9,
    roughness: 0.9,
    metalness: 0,
    transparency: 0,
    breakable: false,
    soundEffect: 'rubber_hit'
  },
  [ObstacleMaterial.Bouncy]: {
    friction: 0.5,
    bounciness: 1.5,
    density: 0.7,
    roughness: 0.7,
    metalness: 0.1,
    transparency: 0,
    breakable: false,
    soundEffect: 'bounce'
  },
  [ObstacleMaterial.Ice]: {
    friction: 0.1,
    bounciness: 0.6,
    density: 0.9,
    roughness: 0.1,
    metalness: 0.2,
    transparency: 0.3,
    breakable: true,
    soundEffect: 'ice_hit'
  },
  [ObstacleMaterial.Sticky]: {
    friction: 1.0,
    bounciness: 0.1,
    density: 0.8,
    roughness: 0.8,
    metalness: 0,
    transparency: 0,
    breakable: false,
    soundEffect: 'sticky_hit'
  },
  [ObstacleMaterial.Magnetic]: {
    friction: 0.6,
    bounciness: 0.4,
    density: 1.2,
    roughness: 0.3,
    metalness: 0.8,
    transparency: 0,
    breakable: false,
    soundEffect: 'magnetic_hit'
  }
};

// Obstacle behavior functions and properties
export interface BehaviorHandler {
  initialize: (obstacle: ObstacleInstance) => void;
  update: (obstacle: ObstacleInstance, deltaTime: number) => void;
  handleCollision?: (obstacle: ObstacleInstance, otherObject: any, collisionPoint: THREE.Vector3) => void;
  handleTrigger?: (obstacle: ObstacleInstance, activator: any) => void;
  cleanup?: (obstacle: ObstacleInstance) => void;
}

// Map of behavior handlers
export const BehaviorHandlers: Record<ObstacleBehavior, BehaviorHandler> = {
  [ObstacleBehavior.Static]: {
    initialize: () => {},
    update: () => {}
  },
  
  [ObstacleBehavior.Kinematic]: {
    initialize: (obstacle) => {
      // Store initial position/rotation for reference
      obstacle.userData.initialPosition = obstacle.position.clone();
      obstacle.userData.initialRotation = obstacle.rotation.clone();
    },
    update: () => {}
  },
  
  [ObstacleBehavior.Moving]: {
    initialize: (obstacle) => {
      const pathPoints = obstacle.userData.pathPoints || [];
      if (pathPoints.length < 2) {
        console.warn('Moving obstacle needs at least 2 path points');
        return;
      }
      
      obstacle.userData.pathIndex = 0;
      obstacle.userData.targetPoint = new THREE.Vector3(...pathPoints[0]);
      obstacle.userData.nextPoint = new THREE.Vector3(...pathPoints[1]);
      obstacle.userData.moveProgress = 0;
      obstacle.userData.movingForward = true;
      obstacle.userData.speed = obstacle.userData.speed || 1;
    },
    update: (obstacle, deltaTime) => {
      const pathPoints = obstacle.userData.pathPoints || [];
      if (pathPoints.length < 2) return;
      
      const speed = obstacle.userData.speed * deltaTime;
      const pathIndex = obstacle.userData.pathIndex;
      const movingForward = obstacle.userData.movingForward;
      
      // Current target and next point
      const currentPoint = new THREE.Vector3(...pathPoints[pathIndex]);
      const nextIndex = movingForward ? 
        (pathIndex + 1) % pathPoints.length : 
        (pathIndex - 1 + pathPoints.length) % pathPoints.length;
      const nextPoint = new THREE.Vector3(...pathPoints[nextIndex]);
      
      // Direction and distance to next point
      const direction = nextPoint.clone().sub(currentPoint).normalize();
      const distanceToTravel = speed;
      const distanceToTarget = obstacle.position.distanceTo(nextPoint);
      
      if (distanceToTravel >= distanceToTarget) {
        // Reached the target point, move to next
        obstacle.position.copy(nextPoint);
        
        if (movingForward && nextIndex === pathPoints.length - 1) {
          // Reached the end, reverse direction
          obstacle.userData.movingForward = false;
          obstacle.userData.pathIndex = pathPoints.length - 1;
        } else if (!movingForward && nextIndex === 0) {
          // Reached the start, reverse direction
          obstacle.userData.movingForward = true;
          obstacle.userData.pathIndex = 0;
        } else {
          // Continue in current direction
          obstacle.userData.pathIndex = nextIndex;
        }
      } else {
        // Move toward next point
        const movement = direction.multiplyScalar(distanceToTravel);
        obstacle.position.add(movement);
      }
    }
  },
  
  [ObstacleBehavior.Rotating]: {
    initialize: (obstacle) => {
      obstacle.userData.rotationAxis = obstacle.userData.rotationAxis || new THREE.Vector3(0, 1, 0);
      obstacle.userData.rotationSpeed = obstacle.userData.speed || 1;
    },
    update: (obstacle, deltaTime) => {
      const axis = obstacle.userData.rotationAxis;
      const speed = obstacle.userData.rotationSpeed * deltaTime;
      
      obstacle.rotateOnAxis(axis, speed);
    }
  },
  
  [ObstacleBehavior.Swinging]: {
    initialize: (obstacle) => {
      obstacle.userData.swingAxis = obstacle.userData.swingAxis || new THREE.Vector3(0, 0, 1);
      obstacle.userData.swingMaxAngle = obstacle.userData.swingMaxAngle || Math.PI / 4;
      obstacle.userData.swingSpeed = obstacle.userData.speed || 1;
      obstacle.userData.swingTime = 0;
      obstacle.userData.initialRotation = obstacle.rotation.clone();
    },
    update: (obstacle, deltaTime) => {
      const maxAngle = obstacle.userData.swingMaxAngle;
      const speed = obstacle.userData.swingSpeed;
      
      obstacle.userData.swingTime += deltaTime * speed;
      const angle = Math.sin(obstacle.userData.swingTime) * maxAngle;
      
      // Reset to initial rotation first
      obstacle.rotation.copy(obstacle.userData.initialRotation);
      
      // Apply swing rotation
      const axis = obstacle.userData.swingAxis;
      obstacle.rotateOnAxis(axis, angle);
    }
  },
  
  [ObstacleBehavior.Falling]: {
    initialize: (obstacle) => {
      obstacle.userData.isFalling = false;
      obstacle.userData.fallDelay = obstacle.userData.fallDelay || 0;
      obstacle.userData.fallSpeed = obstacle.userData.fallSpeed || 9.81;
      obstacle.userData.velocity = new THREE.Vector3(0, 0, 0);
      obstacle.userData.initialPosition = obstacle.position.clone();
    },
    update: (obstacle, deltaTime) => {
      if (obstacle.userData.isFalling) {
        // Apply gravity
        obstacle.userData.velocity.y -= obstacle.userData.fallSpeed * deltaTime;
        
        // Move object
        const movement = obstacle.userData.velocity.clone().multiplyScalar(deltaTime);
        obstacle.position.add(movement);
        
        // Check if below floor level
        if (obstacle.position.y < -50) {
          // Reset position
          obstacle.position.copy(obstacle.userData.initialPosition);
          obstacle.userData.velocity.set(0, 0, 0);
          obstacle.userData.isFalling = false;
        }
      }
    },
    handleCollision: (obstacle, otherObject) => {
      if (!obstacle.userData.isFalling && otherObject.type === 'ball') {
        // Start falling after a delay
        setTimeout(() => {
          obstacle.userData.isFalling = true;
        }, obstacle.userData.fallDelay * 1000);
      }
    }
  },
  
  [ObstacleBehavior.Breakable]: {
    initialize: (obstacle) => {
      obstacle.userData.health = obstacle.userData.health || 100;
      obstacle.userData.breakThreshold = obstacle.userData.breakThreshold || 10;
      obstacle.userData.broken = false;
    },
    update: () => {},
    handleCollision: (obstacle, otherObject, collisionPoint) => {
      if (obstacle.userData.broken) return;
      
      // Calculate impact force
      const impactForce = otherObject.velocity ? otherObject.velocity.length() * otherObject.mass : 0;
      
      if (impactForce > obstacle.userData.breakThreshold) {
        // Reduce health based on impact
        obstacle.userData.health -= impactForce;
        
        // Check if broken
        if (obstacle.userData.health <= 0) {
          obstacle.userData.broken = true;
          obstacle.visible = false;
          
          // Create break effect
          if (obstacle.parent && typeof obstacle.userData.onBreak === 'function') {
            obstacle.userData.onBreak(obstacle, collisionPoint);
          }
        }
      }
    }
  },
  
  [ObstacleBehavior.Triggerable]: {
    initialize: (obstacle) => {
      obstacle.userData.isTriggered = false;
      obstacle.userData.triggerCooldown = obstacle.userData.triggerCooldown || 1;
      obstacle.userData.lastTriggerTime = 0;
      obstacle.userData.triggeredObjects = obstacle.userData.triggeredObjects || [];
    },
    update: () => {},
    handleCollision: (obstacle, otherObject) => {
      const now = Date.now();
      const cooldownTime = obstacle.userData.triggerCooldown * 1000;
      
      if (now - obstacle.userData.lastTriggerTime > cooldownTime && otherObject.type === 'ball') {
        obstacle.userData.isTriggered = true;
        obstacle.userData.lastTriggerTime = now;
        
        // Trigger linked objects
        if (typeof obstacle.userData.onTrigger === 'function') {
          obstacle.userData.onTrigger(obstacle, otherObject);
        }
        
        // Reset trigger after a short time
        setTimeout(() => {
          obstacle.userData.isTriggered = false;
        }, 500);
      }
    }
  }
};

// Full obstacle instance with physics and rendering data
export interface ObstacleInstance extends THREE.Object3D {
  id: string;
  type: string;
  materialType: ObstacleMaterial;
  behavior: ObstacleBehavior;
  mass: number;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  velocity?: THREE.Vector3;
  userData: {
    [key: string]: any;
  };
}

// Factory for creating obstacle instances
export class ObstacleFactory {
  private static instance: ObstacleFactory;
  private obstacleCounter: number = 0;
  
  private constructor() {
    // Private constructor to enforce singleton
  }
  
  public static getInstance(): ObstacleFactory {
    if (!ObstacleFactory.instance) {
      ObstacleFactory.instance = new ObstacleFactory();
    }
    return ObstacleFactory.instance;
  }
  
  // Create a new obstacle instance
  public createObstacle(
    type: ObstacleType,
    material: ObstacleMaterial = ObstacleMaterial.Wood,
    behavior: ObstacleBehavior = ObstacleBehavior.Static,
    options: {
      position?: THREE.Vector3,
      rotation?: THREE.Euler,
      scale?: THREE.Vector3,
      mass?: number,
      color?: string,
      id?: string,
      [key: string]: any
    } = {}
  ): ObstacleInstance {
    // Generate a unique ID if not provided
    const id = options.id || `obstacle-${type}-${this.obstacleCounter++}`;
    
    // Set default values
    const position = options.position || new THREE.Vector3(0, 0, 0);
    const rotation = options.rotation || new THREE.Euler(0, 0, 0);
    const scale = options.scale || new THREE.Vector3(1, 1, 1);
    const mass = options.mass !== undefined ? options.mass : (behavior === ObstacleBehavior.Static ? 0 : 1);
    const color = options.color || '#ffffff';
    
    // Create the base object
    const obstacle = new THREE.Group() as ObstacleInstance;
    obstacle.position.copy(position);
    obstacle.rotation.copy(rotation);
    obstacle.scale.copy(scale);
    
    // Set obstacle properties
    obstacle.id = id;
    obstacle.type = type;
    obstacle.materialType = material;
    obstacle.behavior = behavior;
    obstacle.mass = mass;
    
    // Set additional data
    obstacle.userData = { 
      ...options,
      materialProperties: MaterialPhysicsMap[material]
    };
    
    // Initialize behavior
    BehaviorHandlers[behavior].initialize(obstacle);
    
    // Add mesh based on type
    this.addGeometryForType(obstacle, type, color, material);
    
    return obstacle;
  }
  
  // Update an obstacle's behavior
  public updateObstacle(obstacle: ObstacleInstance, deltaTime: number): void {
    // Apply behavior update
    const behaviorHandler = BehaviorHandlers[obstacle.behavior];
    if (behaviorHandler && behaviorHandler.update) {
      behaviorHandler.update(obstacle, deltaTime);
    }
  }
  
  // Handle collision for an obstacle
  public handleCollision(obstacle: ObstacleInstance, otherObject: any, collisionPoint: THREE.Vector3): void {
    const behaviorHandler = BehaviorHandlers[obstacle.behavior];
    if (behaviorHandler && behaviorHandler.handleCollision) {
      behaviorHandler.handleCollision(obstacle, otherObject, collisionPoint);
    }
  }
  
  // Add appropriate geometry based on obstacle type
  private addGeometryForType(
    obstacle: ObstacleInstance,
    type: ObstacleType,
    color: string,
    material: ObstacleMaterial
  ): void {
    const materialProps = MaterialPhysicsMap[material];
    
    // Create base material
    const meshMaterial = new THREE.MeshStandardMaterial({
      color: color,
      roughness: materialProps.roughness,
      metalness: materialProps.metalness,
      transparent: materialProps.transparency > 0,
      opacity: 1 - materialProps.transparency
    });
    
    let mesh: THREE.Mesh;
    
    switch (type) {
      case ObstacleType.Box:
        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(1, 1, 1),
          meshMaterial
        );
        break;
        
      case ObstacleType.Sphere:
        mesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.5, 32, 32),
          meshMaterial
        );
        break;
        
      case ObstacleType.Cylinder:
        mesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.5, 0.5, 1, 32),
          meshMaterial
        );
        break;
        
      case ObstacleType.Ramp:
        // Create a custom ramp shape
        const rampShape = new THREE.Shape();
        rampShape.moveTo(-0.5, -0.5);
        rampShape.lineTo(0.5, -0.5);
        rampShape.lineTo(0.5, 0.5);
        rampShape.lineTo(-0.5, -0.5);
        
        const extrudeSettings = {
          depth: 1,
          bevelEnabled: false
        };
        
        mesh = new THREE.Mesh(
          new THREE.ExtrudeGeometry(rampShape, extrudeSettings),
          meshMaterial
        );
        mesh.rotation.y = Math.PI / 2;
        break;
        
      case ObstacleType.Platform:
        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(1, 0.2, 1),
          meshMaterial
        );
        break;
        
      case ObstacleType.Wall:
        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.5, 1, 1),
          meshMaterial
        );
        break;
        
      case ObstacleType.Bumper:
        const bumperGroup = new THREE.Group();
        
        // Base cylinder
        const base = new THREE.Mesh(
          new THREE.CylinderGeometry(0.5, 0.5, 0.3, 32),
          meshMaterial
        );
        
        // Top cushion with different color
        const cushionMaterial = new THREE.MeshStandardMaterial({
          color: '#ff3b69',
          roughness: 0.7,
          metalness: 0.1
        });
        
        const cushion = new THREE.Mesh(
          new THREE.TorusGeometry(0.5, 0.1, 16, 32),
          cushionMaterial
        );
        cushion.rotation.x = Math.PI / 2;
        cushion.position.y = 0.15;
        
        bumperGroup.add(base);
        bumperGroup.add(cushion);
        mesh = bumperGroup as unknown as THREE.Mesh;
        break;
        
      case ObstacleType.Spinner:
        const spinnerGroup = new THREE.Group();
        
        // Center hub
        const hub = new THREE.Mesh(
          new THREE.CylinderGeometry(0.2, 0.2, 0.2, 16),
          meshMaterial
        );
        hub.rotation.x = Math.PI / 2;
        
        // Arms
        const arm1 = new THREE.Mesh(
          new THREE.BoxGeometry(2, 0.1, 0.1),
          meshMaterial
        );
        
        const arm2 = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 0.1, 2),
          meshMaterial
        );
        
        spinnerGroup.add(hub);
        spinnerGroup.add(arm1);
        spinnerGroup.add(arm2);
        mesh = spinnerGroup as unknown as THREE.Mesh;
        break;
        
      case ObstacleType.Bridge:
        // Segmented bridge
        const bridgeGroup = new THREE.Group();
        
        // Create segments
        const segmentCount = 5;
        for (let i = 0; i < segmentCount; i++) {
          const segment = new THREE.Mesh(
            new THREE.BoxGeometry(0.18, 0.05, 1),
            meshMaterial
          );
          segment.position.x = (i - (segmentCount - 1) / 2) * 0.2;
          bridgeGroup.add(segment);
        }
        
        mesh = bridgeGroup as unknown as THREE.Mesh;
        break;
        
      case ObstacleType.Portal:
        const portalGroup = new THREE.Group();
        
        // Portal ring
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.5, 0.1, 16, 32),
          new THREE.MeshStandardMaterial({
            color: '#4cc9f0',
            emissive: '#4cc9f0',
            emissiveIntensity: 0.5,
            roughness: 0.3,
            metalness: 0.8
          })
        );
        
        // Center effect
        const center = new THREE.Mesh(
          new THREE.CircleGeometry(0.4, 32),
          new THREE.MeshStandardMaterial({
            color: '#3a86ff',
            emissive: '#3a86ff',
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
          })
        );
        center.position.z = 0.01;
        
        portalGroup.add(ring);
        portalGroup.add(center);
        mesh = portalGroup as unknown as THREE.Mesh;
        break;
        
      case ObstacleType.Door:
        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.2, 1, 1),
          meshMaterial
        );
        break;
        
      case ObstacleType.Button:
        const buttonGroup = new THREE.Group();
        
        // Base
        const buttonBase = new THREE.Mesh(
          new THREE.CylinderGeometry(0.5, 0.5, 0.1, 32),
          new THREE.MeshStandardMaterial({
            color: '#333333',
            roughness: 0.7,
            metalness: 0.3
          })
        );
        
        // Button top
        const buttonTop = new THREE.Mesh(
          new THREE.CylinderGeometry(0.3, 0.3, 0.1, 32),
          new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.3,
            metalness: 0.5,
            emissive: color,
            emissiveIntensity: 0.3
          })
        );
        buttonTop.position.y = 0.1;
        
        buttonGroup.add(buttonBase);
        buttonGroup.add(buttonTop);
        mesh = buttonGroup as unknown as THREE.Mesh;
        break;
        
      case ObstacleType.Lever:
        const leverGroup = new THREE.Group();
        
        // Base
        const leverBase = new THREE.Mesh(
          new THREE.BoxGeometry(0.4, 0.1, 0.4),
          new THREE.MeshStandardMaterial({
            color: '#333333',
            roughness: 0.7,
            metalness: 0.3
          })
        );
        
        // Lever arm
        const leverArm = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 0.5, 0.1),
          new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.3,
            metalness: 0.7
          })
        );
        leverArm.position.y = 0.25;
        
        // Pivot point
        leverArm.position.z = 0.1;
        leverArm.rotation.x = -Math.PI / 4;
        
        leverGroup.add(leverBase);
        leverGroup.add(leverArm);
        mesh = leverGroup as unknown as THREE.Mesh;
        break;
        
      case ObstacleType.Teleporter:
        const teleporterGroup = new THREE.Group();
        
        // Base platform
        const teleBase = new THREE.Mesh(
          new THREE.CylinderGeometry(0.5, 0.5, 0.1, 32),
          new THREE.MeshStandardMaterial({
            color: '#333333',
            roughness: 0.5,
            metalness: 0.7
          })
        );
        
        // Teleport effect
        const teleEffect = new THREE.Mesh(
          new THREE.CylinderGeometry(0.4, 0.4, 0.2, 32, 1, true),
          new THREE.MeshStandardMaterial({
            color: '#ff00ff',
            emissive: '#ff00ff',
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
          })
        );
        teleEffect.position.y = 0.15;
        
        teleporterGroup.add(teleBase);
        teleporterGroup.add(teleEffect);
        mesh = teleporterGroup as unknown as THREE.Mesh;
        break;
        
      case ObstacleType.Trampoline:
        const trampolineGroup = new THREE.Group();
        
        // Base frame
        const frame = new THREE.Mesh(
          new THREE.RingGeometry(0.4, 0.5, 32),
          new THREE.MeshStandardMaterial({
            color: '#333333',
            roughness: 0.5,
            metalness: 0.3
          })
        );
        frame.rotation.x = Math.PI / 2;
        
        // Bounce surface
        const surface = new THREE.Mesh(
          new THREE.CircleGeometry(0.4, 32),
          new THREE.MeshStandardMaterial({
            color: '#ff3b69',
            roughness: 0.7,
            metalness: 0.1
          })
        );
        surface.rotation.x = Math.PI / 2;
        surface.position.y = -0.05;
        
        trampolineGroup.add(frame);
        trampolineGroup.add(surface);
        mesh = trampolineGroup as unknown as THREE.Mesh;
        break;
        
      default:
        // Default to box if unknown type
        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(1, 1, 1),
          meshMaterial
        );
    }
    
    // Enable shadows
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    obstacle.add(mesh);
  }
}

