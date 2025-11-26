# Jael Pet 🐱

A cute pixel art desktop cat that lives on your screen! Watch it walk around, groom itself, take naps, and react to your interactions.

![Cat Preview](sprites/01_idle/tile000.png)

## Features

- 🚶 **Autonomous Behavior** - The cat walks around your desktop on its own
- 😴 **Sleeping** - Occasionally takes naps with cute "zzz" animations
- 🧹 **Grooming** - Licks its paws and cleans itself
- 🐾 **Scratching** - Does adorable scratching animations
- ❤️ **Pet Interaction** - Click the cat to pet it and see hearts!
- 🖱️ **Draggable** - Pick up and move your cat anywhere on screen
- 👀 **Alert Mode** - Sometimes looks around curiously

## Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm (comes with Node.js)

### Setup

1. Clone or download this repository:
   ```bash
   git clone https://github.com/yourusername/jael-pet.git
   cd jael-pet
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the desktop pet:
   ```bash
   npm start
   ```

## Usage

### Interactions

| Action | Result |
|--------|--------|
| **Click** | Pet the cat - shows hearts! |
| **Double-click** | Wake up sleeping cat or trigger fun animations |
| **Drag** | Pick up and move the cat anywhere |

### System Tray

Right-click the cat icon in your system tray for options:
- **Reset Position** - Move cat back to center bottom
- **Toggle Click-Through** - Make the cat non-interactive (so you can click through it)
- **Quit** - Close the application

## Animations

The cat has multiple animation states:

| State | Description |
|-------|-------------|
| Idle | Sitting calmly |
| Walking | Moving across the screen |
| Sleeping | Lying down with floating "z"s |
| Grooming | Licking paws and cleaning |
| Scratching | Playful scratching motion |
| Alert | Looking around curiously |

## Development

```bash
# Run in development mode
npm run dev

# The app uses Electron for cross-platform desktop support
```

## Project Structure

```
jael-pet/
├── sprites/          # Organized sprite animations
├── main.js           # Electron main process
├── renderer.js       # Animation & behavior logic
├── index.html        # Pet window UI
├── package.json      # Dependencies
└── README.md
```

## Sprite Sheet

The cat sprites are organized as follows:
- `tile000-003` - Idle sitting
- `tile008-011` - Idle variation
- `tile016-019` - Alert/looking around
- `tile024-027` - Sitting poses
- `tile032-047` - Grooming animations
- `tile048-051` - Sleeping
- `tile056-061` - Walking
- `tile064-070` - Sit variations
- `tile072-079` - Scratching

## Building Executables

### Local Build

```bash
# Build for your current platform
npm run build

# Build for specific platforms
npm run build:mac    # macOS (.dmg, .zip)
npm run build:win    # Windows (.exe)
npm run build:linux  # Linux (.AppImage, .deb)
```

Built files will be in the `dist/` folder.

### CI/CD (GitHub Actions)

This project includes a GitHub Actions workflow that automatically builds for all platforms:

- **Trigger**: Push or PR to `main` branch
- **Outputs**: macOS (.dmg), Windows (.exe), Linux (.AppImage)
- **Release**: Tag with `v*` (e.g., `v1.0.0`) to auto-create a GitHub Release

#### Creating a Release

```bash
git tag v1.0.0
git push origin v1.0.0
```

This will trigger the build pipeline and create a GitHub Release with all platform binaries attached.

## License

MIT License - Feel free to use and modify!

---

Made with ❤️ for Jael
