import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import './App.css';

const socket = io('https://ai-chat-api-syss.onrender.com');

type ChatMessage = {
  role: 'user' | 'bot';
  content: string;
};

function useTypeWriter(text: string, speed = 30) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    if (!text) return;
    let index = 0;
    setDisplayedText("");

    const interval = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(index));
      index++;
      if (index >= text.length) clearInterval(interval);
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return displayedText;
}

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [latestBotMsg, setLatestBotMsg] = useState<string>("");

  const typedText = useTypeWriter(latestBotMsg, 30);

  useEffect(() => {
    socket.on('botResponse', (msg: string, error: any) => {
      // Store all previous + placeholder for typing effect
      setMessages((prev) => [...prev, { role: 'bot', content: "" }]);
      setLatestBotMsg(msg); // start typing
      console.log(error);
    });

    return () => {
      socket.off('botResponse');
    };
  }, []);

  // When typing finishes, replace the last empty message with full content
  useEffect(() => {
    if (typedText === latestBotMsg && latestBotMsg !== "") {
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { role: 'bot', content: latestBotMsg };
        return newMessages;
      });
      setLatestBotMsg(""); // reset
    }
  }, [typedText, latestBotMsg]);

  const sendMessage = () => {
    if (!input.trim()) return;
    socket.emit('message', input);
    setMessages((prev) => [...prev, { role: 'user', content: input }]);
    setInput('');
  };

  return (
    <div className="p-4 min-h-screen flex flex-col justify-end w-full max-w-xl mx-auto">
      <div className="mb-4 space-y-2">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-2 rounded ${msg.role === 'user' ? 'bg-blue-100' : 'bg-gray-200'}`}
          >
            <strong>{msg.role === 'user' ? 'You' : 'Bot'}:</strong>{" "}
            {msg.role === 'bot' && idx === messages.length - 1 && latestBotMsg
              ? typedText
              : msg.content}
          </div>
        ))}
      </div>  

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="border p-2 w-full mb-2"
        placeholder="Type a message"
      />
      <button
        onClick={sendMessage}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Send
      </button>
    </div>
  );
}

export default App;
