import React from 'react';
import { DiceType, DiceRollResult } from '../types';

// Simple text-based dice buttons to match the requested style
const DieIcon = ({ type }: { type: DiceType }) => {
  const baseStyle = "flex items-center justify-center font-bold text-xs sm:text-sm border-2 rounded-lg transition-all active:scale-95 shadow-sm hover:-translate-y-0.5";
  
  switch (type) {
    case 'd4': return <button className={`${baseStyle} w-10 h-10 border-amber-600 text-amber-600 hover:bg-amber-50 bg-white`}>D4</button>;
    case 'd6': return <button className={`${baseStyle} w-10 h-10 border-amber-600 text-amber-600 hover:bg-amber-50 bg-white`}>D6</button>;
    case 'd8': return <button className={`${baseStyle} w-10 h-10 border-amber-600 text-amber-600 hover:bg-amber-50 bg-white`}>D8</button>;
    case 'd10': return <button className={`${baseStyle} w-10 h-10 border-amber-600 text-amber-600 hover:bg-amber-50 bg-white`}>D10</button>;
    case 'd12': return <button className={`${baseStyle} w-10 h-10 border-amber-600 text-amber-600 hover:bg-amber-50 bg-white`}>D12</button>;
    case 'd20': return <button className={`${baseStyle} w-12 h-12 border-red-600 text-red-600 hover:bg-red-50 bg-white shadow-md`}>D20</button>;
    case 'd100': return <button className={`${baseStyle} w-12 h-12 border-blue-600 text-blue-600 hover:bg-blue-50 bg-white`}>D%</button>;
    default: return null;
  }
};

interface DiceTrayProps {
  onRoll: (result: DiceRollResult) => void;
  disabled?: boolean;
}

const DiceTray: React.FC<DiceTrayProps> = ({ onRoll, disabled }) => {

  const handleRoll = (die: DiceType) => {
    if (disabled) return;
    
    const sides = parseInt(die.substring(1));
    const value = Math.floor(Math.random() * sides) + 1;
    
    const result: DiceRollResult = {
      die,
      value,
      timestamp: Date.now()
    };
    
    onRoll(result);
  };

  return (
    <div className={`flex flex-col gap-2 p-3 bg-stone-50 border-t border-stone-200 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex items-center justify-between px-2 mb-1">
        <span className="text-xs uppercase tracking-widest text-stone-400 font-bold">Quick Roll</span>
        <span className="text-[10px] text-stone-400 italic">Click to roll & send</span>
      </div>
      
      <div className="flex flex-wrap items-center gap-3 justify-center">
        <div onClick={() => handleRoll('d4')}><DieIcon type="d4" /></div>
        <div onClick={() => handleRoll('d6')}><DieIcon type="d6" /></div>
        <div onClick={() => handleRoll('d8')}><DieIcon type="d8" /></div>
        <div onClick={() => handleRoll('d10')}><DieIcon type="d10" /></div>
        <div onClick={() => handleRoll('d12')}><DieIcon type="d12" /></div>
        <div onClick={() => handleRoll('d20')}><DieIcon type="d20" /></div>
        <div onClick={() => handleRoll('d100')}><DieIcon type="d100" /></div>
      </div>
    </div>
  );
};

export default DiceTray;