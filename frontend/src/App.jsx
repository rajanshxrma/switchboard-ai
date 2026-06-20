import { useState, useEffect, useRef } from 'react'
import './index.css'

function App() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [agentState, setAgentState] = useState("ROUTER"); // ROUTER, SALES, CLAIMS
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hello! Welcome to Aurora Audio. How can I help you today?' }
  ]);

  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const chatLogRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [messages]);

  // Setup Web Speech API for listening
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Your browser does not support Speech Recognition. Please use Chrome.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;

    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      handleUserVoiceInput(transcript);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };
  }, []);

  const handleUserVoiceInput = (text) => {
    // Add user message to UI
    setMessages(prev => [...prev, { role: 'user', text }]);
    
    // Simulate LLM Processing Delay
    setTimeout(() => {
      processSimulatedAIResponse(text);
    }, 1000);
  };

  const processSimulatedAIResponse = (userText) => {
    const textLower = userText.toLowerCase();
    let aiResponse = "";
    let newState = agentState;

    // Simulated LLM Routing Logic
    if (agentState === "ROUTER") {
      if (textLower.includes("buy") || textLower.includes("price") || textLower.includes("headphones")) {
        aiResponse = "Sure thing, let me connect you to our Sales department. One moment...";
        newState = "SALES";
      } else if (textLower.includes("broken") || textLower.includes("return") || textLower.includes("fire")) {
        aiResponse = "I'm so sorry to hear that. Let me get Claims on the line for you.";
        newState = "CLAIMS";
      } else {
        aiResponse = "I didn't quite catch that. Are you looking to buy headphones, or do you need support with an existing product?";
      }
    } else if (agentState === "SALES") {
      if (textLower.includes("too expensive") || textLower.includes("high")) {
        aiResponse = "I understand $599 is an investment. We do offer the Aurora Echo for $299 which has identical audio drivers, just slightly less battery life. How does that sound?";
      } else {
        aiResponse = "Our flagship Aurora Zenith features spatial audio and a 60-hour battery. I can process your payment right now if you're ready.";
      }
    } else if (agentState === "CLAIMS") {
      if (textLower.includes("lawyer") || textLower.includes("fire") || textLower.includes("burn")) {
        aiResponse = "I completely understand your frustration. Due to the nature of this issue, I am immediately escalating this to a human legal specialist who will assist you right away.";
      } else {
        aiResponse = "I can help process a return based on our warranty manual. Do you have your order number handy?";
      }
    }

    setAgentState(newState);
    setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
    speakResponse(aiResponse);
  };

  const speakResponse = (text) => {
    if (!synthRef.current) return;
    
    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    // Try to find a premium sounding voice (like a female voice)
    const voices = synthRef.current.getVoices();
    const premiumVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Samantha") || v.lang === 'en-US');
    if (premiumVoice) utterance.voice = premiumVoice;
    
    utterance.pitch = 1;
    utterance.rate = 1.05;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  };

  const toggleMic = () => {
    if (isSpeaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Error starting mic", e);
      }
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">Enterprise Voice AI</h1>
        <p className="app-subtitle">Real-time LLM Router & Conversational Engine Simulator</p>
      </header>

      <main className="main-grid">
        
        {/* Left Panel: The AI Orb */}
        <div className="glass-panel simulator-panel">
          
          <div className="orb-container">
            <div className="ripple ripple-1"></div>
            <div className="ripple ripple-2"></div>
            <div className="ripple ripple-3"></div>
            <div 
              className={`ai-orb ${isListening ? 'listening' : ''} ${isSpeaking ? 'speaking' : ''}`}
              onClick={toggleMic}
              title="Click to talk"
            ></div>
          </div>

          <h3 style={{ margin: 0, fontWeight: 500, letterSpacing: '0.05em' }}>
            {isListening ? 'LISTENING...' : isSpeaking ? 'SPEAKING...' : 'TAP ORB TO SPEAK'}
          </h3>

          <div className={`status-indicator status-${agentState.toLowerCase()}`}>
            ACTIVE AGENT: {agentState}
          </div>

          <div className="onboarding-hints">
            <p>Try saying:</p>
            <ul>
              <li>"I want to buy headphones"</li>
              <li>"My headphones caught on fire"</li>
              <li>"Too expensive"</li>
            </ul>
          </div>

        </div>

        {/* Right Panel: Live Transcript */}
        <div className="glass-panel transcript-panel">
          <h2>Live Call Transcript</h2>
          
          <div className="chat-log" ref={chatLogRef}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role === 'user' ? 'msg-user' : 'msg-ai'}`}>
                {msg.text}
              </div>
            ))}
          </div>

        </div>

      </main>
    </div>
  )
}

export default App
