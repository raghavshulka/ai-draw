"use client";

import Link from "next/link";
import { MessageSquare, Radio, Share2 } from "lucide-react";
import { SiteHeader } from "../components/site-header";
import { CanvasIllustration } from "../components/canvas-illustration";
import { buttonClasses, Container } from "../components/ui";
import { useAuth } from "./providers/authProvider";

const REPO_URL = "https://github.com/raghavshulka/ai-draw";

const features = [
  {
    icon: Radio,
    title: "Real-time sync",
    body: "Strokes are relayed over a WebSocket connection, so everyone in the room sees lines appear as they are drawn.",
  },
  {
    icon: Share2,
    title: "Rooms you share by ID",
    body: "Create a room from your dashboard, copy its ID, and send it to whoever should join.",
  },
  {
    icon: MessageSquare,
    title: "Chat beside the canvas",
    body: "Talk through the sketch without switching apps. Messages go to everyone in the same room.",
  },
];

const steps = [
  { title: "Create an account", body: "Pick a username and password." },
  { title: "Open or join a room", body: "Start a new room, or paste a room ID someone sent you." },
  { title: "Draw and talk", body: "Pick a colour and line width, sketch, and chat in the side panel." },
];

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b">
          <Container className="grid items-center gap-10 py-14 md:py-20 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
            <div className="space-y-6">
              <p className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                Open source, Excalidraw-inspired
              </p>
              <h1 className="[text-wrap:balance] text-4xl font-semibold tracking-tight sm:text-5xl">
                A whiteboard you can sketch on together, live.
              </h1>
              <p className="max-w-xl [text-wrap:pretty] text-lg text-muted-foreground">
                Open a room, share its ID, and draw with other people in real time, with a chat panel right next to the canvas.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href={isAuthenticated ? "/dashboard" : "/sign-up"}
                  className={buttonClasses({ size: "lg" })}
                >
                  {isAuthenticated ? "Open dashboard" : "Get started"}
                </Link>
                <a href={REPO_URL} target="_blank" rel="noreferrer" className={buttonClasses({ variant: "outline", size: "lg" })}>
                  View source on GitHub
                </a>
              </div>
            </div>
            <CanvasIllustration />
          </Container>
        </section>

        <section aria-labelledby="features-heading" className="py-14 md:py-20">
          <Container>
            <h2 id="features-heading" className="sr-only">Features</h2>
            <ul className="grid gap-4 md:grid-cols-3">
              {features.map(({ icon: Icon, title, body }) => (
                <li key={title} className="rounded-lg border bg-card p-6">
                  <span className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                    <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  </span>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </li>
              ))}
            </ul>
          </Container>
        </section>

        <section aria-labelledby="how-heading" className="border-t bg-muted/40 py-14 md:py-20">
          <Container>
            <h2 id="how-heading" className="text-2xl font-semibold tracking-tight">How it works</h2>
            <ol className="mt-8 grid gap-6 md:grid-cols-3">
              {steps.map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background font-mono text-sm">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-medium">{step.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Container>
        </section>
      </main>

      <footer className="border-t py-6">
        <Container className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>AIDraw: Next.js front end, Express API, and a Node WebSocket relay.</p>
          <a href={REPO_URL} target="_blank" rel="noreferrer" className="font-medium text-foreground underline-offset-4 hover:underline">
            github.com/raghavshulka/ai-draw
          </a>
        </Container>
      </footer>
    </div>
  );
}
