import React, { useState, useEffect, useRef } from 'react';
import { Role, Message, Character, DiceRollResult, AppMode } from './types';
import { startGameSession, streamMessageToDM } from './services/gemini';
import ChatInterface from './components/ChatInterface';
import DiceTray from './components/DiceTray';
import CharacterPanel from './components/CharacterPanel';
import CharacterCreator from './components/CharacterCreator';
import { Send, Menu, RefreshCw, AlertTriangle, Users, Plus, Play, LogOut } from 'lucide-react';

const App: React.FC = () => {
  // --- STATE ---
  const [mode, setMode] = useState<AppMode>('LOBBY');
  const [roomCode, setRoomCode] = useState('');
  
  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Data State
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // UI State
  const [showMobilePanel, setShowMobilePanel] = useState(false);

  // --- LIFECYCLE & PERSISTENCE ---

  // Load characters on mount
  useEffect(() => {
    const savedChars = localStorage.getItem('dnd_characters');
    if (savedChars) {
      setCharacters(JSON.parse(savedChars));
    }
  }, []);

  // Save characters on change
  useEffect(() => {
    localStorage.setItem('dnd_characters', JSON.stringify(characters));
  }, [characters]);

  // Load/Save Room Chat History
  useEffect(() => {
    if (mode === 'GAME' && roomCode) {
      const savedChat = localStorage.getItem(`dnd_chat_${roomCode}`);
      if (savedChat) {
        setMessages(JSON.parse(savedChat));
      } else {
        setMessages([]);
      }
    }
  }, [mode, roomCode]);

  useEffect(() => {
    if (mode === 'GAME' && roomCode && messages.length > 0) {
      localStorage.setItem(`dnd_chat_${roomCode}`, JSON.stringify(messages));
    }
  }, [messages, mode, roomCode]);


  // --- HANDLERS ---

  const handleCreateNewCharacter = () => {
    setMode('CREATOR');
    setError(null);
  };

  const handleCharacterCreated = (newChar: Character) => {
    setCharacters(prev => [...prev, newChar]);
    setMode('LOBBY');
    setSelectedCharacterId(newChar.id);
  };

  const handleJoinGame = async () => {
    if (!selectedCharacterId || !roomCode.trim()) return;
    
    const char = characters.find(c => c.id === selectedCharacterId);
    if (!char) return;

    setMode('GAME');
    setIsLoading(true);
    
    // Check if we have existing history for this room to resume
    const savedChat = localStorage.getItem(`dnd_chat_${roomCode}`);
    const history = savedChat ? JSON.parse(savedChat) : [];

    try {
      const response = await startGameSession(char, roomCode, history);
      if (response) {
        // Only append if it returned a new intro (i.e. new game)
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          role: Role.MODEL,
          text: response,
          timestamp: Date.now()
        }]);
      } else if (history.length > 0) {
        setMessages(history);
      }
    } catch (e) {
      setError("Failed to join game session.");
      setMode('LOBBY');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (overrideText?: string, isAction: boolean = false) => {
    const textToSend = overrideText || input;
    if (!textToSend.trim() || isLoading) return;

    // UI Updates
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: Role.USER,
      text: textToSend,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMsg]);
    if (!overrideText) setInput('');
    setIsLoading(true);

    try {
      let fullResponse = "";
      const assistantId = crypto.randomUUID();
      
      // Add placeholder for AI response
      setMessages(prev => [...prev, {
        id: assistantId,
        role: Role.MODEL,
        text: "...",
        timestamp: Date.now()
      }]);

      const stream = streamMessageToDM(textToSend);
      
      for await (const chunk of stream) {
        fullResponse += chunk;
        setMessages(prev => prev.map(m => 
          m.id === assistantId ? { ...m, text: fullResponse } : m
        ));
      }

    } catch (e) {
      console.error(e);
      setError("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiceRoll = (result: DiceRollResult) => {
    if (mode !== 'GAME') return;
    const text = `[Rolled ${result.die}: ${result.value}]`;
    handleSendMessage(text, true);
  };

  const deleteCharacter = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCharacters(prev => prev.filter(c => c.id !== id));
    if (selectedCharacterId === id) setSelectedCharacterId(null);
  };

  // --- RENDERING ---

  // 1. LOBBY VIEW
  if (mode === 'LOBBY') {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4 font-sans text-stone-900">
        <div className="max-w-md w-full bg-white rounded-xl shadow-xl border border-stone-200 overflow-hidden">
          <div className="bg-stone-900 p-6 text-center">
            <h1 className="font-fantasy text-3xl text-amber-500 mb-2">Dungeon Master AI</h1>
            <p className="text-stone-400 text-sm">Join a campaign or create your hero</p>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Room Code */}
            <div>
              <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Room Code</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="ENTER CODE (e.g. CAMPAIGN-1)"
                  className="flex-1 bg-stone-50 border border-stone-300 rounded px-3 py-2 font-mono uppercase focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <p className="text-[10px] text-stone-400 mt-1">Share this code with friends (or yourself) to join the same game world.</p>
            </div>

            {/* Character Selection */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold uppercase text-stone-500">Your Character</label>
                <button 
                  onClick={handleCreateNewCharacter}
                  className="text-xs flex items-center gap-1 text-amber-600 hover:text-amber-700 font-semibold"
                >
                  <Plus size={14} /> Create New
                </button>
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {characters.length === 0 ? (
                  <div className="text-center py-6 border-2 border-dashed border-stone-200 rounded-lg text-stone-400 text-sm">
                    No characters found. Create one to begin!
                  </div>
                ) : (
                  characters.map(char => (
                    <div 
                      key={char.id}
                      onClick={() => setSelectedCharacterId(char.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex justify-between items-center ${
                        selectedCharacterId === char.id 
                          ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-500' 
                          : 'border-stone-200 hover:border-amber-300 bg-white'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-stone-800">{char.name}</div>
                        <div className="text-xs text-stone-500">{char.race} {char.class} (Lvl {char.level})</div>
                      </div>
                      <button 
                        onClick={(e) => deleteCharacter(char.id, e)}
                        className="text-stone-300 hover:text-red-500 p-1"
                      >
                        <LogOut size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Main Action */}
            <button 
              onClick={handleJoinGame}
              disabled={!selectedCharacterId || !roomCode}
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg transform active:scale-95"
            >
              <Play size={20} /> Enter Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. CREATOR VIEW
  if (mode === 'CREATOR') {
    return (
      <CharacterCreator 
        onComplete={handleCharacterCreated}
        onCancel={() => setMode('LOBBY')}
      />
    );
  }

  // 3. GAME VIEW (Original Layout + Mods)
  const activeChar = characters.find(c => c.id === selectedCharacterId);

  return (
    <div className="flex h-screen w-full bg-white text-stone-900 overflow-hidden font-sans">
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative">
        <header className="h-14 border-b border-stone-200 bg-white/90 backdrop-blur flex items-center justify-between px-4 z-20 shrink-0">
          <div className="flex items-center gap-3">
             <h1 className="font-fantasy text-xl text-amber-600 tracking-wider hidden sm:block">Dungeon Master AI</h1>
             <div className="px-2 py-0.5 bg-stone-100 rounded text-xs font-mono text-stone-500 border border-stone-200">
               Room: {roomCode}
             </div>
          </div>
          <div className="flex items-center gap-2">
            {!process.env.API_KEY && (
              <div className="flex items-center gap-1 text-red-600 text-xs border border-red-200 bg-red-50 px-2 py-1 rounded">
                <AlertTriangle size={14} /> API Key Missing
              </div>
            )}
            <button 
              onClick={() => setMode('LOBBY')}
              className="text-xs text-stone-500 hover:text-red-600 px-3 py-1 rounded hover:bg-stone-100"
            >
              Leave Game
            </button>
            <button 
              className="lg:hidden p-2 text-stone-500"
              onClick={() => setShowMobilePanel(!showMobilePanel)}
            >
              <Menu size={20} />
            </button>
          </div>
        </header>

        {error && (
          <div className="bg-red-50 border-b border-red-200 text-red-800 px-4 py-2 text-sm text-center shrink-0">
            {error}
          </div>
        )}

        <ChatInterface messages={messages} isLoading={isLoading} />

        {/* Input Area */}
        <div className="z-20 bg-stone-50 border-t border-stone-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] shrink-0">
          <DiceTray onRoll={handleDiceRoll} disabled={isLoading} />
          
          <div className="p-3 sm:p-4 flex gap-2 max-w-5xl mx-auto">
            <div className="relative flex-1">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={`What does ${activeChar?.name} do?`}
                className="w-full bg-white border border-stone-300 rounded-lg pl-4 pr-12 py-3 text-stone-900 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600/50 resize-none h-14 min-h-[3.5rem] max-h-32 transition-all shadow-sm"
              />
              <button 
                onClick={() => handleSendMessage()}
                disabled={isLoading || !input.trim()}
                className="absolute right-2 top-2 p-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:bg-stone-300 text-white rounded transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar - Desktop */}
      <div className="hidden lg:block h-full border-l border-stone-200">
        <CharacterPanel 
          characters={characters} 
          setCharacters={setCharacters}
          activeCharacterId={selectedCharacterId}
          setActiveCharacterId={setSelectedCharacterId}
        />
      </div>

      {/* Sidebar - Mobile Overlay */}
      {showMobilePanel && (
        <div className="absolute inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowMobilePanel(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-stone-50 shadow-2xl animate-slide-in">
             <div className="flex justify-end p-2 border-b border-stone-200">
               <button onClick={() => setShowMobilePanel(false)} className="text-stone-500 p-2">✕</button>
             </div>
             <CharacterPanel 
                characters={characters} 
                setCharacters={setCharacters}
                activeCharacterId={selectedCharacterId}
                setActiveCharacterId={setSelectedCharacterId}
              />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;