import { GoogleGenAI, Chat, GenerativeModel } from "@google/genai";
import { Message, Role, Character } from "../types";

const DM_INSTRUCTION = `
You are a world-class Dungeon Master (DM) for a Dungeons & Dragons 5th Edition (D&D 5e) game. 
Your goal is to run an immersive, fair, and consistent game.

RESPONSIBILITIES:
1. **Narrative**: Describe the setting, environment, NPCs, and atmosphere vividly. Use sensory details.
2. **Mechanics**: 
   - Adhere to D&D 5e rules. 
   - Call for Skill Checks (e.g., Athletics, Sleight of Hand) when outcomes are uncertain. The difficulty (DC) depends on the task.
   - Simple actions (opening unlocked doors) succeed automatically. Impossible actions (lifting buildings) fail automatically.
3. **Combat**:
   - Ask for Initiative rolls at the start of combat. 
   - Generate rolls for NPCs/monsters. 
   - Provide an initiative list at the start of combat.
   - Track HP for all creatures. 
   - On player turns, ask for Attack Rolls vs AC. If hit, ask/calculate damage.
   - On NPC turns, decide their action (Attack, Run, etc.) and generate their rolls.
   - A round is 6 seconds.
4. **Consistency**: 
   - Do not allow actions that conflict with the setting (e.g., no jukeboxes in fantasy taverns).
   - Maintain consistency (dead NPCs stay dead).

DICE ROLLS:
- Players will click buttons to roll dice.
- You will see messages like "[Rolled d20: 15]".
- **TRUST** these values completely. Do not reroll for the player.
- Use these values to resolve the checks or attacks you called for.

INTERACTION:
- Be concise but descriptive.
- Use bolding for emphasis (e.g., **Initiative Order**).
`;

let ai: GoogleGenAI | null = null;
let chatSession: Chat | null = null;

const getAI = () => {
  if (ai) return ai;
  if (!process.env.API_KEY) throw new Error("API Key missing");
  ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return ai;
};

export const startGameSession = async (character: Character, roomCode: string, history: Message[] = []): Promise<string> => {
  const ai = getAI();
  
  // Create a customized system instruction that includes the character context
  const contextInstruction = `${DM_INSTRUCTION}
  
  CURRENT PLAYER:
  You are DMing for a player character named **${character.name}** (${character.race} ${character.class}).
  HP: ${character.hp}/${character.maxHp} | AC: ${character.ac}.
  Room Code: ${roomCode} (Use this to seed the consistency of the world if needed).
  
  If this is the start of the chat, set the scene based on a generic fantasy adventure start or resume if context implies it.
  `;

  chatSession = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: contextInstruction,
      temperature: 0.9,
    },
    history: history.filter(m => m.role !== Role.SYSTEM).map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }))
  });

  // If history is empty, trigger the intro
  if (history.length === 0) {
    const response = await chatSession.sendMessage({ 
      message: `I am ${character.name}, a ${character.race} ${character.class}. I am ready to adventure.` 
    });
    return response.text;
  } else {
    // If history exists, we don't send a new message, just return a ready signal or the last message?
    // Actually, we usually just need to re-establish the session.
    // For simplicity in this stateless architecture, we'll just return a "Resumed" log or nothing.
    return ""; 
  }
};

export const sendMessageToDM = async (text: string): Promise<string> => {
  if (!chatSession) throw new Error("Session not initialized");
  const response = await chatSession.sendMessage({ message: text });
  return response.text;
};

export const streamMessageToDM = async function* (text: string) {
  if (!chatSession) throw new Error("Session not initialized");
  const responseStream = await chatSession.sendMessageStream({ message: text });
  for await (const chunk of responseStream) {
    yield chunk.text;
  }
};