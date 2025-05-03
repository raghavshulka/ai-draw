"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ModeToggle } from "../../components/mode-toggle";
import { useAuth } from "../providers/authProvider";
import axios from "axios";

interface Room {
  id: string;
  name: string;
  createdAt: string;
}

export default function Dashboard() {
  const { isAuthenticated, logout, token } = useAuth();
  const router = useRouter();
  const [roomName, setRoomName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "join">("create");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/sign-in");
      return;
    }

    // Fetch user's rooms
    fetchRooms();
  }, [isAuthenticated, router, token]);

  const fetchRooms = async () => {
    if (!token) return;
    
    setLoadingRooms(true);
    try {
      const response = await axios.get("http://localhost:3002/my-rooms", {
        headers: {
          Authorization: token,
        },
      });
      setRooms(response.data);
    } catch (err) {
      console.error("Error fetching rooms:", err);
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleCreateRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:3002/create-room",
        { name: roomName },
        {
          headers: {
            Authorization: token,
          },
        }
      );
      setRoomName("");
      setShowCreateForm(false);
      setIsCreating(false);
      
      // Refresh the rooms list
      await fetchRooms();
      
      // Navigate to the new room
      if (response.data && response.data.id) {
        router.push(`/room/${response.data.id}`);
      }
    } catch (err) {
      console.error("Error creating room:", err);
      setError("Failed to create room");
      setIsCreating(false);
    }
  };

  const handleJoinRoom = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsJoining(true);
    setError("");

    if (!roomId.trim()) {
      setError("Room ID is required");
      setIsJoining(false);
      return;
    }

    // Call the API endpoint to join the room
    axios.post(
      `http://localhost:3002/join-room/${roomId.trim()}`,
      {},
      {
        headers: {
          Authorization: token,
        },
      }
    )
      .then(() => {
        router.push(`/room/${roomId.trim()}`);
        setRoomId("");
        setShowCreateForm(false);
      })
      .catch((err) => {
        console.error("Error joining room:", err);
        setError("Failed to join room. It might not exist.");
      })
      .finally(() => {
        setIsJoining(false);
      });
  };

  const toggleFormMode = (mode: "create" | "join") => {
    setFormMode(mode);
    setError("");
  };

  if (!isAuthenticated) {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <Link href="/" className="font-bold">
            AI Draw
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-sm font-medium hover:text-primary">
              Home
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm font-medium hover:text-primary"
            >
              Logout
            </button>
            <ModeToggle />
          </nav>
        </div>
      </header>
      <main className="flex-1 p-6">
        <div className="container">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {showCreateForm ? "Cancel" : "Create or Join Room"}
            </button>
          </div>

          {showCreateForm && (
            <div className="mb-8 p-6 border rounded-lg bg-card text-card-foreground shadow-sm">
              <div className="flex space-x-2 mb-4 border-b">
                <button
                  onClick={() => toggleFormMode("create")}
                  className={`pb-2 px-4 text-sm font-medium transition-colors ${
                    formMode === "create"
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Create a Room
                </button>
                <button
                  onClick={() => toggleFormMode("join")}
                  className={`pb-2 px-4 text-sm font-medium transition-colors ${
                    formMode === "join"
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Join a Room
                </button>
              </div>

              {formMode === "create" ? (
                <>
                  <h2 className="text-xl font-semibold mb-4">Create a New Drawing Room</h2>
                  <form onSubmit={handleCreateRoom}>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="roomName" className="text-sm font-medium leading-none">
                          Room Name
                        </label>
                        <input
                          id="roomName"
                          value={roomName}
                          onChange={(e) => setRoomName(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          placeholder="Enter a name for your drawing room"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isCreating}
                        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {isCreating ? "Creating..." : "Create Room"}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-semibold mb-4">Join an Existing Room</h2>
                  <form onSubmit={handleJoinRoom}>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="roomId" className="text-sm font-medium leading-none">
                          Room ID
                        </label>
                        <input
                          id="roomId"
                          value={roomId}
                          onChange={(e) => setRoomId(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          placeholder="Enter the room ID you want to join"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isJoining}
                        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {isJoining ? "Joining..." : "Join Room"}
                      </button>
                    </div>
                  </form>
                </>
              )}
              {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow overflow-hidden group relative">
              <div className="flex flex-col space-y-1.5">
                <h3 className="text-2xl font-semibold">Your AI Drawing Rooms</h3>
                <p className="text-muted-foreground">Collaborate with others on AI-powered artwork</p>
              </div>
              <div className="p-6">
                {loadingRooms ? (
                  <div className="mt-4 flex items-center justify-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : rooms.length > 0 ? (
                  <div className="mt-4 space-y-3 max-h-60 overflow-y-auto">
                    {rooms.map((room) => (
                      <div 
                        key={room.id}
                        className="flex justify-between items-center p-3 border rounded-md hover:bg-muted cursor-pointer transition-colors"
                        onClick={() => router.push(`/room/${room.id}`)}
                      >
                        <div>
                          <h4 className="font-medium">{room.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            Created on {new Date(room.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button className="text-sm text-primary hover:underline">
                          Enter
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2 justify-end pt-2">
                      <button
                        onClick={() => {
                          setShowCreateForm(true);
                          setFormMode("create");
                        }}
                        className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
                      >
                        Create New
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-md border-muted-foreground/20">
                    <div className="text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-muted-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      <h3 className="mt-2 text-sm font-semibold">No rooms yet</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Get started by creating a new drawing room
                      </p>
                      <div className="mt-6 flex gap-2 justify-center">
                        <button
                          onClick={() => {
                            setShowCreateForm(true);
                            setFormMode("create");
                          }}
                          className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        >
                          <svg
                            className="-ml-0.5 mr-1.5 h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"
                            />
                          </svg>
                          Create
                        </button>
                        <button
                          onClick={() => {
                            setShowCreateForm(true);
                            setFormMode("join");
                          }}
                          className="inline-flex items-center rounded-md bg-secondary px-3 py-2 text-sm font-semibold text-secondary-foreground shadow-sm hover:bg-secondary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
                        >
                          Join
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col space-y-1.5">
                <h3 className="text-2xl font-semibold">Recent Activity</h3>
                <p className="text-muted-foreground">Your recent drawing sessions</p>
              </div>
              <div className="p-6">
                <div className="mt-4 flex flex-col items-center justify-center h-40 text-muted-foreground">
                  <p>No recent activity</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col space-y-1.5">
                <h3 className="text-2xl font-semibold">Tutorial</h3>
                <p className="text-muted-foreground">Learn how to use AI Draw</p>
              </div>
              <div className="p-6">
                <div className="mt-4 flex flex-col h-40">
                  <ul className="space-y-2">
                    <li className="flex items-center text-sm">
                      <span className="mr-2 text-green-500">✓</span>
                      Create a drawing room
                    </li>
                    <li className="flex items-center text-sm">
                      <span className="mr-2 text-green-500">✓</span>
                      Join an existing room
                    </li>
                    <li className="flex items-center text-sm">
                      <span className="mr-2 text-green-500">✓</span>
                      Use AI to generate art
                    </li>
                    <li className="flex items-center text-sm">
                      <span className="mr-2 text-green-500">✓</span>
                      Edit and collaborate in real-time
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 