# WebXR Tetris Prototype

A WebXR-based Tetris game that runs on VR headsets with passthrough mode, controlled by a mobile phone interface.

## Features

- **WebXR AR Mode**: View the game in augmented reality using passthrough on compatible VR headsets
- **3D Tetris Board**: Classic Tetris gameplay rendered in 3D space
- **Mobile Controller**: Control the game using a separate mobile phone interface
- **WebRTC Connection**: Real-time communication between headset and phone using PeerJS

## How It Works

The game consists of two interfaces:

1. **Headset View (index.html)**: The main game runs in WebXR AR mode on a VR headset
2. **Phone Controller (phone.html)**: A mobile interface that sends control commands to the headset

The two devices communicate via WebRTC using PeerJS for peer-to-peer connection.

## Setup Instructions

### Requirements

- **VR Headset**: A WebXR-compatible device (Meta Quest 2/3/Pro, Pico, etc.) with passthrough support
- **Mobile Phone**: Any modern smartphone with a web browser
- **HTTPS Server**: Both devices must access the app via HTTPS (required for WebXR)

### Running Locally

1. **Serve the files over HTTPS**:

   You can use any HTTPS server. Here are some options:

   **Option A: Using Python (requires SSL certificate)**
   ```bash
   python3 -m http.server 8000
   ```
   Then use a tool like ngrok to create HTTPS tunnel:
   ```bash
   ngrok http 8000
   ```

   **Option B: Using Node.js http-server with ngrok**
   ```bash
   npx http-server -p 8000
   ngrok http 8000
   ```

2. **Access on VR Headset**:
   - Open the browser on your VR headset
   - Navigate to your HTTPS URL (e.g., `https://your-ngrok-url.ngrok.io/index.html`)
   - Click "Start AR Session" button
   - Note the Peer ID displayed on screen (e.g., "vr-abc123xyz")

3. **Connect from Phone**:
   - Open the browser on your mobile phone
   - Navigate to `https://your-ngrok-url.ngrok.io/phone.html`
   - Enter the Peer ID from the headset
   - Click "Connect"
   - Once connected, use the on-screen controls to play

### GitHub Pages Deployment

You can also deploy to GitHub Pages with a custom domain that supports HTTPS:

1. Push files to your repository
2. Enable GitHub Pages in repository settings
3. Access via your GitHub Pages URL

Note: GitHub Pages provides HTTPS by default.

## Controls

### Mobile Controller Buttons

- **⬅️ Left**: Move piece left
- **➡️ Right**: Move piece right
- **⬇️ Down**: Move piece down faster
- **🔄 Rotate**: Rotate piece clockwise
- **⚡ Hard Drop**: Instantly drop piece to bottom

## Game Rules

- Standard Tetris gameplay
- Clear complete horizontal lines to score points
- Game ends when pieces reach the top of the board
- Score: 100 points per line cleared

## Technical Details

### WebXR Implementation

- Uses WebXR Device API with `immersive-ar` mode
- Renders using WebGL 2.0 with custom shaders
- Game board positioned 1 meter in front of the user
- Board size: 10 blocks wide × 20 blocks tall

### Networking

- **PeerJS**: Simplifies WebRTC peer-to-peer connections
- **Data Channel**: Sends control commands as JSON objects
- **Connection Flow**:
  1. Headset creates peer with ID "vr-xxxxx"
  2. Phone creates peer with ID "phone-xxxxx"
  3. Phone connects to headset using the headset's peer ID
  4. Commands sent as: `{ command: "left" | "right" | "down" | "rotate" | "drop" }`

### Browser Compatibility

- **Headset**: Requires WebXR support (Meta Quest Browser, Wolvic, etc.)
- **Phone**: Any modern mobile browser (Chrome, Safari, Firefox)

## Development

### File Structure

```
.
├── index.html      # VR headset view (main game)
├── phone.html      # Mobile controller interface
└── README.md       # This file
```

### Modifying the Game

**Game Logic**: Located in the `TetrisGame` class in `index.html`
- Adjust board size: Change `this.width` and `this.height`
- Change drop speed: Modify `this.dropInterval` (milliseconds)
- Add new pieces: Extend `this.pieces` object

**Visual Appearance**: Located in the `WebXRTetrisRenderer` class
- Block size: Modify `blockSize` variable in `renderGame()`
- Board position: Adjust `boardOffsetX`, `boardOffsetY`, `boardOffsetZ`
- Colors: Modify `this.colors` array in `TetrisGame`

**Controller Layout**: Located in `phone.html`
- Button arrangement: Modify the `.control-row` divs
- Styling: Update the CSS in the `<style>` section

## Troubleshooting

### "WebXR not supported" Error
- Ensure you're using a WebXR-compatible browser on your headset
- Make sure you're accessing via HTTPS

### Connection Fails Between Devices
- Verify both devices are accessing via the same HTTPS URL
- Check that the Peer ID is entered correctly (case-sensitive)
- Ensure both devices have internet connection (PeerJS requires signaling server)

### AR Session Won't Start
- Grant camera permissions if prompted
- Some headsets require "passthrough" to be enabled in settings
- Try restarting the browser

### Controls Not Working
- Verify connection status shows "Connected" on phone
- Check browser console for errors
- Try refreshing both pages and reconnecting

## Future Enhancements

Potential improvements for this prototype:

- Add sound effects and music
- Implement multiplayer mode
- Add power-ups and special pieces
- Create a lobby system for easier pairing
- Add hand tracking controls as an alternative to phone
- Implement score leaderboard
- Add difficulty levels
- Create ghost piece preview

## License

This is a prototype/demonstration project. Feel free to use and modify as needed.
