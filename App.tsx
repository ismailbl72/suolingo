import React, { useState, useEffect } from 'react';
import { ScreenName, HistoryItem, AvatarMode } from './types';
import { speechService } from './services/speechService';
import { Avatar } from './components/Avatar';
import { 
  Mic, 
  Square, 
  Play, 
  StopCircle, 
  History, 
  Keyboard, 
  ChevronLeft, 
  Copy, 
  Save, 
  Volume2,
  Trash2
} from 'lucide-react';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>(ScreenName.HOME);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  // TTS State
  const [textInput, setTextInput] = useState("Merhaba dünya");
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // STT State
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem('suolingo_history');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  const addToHistory = (type: 'TTS' | 'STT', text: string) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      type,
      text,
      timestamp: Date.now()
    };
    const newHistory = [newItem, ...history];
    setHistory(newHistory);
    localStorage.setItem('suolingo_history', JSON.stringify(newHistory));
  };

  const handleSpeak = () => {
    if (!textInput.trim()) return;
    
    setIsSpeaking(true);
    speechService.speak(
      textInput,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false),
      (e) => {
        console.error(e);
        setIsSpeaking(false);
      }
    );
    addToHistory('TTS', textInput);
  };

  const handleStopSpeak = () => {
    speechService.stopSpeaking();
    setIsSpeaking(false);
  };

  const handleToggleListen = () => {
    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
    } else {
      setTranscript("");
      setInterimTranscript("");
      setIsListening(true);
      speechService.startListening(
        (text, isFinal) => {
            if (isFinal) {
                setTranscript(prev => prev + " " + text);
                setInterimTranscript("");
            } else {
                setInterimTranscript(text);
            }
        },
        () => setIsListening(false),
        (err) => {
            console.error(err);
            setIsListening(false);
            alert("Microphone access error or not supported.");
        }
      );
    }
  };

  const handleSaveTranscript = () => {
    if (transcript) {
        addToHistory('STT', transcript);
        alert("Saved to history!");
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const clearHistory = () => {
      setHistory([]);
      localStorage.removeItem('suolingo_history');
  }

  // Determine Avatar Mode
  let avatarMode = AvatarMode.IDLE;
  if (isSpeaking) avatarMode = AvatarMode.SPEAKING;
  if (isListening) avatarMode = AvatarMode.LISTENING;

  return (
    <div className="w-full h-full max-w-md bg-slate-900 flex flex-col relative overflow-hidden shadow-2xl">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <div className="absolute -top-20 -left-20 w-60 h-60 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>

        {/* Header */}
        <header className="pt-12 pb-6 px-6 z-10 flex items-center justify-between">
            {currentScreen !== ScreenName.HOME && (
                <button 
                    onClick={() => {
                        handleStopSpeak();
                        speechService.stopListening();
                        setCurrentScreen(ScreenName.HOME);
                    }}
                    className="p-2 bg-white/10 rounded-full hover:bg-white/20 backdrop-blur-md transition-all"
                >
                    <ChevronLeft size={24} className="text-white" />
                </button>
            )}
            <div className="flex-1 text-center">
                 <h1 className="text-xl font-bold tracking-wider text-white">SUOLINGO</h1>
                 {currentScreen === ScreenName.TTS && <span className="text-xs text-indigo-300 font-medium">Text to Speech</span>}
                 {currentScreen === ScreenName.STT && <span className="text-xs text-pink-300 font-medium">Speech to Text</span>}
            </div>
            <div className="w-10"></div> {/* Spacer for alignment */}
        </header>

        {/* Avatar Area */}
        <div className="flex flex-col items-center justify-center py-6 z-10 transition-all duration-500" style={{ height: currentScreen === ScreenName.HOME ? '40%' : '30%' }}>
            <div className="relative">
                <Avatar mode={avatarMode} size={currentScreen === ScreenName.HOME ? 180 : 130} />
                {isListening && (
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex gap-1">
                         {[1,2,3,4,5].map(i => (
                             <div key={i} className="w-1 bg-pink-500 rounded-full animate-pulse" style={{ height: Math.random() * 15 + 5, animationDuration: '0.4s' }}></div>
                         ))}
                    </div>
                )}
            </div>
        </div>

        {/* Main Content Area - Glassmorphism Card */}
        <div className="flex-1 bg-white/10 backdrop-blur-xl rounded-t-3xl border-t border-white/10 p-6 flex flex-col z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] overflow-y-auto">
            
            {/* HOME SCREEN */}
            {currentScreen === ScreenName.HOME && (
                <div className="flex flex-col gap-4 h-full justify-center">
                    <button 
                        onClick={() => setCurrentScreen(ScreenName.TTS)}
                        className="group relative p-6 bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl shadow-lg border border-indigo-400/30 flex items-center gap-4 hover:scale-[1.02] transition-transform active:scale-95"
                    >
                        <div className="p-3 bg-white/20 rounded-xl">
                            <Keyboard className="text-white" size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className="text-lg font-bold text-white">Text → Speech</h3>
                            <p className="text-indigo-200 text-sm">Type and let the avatar speak</p>
                        </div>
                    </button>

                    <button 
                        onClick={() => setCurrentScreen(ScreenName.STT)}
                        className="group relative p-6 bg-gradient-to-r from-purple-600 to-purple-500 rounded-2xl shadow-lg border border-purple-400/30 flex items-center gap-4 hover:scale-[1.02] transition-transform active:scale-95"
                    >
                        <div className="p-3 bg-white/20 rounded-xl">
                            <Mic className="text-white" size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className="text-lg font-bold text-white">Speech → Text</h3>
                            <p className="text-purple-200 text-sm">Record your voice to text</p>
                        </div>
                    </button>

                    <button 
                        onClick={() => setCurrentScreen(ScreenName.HISTORY)}
                        className="group relative p-6 bg-slate-800/50 rounded-2xl shadow-lg border border-slate-700 flex items-center gap-4 hover:bg-slate-800 transition-colors active:scale-95"
                    >
                        <div className="p-3 bg-slate-700 rounded-xl">
                            <History className="text-slate-300" size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className="text-lg font-bold text-slate-200">History</h3>
                            <p className="text-slate-400 text-sm">View past interactions</p>
                        </div>
                    </button>
                </div>
            )}

            {/* TTS SCREEN */}
            {currentScreen === ScreenName.TTS && (
                <div className="flex flex-col h-full gap-4">
                    <div className="flex-1 relative">
                        <textarea
                            className="w-full h-full bg-slate-800/50 border border-slate-600 rounded-2xl p-4 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
                            placeholder="Type something in Turkish..."
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            maxLength={500}
                        />
                        <span className="absolute bottom-4 right-4 text-xs text-slate-500">{textInput.length}/500</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={handleSpeak}
                            disabled={isSpeaking || !textInput}
                            className={`flex items-center justify-center gap-2 p-4 rounded-xl font-bold text-white transition-all ${isSpeaking ? 'bg-slate-600 opacity-50' : 'bg-indigo-600 hover:bg-indigo-500 active:scale-95 shadow-lg shadow-indigo-500/30'}`}
                        >
                            <Volume2 size={20} />
                            Speak
                        </button>
                        <button
                            onClick={handleStopSpeak}
                            disabled={!isSpeaking}
                            className={`flex items-center justify-center gap-2 p-4 rounded-xl font-bold text-white transition-all ${!isSpeaking ? 'bg-slate-600 opacity-50' : 'bg-pink-600 hover:bg-pink-500 active:scale-95 shadow-lg shadow-pink-500/30'}`}
                        >
                            <StopCircle size={20} />
                            Stop
                        </button>
                    </div>
                </div>
            )}

            {/* STT SCREEN */}
            {currentScreen === ScreenName.STT && (
                <div className="flex flex-col h-full gap-6 items-center">
                     <div className="w-full bg-slate-800/50 rounded-2xl p-4 min-h-[120px] max-h-[200px] overflow-y-auto border border-slate-700/50 relative">
                         {transcript || interimTranscript ? (
                             <p className="text-lg text-white leading-relaxed">
                                 {transcript}
                                 <span className="text-slate-400 italic">{interimTranscript}</span>
                             </p>
                         ) : (
                             <p className="text-slate-500 text-center mt-8">Press record and start speaking...</p>
                         )}
                         
                         {isListening && (
                             <div className="absolute top-2 right-2 flex items-center gap-2">
                                 <span className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                                <span className="text-xs text-red-400 font-mono">REC</span>
                             </div>
                         )}
                     </div>

                     <button
                        onClick={handleToggleListen}
                        className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${isListening ? 'bg-red-500 scale-110 shadow-red-500/40' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/40'}`}
                     >
                         {isListening ? <Square fill="white" size={24} /> : <Mic fill="white" size={32} />}
                     </button>
                     
                     <div className="flex gap-4 w-full">
                         <button onClick={() => handleCopy(transcript)} className="flex-1 py-3 bg-slate-700 rounded-xl text-slate-200 font-medium hover:bg-slate-600 flex items-center justify-center gap-2">
                             <Copy size={16} /> Copy
                         </button>
                         <button onClick={handleSaveTranscript} disabled={!transcript} className="flex-1 py-3 bg-slate-700 rounded-xl text-slate-200 font-medium hover:bg-slate-600 flex items-center justify-center gap-2 disabled:opacity-50">
                             <Save size={16} /> Save
                         </button>
                     </div>
                </div>
            )}

            {/* HISTORY SCREEN */}
            {currentScreen === ScreenName.HISTORY && (
                <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-slate-300 font-medium">Recent Activity</h2>
                        {history.length > 0 && (
                            <button onClick={clearHistory} className="text-red-400 text-xs hover:underline flex items-center gap-1">
                                <Trash2 size={12} /> Clear All
                            </button>
                        )}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-3">
                        {history.length === 0 ? (
                            <div className="text-center text-slate-500 mt-10">No history yet.</div>
                        ) : (
                            history.map(item => (
                                <div key={item.id} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-xs px-2 py-1 rounded-md font-bold ${item.type === 'TTS' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-pink-500/20 text-pink-300'}`}>
                                            {item.type}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                    <p className="text-slate-200 text-sm line-clamp-2">{item.text}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default App;
