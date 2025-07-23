# AIDraw

AIDraw is an open-source collaborative drawing platform inspired by Excalidraw, designed for real-time collaborative sketching and diagramming.

## Overview

AIDraw provides a simple, intuitive interface for creating diagrams, sketches, and illustrations in real-time. Built with a modern tech stack, it leverages AI capabilities to enhance the drawing experience.

## Features (Planned)

- Real-time collaborative drawing
- Minimalist, intuitive UI
- Vector-based graphics for crisp rendering at any scale
- Shape recognition and auto-alignment
- Dark/light theme support
- Exportable drawings (PNG, SVG, etc.)
- Keyboard shortcuts for power users
- AI-assisted drawing features


## Tech Stack

- **Frontend**: Next.js, React, TypeScript
- **Backend**: Node.js
- **Real-time Communication**: WebSockets
- **Monorepo Structure**: Turborepo

## Project Structure

```
ai-draw/
├── apps/
│   ├── web/        # Next.js web application
│   ├── server/     # Backend server
│   └── ws/         # WebSocket server for real-time features
├── packages/
│   ├── ui/         # Shared UI components
│   ├── db/         # Database package with Prisma ORM
│   └── ...         # Other shared packages
```

## Getting Started

### Prerequisites

- Node.js (>= 18)
- pnpm (>= 9.0.0)
- PostgreSQL database

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/ai-draw.git
cd ai-draw

# Install dependencies
pnpm install

# Set up environment variables
# Create a .env file in packages/db with:
# DATABASE_URL="postgresql://username:password@localhost:5432/ai-draw"

# Generate Prisma client
pnpm prisma:generate
```

### Development

To run the development environment:

```bash
pnpm dev
```

This will start all applications in development mode.

### Building

To build all applications:

```bash
pnpm build
```

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a pull request

## License

[MIT](LICENSE)

## Acknowledgements

- Built with [Turborepo](https://turbo.build/)
