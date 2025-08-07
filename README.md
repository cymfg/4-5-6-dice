# 4-5-6 Dice Game

A modern 3D dice game built with React, TypeScript, and Vite. Features beautiful 3D dice animations powered by dice-box library and a sleek, responsive UI design.

## Features

- 🎲 Realistic 3D dice with physics simulation
- 🎨 Modern glass morphism UI design
- 📱 Fully responsive for all screen sizes
- ⚡ High-performance rendering with crisp visuals
- 🎮 Classic 4-5-6 dice game rules
- 💰 Betting system with banker vs player gameplay

## Game Rules

- **Auto Win:** 4-5-6, Point 6, Triples (for player)
- **Auto Lose:** 1-2-3, Point 1
- **Points:** Higher point beats lower point
- **Banker:** Wins on their own triples

## Development

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <your-repo-url>

# Navigate to project directory
cd 4-5-6

# Install dependencies
npm install
```

### Running Locally

```bash
# Start development server
npm run dev

# Open browser to http://localhost:5173
```

### Building for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## Deployment

### Deploy to Vercel

This project is configured for easy deployment to Vercel:

1. **Automatic Deployment (Recommended):**
   - Push to GitHub
   - Connect repository to Vercel
   - Vercel will automatically detect the configuration and deploy

2. **Manual Deployment:**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Deploy from project root
   vercel

   # Follow the prompts
   ```

3. **Deploy via GitHub:**
   - Push your code to GitHub
   - Import project in Vercel dashboard
   - Vercel will use the `vercel.json` configuration automatically

### Configuration

The project includes a `vercel.json` file with:
- Vite framework detection
- SPA routing support
- Asset caching headers
- WASM content type headers for 3D dice

## Tech Stack

- **Frontend:** React 18, TypeScript
- **Styling:** Tailwind CSS
- **3D Rendering:** @3d-dice/dice-box
- **Build Tool:** Vite
- **Icons:** Lucide React
- **Deployment:** Vercel

## Project Structure

```
├── public/
│   └── assets/
│       └── dice-box/          # 3D dice assets
├── src/
│   ├── DiceGame.tsx          # Main game component
│   ├── App.tsx               # App wrapper
│   └── main.tsx              # Entry point
├── vercel.json               # Vercel deployment config
└── package.json
```

## Performance

- Optimized for high-DPI displays
- Efficient 3D rendering with device pixel ratio scaling
- Responsive canvas sizing
- Minimal bundle size with code splitting

## Browser Support

- Chrome/Chromium 88+
- Firefox 85+
- Safari 14+
- Edge 88+

*3D dice require WebGL2 support. Falls back to 2D dice icons if unavailable.*

## License

MIT License - feel free to use for personal or commercial projects.