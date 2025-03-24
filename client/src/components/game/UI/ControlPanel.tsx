import { useState, useEffect } from 'react';
import { useKeyboardControls } from '@react-three/drei';
import { Controls } from '../../../App';
import { usePhysics } from '../../../lib/stores/usePhysics';
import { useSettings } from '../../../lib/stores/useSettings';
import { useAudio } from '../../../lib/stores/useAudio';
import { useLevel } from '../../../lib/stores/useLevel';

const ControlPanel = () => {
  const [showPanel, setShowPanel] = useState(true);
  const [activeTab, setActiveTab] = useState('physics');
  const physics = usePhysics();
  const settings = useSettings();
  const audio = useAudio();
  const level = useLevel();
  
  // Get keyboard state
  const forward = useKeyboardControls<Controls>(state => state.forward);
  const backward = useKeyboardControls<Controls>(state => state.backward);
  const leftward = useKeyboardControls<Controls>(state => state.leftward);
  const rightward = useKeyboardControls<Controls>(state => state.rightward);
  const jump = useKeyboardControls<Controls>(state => state.jump);
  
  // Listen for key press to toggle panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        setShowPanel(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  if (!showPanel) {
    return (
      <div className="absolute bottom-5 right-5 bg-gray-800 bg-opacity-75 text-white text-sm py-2 px-4 rounded-lg">
        Press Tab to show controls
      </div>
    );
  }
  
  return (
    <div className="absolute top-5 right-5 w-80 bg-gray-800 bg-opacity-90 text-white rounded-lg shadow-lg overflow-hidden">
      <div className="px-4 py-3 bg-gray-700 flex justify-between items-center">
        <h2 className="font-bold">Control Panel</h2>
        <button 
          onClick={() => setShowPanel(false)}
          className="text-gray-300 hover:text-white"
        >
          ×
        </button>
      </div>
      
      <div className="flex border-b border-gray-700">
        <button
          className={`px-4 py-2 ${activeTab === 'physics' ? 'bg-blue-700' : 'bg-transparent'}`}
          onClick={() => setActiveTab('physics')}
        >
          Physics
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'visuals' ? 'bg-blue-700' : 'bg-transparent'}`}
          onClick={() => setActiveTab('visuals')}
        >
          Visuals
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'audio' ? 'bg-blue-700' : 'bg-transparent'}`}
          onClick={() => setActiveTab('audio')}
        >
          Audio
        </button>
      </div>
      
      <div className="p-4 max-h-96 overflow-y-auto">
        {activeTab === 'physics' && (
          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-sm">Gravity</label>
              <input
                type="range"
                min="0"
                max="20"
                step="0.1"
                value={physics.gravity}
                onChange={(e) => physics.setGravity(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs mt-1">
                <span>0</span>
                <span>{physics.gravity.toFixed(1)}</span>
                <span>20</span>
              </div>
            </div>
            
            <div>
              <label className="block mb-2 text-sm">Bounciness</label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.05"
                value={physics.bounciness}
                onChange={(e) => physics.setBounciness(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs mt-1">
                <span>0</span>
                <span>{physics.bounciness.toFixed(2)}</span>
                <span>2</span>
              </div>
            </div>
            
            <div>
              <label className="block mb-2 text-sm">Friction</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={physics.friction}
                onChange={(e) => physics.setFriction(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs mt-1">
                <span>0</span>
                <span>{physics.friction.toFixed(2)}</span>
                <span>1</span>
              </div>
            </div>
            
            <div>
              <label className="block mb-2 text-sm">Wind Force</label>
              <div className="flex gap-2">
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="0.5"
                  value={physics.windForce}
                  onChange={(e) => physics.setWindForce(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
                <span className="w-10 text-center">{physics.windForce.toFixed(1)}</span>
              </div>
            </div>
            
            <div className="border-t border-gray-700 pt-4">
              <h3 className="font-semibold mb-2">Add Objects</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => physics.createBall({
                    position: [0, 10, 0],
                    radius: 1,
                    color: '#' + Math.floor(Math.random()*16777215).toString(16)
                  })}
                  className="bg-blue-600 py-2 px-3 rounded hover:bg-blue-700"
                >
                  Add Ball
                </button>
                <button
                  onClick={() => physics.createObstacle({
                    type: 'box',
                    position: [Math.random() * 10 - 5, 5, Math.random() * 10 - 5],
                    scale: [1, 1, 1],
                    color: '#' + Math.floor(Math.random()*16777215).toString(16)
                  })}
                  className="bg-purple-600 py-2 px-3 rounded hover:bg-purple-700"
                >
                  Add Box
                </button>
                <button
                  onClick={() => physics.createObstacle({
                    type: 'ramp',
                    position: [Math.random() * 10 - 5, 0.5, Math.random() * 10 - 5],
                    rotation: [0, Math.random() * Math.PI * 2, 0],
                    scale: [3, 1, 3],
                    color: '#' + Math.floor(Math.random()*16777215).toString(16)
                  })}
                  className="bg-green-600 py-2 px-3 rounded hover:bg-green-700"
                >
                  Add Ramp
                </button>
                <button
                  onClick={() => physics.createPowerUp({
                    type: ['speed', 'jump', 'gravity', 'size', 'multiplier'][Math.floor(Math.random() * 5)] as any,
                    position: [Math.random() * 10 - 5, 1, Math.random() * 10 - 5]
                  })}
                  className="bg-yellow-600 py-2 px-3 rounded hover:bg-yellow-700"
                >
                  Add Power-Up
                </button>
              </div>
            </div>
            
            <div className="border-t border-gray-700 pt-4">
              <h3 className="font-semibold mb-2">Special Effects</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => physics.triggerExplosion(
                    new THREE.Vector3(0, 2, 0), 
                    5, 
                    10
                  )}
                  className="bg-red-600 py-2 px-3 rounded hover:bg-red-700"
                >
                  Explosion
                </button>
                <button
                  onClick={() => physics.reverseGravity(5)}
                  className="bg-indigo-600 py-2 px-3 rounded hover:bg-indigo-700"
                >
                  Reverse Gravity
                </button>
                <button
                  onClick={() => physics.slowMotion(0.3, 3)}
                  className="bg-teal-600 py-2 px-3 rounded hover:bg-teal-700"
                >
                  Slow Motion
                </button>
                <button
                  onClick={() => physics.applyImpulseToAllBalls(
                    new THREE.Vector3(0, 15, 0)
                  )}
                  className="bg-pink-600 py-2 px-3 rounded hover:bg-pink-700"
                >
                  Super Jump
                </button>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'visuals' && (
          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-sm">Graphics Quality</label>
              <select
                value={settings.lightingQuality}
                onChange={(e) => settings.setLightingQuality(e.target.value as any)}
                className="w-full bg-gray-700 py-2 px-3 rounded"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm">Shadows</label>
              <div className="relative inline-block w-12 h-6 rounded-full bg-gray-700">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={settings.shadows}
                  onChange={() => settings.toggleShadows()}
                />
                <span
                  className={`absolute left-1 top-1 w-4 h-4 rounded-full transition-transform ${
                    settings.shadows ? 'transform translate-x-6 bg-blue-500' : 'bg-gray-400'
                  }`}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm">Camera Shake</label>
              <div className="relative inline-block w-12 h-6 rounded-full bg-gray-700">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={settings.cameraShake}
                  onChange={() => settings.toggleCameraShake()}
                />
                <span
                  className={`absolute left-1 top-1 w-4 h-4 rounded-full transition-transform ${
                    settings.cameraShake ? 'transform translate-x-6 bg-blue-500' : 'bg-gray-400'
                  }`}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm">Dynamic Lighting</label>
              <div className="relative inline-block w-12 h-6 rounded-full bg-gray-700">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={settings.dynamicLighting}
                  onChange={() => settings.toggleDynamicLighting()}
                />
                <span
                  className={`absolute left-1 top-1 w-4 h-4 rounded-full transition-transform ${
                    settings.dynamicLighting ? 'transform translate-x-6 bg-blue-500' : 'bg-gray-400'
                  }`}
                />
              </div>
            </div>
            
            <div>
              <label className="block mb-2 text-sm">Environment</label>
              <select
                value={settings.environment}
                onChange={(e) => settings.setEnvironment(e.target.value as any)}
                className="w-full bg-gray-700 py-2 px-3 rounded"
              >
                <option value="day">Day</option>
                <option value="sunset">Sunset</option>
                <option value="night">Night</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm">Debug Mode</label>
              <div className="relative inline-block w-12 h-6 rounded-full bg-gray-700">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={settings.debug}
                  onChange={() => settings.toggleDebug()}
                />
                <span
                  className={`absolute left-1 top-1 w-4 h-4 rounded-full transition-transform ${
                    settings.debug ? 'transform translate-x-6 bg-blue-500' : 'bg-gray-400'
                  }`}
                />
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'audio' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm">Sound Effects</label>
              <div className="relative inline-block w-12 h-6 rounded-full bg-gray-700">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={!audio.isMuted}
                  onChange={() => audio.toggleMute()}
                />
                <span
                  className={`absolute left-1 top-1 w-4 h-4 rounded-full transition-transform ${
                    !audio.isMuted ? 'transform translate-x-6 bg-blue-500' : 'bg-gray-400'
                  }`}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm">Background Music</label>
              <div className="relative inline-block w-12 h-6 rounded-full bg-gray-700">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={settings.musicEnabled}
                  onChange={() => settings.toggleMusic()}
                />
                <span
                  className={`absolute left-1 top-1 w-4 h-4 rounded-full transition-transform ${
                    settings.musicEnabled ? 'transform translate-x-6 bg-blue-500' : 'bg-gray-400'
                  }`}
                />
              </div>
            </div>
            
            <div>
              <label className="block mb-2 text-sm">Volume</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={settings.volume}
                onChange={(e) => settings.setVolume(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs mt-1">
                <span>0%</span>
                <span>{Math.round(settings.volume * 100)}%</span>
                <span>100%</span>
              </div>
            </div>
            
            <div className="border-t border-gray-700 pt-4">
              <h3 className="font-semibold mb-2">Test Sounds</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => audio.playHit()}
                  className="bg-blue-600 py-2 px-3 rounded hover:bg-blue-700"
                >
                  Play Hit
                </button>
                <button
                  onClick={() => audio.playSuccess()}
                  className="bg-green-600 py-2 px-3 rounded hover:bg-green-700"
                >
                  Play Success
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-gray-700">
        <div className="mb-3">
          <h3 className="font-semibold mb-2">Current Level: {level.currentLevel}</h3>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => level.prevLevel()}
              className="bg-gray-700 py-1 px-2 rounded hover:bg-gray-600"
              disabled={level.currentLevel <= 1}
            >
              Previous
            </button>
            <button
              onClick={() => level.reloadLevel()}
              className="bg-gray-700 py-1 px-2 rounded hover:bg-gray-600"
            >
              Reload
            </button>
            <button
              onClick={() => level.nextLevel()}
              className="bg-gray-700 py-1 px-2 rounded hover:bg-gray-600"
            >
              Next
            </button>
          </div>
        </div>
        
        <div className="text-xs text-gray-400">
          <div>Controls: WASD - Move, Space - Jump, C - Change Camera</div>
          <div>Tab - Toggle Control Panel</div>
        </div>
        
        <div className="text-xs mt-2 text-gray-500">
          Active keys: {[
            forward && 'Forward',
            backward && 'Backward',
            leftward && 'Left',
            rightward && 'Right',
            jump && 'Jump'
          ].filter(Boolean).join(', ') || 'None'}
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
