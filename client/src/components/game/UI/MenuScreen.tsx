import { useState, useEffect } from 'react';
import { useGame } from '../../../lib/stores/useGame';
import { useLevel } from '../../../lib/stores/useLevel';
import { useSettings } from '../../../lib/stores/useSettings';
import { useScore } from '../../../lib/stores/useScore';

const MenuScreen = () => {
  const [activeTab, setActiveTab] = useState('main');
  const [loadingGame, setLoadingGame] = useState(false);
  const game = useGame();
  const level = useLevel();
  const settings = useSettings();
  const score = useScore();
  
  // Predefined game modes
  const gameModes = [
    { id: 'sandbox', name: 'Sandbox', description: 'Experiment with physics and create your own scenes' },
    { id: 'challenge', name: 'Challenge Mode', description: 'Complete objectives across multiple levels' },
    { id: 'destruction', name: 'Destruction Challenge', description: 'Cause maximum destruction with limited resources' },
    { id: 'puzzle', name: 'Physics Puzzles', description: 'Solve complex physics-based puzzles' },
    { id: 'race', name: 'Time Trial', description: 'Race against the clock in precision courses' }
  ];
  
  const startGame = (gameMode: string, levelNumber: number = 1) => {
    setLoadingGame(true);
    
    // Reset scores and set game mode
    score.reset();
    
    // Set up selected level
    level.setCurrentLevel(levelNumber);
    
    // Short artificial delay for loading effect
    setTimeout(() => {
      game.start();
      setLoadingGame(false);
    }, 500);
  };
  
  useEffect(() => {
    // Start with a fresh level configuration
    level.initialize();
    
    // Add keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && activeTab === 'main') {
        startGame('sandbox');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeTab]);
  
  return (
    <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center">
      {/* Background visual effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated background elements - We'll create floating particles */}
        {Array.from({ length: 50 }).map((_, i) => {
          const size = Math.random() * 10 + 5;
          const startPos = {
            x: Math.random() * 100,
            y: Math.random() * 100,
          };
          const speed = Math.random() * 20 + 10;
          
          return (
            <div
              key={i}
              className="absolute rounded-full bg-blue-500 opacity-10"
              style={{
                width: size,
                height: size,
                left: `${startPos.x}%`,
                top: `${startPos.y}%`,
                animation: `float-particle ${speed}s linear infinite`,
                animationDelay: `${Math.random() * -speed}s`,
              }}
            />
          );
        })}
      </div>
      
      {/* Main content */}
      <div className="z-10 w-full max-w-3xl px-4">
        <h1 className="text-5xl font-bold text-center text-white mb-3">
          PhysicsSandbox
          <span className="text-blue-500">3D</span>
        </h1>
        <p className="text-gray-300 text-center mb-10">
          An advanced physics playground with realistic interactions
        </p>
        
        {loadingGame ? (
          <div className="bg-gray-800 rounded-lg p-8 text-white text-center">
            <h2 className="text-xl font-semibold mb-4">Loading Game...</h2>
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 animate-pulse" style={{ width: '100%' }}></div>
            </div>
            <p className="mt-4 text-gray-400">Preparing physics environment...</p>
          </div>
        ) : (
          <div className="bg-gray-800 bg-opacity-95 rounded-lg overflow-hidden shadow-xl">
            {/* Tab navigation */}
            <div className="flex text-white border-b border-gray-700">
              <button
                onClick={() => setActiveTab('main')}
                className={`px-4 py-3 font-medium ${activeTab === 'main' ? 'bg-blue-700' : 'bg-transparent hover:bg-gray-700'}`}
              >
                Play
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-3 font-medium ${activeTab === 'settings' ? 'bg-blue-700' : 'bg-transparent hover:bg-gray-700'}`}
              >
                Settings
              </button>
              <button
                onClick={() => setActiveTab('about')}
                className={`px-4 py-3 font-medium ${activeTab === 'about' ? 'bg-blue-700' : 'bg-transparent hover:bg-gray-700'}`}
              >
                About
              </button>
            </div>
            
            {/* Tab content */}
            <div className="p-6">
              {activeTab === 'main' && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-4">Select Game Mode</h2>
                  
                  <div className="grid gap-3">
                    {gameModes.map(mode => (
                      <button
                        key={mode.id}
                        onClick={() => startGame(mode.id)}
                        className="flex items-center bg-gray-700 hover:bg-gray-600 p-4 rounded-lg text-white transition-colors"
                      >
                        <div>
                          <h3 className="font-bold">{mode.name}</h3>
                          <p className="text-sm text-gray-300">{mode.description}</p>
                        </div>
                      </button>
                    ))}
                    
                    <button
                      onClick={() => game.setPhase('level_select')}
                      className="flex items-center justify-center bg-blue-700 hover:bg-blue-600 p-3 rounded-lg text-white font-semibold transition-colors mt-2"
                    >
                      Level Selection
                    </button>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-bold text-white mb-2">Quick Start</h3>
                    <p className="text-gray-300 text-sm mb-3">
                      Jump right into a ready-made scene with different physics challenges.
                    </p>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => startGame('sandbox', 1)}
                        className="bg-gray-700 hover:bg-gray-600 p-2 rounded text-white text-sm"
                      >
                        Sandbox World
                      </button>
                      <button
                        onClick={() => startGame('challenge', 2)}
                        className="bg-gray-700 hover:bg-gray-600 p-2 rounded text-white text-sm"
                      >
                        Obstacle Course
                      </button>
                      <button
                        onClick={() => startGame('destruction', 3)}
                        className="bg-gray-700 hover:bg-gray-600 p-2 rounded text-white text-sm"
                      >
                        Tower Collapse
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'settings' && (
                <div className="text-white">
                  <h2 className="text-xl font-bold mb-4">Game Settings</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Graphics Quality</h3>
                      <div className="flex gap-2">
                        {['low', 'medium', 'high'].map(quality => (
                          <button
                            key={quality}
                            onClick={() => settings.setLightingQuality(quality as any)}
                            className={`flex-1 py-2 rounded ${
                              settings.lightingQuality === quality 
                                ? 'bg-blue-600' 
                                : 'bg-gray-700 hover:bg-gray-600'
                            }`}
                          >
                            {quality.charAt(0).toUpperCase() + quality.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">Environment</h3>
                      <div className="flex gap-2">
                        {['day', 'sunset', 'night'].map(env => (
                          <button
                            key={env}
                            onClick={() => settings.setEnvironment(env as any)}
                            className={`flex-1 py-2 rounded ${
                              settings.environment === env 
                                ? 'bg-blue-600' 
                                : 'bg-gray-700 hover:bg-gray-600'
                            }`}
                          >
                            {env.charAt(0).toUpperCase() + env.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between bg-gray-700 p-3 rounded">
                        <span>Shadows</span>
                        <div 
                          className={`w-12 h-6 rounded-full p-1 flex ${settings.shadows ? 'bg-blue-600 justify-end' : 'bg-gray-600'}`}
                          onClick={() => settings.toggleShadows()}
                        >
                          <div className="w-4 h-4 bg-white rounded-full"></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between bg-gray-700 p-3 rounded">
                        <span>Music</span>
                        <div 
                          className={`w-12 h-6 rounded-full p-1 flex ${settings.musicEnabled ? 'bg-blue-600 justify-end' : 'bg-gray-600'}`}
                          onClick={() => settings.toggleMusic()}
                        >
                          <div className="w-4 h-4 bg-white rounded-full"></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between bg-gray-700 p-3 rounded">
                        <span>Sound Effects</span>
                        <div 
                          className={`w-12 h-6 rounded-full p-1 flex ${!settings.soundsMuted ? 'bg-blue-600 justify-end' : 'bg-gray-600'}`}
                          onClick={() => settings.toggleSounds()}
                        >
                          <div className="w-4 h-4 bg-white rounded-full"></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between bg-gray-700 p-3 rounded">
                        <span>Camera Shake</span>
                        <div 
                          className={`w-12 h-6 rounded-full p-1 flex ${settings.cameraShake ? 'bg-blue-600 justify-end' : 'bg-gray-600'}`}
                          onClick={() => settings.toggleCameraShake()}
                        >
                          <div className="w-4 h-4 bg-white rounded-full"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">Volume: {Math.round(settings.volume * 100)}%</h3>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={settings.volume}
                        onChange={(e) => settings.setVolume(parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    
                    <button
                      onClick={() => settings.resetToDefaults()}
                      className="w-full bg-gray-700 hover:bg-gray-600 p-2 rounded mt-4"
                    >
                      Reset to Defaults
                    </button>
                  </div>
                </div>
              )}
              
              {activeTab === 'about' && (
                <div className="text-white">
                  <h2 className="text-xl font-bold mb-4">About PhysicsSandbox3D</h2>
                  
                  <p className="mb-4">
                    PhysicsSandbox3D is an advanced 3D physics simulation environment where you can experiment with realistic physics, create challenging scenarios, and enjoy various game modes.
                  </p>
                  
                  <h3 className="font-semibold mb-2">Controls</h3>
                  <ul className="space-y-1 mb-4 text-gray-300">
                    <li><span className="text-white font-medium">WASD</span> - Move camera/control active object</li>
                    <li><span className="text-white font-medium">Space</span> - Jump/Apply force</li>
                    <li><span className="text-white font-medium">C</span> - Change camera mode</li>
                    <li><span className="text-white font-medium">Tab</span> - Toggle control panel</li>
                    <li><span className="text-white font-medium">Esc</span> - Pause menu</li>
                  </ul>
                  
                  <h3 className="font-semibold mb-2">Key Features</h3>
                  <ul className="list-disc pl-5 space-y-1 mb-4 text-gray-300">
                    <li>Realistic physics simulation</li>
                    <li>Multiple game modes and challenges</li>
                    <li>Advanced particle and visual effects</li>
                    <li>Various objects and power-ups</li>
                    <li>Level editor and custom scenarios</li>
                    <li>Dynamic lighting and environments</li>
                  </ul>
                  
                  <div className="mt-6 text-center text-sm text-gray-400">
                    <p>Created with React Three Fiber</p>
                    <p>Version 1.0.0</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes float-particle {
          0% {
            transform: translateY(0) rotate(0deg);
          }
          100% {
            transform: translateY(-100vh) rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default MenuScreen;
