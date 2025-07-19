"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { use } from "react";
import { ModeToggle } from "../../../components/mode-toggle";
import { useAuth } from "../../providers/authProvider";

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
  isOwnMessage?: boolean;
}

interface DrawingData {
  from: { x: number; y: number };
  to: { x: number; y: number };
  color: string;
  lineWidth: number;
  userId?: string;
  userName?: string;
}

// Helper function to decode JWT token
const decodeToken = (token: string) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT token format');
      return null;
    }
    const payload = parts[1];
    if (!payload) {
      console.error('Invalid JWT token payload');
      return null;
    }
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { isAuthenticated, token } = useAuth();
  const router = useRouter();
  const resolvedParams = use(params);
  const roomId = resolvedParams.id;
  
  // Decode user info from token
  const userInfo = token ? decodeToken(token) : null;
  const userId = userInfo?.id || userInfo?.sub;
  const userName = localStorage.getItem("username");
  console.log("username", userName);
  
  const [roomDetails, setRoomDetails] = useState<RoomDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [drawingColor, setDrawingColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(2);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const msgContainerRef = useRef<HTMLDivElement>(null);
  
  console.log("RoomPage: Component initialized for room:", roomId);
  console.log("RoomPage: Authentication status:", isAuthenticated);
  console.log("RoomPage: Current user:", { userId, userName });
  
  // Connect to WebSocket server
  useEffect(() => {
    if (!isAuthenticated) {
      console.log("RoomPage: User not authenticated, skipping WebSocket connection");
      return;
    }
    
    console.log("RoomPage: Connecting to WebSocket server for room:", roomId);
    
    // Add a welcome message
    setTimeout(() => {
      console.log("RoomPage: Adding welcome message");
      setMessages(prevMessages => [...prevMessages, {
        id: Date.now().toString(),
        sender: "System",
        content: `Welcome to room ${roomId}! You can chat and draw collaboratively.`,
        timestamp: new Date()
      }]);
    }, 1000);
    
    try {
      // Connect to the WebSocket server
      const wsUrl = `ws://localhost:8080?token=${token}`;
      console.log("RoomPage: Attempting WebSocket connection to:", wsUrl);
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log("RoomPage: WebSocket connected successfully");
        // Send join room message
        const joinMessage = {
          type: "join",
          room: roomId,
          userId: userId,
          userName: userName
        };
        console.log("RoomPage: Sending join room message:", joinMessage);
        ws.send(JSON.stringify(joinMessage));
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("RoomPage: WebSocket message received:", data);
          
          if (data.type === "chat") {
            console.log("RoomPage: Processing chat message from:", data.senderName);
            // Check if this is our own message to avoid duplicate display
            const isOwnMessage = data.senderId === userId;
            
            if (!isOwnMessage) {
              setMessages(prevMessages => [...prevMessages, {
                id: Date.now().toString(),
                sender: data.senderName || "Unknown User",
                content: data.message,
                timestamp: new Date(),
                isOwnMessage: false
              }]);
            }
          } else if (data.type === "drawing") {
            console.log("RoomPage: Processing drawing data:", data);
            // Only draw if it's not our own drawing
            if (data.userId !== userId) {
              drawFromWebSocket(data);
            }
          } else if (data.type === "clear_canvas") {
            console.log("RoomPage: Processing clear canvas request:", data);
            // Only clear if it's not our own clear request
            if (data.userId !== userId) {
              clearCanvasFromWebSocket();
            }
          }
        } catch (err) {
          console.error("RoomPage: Error processing WebSocket message:", err);
        }
      };
      
      ws.onerror = (error) => {
        console.error("RoomPage: WebSocket error:", error);
      };
      
      ws.onclose = () => {
        console.log("RoomPage: WebSocket connection closed");
      };
      
      // Store the WebSocket
      wsRef.current = ws;
    } catch (err) {
      console.error("RoomPage: Error establishing WebSocket connection:", err);
      // Fall back to mock WebSocket if connection fails
      console.log("RoomPage: Falling back to mock WebSocket");
      const mockWs = {
        readyState: WebSocket.OPEN,
        send: (data: string) => {
          try {
            const parsedData = JSON.parse(data);
            console.log("RoomPage: Mock WebSocket send:", parsedData);
            
            // Simulate receiving a message for demo purposes
            if (parsedData.type === "chat") {
              setTimeout(() => {
                console.log("RoomPage: Mock WebSocket echoing message");
                setMessages(prevMessages => [...prevMessages, {
                  id: Date.now().toString(),
                  sender: "Demo User",
                  content: `Demo response to: ${parsedData.messages}`,
                  timestamp: new Date(),
                  isOwnMessage: false
                }]);
              }, 1000);
            }
          } catch (err) {
            console.error("RoomPage: Error parsing WebSocket data:", err);
          }
        },
        close: () => {
          console.log("RoomPage: Mock WebSocket disconnected");
        }
      };
      
      wsRef.current = mockWs as any;
    }
    
    return () => {
      console.log("RoomPage: Cleaning up WebSocket connection");
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        // Send leave room message if it's a real WebSocket
        if (wsRef.current instanceof WebSocket) {
          try {
            const leaveMessage = {
              type: "leave",
              room: roomId,
              userId: userId
            };
            console.log("RoomPage: Sending leave room message:", leaveMessage);
            wsRef.current.send(JSON.stringify(leaveMessage));
          } catch (err) {
            console.error("RoomPage: Error sending leave room message:", err);
          }
        }
        
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isAuthenticated, roomId, token, userId, userName]);
  
  // Initialize drawing canvas
  useEffect(() => {
    if (!canvasRef.current) {
      console.log("RoomPage: Canvas ref not available");
      return;
    }
    
    console.log("RoomPage: Initializing drawing canvas");
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) {
      console.error("RoomPage: Could not get canvas context");
      return;
    }
    
    // Set canvas dimensions
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    console.log("RoomPage: Canvas dimensions set to:", canvas.width, "x", canvas.height);
    
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
      console.log("RoomPage: Started drawing at:", lastX, lastY);
    };
    
    const draw = (e: MouseEvent) => {
      if (!isDrawing) return;
      
      const rect = canvas.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      
      if (context) {
        context.strokeStyle = drawingColor;
        context.lineWidth = lineWidth;
        context.lineJoin = 'round';
        context.lineCap = 'round';
        
        context.beginPath();
        context.moveTo(lastX, lastY);
        context.lineTo(currentX, currentY);
        context.stroke();
      }
      
      // Send drawing data via WebSocket
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const drawingData = {
          type: 'drawing',
          from: { x: lastX, y: lastY },
          to: { x: currentX, y: currentY },
          color: drawingColor,
          lineWidth: lineWidth,
          roomId: roomId,
          userId: userId,
          userName: userName
        };
        console.log("RoomPage: Sending drawing data:", drawingData);
        wsRef.current.send(JSON.stringify(drawingData));
      }
      
      lastX = currentX;
      lastY = currentY;
    };
    
    const stopDrawing = () => {
      if (isDrawing) {
        console.log("RoomPage: Stopped drawing");
        isDrawing = false;
      }
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
  }, [roomId, drawingColor, lineWidth, userId, userName]);
  
  const drawFromWebSocket = (data: DrawingData) => {
    if (!canvasRef.current) {
      console.log("RoomPage: Canvas not available for drawing from WebSocket");
      return;
    }
    
    console.log("RoomPage: Drawing from WebSocket data:", data);
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (context) {
      context.strokeStyle = data.color || '#000000';
      context.lineWidth = data.lineWidth || 2;
      context.lineJoin = 'round';
      context.lineCap = 'round';
      
      context.beginPath();
      context.moveTo(data.from.x, data.from.y);
      context.lineTo(data.to.x, data.to.y);
      context.stroke();
    }
  };

  const clearCanvasFromWebSocket = () => {
    console.log("RoomPage: Clearing canvas from WebSocket request");
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  };
  
  // Fetch room details
  useEffect(() => {
    if (!isAuthenticated) {
      console.log("RoomPage: User not authenticated, redirecting to sign-in");
      router.push("/sign-in");
      return;
    }

    console.log("RoomPage: Fetching room details for room:", roomId);
    setLoading(true);
    setTimeout(() => {
      const roomData = {
        id: roomId,
        name: "Drawing Room " + roomId,
        createdAt: new Date().toISOString(),
      };
      console.log("RoomPage: Setting room details:", roomData);
      setRoomDetails(roomData);
      setLoading(false);
    }, 500);
    
    // Set share URL
    const url = `${window.location.origin}/room/${roomId}`;
    console.log("RoomPage: Setting share URL:", url);
    setShareUrl(url);
  }, [isAuthenticated, router, roomId, token]);

  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (msgContainerRef.current) {
      msgContainerRef.current.scrollTop = msgContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !wsRef.current) {
      console.log("RoomPage: Cannot send message - empty or no WebSocket");
      return;
    }
    
    console.log("RoomPage: Sending chat message:", inputMessage);
    
    // Format message according to the WebSocket server's expected format
    const messageData = {
      type: "chat",
      messages: inputMessage,
      roomId: roomId,
      userId: userId,
      userName: userName
    };
    
    // Send via WebSocket
    if (wsRef.current.readyState === WebSocket.OPEN) {
      console.log("RoomPage: Sending message via WebSocket:", messageData);
      wsRef.current.send(JSON.stringify(messageData));
      
      // Add to local messages immediately for better UX
      setMessages(prevMessages => [...prevMessages, {
        id: Date.now().toString(),
        sender: "You",
        content: inputMessage,
        timestamp: new Date(),
        isOwnMessage: true
      }]);
      
      setInputMessage("");
    } else {
      console.log("RoomPage: WebSocket not ready, current state:", wsRef.current.readyState);
    }
  };
  
  const copyShareLink = () => {
    console.log("RoomPage: Copying share link to clipboard:", shareUrl);
    navigator.clipboard.writeText(shareUrl);
    alert("Room link copied to clipboard!");
  };
  
  const clearCanvas = () => {
    console.log("RoomPage: Clearing canvas");
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
    
    // Send clear canvas message to other users
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const clearData = {
        type: 'clear_canvas',
        roomId: roomId,
        userId: userId
      };
      console.log("RoomPage: Sending clear canvas message:", clearData);
      wsRef.current.send(JSON.stringify(clearData));
    }
  };

  const changeColor = (color: string) => {
    console.log("RoomPage: Changing drawing color to:", color);
    setDrawingColor(color);
  };

  const changeLineWidth = (width: number) => {
    console.log("RoomPage: Changing line width to:", width);
    setLineWidth(width);
  };

  if (!isAuthenticated || loading) {
    console.log("RoomPage: Rendering loading state");
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  console.log("RoomPage: Rendering main room interface");
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
            <span className="text-sm text-muted-foreground">Room ID: {roomId}</span>
            <ModeToggle />
          </div>
        </div>
      </header>
      
      <main className="flex-1 p-6">
        <div className="container flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Collaborative Drawing Room</h2>
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
                className="w-full h-full bg-white rounded-lg cursor-crosshair"
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
                      <div key={msg.id + Math.random()} className={`flex ${msg.isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg px-3 py-2 ${
                          msg.isOwnMessage 
                            ? 'bg-primary text-primary-foreground' 
                            : msg.sender === 'System' 
                              ? 'bg-muted text-foreground italic text-center w-full'
                              : 'bg-secondary text-secondary-foreground'
                        }`}>
                          {!msg.isOwnMessage && msg.sender !== 'System' && (
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
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 rounded-md bg-muted p-2">
                <span className="text-sm font-medium">Line Width:</span>
                <button 
                  onClick={() => changeLineWidth(1)}
                  className={`p-1 rounded-sm hover:bg-background ${lineWidth === 1 ? 'bg-background' : ''}`}
                >
                  1px
                </button>
                <button 
                  onClick={() => changeLineWidth(2)}
                  className={`p-1 rounded-sm hover:bg-background ${lineWidth === 2 ? 'bg-background' : ''}`}
                >
                  2px
                </button>
                <button 
                  onClick={() => changeLineWidth(5)}
                  className={`p-1 rounded-sm hover:bg-background ${lineWidth === 5 ? 'bg-background' : ''}`}
                >
                  5px
                </button>
                <button 
                  onClick={() => changeLineWidth(10)}
                  className={`p-1 rounded-sm hover:bg-background ${lineWidth === 10 ? 'bg-background' : ''}`}
                >
                  10px
                </button>
              </div>
              <div className="flex items-center gap-2 rounded-md bg-muted p-2">
                <span className="text-sm font-medium">Colors:</span>
                <div 
                  onClick={() => changeColor("#000000")}
                  className={`w-6 h-6 rounded-full bg-black cursor-pointer border-2 ${drawingColor === "#000000" ? 'border-blue-500' : 'border-gray-300'}`}
                ></div>
                <div 
                  onClick={() => changeColor("#ff0000")}
                  className={`w-6 h-6 rounded-full bg-red-500 cursor-pointer border-2 ${drawingColor === "#ff0000" ? 'border-blue-500' : 'border-gray-300'}`}
                ></div>
                <div 
                  onClick={() => changeColor("#00ff00")}
                  className={`w-6 h-6 rounded-full bg-green-500 cursor-pointer border-2 ${drawingColor === "#00ff00" ? 'border-blue-500' : 'border-gray-300'}`}
                ></div>
                <div 
                  onClick={() => changeColor("#0000ff")}
                  className={`w-6 h-6 rounded-full bg-blue-500 cursor-pointer border-2 ${drawingColor === "#0000ff" ? 'border-blue-500' : 'border-gray-300'}`}
                ></div>
                <div 
                  onClick={() => changeColor("#ffff00")}
                  className={`w-6 h-6 rounded-full bg-yellow-500 cursor-pointer border-2 ${drawingColor === "#ffff00" ? 'border-blue-500' : 'border-gray-300'}`}
                ></div>
                <div 
                  onClick={() => changeColor("#ff00ff")}
                  className={`w-6 h-6 rounded-full bg-purple-500 cursor-pointer border-2 ${drawingColor === "#ff00ff" ? 'border-blue-500' : 'border-gray-300'}`}
                ></div>
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