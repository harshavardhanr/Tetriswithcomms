# WebXR AR Tetris

A WebXR augmented reality Tetris game designed for Meta Quest headsets with mobile phone controls.

## Features

- **AR Display**: Full 3D Tetris game rendered in AR with passthrough on Quest headsets
- **Mobile Controls**: Landscape-oriented mobile phone interface for game control
- **Real-time Communication**: WebSocket-based communication between headset and controller
- **Classic Tetris Gameplay**: All 7 standard Tetriminos with rotation, scoring, and levels
- **Progressive Difficulty**: Speed increases as you clear lines

## Architecture

The application consists of three main components:

1. **Node.js Server** (`server.js`): WebSocket server facilitating real-time communication
2. **Headset Client** (`public/headset.html`): WebXR AR application for Quest
3. **Controller Client** (`public/controller.html`): Mobile touch interface for controls

## Requirements

- Meta Quest 2/3/Pro headset with browser supporting WebXR
- Mobile phone (iOS/Android) with modern web browser
- Node.js (v14 or higher)
- Both devices on the same network

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mobileexperiment
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Find your local IP address:
   - **Linux/Mac**: `ifconfig` or `ip addr`
   - **Windows**: `ipconfig`

## Usage

### Step 1: Start the Server

Run `npm start` on your computer. The server will display:
```
Server running on port 3000
Headset: http://YOUR_IP:3000/headset.html
Controller: http://YOUR_IP:3000/controller.html
```

### Step 2: Connect the Quest Headset

1. Put on your Quest headset
2. Open the Meta Quest Browser
3. Navigate to `http://YOUR_IP:3000/headset.html`
4. Click "Start AR Tetris"
5. Grant AR permissions when prompted
6. The game board will appear in your space

### Step 3: Connect the Mobile Controller

1. On your mobile phone, open a web browser
2. Navigate to `http://YOUR_IP:3000/controller.html`
3. Rotate your phone to landscape mode
4. Wait for "Connected" status to appear

### Step 4: Play!

**Mobile Controls:**
- **NEW GAME**: Start a new game
- **LEFT/RIGHT**: Move piece horizontally
- **DOWN**: Soft drop (move piece down faster)
- **ROTATE**: Rotate piece 90° clockwise
- **HARD DROP**: Instantly drop piece to bottom

**Scoring:**
- Moving down manually: 2 points
- Clearing 1 line: 100 × level
- Clearing 2 lines: 200 × level
- Clearing 3 lines: 300 × level
- Clearing 4 lines: 400 × level

**Levels:**
- Every 10 lines cleared increases the level
- Higher levels mean faster piece dropping

## Troubleshooting

### Connection Issues

**Problem**: Controller shows "Disconnected"
- Ensure both devices are on the same WiFi network
- Check firewall settings allow port 3000
- Try reloading both pages

**Problem**: "WebXR not supported"
- Ensure you're using Meta Quest Browser (not Chrome/Firefox)
- Check Quest browser is up to date
- Try restarting the browser

### AR Session Issues

**Problem**: AR session won't start
- Grant camera and motion permissions when prompted
- Ensure room has adequate lighting
- Try moving to a different location

### Performance Issues

**Problem**: Game is laggy
- Close other apps on Quest
- Reduce browser tabs
- Move closer to WiFi router

## Technical Details

### WebXR Features Used
- `immersive-ar` session mode
- `local-floor` reference space
- Passthrough rendering

### 3D Rendering
- Three.js for 3D graphics
- Real-time block positioning
- Dynamic lighting

### Communication Protocol

**Registration:**
```json
{ "type": "register", "role": "headset|controller" }
```

**Control Message (Controller → Headset):**
```json
{ "type": "control", "action": "left|right|down|rotate|drop|new_game" }
```

**Game State (Headset → Controller):**
```json
{
  "type": "game_state",
  "score": 0,
  "level": 1,
  "linesCleared": 0,
  "gameActive": true
}
```

## Development

### Project Structure
```
mobileexperiment/
├── server.js           # WebSocket server
├── package.json        # Dependencies
├── public/
│   ├── headset.html   # Quest AR client
│   └── controller.html # Mobile controller
└── README.md
```

### Adding Features

**New Control Actions:**
1. Add button to `controller.html`
2. Send action via `sendControl()`
3. Handle action in `headset.html` `handleControl()`

**Modifying Game Board:**
- Adjust `BOARD_WIDTH`, `BOARD_HEIGHT` in `headset.html`
- Modify `BLOCK_SIZE` for piece size
- Change `BOARD_OFFSET` for position in space

## Known Limitations

- Only one controller and one headset can connect at a time
- Requires stable network connection
- AR placement is fixed (not interactive positioning)
- No persistence (game state lost on refresh)

## Future Enhancements

- [ ] Multiple difficulty modes
- [ ] Sound effects and music
- [ ] Multiplayer support
- [ ] Ghost piece preview
- [ ] Next piece preview
- [ ] Hold piece functionality
- [ ] Leaderboard/high scores
- [ ] Hand tracking controls

## License

MIT License

## Credits

Built with:
- [Three.js](https://threejs.org/) - 3D rendering
- [WebXR Device API](https://www.w3.org/TR/webxr/) - AR capabilities
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) - Real-time communication
