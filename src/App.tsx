import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, TransformControls, Grid, ContactShadows, Environment } from '@react-three/drei';
import { 
  Menu, X, Settings, HelpCircle, Plus, Trash2, 
  Move, RotateCw, Maximize, Box, Circle, Triangle, 
  Layers, RefreshCcw, Sun, Moon, Palette, MousePointer2
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import * as THREE from 'three';

// --- Types ---

type ShapeType = 'cube' | 'sphere' | 'cone' | 'torus' | 'cylinder' | 'icosahedron';

interface SceneObject {
  id: string;
  type: ShapeType;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  autoRotate?: boolean;
}

// --- Components ---

const Geometry = ({ type }: { type: ShapeType }) => {
  switch (type) {
    case 'cube': return <boxGeometry args={[1, 1, 1]} />;
    case 'sphere': return <sphereGeometry args={[0.6, 32, 32]} />;
    case 'cone': return <coneGeometry args={[0.6, 1.2, 32]} />;
    case 'torus': return <torusGeometry args={[0.5, 0.2, 16, 100]} />;
    case 'cylinder': return <cylinderGeometry args={[0.5, 0.5, 1, 32]} />;
    case 'icosahedron': return <icosahedronGeometry args={[0.7, 0]} />;
    default: return <boxGeometry />;
  }
};

const DraggableObject = ({
  obj,
  isSelected,
  mode,
  onSelect,
  onChange,
}: {
  obj: SceneObject;
  isSelected: boolean;
  mode: 'translate' | 'rotate' | 'scale';
  onSelect: () => void;
  onChange: (newProps: Partial<SceneObject>) => void;
}) => {
  const [mesh, setMesh] = useState<THREE.Mesh | null>(null);

  useFrame((state, delta) => {
    if (obj.autoRotate && mesh && !isSelected) {
      mesh.rotation.x += delta * 0.5;
      mesh.rotation.y += delta * 0.5;
    }
  });

  return (
    <>
      {isSelected && mesh && (
        <TransformControls
          object={mesh}
          mode={mode}
          onObjectChange={() => {
            if (mesh) {
              onChange({
                position: mesh.position.toArray(),
                rotation: mesh.rotation.toArray().slice(0, 3) as [number, number, number],
                scale: mesh.scale.toArray(),
              });
            }
          }}
        />
      )}
      <mesh
        ref={setMesh}
        position={obj.position}
        rotation={obj.rotation}
        scale={obj.scale}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <Geometry type={obj.type} />
        <meshStandardMaterial 
          color={obj.color} 
          roughness={0.3} 
          metalness={0.1} 
        />
      </mesh>
    </>
  );
};

// --- Main App ---

export default function App() {
  // State
  const [objects, setObjects] = useState<SceneObject[]>([
    { 
      id: '1', 
      type: 'cube', 
      position: [0, 0, 0], 
      rotation: [0, 0, 0], 
      scale: [1, 1, 1], 
      color: '#4f46e5', 
      autoRotate: true 
    }
  ]);
  const [selectedId, setSelectedId] = useState<string | null>('1');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showReadme, setShowReadme] = useState(false);
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [accentColor, setAccentColor] = useState('blue');

  // Handlers
  const addObject = (type: ShapeType) => {
    const newObj: SceneObject = {
      id: uuidv4(),
      type,
      position: [Math.random() * 4 - 2, Math.random() * 2, Math.random() * 4 - 2],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#' + Math.floor(Math.random()*16777215).toString(16),
      autoRotate: false,
    };
    setObjects([...objects, newObj]);
    setSelectedId(newObj.id);
  };

  const updateObject = (id: string, props: Partial<SceneObject>) => {
    setObjects(prev => prev.map(o => o.id === id ? { ...o, ...props } : o));
  };

  const deleteSelected = () => {
    if (selectedId) {
      setObjects(prev => prev.filter(o => o.id !== selectedId));
      setSelectedId(null);
    }
  };

  const clearScene = () => {
    setObjects([]);
    setSelectedId(null);
  };

  const selectedObject = objects.find(o => o.id === selectedId);

  // Theme Classes
  const bgClass = theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900';
  const panelClass = theme === 'dark' ? 'bg-gray-800/95 border-gray-700' : 'bg-white/95 border-gray-200';
  const inputClass = theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900';
  const sectionHeaderClass = "text-xs font-bold uppercase tracking-wider opacity-60 mb-2 flex items-center gap-2";

  return (
    <div className={`w-full h-full relative overflow-hidden ${bgClass}`}>
      
      {/* --- 3D Canvas --- */}
      <div className="absolute inset-0 z-0">
        <Canvas shadows camera={{ position: [4, 4, 6], fov: 50 }}>
          <Suspense fallback={null}>
            <Environment preset="city" />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} castShadow />
            <Grid infiniteGrid fadeDistance={30} sectionColor={theme === 'dark' ? '#444' : '#ccc'} cellColor={theme === 'dark' ? '#222' : '#eee'} />
            
            {objects.map(obj => (
              <DraggableObject
                key={obj.id}
                obj={obj}
                isSelected={selectedId === obj.id}
                mode={transformMode}
                onSelect={() => setSelectedId(obj.id)}
                onChange={(props) => updateObject(obj.id, props)}
              />
            ))}

            <ContactShadows position={[0, -0.01, 0]} opacity={0.5} scale={20} blur={2} far={4.5} />
            <OrbitControls makeDefault />
          </Suspense>
        </Canvas>
      </div>

      {/* --- Top Left Menu Button --- */}
      <button 
        onClick={() => setIsMenuOpen(true)}
        className={`absolute top-4 left-4 z-50 p-2 rounded-lg shadow-lg transition-colors ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'}`}
      >
        <Menu size={24} />
      </button>

      {/* --- Main Menu Panel (Now includes Scene Manager) --- */}
      {isMenuOpen && (
        <div className={`absolute top-0 left-0 w-80 h-full z-50 shadow-2xl transform transition-transform duration-300 ${panelClass} border-r backdrop-blur-sm flex flex-col`}>
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700/20 shrink-0">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Box className="text-indigo-500" /> 3D Studio
            </h2>
            <button onClick={() => setIsMenuOpen(false)} className="p-1 hover:bg-gray-500/20 rounded">
              <X size={20} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            
            {/* SECTION: Add Objects */}
            <div>
              <h3 className={sectionHeaderClass}><Plus size={14} /> Add Objects</h3>
              <div className="grid grid-cols-3 gap-2">
                {[ 
                  { id: 'cube', icon: Box }, 
                  { id: 'sphere', icon: Circle }, 
                  { id: 'cone', icon: Triangle },
                  { id: 'torus', icon: RefreshCcw },
                  { id: 'cylinder', icon: Layers },
                  { id: 'icosahedron', icon: Sun }
                ].map((shape) => (
                  <button
                    key={shape.id}
                    onClick={() => addObject(shape.id as ShapeType)}
                    className={`p-2 rounded flex flex-col items-center justify-center gap-1 text-[10px] transition-colors border border-transparent ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                    title={`Add ${shape.id}`}
                  >
                    <shape.icon size={16} />
                    <span className="capitalize">{shape.id.slice(0,4)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* SECTION: Selected Object Properties */}
            <div>
              <h3 className={sectionHeaderClass}><MousePointer2 size={14} /> Properties</h3>
              <div className={`p-3 rounded-lg border ${theme === 'dark' ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                {selectedObject ? (
                  <div className="space-y-4">
                    {/* Header & Delete */}
                    <div className="flex items-center justify-between border-b border-gray-500/20 pb-2">
                      <span className="text-sm font-bold uppercase text-indigo-500">{selectedObject.type}</span>
                      <button 
                        onClick={deleteSelected}
                        className="text-red-500 hover:bg-red-500/10 p-1 rounded transition-colors"
                        title="Delete Object"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Color Picker */}
                    <div className="space-y-1">
                      <label className="text-xs opacity-70">Color</label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={selectedObject.color} 
                          onChange={(e) => updateObject(selectedObject.id, { color: e.target.value })}
                          className="w-8 h-8 rounded cursor-pointer border-0"
                        />
                        <input 
                          type="text" 
                          value={selectedObject.color} 
                          onChange={(e) => updateObject(selectedObject.id, { color: e.target.value })}
                          className={`flex-1 px-2 text-sm rounded border ${inputClass}`}
                        />
                      </div>
                    </div>

                    {/* Position Inputs */}
                    <div className="space-y-1">
                      <label className="text-xs opacity-70">Position (X, Y, Z)</label>
                      <div className="grid grid-cols-3 gap-1">
                        {[0, 1, 2].map((axis) => (
                          <input
                            key={axis}
                            type="number"
                            step="0.1"
                            value={selectedObject.position[axis].toFixed(2)}
                            onChange={(e) => {
                              const newPos = [...selectedObject.position] as [number, number, number];
                              newPos[axis] = parseFloat(e.target.value);
                              updateObject(selectedObject.id, { position: newPos });
                            }}
                            className={`w-full px-1 py-1 text-xs rounded border ${inputClass}`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Auto Rotate Toggle */}
                    <div className="flex items-center justify-between pt-1">
                      <label className="text-sm">Auto Rotate</label>
                      <button 
                        onClick={() => updateObject(selectedObject.id, { autoRotate: !selectedObject.autoRotate })}
                        className={`w-10 h-5 rounded-full relative transition-colors ${selectedObject.autoRotate ? 'bg-green-500' : 'bg-gray-500'}`}
                      >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${selectedObject.autoRotate ? 'left-6' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center opacity-50 py-4 text-sm italic">
                    Select an object in the scene to edit properties.
                  </div>
                )}
              </div>
            </div>

            {/* SECTION: Scene Actions */}
            <div>
              <h3 className={sectionHeaderClass}><Layers size={14} /> Scene Actions</h3>
              <button 
                onClick={clearScene}
                className="w-full py-2 px-4 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20 text-sm font-medium transition-colors border border-red-500/20"
              >
                Clear All Objects
              </button>
            </div>

            {/* SECTION: Appearance */}
            <div>
              <h3 className={sectionHeaderClass}><Palette size={14} /> Appearance</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Theme Mode</span>
                  <button 
                    onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${theme === 'dark' ? 'bg-indigo-600 text-white' : 'bg-yellow-400 text-black'}`}
                  >
                    {theme === 'dark' ? 'Dark' : 'Light'}
                  </button>
                </div>

                <div className="space-y-2">
                  <span className="text-sm">Accent Color</span>
                  <div className="flex gap-2">
                    {['blue', 'purple', 'green', 'red', 'orange'].map(c => (
                      <button
                        key={c}
                        onClick={() => setAccentColor(c)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${accentColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION: Info */}
            <div>
              <h3 className={sectionHeaderClass}><HelpCircle size={14} /> Info</h3>
              <button 
                onClick={() => setShowReadme(true)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors border ${theme === 'dark' ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700' : 'bg-gray-100 border-gray-200 hover:bg-gray-200'}`}
              >
                <HelpCircle size={20} className="text-blue-500" />
                <span className="font-medium">Help & About</span>
              </button>
              <div className="mt-2 text-xs opacity-50 text-center">
                Objects: {objects.length} | Selected: {selectedId ? 'Yes' : 'No'}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- README Modal --- */}
      {showReadme && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className={`relative w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-xl shadow-2xl p-6 ${panelClass}`}>
            <button 
              onClick={() => setShowReadme(false)} 
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-500/20"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold mb-4">Welcome to 3D Studio</h2>
            <div className="space-y-4 leading-relaxed opacity-90">
              <p>This is a fully interactive 3D scene editor running directly in your browser.</p>
              
              <h3 className="text-lg font-semibold mt-4">Controls</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Rotate Camera:</strong> Left Click + Drag (or one finger touch)</li>
                <li><strong>Pan Camera:</strong> Right Click + Drag (or two finger touch)</li>
                <li><strong>Zoom:</strong> Scroll Wheel (or pinch)</li>
                <li><strong>Select Object:</strong> Click on any shape</li>
              </ul>

              <h3 className="text-lg font-semibold mt-4">Object Manipulation</h3>
              <p>When an object is selected, use the gizmo handles to move it. You can change properties in the main menu.</p>

              <h3 className="text-lg font-semibold mt-4">Features</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Add various shapes (Cube, Sphere, Torus, etc.)</li>
                <li>Toggle "Auto Rotate" for dynamic effects</li>
                <li>Change colors and materials</li>
                <li>Dark/Light mode support</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* --- Bottom Controls (Transform Modes) --- */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-40">
        {[ 
          { id: 'translate', icon: Move }, 
          { id: 'rotate', icon: RotateCw }, 
          { id: 'scale', icon: Maximize } 
        ].map((mode) => (
          <button
            key={mode.id}
            onClick={() => setTransformMode(mode.id as any)}
            className={`p-3 rounded-full shadow-lg backdrop-blur-md border transition-all ${transformMode === mode.id ? 'bg-indigo-600 text-white border-indigo-500 scale-110' : `${panelClass} hover:scale-105`}`}
            title={`${mode.id.charAt(0).toUpperCase() + mode.id.slice(1)} Mode`}
          >
            <mode.icon size={20} />
          </button>
        ))}
      </div>

    </div>
  );
}