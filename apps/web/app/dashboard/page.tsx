"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { SiteHeader } from "../../components/site-header";
import { CopyButton } from "../../components/copy-button";
import { Button, Card, Container, FormError, Input, Label, Spinner, buttonClasses } from "../../components/ui";
import { useAuth } from "../providers/authProvider";
import axios from "axios";

interface Room {
  id: string;
  name: string;
  createdAt: string;
}

export default function Dashboard() {
  const { isAuthenticated, ready, token } = useAuth();
  const router = useRouter();
  const [roomName, setRoomName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [createError, setCreateError] = useState("");
  const [joinError, setJoinError] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [roomsError, setRoomsError] = useState(false);

  useEffect(() => {
    // Wait until the stored token has been read before deciding to redirect.
    if (!ready) return;
    if (!isAuthenticated) {
      router.push("/sign-in");
      return;
    }

    // Fetch user's rooms
    fetchRooms();
  }, [ready, isAuthenticated, router, token]);

  const fetchRooms = async () => {
    if (!token) return;
    
    setLoadingRooms(true);
    setRoomsError(false);
    try {
      const response = await axios.get(`${API_URL}/my-rooms`, {
        headers: {
          Authorization: token,
        },
      });
      setRooms(response.data);
    } catch (err) {
      console.error("Error fetching rooms:", err);
      setRoomsError(true);
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);
    setCreateError("");

    try {
      const response = await axios.post(
        `${API_URL}/create-room`,
        { name: roomName },
        {
          headers: {
            Authorization: token,
          },
        }
      );
      setRoomName("");
      setIsCreating(false);
      
      // Refresh the rooms list
      await fetchRooms();
      
      // Navigate to the new room
      if (response.data && response.data.id) {
        router.push(`/room/${response.data.id}`);
      }
    } catch (err) {
      console.error("Error creating room:", err);
      setCreateError("Could not create the room. Try again.");
      setIsCreating(false);
    }
  };

  const handleJoinRoom = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsJoining(true);
    setJoinError("");

    if (!roomId.trim()) {
      setJoinError("Enter a room ID.");
      setIsJoining(false);
      return;
    }

    // Call the API endpoint to join the room
    axios.post(
      `${API_URL}/join-room/${roomId.trim()}`,
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
      })
      .catch((err) => {
        console.error("Error joining room:", err);
        setJoinError("Could not join that room. Check the ID and try again.");
      })
      .finally(() => {
        setIsJoining(false);
      });
  };

  if (!isAuthenticated) {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 py-10">
        <Container>
          <div className="mb-8 space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Your rooms</h1>
            <p className="text-muted-foreground">
              Create a room or join one with an ID someone shared with you.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">

            <section aria-labelledby="rooms-heading">
              <h2 id="rooms-heading" className="sr-only">Rooms</h2>
              {loadingRooms ? (
                <div className="grid gap-4 sm:grid-cols-2" aria-busy="true">
                  <Spinner className="sr-only" label="Loading rooms" />
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-[132px] animate-pulse rounded-lg border bg-muted/50" />
                  ))}
                </div>
              ) : roomsError ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-14 text-center">
                  <h3 className="font-semibold">Could not load your rooms</h3>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    The API did not respond. You can still join a room by ID.
                  </p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={fetchRooms}>
                    Try again
                  </Button>
                </div>
              ) : rooms.length > 0 ? (
                <ul className="grid gap-4 sm:grid-cols-2">
                  {rooms.map((room) => (
                    <li key={room.id}>
                      <Card className="flex h-full flex-col p-5 transition-colors hover:border-foreground/20">
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold" title={room.name}>{room.name}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">Created {formatDate(room.createdAt)}</p>
                        </div>
                        <div className="mt-3 flex items-center gap-1 rounded-md bg-muted px-2 py-1">
                          <span className="sr-only">Room ID</span>
                          <code className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">{room.id}</code>
                          <CopyButton value={String(room.id)} label={`Copy ID of ${room.name}`} size="icon" className="h-7 w-7" />
                        </div>
                        <div className="mt-4 flex justify-end">
                          <Link href={`/room/${room.id}`} className={buttonClasses({ size: "sm" })} aria-label={`Open ${room.name}`}>
                            Open
                            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                          </Link>
                        </div>
                      </Card>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-14 text-center">
                  <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                    <Plus className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="font-semibold">No rooms yet</h3>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    Create your first room, or join one with an ID a teammate sent you.
                  </p>
                  <Button size="sm" className="mt-4" onClick={() => document.getElementById("roomName")?.focus()}>
                    Create a room
                  </Button>
                </div>
              )}
            </section>

            <aside className="space-y-4" aria-label="Create or join a room">
              <Card className="p-5">
                <h2 className="font-semibold">New room</h2>
                <p className="mt-1 text-sm text-muted-foreground">You will be taken straight into it.</p>
                <form onSubmit={handleCreateRoom} className="mt-4 space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="roomName">Room name</Label>
                    <Input
                      id="roomName"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      placeholder="e.g. Sprint planning"
                      required
                    />
                  </div>
                  <FormError>{createError}</FormError>
                  <Button type="submit" disabled={isCreating} className="w-full">
                    {isCreating ? <Spinner className="h-4 w-4 border-primary-foreground/30 border-t-primary-foreground" label="Creating room" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
                    {isCreating ? "Creating…" : "Create room"}
                  </Button>
                </form>
              </Card>

              <Card className="p-5">
                <h2 className="font-semibold">Join a room</h2>
                <p className="mt-1 text-sm text-muted-foreground">Paste the ID a teammate copied for you.</p>
                <form onSubmit={handleJoinRoom} className="mt-4 space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="roomId">Room ID</Label>
                    <Input
                      id="roomId"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      placeholder="Paste a room ID"
                      autoComplete="off"
                      spellCheck={false}
                      className="font-mono"
                      required
                    />
                  </div>
                  <FormError>{joinError}</FormError>
                  <Button type="submit" variant="outline" disabled={isJoining} className="w-full">
                    {isJoining ? "Joining…" : "Join room"}
                  </Button>
                </form>
              </Card>
            </aside>
          </div>
        </Container>
      </main>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "recently";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
