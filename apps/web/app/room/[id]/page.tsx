"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { use } from "react";
import { ArrowLeft, Eraser, Link2, MessageSquare, Send, X } from "lucide-react";
import { SiteHeader } from "../../../components/site-header";
import { CopyButton } from "../../../components/copy-button";
import { Button, Input, Spinner, buttonClasses } from "../../../components/ui";
import { cn } from "../../../cn";
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

// Values are sent over the WebSocket as-is; keep them stable.
const COLORS = [
  { value: "#000000", name: "Black" },
  { value: "#ff0000", name: "Red" },
  { value: "#00ff00", name: "Green" },
  { value: "#0000ff", name: "Blue" },
  { value: "#ffff00", name: "Yellow" },
  { value: "#ff00ff", name: "Magenta" },
];
const LINE_WIDTHS = [1, 2, 5, 10];
const DOT_SIZE: Record<number, number> = { 1: 3, 2: 5, 5: 9, 10: 14 };

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
  const { isAuthenticated, ready, token } = useAuth();
  const router = useRouter();
  const resolvedParams = use(params);
  const roomId = resolvedParams.id;
  
  // Decode user info from token
  const userInfo = token ? decodeToken(token) : null;
  const userId = userInfo?.id || userInfo?.sub;
  const userName = typeof window !== "undefined" ? localStorage.getItem("username") : null;
  console.log("username", userName);
  
  const [roomDetails, setRoomDetails] = useState<RoomDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [showChat, setShowChat] = useState(true);
  const [drawingColor, setDrawingColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(2);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const msgContainerRef = useRef<HTMLDivElement>(null);

  // Start with the chat collapsed on small screens so the canvas gets the room.
  useEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches) setShowChat(false);
  }, []);
  
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
      const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080"}?token=${token}`;
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
    
    // Set canvas dimensions. Assigning width/height wipes the bitmap, so only do it
    // when the size actually changed (not on every colour / line-width change).
    if (canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      console.log("RoomPage: Canvas dimensions set to:", canvas.width, "x", canvas.height);

      // Set white background
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    
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
    
    // Add event listeners (pointer events cover mouse, touch and pen)
    canvas.addEventListener('pointerdown', startDrawing);
    canvas.addEventListener('pointermove', draw);
    canvas.addEventListener('pointerup', stopDrawing);
    canvas.addEventListener('pointerleave', stopDrawing);
    canvas.addEventListener('pointercancel', stopDrawing);
    
    return () => {
      canvas.removeEventListener('pointerdown', startDrawing);
      canvas.removeEventListener('pointermove', draw);
      canvas.removeEventListener('pointerup', stopDrawing);
      canvas.removeEventListener('pointerleave', stopDrawing);
      canvas.removeEventListener('pointercancel', stopDrawing);
    };
    // `loading` is included so listeners attach once the canvas mounts after the spinner.
  }, [roomId, drawingColor, lineWidth, userId, userName, loading]);
  
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
    // Wait until the stored token has been read before deciding to redirect.
    if (!ready) return;
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
  }, [ready, isAuthenticated, router, roomId, token]);

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
        <Spinner className="h-8 w-8" label="Loading room" />
      </div>
    );
  }

  console.log("RoomPage: Rendering main room interface");
  const toolbarDivider = <span className="mx-1 hidden h-6 w-px bg-border sm:block" aria-hidden="true" />;
  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      <SiteHeader fluid>
        <span className="mx-1 hidden h-5 w-px bg-border sm:block" aria-hidden="true" />
        <h1 className="hidden min-w-0 truncate text-sm font-medium md:block" title={roomDetails?.name}>
          {roomDetails?.name}
        </h1>
        <div className="flex min-w-0 items-center gap-0.5 rounded-md border bg-muted/50 py-0.5 pl-2 pr-0.5">
          <span className="shrink-0 text-xs text-muted-foreground">ID</span>
          <code className="min-w-0 truncate px-1 font-mono text-xs">{roomId}</code>
          <CopyButton value={roomId} label="Copy room ID" size="icon" className="h-7 w-7" />
        </div>
      </SiteHeader>

      <main className="relative min-h-0 flex-1 bg-muted/40">
        <canvas
          ref={canvasRef}
          aria-label="Shared drawing canvas"
          className="absolute inset-0 h-full w-full cursor-crosshair touch-none bg-white"
        />

        {/* Toolbar */}
        <div
          role="toolbar"
          aria-label="Drawing tools"
          className="absolute left-1/2 top-3 z-10 flex w-max max-w-[calc(100%-1rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-1 rounded-xl border bg-background/95 p-1.5 shadow-md backdrop-blur"
        >
          <div className="flex items-center gap-1 px-1" role="group" aria-label="Colour">
            {COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => changeColor(c.value)}
                aria-label={c.name}
                aria-pressed={drawingColor === c.value}
                title={c.name}
                className={cn(
                  "h-6 w-6 rounded-full border border-foreground/25 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  drawingColor === c.value && "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                )}
                style={{ backgroundColor: c.value }}
              />
            ))}
          </div>
          {toolbarDivider}
          <div className="flex items-center gap-0.5" role="group" aria-label="Line width">
            {LINE_WIDTHS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => changeLineWidth(w)}
                aria-label={`${w}px line`}
                aria-pressed={lineWidth === w}
                title={`${w}px`}
                className={buttonClasses({
                  variant: "ghost",
                  size: "icon",
                  className: cn("h-8 w-8", lineWidth === w && "bg-secondary text-secondary-foreground"),
                })}
              >
                <span
                  aria-hidden="true"
                  className="rounded-full bg-foreground"
                  style={{ width: DOT_SIZE[w], height: DOT_SIZE[w] }}
                />
              </button>
            ))}
          </div>
          {toolbarDivider}
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearCanvas} aria-label="Clear canvas for everyone" title="Clear canvas">
              <Eraser className="h-4 w-4" aria-hidden="true" />
            </Button>
            <CopyButton value={shareUrl} label="Copy invite link" icon={Link2} size="icon" className="h-8 w-8" />
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", showChat && "bg-secondary text-secondary-foreground")}
              onClick={() => setShowChat(!showChat)}
              aria-label={showChat ? "Hide chat" : "Show chat"}
              aria-pressed={showChat}
              aria-controls="room-chat"
              title={showChat ? "Hide chat" : "Show chat"}
            >
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Link href="/dashboard" className={buttonClasses({ variant: "ghost", size: "sm", className: "h-8" })} title="Leave room">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Leave</span>
            </Link>
          </div>
        </div>

        {/* Chat */}
        {showChat && (
          <section
            id="room-chat"
            aria-label="Room chat"
            className="absolute inset-x-2 bottom-2 z-20 flex h-[55%] flex-col overflow-hidden rounded-xl border bg-background shadow-lg md:inset-x-auto md:bottom-3 md:right-3 md:top-20 md:h-auto md:w-80"
          >
            <div className="flex items-center justify-between border-b px-4 py-2.5">
              <h2 className="text-sm font-semibold">Chat</h2>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowChat(false)} aria-label="Close chat">
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
            <div
              ref={msgContainerRef}
              className="flex-1 space-y-3 overflow-y-auto px-4 py-3"
              aria-live="polite"
            >
              {messages.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No messages yet. Say hello to the room.
                </p>
              ) : (
                messages.map((msg, i) =>
                  msg.sender === "System" ? (
                    <p key={`${msg.id}-${i}`} className="text-center text-xs text-muted-foreground">
                      {msg.content}
                    </p>
                  ) : (
                    <div key={`${msg.id}-${i}`} className={cn("flex flex-col", msg.isOwnMessage ? "items-end" : "items-start")}>
                      <div className="mb-1 flex items-baseline gap-2 px-1 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{msg.isOwnMessage ? "You" : msg.sender}</span>
                        <time dateTime={new Date(msg.timestamp).toISOString()}>
                          {new Date(msg.timestamp).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                        </time>
                      </div>
                      <div
                        className={cn(
                          "max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm",
                          msg.isOwnMessage
                            ? "rounded-br-sm bg-primary text-primary-foreground"
                            : "rounded-bl-sm bg-secondary text-secondary-foreground"
                        )}
                      >
                        {msg.content}
                      </div>
                    </div>
                  )
                )
              )}
            </div>
            <form onSubmit={sendMessage} className="flex gap-2 border-t p-3">
              <label htmlFor="chat-input" className="sr-only">
                Message
              </label>
              <Input
                id="chat-input"
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Write a message…"
                autoComplete="off"
              />
              <Button type="submit" size="icon" className="h-10 w-10" aria-label="Send message" disabled={!inputMessage.trim()}>
                <Send className="h-4 w-4" aria-hidden="true" />
              </Button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}
