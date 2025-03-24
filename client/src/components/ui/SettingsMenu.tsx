import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGameState } from '@/lib/stores/useGameState';
import { useSettingsState } from '@/lib/stores/useSettingsState';
import { useAudio } from '@/lib/stores/useAudio';
import { GamePhase } from '@/types/game';
import { 
  ChevronLeft, 
  Volume, 
  Music, 
  SunMedium, 
  Gamepad2, 
  Heart
} from 'lucide-react';

const SettingsMenu = () => {
  const { setPhase } = useGameState();
  const { 
    settings, 
    updateSetting, 
    physicsSettings, 
    updatePhysicsSetting,
    resetSettings
  } = useSettingsState();
  const { backgroundMusic, setBackgroundMusic, isMuted, toggleMute } = useAudio();
  
  // Keep local state for the sliders
  const [soundVolume, setSoundVolume] = useState(settings.soundVolume * 100);
  const [musicVolume, setMusicVolume] = useState(settings.musicVolume * 100);
  const [particleCount, setParticleCount] = useState(settings.particleCount);
  const [mouseSensitivity, setMouseSensitivity] = useState(settings.mouseSensitivity * 100);
  
  // Physics settings sliders
  const [gravity, setGravity] = useState(physicsSettings.gravity * 10);
  const [bounciness, setBounciness] = useState(physicsSettings.defaultBounciness * 100);
  const [friction, setFriction] = useState(physicsSettings.defaultFriction * 100);
  
  // Update the actual settings when slider interaction is complete
  useEffect(() => {
    updateSetting('soundVolume', soundVolume / 100);
  }, [soundVolume, updateSetting]);
  
  useEffect(() => {
    updateSetting('musicVolume', musicVolume / 100);
    if (backgroundMusic) {
      backgroundMusic.volume = (musicVolume / 100) * (isMuted ? 0 : 1);
    }
  }, [musicVolume, updateSetting, backgroundMusic, isMuted]);
  
  useEffect(() => {
    updateSetting('mouseSensitivity', mouseSensitivity / 100);
  }, [mouseSensitivity, updateSetting]);
  
  useEffect(() => {
    updatePhysicsSetting('gravity', gravity / 10);
  }, [gravity, updatePhysicsSetting]);
  
  useEffect(() => {
    updatePhysicsSetting('defaultBounciness', bounciness / 100);
  }, [bounciness, updatePhysicsSetting]);
  
  useEffect(() => {
    updatePhysicsSetting('defaultFriction', friction / 100);
  }, [friction, updatePhysicsSetting]);
  
  const handleBackToMenu = () => {
    setPhase(GamePhase.MENU);
  };
  
  const handleReset = () => {
    // Ask for confirmation before resetting
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      resetSettings();
      
      // Update local state to match reset settings
      setSoundVolume(settings.soundVolume * 100);
      setMusicVolume(settings.musicVolume * 100);
      setParticleCount(settings.particleCount);
      setMouseSensitivity(settings.mouseSensitivity * 100);
      setGravity(physicsSettings.gravity * 10);
      setBounciness(physicsSettings.defaultBounciness * 100);
      setFriction(physicsSettings.defaultFriction * 100);
    }
  };
  
  return (
    <div className="fixed inset-0 game-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="glass-panel p-8">
          <div className="flex justify-between items-center mb-6">
            <Button
              variant="outline"
              onClick={handleBackToMenu}
              className="bg-gray-800/70 hover:bg-gray-700/70"
            >
              <ChevronLeft className="mr-2" size={20} />
              Back
            </Button>
            
            <h2 className="text-2xl font-bold text-center">Settings</h2>
            
            <Button
              variant="outline"
              onClick={handleReset}
              className="bg-gray-800/70 hover:bg-gray-700/70"
            >
              Reset
            </Button>
          </div>
          
          <Tabs defaultValue="audio" className="w-full">
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="audio">Audio</TabsTrigger>
              <TabsTrigger value="visual">Visual</TabsTrigger>
              <TabsTrigger value="gameplay">Gameplay</TabsTrigger>
            </TabsList>
            
            {/* Audio Settings */}
            <TabsContent value="audio" className="space-y-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="flex items-center">
                      <Volume className="mr-2" size={18} />
                      Sound Effects Volume
                    </Label>
                    <span className="text-sm">{Math.round(soundVolume)}%</span>
                  </div>
                  <Slider
                    min={0}
                    max={100}
                    step={1}
                    value={[soundVolume]}
                    onValueChange={(value) => setSoundVolume(value[0])}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="flex items-center">
                      <Music className="mr-2" size={18} />
                      Music Volume
                    </Label>
                    <span className="text-sm">{Math.round(musicVolume)}%</span>
                  </div>
                  <Slider
                    min={0}
                    max={100}
                    step={1}
                    value={[musicVolume]}
                    onValueChange={(value) => setMusicVolume(value[0])}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="flex items-center cursor-pointer">
                    <Music className="mr-2" size={18} />
                    Mute All Audio
                  </Label>
                  <Switch
                    checked={isMuted}
                    onCheckedChange={toggleMute}
                  />
                </div>
              </div>
            </TabsContent>
            
            {/* Visual Settings */}
            <TabsContent value="visual" className="space-y-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Shadow Quality</Label>
                    <span className="text-sm">{settings.shadowQuality}</span>
                  </div>
                  <Select
                    value={settings.shadowQuality}
                    onValueChange={(value) => updateSetting('shadowQuality', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select shadow quality" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Effects Quality</Label>
                    <span className="text-sm">{settings.effectsQuality}</span>
                  </div>
                  <Select
                    value={settings.effectsQuality}
                    onValueChange={(value) => updateSetting('effectsQuality', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select effects quality" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="flex items-center">
                      <SunMedium className="mr-2" size={18} />
                      Particle Count
                    </Label>
                    <span className="text-sm">{particleCount}</span>
                  </div>
                  <Slider
                    min={100}
                    max={5000}
                    step={100}
                    value={[particleCount]}
                    onValueChange={(value) => {
                      setParticleCount(value[0]);
                      updateSetting('particleCount', value[0]);
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="flex items-center cursor-pointer">
                    <SunMedium className="mr-2" size={18} />
                    Camera Shake
                  </Label>
                  <Switch
                    checked={settings.cameraShake}
                    onCheckedChange={(value) => updateSetting('cameraShake', value)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="flex items-center cursor-pointer">
                    Show FPS Counter
                  </Label>
                  <Switch
                    checked={settings.showFPS}
                    onCheckedChange={(value) => updateSetting('showFPS', value)}
                  />
                </div>
              </div>
            </TabsContent>
            
            {/* Gameplay Settings */}
            <TabsContent value="gameplay" className="space-y-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="flex items-center">
                      <Gamepad2 className="mr-2" size={18} />
                      Mouse Sensitivity
                    </Label>
                    <span className="text-sm">{Math.round(mouseSensitivity)}%</span>
                  </div>
                  <Slider
                    min={10}
                    max={200}
                    step={1}
                    value={[mouseSensitivity]}
                    onValueChange={(value) => setMouseSensitivity(value[0])}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Control Type</Label>
                    <span className="text-sm">{settings.controlType}</span>
                  </div>
                  <Select
                    value={settings.controlType}
                    onValueChange={(value) => updateSetting('controlType', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select control type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="keyboard">Keyboard</SelectItem>
                      <SelectItem value="gamepad">Gamepad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="flex items-center cursor-pointer">
                    Invert Y Axis
                  </Label>
                  <Switch
                    checked={settings.invertY}
                    onCheckedChange={(value) => updateSetting('invertY', value)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="flex items-center cursor-pointer">
                    Invert X Axis
                  </Label>
                  <Switch
                    checked={settings.invertX}
                    onCheckedChange={(value) => updateSetting('invertX', value)}
                  />
                </div>
                
                <h3 className="text-lg font-semibold mt-4 pb-2 border-b border-gray-700">
                  Physics Settings
                </h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Gravity</Label>
                    <span className="text-sm">{(gravity / 10).toFixed(1)}</span>
                  </div>
                  <Slider
                    min={0}
                    max={30}
                    step={1}
                    value={[gravity]}
                    onValueChange={(value) => setGravity(value[0])}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Ball Bounciness</Label>
                    <span className="text-sm">{(bounciness / 100).toFixed(2)}</span>
                  </div>
                  <Slider
                    min={0}
                    max={200}
                    step={1}
                    value={[bounciness]}
                    onValueChange={(value) => setBounciness(value[0])}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Surface Friction</Label>
                    <span className="text-sm">{(friction / 100).toFixed(2)}</span>
                  </div>
                  <Slider
                    min={0}
                    max={100}
                    step={1}
                    value={[friction]}
                    onValueChange={(value) => setFriction(value[0])}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            onClick={handleBackToMenu}
            className="bg-blue-600 hover:bg-blue-500"
          >
            Save & Return
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsMenu;
