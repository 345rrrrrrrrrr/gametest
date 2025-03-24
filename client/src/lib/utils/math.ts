import * as THREE from 'three';

// Clamp a number between min and max values
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Linear interpolation
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Three.js Vector3 linear interpolation
export function lerpVector3(a: THREE.Vector3, b: THREE.Vector3, t: number): THREE.Vector3 {
  return new THREE.Vector3(
    lerp(a.x, b.x, t),
    lerp(a.y, b.y, t),
    lerp(a.z, b.z, t)
  );
}

// Smooth step interpolation
export function smoothStep(a: number, b: number, t: number): number {
  t = clamp(t, 0, 1);
  t = t * t * (3 - 2 * t);
  return a + (b - a) * t;
}

// Smooth damp (similar to Unity's Mathf.SmoothDamp)
export function smoothDamp(
  current: number,
  target: number,
  currentVelocity: { value: number },
  smoothTime: number,
  maxSpeed: number = Infinity,
  deltaTime: number
): number {
  smoothTime = Math.max(0.0001, smoothTime);
  const omega = 2 / smoothTime;
  
  const x = omega * deltaTime;
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  
  let change = current - target;
  const originalTarget = target;
  
  // Clamp maximum speed
  const maxChange = maxSpeed * smoothTime;
  change = clamp(change, -maxChange, maxChange);
  
  target = current - change;
  
  const temp = (currentVelocity.value + omega * change) * deltaTime;
  currentVelocity.value = (currentVelocity.value - omega * temp) * exp;
  
  let output = target + (change + temp) * exp;
  
  // Prevent overshooting
  if (originalTarget - current > 0 === output > originalTarget) {
    output = originalTarget;
    currentVelocity.value = (output - originalTarget) / deltaTime;
  }
  
  return output;
}

// Smooth damp for THREE.Vector3
export function smoothDampVector3(
  current: THREE.Vector3,
  target: THREE.Vector3,
  currentVelocity: THREE.Vector3,
  smoothTime: number,
  maxSpeed: number = Infinity,
  deltaTime: number
): THREE.Vector3 {
  const velocityX = { value: currentVelocity.x };
  const velocityY = { value: currentVelocity.y };
  const velocityZ = { value: currentVelocity.z };
  
  const x = smoothDamp(current.x, target.x, velocityX, smoothTime, maxSpeed, deltaTime);
  const y = smoothDamp(current.y, target.y, velocityY, smoothTime, maxSpeed, deltaTime);
  const z = smoothDamp(current.z, target.z, velocityZ, smoothTime, maxSpeed, deltaTime);
  
  currentVelocity.set(velocityX.value, velocityY.value, velocityZ.value);
  
  return new THREE.Vector3(x, y, z);
}

// Convert degrees to radians
export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Convert radians to degrees
export function radToDeg(radians: number): number {
  return radians * (180 / Math.PI);
}

// Get a random float between min and max
export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// Get a random integer between min (inclusive) and max (inclusive)
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Get a random THREE.Vector3 with components in specified ranges
export function randomVector3(
  minX: number, maxX: number,
  minY: number, maxY: number,
  minZ: number, maxZ: number
): THREE.Vector3 {
  return new THREE.Vector3(
    randomFloat(minX, maxX),
    randomFloat(minY, maxY),
    randomFloat(minZ, maxZ)
  );
}

// Get a random color
export function randomColor(): THREE.Color {
  return new THREE.Color(Math.random(), Math.random(), Math.random());
}

// Get a random item from an array
export function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Linear mapping from one range to another
export function mapRange(
  value: number, 
  inMin: number, 
  inMax: number, 
  outMin: number, 
  outMax: number
): number {
  return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

// Calculate the distance between two points
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Calculate the distance between two 3D points
export function distance3D(
  x1: number, y1: number, z1: number,
  x2: number, y2: number, z2: number
): number {
  return Math.sqrt(
    Math.pow(x2 - x1, 2) + 
    Math.pow(y2 - y1, 2) + 
    Math.pow(z2 - z1, 2)
  );
}

// Check if a point is inside a sphere
export function pointInSphere(
  point: THREE.Vector3,
  center: THREE.Vector3,
  radius: number
): boolean {
  return point.distanceToSquared(center) <= radius * radius;
}

// Check if a point is inside a box
export function pointInBox(
  point: THREE.Vector3,
  boxMin: THREE.Vector3,
  boxMax: THREE.Vector3
): boolean {
  return (
    point.x >= boxMin.x && point.x <= boxMax.x &&
    point.y >= boxMin.y && point.y <= boxMax.y &&
    point.z >= boxMin.z && point.z <= boxMax.z
  );
}

// Get a normalized direction vector from two points
export function getDirection(
  from: THREE.Vector3,
  to: THREE.Vector3
): THREE.Vector3 {
  return new THREE.Vector3().subVectors(to, from).normalize();
}

// Rotate a 2D point around an origin by an angle (in radians)
export function rotatePoint(
  x: number,
  y: number,
  originX: number,
  originY: number,
  angle: number
): { x: number, y: number } {
  const s = Math.sin(angle);
  const c = Math.cos(angle);
  
  // Translate point back to origin
  const translatedX = x - originX;
  const translatedY = y - originY;
  
  // Rotate point
  const rotatedX = translatedX * c - translatedY * s;
  const rotatedY = translatedX * s + translatedY * c;
  
  // Translate point back
  return {
    x: rotatedX + originX,
    y: rotatedY + originY
  };
}

// Generate a perlin noise value (simplified)
export function perlinNoise(x: number, y: number, z: number = 0): number {
  // This is a placeholder for actual perlin noise implementation
  // In a real project, you'd use a proper noise library
  return (Math.sin(x) + Math.cos(y) + Math.sin(z)) / 3;
}

// Generate a 1D simplex noise value (simplified)
export function simplexNoise(x: number): number {
  // This is a placeholder for actual simplex noise implementation
  return Math.sin(x * 0.1) * 0.5 + 0.5;
}
