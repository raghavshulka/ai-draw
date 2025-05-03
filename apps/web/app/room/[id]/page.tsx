"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ModeToggle } from "../../../components/mode-toggle";
import { useAuth } from "../../providers/authProvider";
import axios from "axios";

interface RoomDetails {
  id: string;
  name: string;
  createdAt: string;
}

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
}

export default function RoomPage({ params }: { params: { id: string } }) {
  const { isAuthenticated, token } = useAuth();
  const router = useRouter();
  const [roomDetails, setRoomDetails] = useState<RoomDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showChat, setShowChat] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const msgContainerRef = useRef<HTMLDivElement>(null);
  
  // Connect to WebSocket server
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Connect to the actual WebSocket server (port 8080)
    console.log("Connecting to WebSocket server for room:", params.id);
    
    // Add a welcome message
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: "System",
        content: `Welcome to room ${params.id}`,
        timestamp: new Date()
      }]);
    }, 1000);
    
    try {
      // Connect to the WebSocket server - using port 8080
      const wsUrl = `ws://localhost:8080?token=${token}`;
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log("WebSocket connected successfully");
        // Send join room message
        ws.send(JSON.stringify({
          type: "join",
          room: params.id
        }));
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("WebSocket message received:", data);
          
          if (data.type === "chat") {
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              sender: data.sender || "User",
              content: data.message,
              timestamp: new Date()
            }]);
          } else if (data.type === "drawing") {
            drawFromWebSocket(data);
          }
        } catch (err) {
          console.error("Error processing WebSocket message:", err);
        }
      };
      
      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
      
      ws.onclose = () => {
        console.log("WebSocket connection closed");
      };
      
      // Store the WebSocket
      wsRef.current = ws;
    } catch (err) {
      console.error("Error establishing WebSocket connection:", err);
      // Fall back to mock WebSocket if connection fails
      const mockWs = {
        readyState: WebSocket.OPEN,
        send: (data: string) => {
          // Parse the sent data
          try {
            const parsedData = JSON.parse(data);
            console.log("Mock WebSocket send:", parsedData);
            
            // Simulate receiving a message - for chat messages
            if (parsedData.type === "chat") {
              // Echo the message back as if from another user for demo purposes
              setTimeout(() => {
                setMessages(prev => [...prev, {
                  id: Date.now().toString(),
                  sender: "Echo Bot",
                  content: `Echo: ${parsedData.content}`,
                  timestamp: new Date()
                }]);
              }, 1000);
            }
          } catch (err) {
            console.error("Error parsing WebSocket data:", err);
          }
        },
        close: () => {
          console.log("Mock WebSocket disconnected");
        }
      };
      
      // Store the mock WebSocket
      wsRef.current = mockWs as any;
    }
    
    return () => {
      // Clean up
      if (wsRef.current) {
        // Send leave room message if it's a real WebSocket
        if (wsRef.current instanceof WebSocket) {
          try {
            wsRef.current.send(JSON.stringify({
              type: "leave",
              room: params.id
            }));
          } catch (err) {
            console.error("Error sending leave room message:", err);
          }
        }
        
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isAuthenticated, params.id, token]);
  
  // Initialize drawing canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;
    
    // Set canvas dimensions
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Set white background
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Drawing state
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    
    // Drawing functions
    const startDrawing = (e: MouseEvent) => {
      isDrawing = true;
      const rect = canvas.getBoundingClientRect();
      lastX = e.clientX - rect.left;
      lastY = e.clientY - rect.top;
    };
    
    const draw = (e: MouseEvent) => {
      if (!isDrawing) return;
      
      const rect = canvas.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      
      if (context) {
        context.strokeStyle = '#000000';
        context.lineWidth = 2;
        context.lineJoin = 'round';
        context.lineCap = 'round';
        
        context.beginPath();
        context.moveTo(lastX, lastY);
        context.lineTo(currentX, currentY);
        context.stroke();
      }
      
      // Send drawing data via WebSocket
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'drawing',
          from: { x: lastX, y: lastY },
          to: { x: currentX, y: currentY },
          roomId: params.id
        }));
      }
      
      lastX = currentX;
      lastY = currentY;
    };
    
    const stopDrawing = () => {
      isDrawing = false;
    };
    
    // Add event listeners
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseout', stopDrawing);
    };
  }, [params.id]);
  
  const drawFromWebSocket = (data: any) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (context) {
      context.strokeStyle = '#000000';
      context.lineWidth = 2;
      context.lineJoin = 'round';
      context.lineCap = 'round';
      
      context.beginPath();
      context.moveTo(data.from.x, data.from.y);
      context.lineTo(data.to.x, data.to.y);
      context.stroke();
    }
  };
  
  // Fetch room details
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/sign-in");
      return;
    }

    // In a real app, you would fetch room details here
    // For now we'll just simulate a room
    setLoading(true);
    setTimeout(() => {
      setRoomDetails({
        id: params.id,
        name: "Drawing Room " + params.id,
        createdAt: new Date().toISOString(),
      });
      setLoading(false);
    }, 500);
    
    // Set share URL
    setShareUrl(`${window.location.origin}/room/${params.id}`);
  }, [isAuthenticated, router, params.id, token]);

  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (msgContainerRef.current) {
      msgContainerRef.current.scrollTop = msgContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !wsRef.current) return;
    
    // Format message according to the WebSocket server's expected format
    // The server in apps/ws/src/index.ts expects 'messages' not 'content'
    const messageData = {
      type: "chat",
      messages: inputMessage,
      roomId: params.id
    };
    
    // Send via WebSocket
    if (wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(messageData));
      
      // Add to local messages immediately for better UX
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: "You",
        content: inputMessage,
        timestamp: new Date()
      }]);
      
      setInputMessage("");
    }
  };
  
  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    alert("Room link copied to clipboard!");
  };
  
  const generateDrawing = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    
    try {
      // Simulate AI generation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real app, call your AI API here
      // const response = await axios.post('/api/generate', { prompt });
      // Then draw the resulting image on the canvas
      
      const canvas = canvasRef.current;
      if (canvas) {
        const context = canvas.getContext('2d');
        if (context) {
          // For now, just draw a dummy shape
          context.fillStyle = "#5a67d8";
          context.beginPath();
          context.arc(canvas.width / 2, canvas.height / 2, 50, 0, 2 * Math.PI);
          context.fill();
          
          context.font = "16px Arial";
          context.fillStyle = "white";
          context.textAlign = "center";
          context.fillText("AI Generated", canvas.width / 2, canvas.height / 2 + 5);
        }
      }
      
      setPrompt("");
    } catch (error) {
      console.error("Error generating drawing:", error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  if (!isAuthenticated || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-medium hover:text-primary">
              ← Back to Dashboard
            </Link>
            <h1 className="font-bold truncate max-w-[200px] md:max-w-md">
              {roomDetails?.name}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowShareModal(true)}
              className="text-sm font-medium hover:text-primary"
            >
              Share Room
            </button>
            <button 
              onClick={() => setShowChat(!showChat)}
              className="text-sm font-medium hover:text-primary"
            >
              {showChat ? "Hide Chat" : "Show Chat"}
            </button>
            <span className="text-sm text-muted-foreground">Room ID: {params.id}</span>
            <ModeToggle />
          </div>
        </div>
      </header>
      
      <main className="flex-1 p-6">
        <div className="container flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Collaborative Drawing</h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={clearCanvas}
                className="inline-flex h-10 items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Clear Canvas
              </button>
              <button 
                onClick={() => setShowShareModal(true)}
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Invite Others
              </button>
            </div>
          </div>
          
          <div className="flex gap-4 h-[calc(100vh-220px)]">
            <div className={`flex-1 border rounded-lg bg-card shadow-sm relative ${showChat ? 'w-2/3' : 'w-full'}`}>
              <canvas 
                ref={canvasRef} 
                className="w-full h-full bg-white rounded-lg"
              />
            </div>
            
            {showChat && (
              <div className="w-1/3 border rounded-lg bg-card shadow-sm flex flex-col">
                <div className="p-3 border-b">
                  <h3 className="font-medium">Chat</h3>
                </div>
                <div 
                  ref={msgContainerRef}
                  className="flex-1 p-3 overflow-y-auto space-y-3"
                >
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground p-4">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    messages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.sender === 'You' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg px-3 py-2 ${
                          msg.sender === 'You' 
                            ? 'bg-primary text-primary-foreground' 
                            : msg.sender === 'System' 
                              ? 'bg-muted text-foreground italic text-center w-full'
                              : 'bg-secondary text-secondary-foreground'
                        }`}>
                          {msg.sender !== 'You' && msg.sender !== 'System' && (
                            <div className="text-xs font-medium mb-1">{msg.sender}</div>
                          )}
                          <div>{msg.content}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-3 border-t">
                  <form onSubmit={sendMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                    <button
                      type="submit"
                      className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Send
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-6">
            <div className="flex gap-4 items-start">
              <div className="flex-1">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what you want to draw with AI..."
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <button 
                onClick={generateDrawing}
                disabled={isGenerating || !prompt.trim()}
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none"
              >
                {isGenerating ? "Generating..." : "Generate"}
              </button>
            </div>
            <div className="mt-4 flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 rounded-md bg-muted p-2">
                <span className="text-sm font-medium">Tools:</span>
                <button className="p-1 rounded-sm hover:bg-background">Brush</button>
                <button className="p-1 rounded-sm hover:bg-background">Eraser</button>
                <button className="p-1 rounded-sm hover:bg-background">Text</button>
                <button className="p-1 rounded-sm hover:bg-background">Shapes</button>
              </div>
              <div className="flex items-center gap-2 rounded-md bg-muted p-2">
                <span className="text-sm font-medium">Colors:</span>
                <div className="w-5 h-5 rounded-full bg-red-500 cursor-pointer"></div>
                <div className="w-5 h-5 rounded-full bg-blue-500 cursor-pointer"></div>
                <div className="w-5 h-5 rounded-full bg-green-500 cursor-pointer"></div>
                <div className="w-5 h-5 rounded-full bg-yellow-500 cursor-pointer"></div>
                <div className="w-5 h-5 rounded-full bg-purple-500 cursor-pointer"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Share Room</h3>
              <button 
                onClick={() => setShowShareModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Share this link with others to invite them to this drawing room:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <button
                onClick={copyShareLink}
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 