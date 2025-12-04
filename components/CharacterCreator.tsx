import React, { useState } from 'react';
import { Character } from '../types';
import { Bot, User, ChevronRight, RefreshCw, Dice5, Check, Shield, Heart } from 'lucide-react';

const RACES = ['Human', 'Elf', 'Dwarf', 'Halfling', 'Dragonborn', 'Tiefling', 'Gnome', 'Half-Orc'];
const CLASSES = ['Fighter', 'Wizard', 'Rogue', 'Cleric', 'Ranger', 'Paladin', 'Barbarian', 'Bard', 'Druid', 'Monk', 'Sorcerer', 'Warlock'];

const RANDOM_NAMES = [
  'Aelion', 'Thorgar', 'Elara', 'Grimm', 'Sylas', 'Kaelyn', 'Dorn', 'Zephyr', 
  'Mara', 'Kael', 'Lyra', 'Brom', 'Seraphina', 'Vaelis', 'Isolde', 'Ragnar'
];

interface CharacterCreatorProps {
  onComplete: (char: Character) => void;
  onCancel: () => void;
}

const CharacterCreator: React.FC<CharacterCreatorProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(0);
  const [char, setChar] = useState<Partial<Character>>({
    level: 1,
    hp: 10,
    maxHp: 10,
    ac: 10,
    stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }
  });

  const [nameInput, setNameInput] = useState('');

  // Helper to get priority stats for classes
  const getPriorityStats = (className: string) => {
    switch (className) {
      case 'Barbarian': return ['str', 'con'];
      case 'Bard': return ['cha', 'dex'];
      case 'Cleric': return ['wis', 'con'];
      case 'Druid': return ['wis', 'con'];
      case 'Fighter': return ['str', 'con'];
      case 'Monk': return ['dex', 'wis'];
      case 'Paladin': return ['str', 'cha'];
      case 'Ranger': return ['dex', 'wis'];
      case 'Rogue': return ['dex', 'int'];
      case 'Sorcerer': return ['cha', 'con'];
      case 'Warlock': return ['cha', 'con'];
      case 'Wizard': return ['int', 'dex'];
      default: return ['str', 'dex'];
    }
  };

  const handleRollStats = () => {
    // Roll 4d6 drop lowest 6 times
    const rolls = Array(6).fill(0).map(() => {
      const dice = Array(4).fill(0).map(() => Math.floor(Math.random() * 6) + 1);
      dice.sort((a, b) => a - b);
      return dice.slice(1).reduce((a, b) => a + b, 0);
    });

    // Sort rolls descending
    rolls.sort((a, b) => b - a);

    // Get priorities
    const priorities = getPriorityStats(char.class || 'Fighter');
    const statsObj: any = {};
    const statsList = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

    // Assign highest rolls to priorities
    priorities.forEach((stat, idx) => {
      statsObj[stat] = rolls[idx];
    });

    // Assign remaining
    let rollIdx = priorities.length;
    statsList.forEach(stat => {
      if (!statsObj[stat]) {
        statsObj[stat] = rolls[rollIdx++];
      }
    });

    // Simple HP calc (Max roll + Con mod)
    const conMod = Math.floor((statsObj.con - 10) / 2);
    const hitDie = ['Wizard', 'Sorcerer'].includes(char.class || '') ? 6 : 
                   ['Fighter', 'Paladin', 'Ranger'].includes(char.class || '') ? 10 :
                   ['Barbarian'].includes(char.class || '') ? 12 : 8;
    const maxHp = hitDie + conMod;
    
    // Simple AC calc (10 + Dex mod) - logic varies by class but this is a safe base
    const dexMod = Math.floor((statsObj.dex - 10) / 2);
    const ac = 10 + dexMod;

    setChar(prev => ({
      ...prev,
      stats: statsObj,
      hp: maxHp,
      maxHp: maxHp,
      ac: ac
    }));
    
    setStep(3);
  };

  const handleNameGenerate = () => {
    const random = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    setNameInput(random);
  };

  const finalize = () => {
    onComplete({
      id: crypto.randomUUID(),
      name: nameInput || 'Unknown Hero',
      race: char.race || 'Human',
      class: char.class || 'Fighter',
      level: 1,
      hp: char.hp || 10,
      maxHp: char.maxHp || 10,
      ac: char.ac || 10,
      stats: char.stats,
      notes: "Ready for adventure."
    });
  };

  return (
    <div className="flex flex-col h-screen w-full bg-white max-w-4xl mx-auto shadow-2xl overflow-hidden relative">
       {/* Header */}
      <header className="h-16 border-b border-stone-200 flex items-center justify-between px-6 bg-stone-50 shrink-0 z-10">
        <h2 className="font-fantasy text-xl text-amber-600">Character Creation</h2>
        <button onClick={onCancel} className="text-stone-400 hover:text-stone-600">
          Exit
        </button>
      </header>

      {/* DM Dialogue Area */}
      <div className="bg-stone-100 p-6 flex gap-4 border-b border-stone-200 shrink-0">
        <div className="w-12 h-12 rounded-full bg-amber-100 border-2 border-amber-200 flex items-center justify-center shrink-0">
          <Bot size={24} className="text-amber-600" />
        </div>
        <div className="bg-white p-4 rounded-r-xl rounded-bl-xl shadow-sm border border-stone-200 relative">
          <div className="absolute w-3 h-3 bg-white border-l border-b border-stone-200 rotate-45 -left-1.5 top-4"></div>
          <p className="font-narrative text-stone-800 text-lg">
            {step === 0 && "Welcome, adventurer. Before you step into the world, tell me: what is your lineage?"}
            {step === 1 && `Ah, a ${char.race}. And what discipline have you mastered?`}
            {step === 2 && "A fine choice. Now, let the fates decide your strengths. Roll the dice."}
            {step === 3 && "And finally, what shall you be called in the songs of legend?"}
          </p>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-white">
        
        {/* Step 0: Race */}
        {step === 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-slide-in">
            {RACES.map(race => (
              <button
                key={race}
                onClick={() => { setChar({ ...char, race }); setStep(1); }}
                className="h-24 rounded-lg border-2 border-stone-200 hover:border-amber-500 hover:bg-amber-50 flex items-center justify-center font-bold text-stone-700 hover:text-amber-700 transition-all text-lg shadow-sm hover:shadow-md"
              >
                {race}
              </button>
            ))}
          </div>
        )}

        {/* Step 1: Class */}
        {step === 1 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-slide-in">
            {CLASSES.map(cls => (
              <button
                key={cls}
                onClick={() => { setChar({ ...char, class: cls }); setStep(2); }}
                className="h-20 rounded-lg border-2 border-stone-200 hover:border-amber-500 hover:bg-amber-50 flex items-center justify-center font-bold text-stone-700 hover:text-amber-700 transition-all shadow-sm hover:shadow-md"
              >
                {cls}
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Stats */}
        {step === 2 && (
          <div className="flex flex-col items-center justify-center h-full space-y-8 animate-slide-in">
             <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-stone-800">{char.race} {char.class}</div>
                <div className="text-stone-500">Click below to generate your ability scores</div>
             </div>
             <button 
              onClick={handleRollStats}
              className="w-48 h-48 rounded-full bg-amber-50 border-4 border-amber-200 hover:border-amber-500 flex flex-col items-center justify-center gap-2 group transition-all hover:scale-105 shadow-xl"
             >
               <Dice5 size={48} className="text-amber-600 group-hover:rotate-180 transition-transform duration-500" />
               <span className="font-fantasy text-xl text-amber-800 font-bold">ROLL STATS</span>
             </button>
          </div>
        )}

        {/* Step 3: Name & Finalize */}
        {step === 3 && (
          <div className="max-w-xl mx-auto space-y-8 animate-slide-in">
            
            {/* Stats Summary */}
            <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
               <div className="flex items-center justify-between mb-4 border-b border-stone-200 pb-2">
                 <span className="font-bold text-stone-700">{char.race} {char.class}</span>
                 <div className="flex gap-4 text-sm">
                    <span className="flex items-center gap-1"><Shield size={14} /> AC: {char.ac}</span>
                    <span className="flex items-center gap-1"><Heart size={14} /> HP: {char.maxHp}</span>
                 </div>
               </div>
               <div className="grid grid-cols-6 gap-2 text-center">
                  {Object.entries(char.stats || {}).map(([key, val]) => (
                    <div key={key} className="bg-white p-2 rounded border border-stone-200 shadow-sm">
                      <div className="text-xs uppercase text-stone-500 font-bold">{key}</div>
                      <div className="text-lg font-mono font-bold text-amber-700">{val}</div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-bold text-stone-500 uppercase">Character Name</label>
              <div className="flex gap-3">
                 <input 
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Enter name..."
                  className="flex-1 bg-white border-2 border-stone-300 rounded-lg px-4 py-3 text-lg font-bold text-stone-800 focus:border-amber-500 outline-none"
                 />
                 <button 
                  onClick={handleNameGenerate}
                  className="px-4 py-2 bg-stone-100 border-2 border-stone-300 rounded-lg hover:bg-stone-200 text-stone-600 font-semibold flex items-center gap-2"
                 >
                   <RefreshCw size={20} />
                   Random
                 </button>
              </div>
            </div>

            <button 
              onClick={finalize}
              disabled={!nameInput.trim()}
              className="w-full py-4 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-fantasy text-xl rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
            >
              <Check size={24} />
              Begin Adventure
            </button>
          </div>
        )}

      </div>
      
      {/* Progress Dots */}
      <div className="h-2 bg-stone-100 flex">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`flex-1 transition-colors ${i <= step ? 'bg-amber-500' : 'bg-transparent'}`} />
        ))}
      </div>
    </div>
  );
};

export default CharacterCreator;