import React, { useState } from 'react';
import { Character } from '../types';
import { User, Heart, Shield, Sword, Plus, Trash2, ChevronDown, ChevronUp, Save, Edit2 } from 'lucide-react';

interface CharacterPanelProps {
  characters: Character[];
  setCharacters: React.Dispatch<React.SetStateAction<Character[]>>;
  activeCharacterId: string | null;
  setActiveCharacterId: (id: string | null) => void;
}

const CharacterPanel: React.FC<CharacterPanelProps> = ({ 
  characters, 
  setCharacters, 
  activeCharacterId, 
  setActiveCharacterId 
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);

  const updateCharacter = (id: string, updates: Partial<Character>) => {
    setCharacters(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  return (
    <div className={`flex flex-col bg-stone-50 h-full transition-all duration-300 ${isOpen ? 'w-80' : 'w-12'}`}>
      {/* Toggle Header */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="h-12 flex items-center justify-center border-b border-stone-200 hover:bg-stone-200 text-stone-500 shrink-0"
      >
        {isOpen ? <ChevronDown className="rotate-[-90deg]" /> : <ChevronUp className="rotate-[-90deg]" />}
      </button>

      {isOpen && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-fantasy text-xl text-amber-600">Party Stats</h2>
          </div>

          {characters.length === 0 && (
            <div className="text-center text-stone-400 text-sm italic py-4">
              Party is empty.
            </div>
          )}

          {characters.map(char => (
            <div 
              key={char.id} 
              className={`p-3 rounded-lg border transition-colors ${
                activeCharacterId === char.id 
                  ? 'border-amber-500 bg-amber-50/50 shadow-sm' 
                  : 'border-stone-200 bg-white shadow-sm'
              }`}
            >
              {isEditing === char.id ? (
                <div className="space-y-2 text-sm">
                  <input 
                    className="w-full bg-white border border-stone-300 rounded px-2 py-1 text-stone-900 placeholder-stone-400 font-bold" 
                    value={char.name} 
                    onChange={e => updateCharacter(char.id, { name: e.target.value })} 
                    placeholder="Name"
                  />
                   <div className="flex gap-2 items-center justify-between">
                    <div className="flex items-center gap-1">
                      <label className="text-stone-500 text-[10px] uppercase">AC</label>
                      <input 
                        type="number"
                        className="w-10 bg-white border border-stone-300 rounded px-1 py-1 text-center text-stone-900"
                        value={char.ac}
                        onChange={e => updateCharacter(char.id, { ac: parseInt(e.target.value) || 10 })}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <label className="text-stone-500 text-[10px] uppercase">HP</label>
                      <input 
                        type="number"
                        className="w-10 bg-white border border-stone-300 rounded px-1 py-1 text-center text-stone-900"
                        value={char.hp}
                        onChange={e => updateCharacter(char.id, { hp: parseInt(e.target.value) || 0 })}
                      />
                      <span className="text-stone-400">/</span>
                      <input 
                        type="number"
                        className="w-10 bg-white border border-stone-300 rounded px-1 py-1 text-center text-stone-900"
                        value={char.maxHp}
                        onChange={e => updateCharacter(char.id, { maxHp: parseInt(e.target.value) || 10 })}
                      />
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsEditing(null); }}
                    className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 py-1.5 rounded text-xs mt-2 text-white"
                  >
                    <Save size={14} /> Save Changes
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-stone-800 leading-tight">{char.name}</h3>
                      <p className="text-xs text-stone-500">{char.race} {char.class} (Lvl {char.level})</p>
                    </div>
                    {activeCharacterId === char.id && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setIsEditing(char.id); }}
                        className="text-stone-400 hover:text-amber-600 p-1"
                        title="Edit Stats"
                      >
                         <Edit2 size={14} />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 bg-stone-100 p-1.5 rounded border border-stone-200/50">
                      <Shield size={14} className="text-blue-500" />
                      <span className="text-xs text-stone-500 uppercase font-bold">AC</span>
                      <span className="font-mono font-bold text-stone-900">{char.ac}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-stone-100 p-1.5 rounded border border-stone-200/50">
                      <Heart size={14} className="text-red-500" />
                      <span className="text-xs text-stone-500 uppercase font-bold">HP</span>
                      <span className={`font-mono font-bold ${char.hp < char.maxHp / 2 ? 'text-red-600' : 'text-stone-900'}`}>{char.hp}/{char.maxHp}</span>
                    </div>
                  </div>
                  
                  {char.stats && (
                    <div className="mt-2 grid grid-cols-6 gap-1 text-[10px] text-center text-stone-500">
                      <div className="bg-white rounded border border-stone-200 py-1">
                        <div className="font-bold">STR</div>
                        <div>{char.stats.str}</div>
                      </div>
                      <div className="bg-white rounded border border-stone-200 py-1">
                        <div className="font-bold">DEX</div>
                        <div>{char.stats.dex}</div>
                      </div>
                       <div className="bg-white rounded border border-stone-200 py-1">
                        <div className="font-bold">CON</div>
                        <div>{char.stats.con}</div>
                      </div>
                       <div className="bg-white rounded border border-stone-200 py-1">
                        <div className="font-bold">INT</div>
                        <div>{char.stats.int}</div>
                      </div>
                       <div className="bg-white rounded border border-stone-200 py-1">
                        <div className="font-bold">WIS</div>
                        <div>{char.stats.wis}</div>
                      </div>
                       <div className="bg-white rounded border border-stone-200 py-1">
                        <div className="font-bold">CHA</div>
                        <div>{char.stats.cha}</div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CharacterPanel;