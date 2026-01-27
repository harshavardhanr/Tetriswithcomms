# WebXR Tetris - Quest Headset with Phone Controller

A WebXR prototype of Tetris that runs on a Quest VR headset and is controlled via a phone-based UI. The communication between devices uses WebRTC peer-to-peer technology, requiring no local server.

## Features

- **WebXR Support**: Runs on Quest VR headsets using WebXR API
- **Phone Controller**: Landscape-optimized UI for mobile devices
- **Peer-to-Peer Communication**: Uses PeerJS for signaling and WebRTC DataChannels for game commands
- **No Local Server Required**: Uses PeerJS free signaling servers (no local server setup needed)

## Deployment Options

### Option 1: GitHub Pages (Recommended - Free HTTPS Hosting)

1. **Create a GitHub repository:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

2. **Enable GitHub Pages:**
   - Go to your repository on GitHub
   - Click **Settings** → **Pages**
   - Under "Source", select **main** branch (or your default branch)
   - Click **Save**
   - Your site will be available at: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

3. **Access your app:**
   - Phone controller: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/phone.html`
   - VR headset: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/index.html`

**Note:** GitHub Pages provides HTTPS automatically, which is required for WebRTC!

### Option 2: Local Development Server

For local testing, use a simple HTTP server:

```bash
# Python 3
python3 -m http.server 8000

# Node.js (if you have http-server installed)
npx http-server -p 8000
```

Then access:
- Phone controller: `http://localhost:8000/phone.html`
- VR headset: `http://YOUR_LOCAL_IP:8000/index.html` (use your computer's IP for Quest)

## Setup Instructions

### For Quest Headset (VR)

1. Open the Quest browser (Oculus Browser)
2. Navigate to your hosted URL (GitHub Pages or local server)
3. Click "Enter VR" button to start the WebXR session
4. Note the Connection ID displayed on screen

### For Phone Controller

1. Open `phone.html` in your phone's browser (landscape mode recommended)
2. A Connection ID and QR code will be displayed
3. Either:
   - Scan the QR code with the Quest headset, OR
   - Manually enter the Connection ID in the Quest browser URL: `index.html?id=CONNECTION_ID`

### Connection Process

The system uses PeerJS for peer-to-peer communication:
- **Signaling**: PeerJS free signaling servers (0.peerjs.com) - no local server needed
- **Data Transfer**: WebRTC DataChannels via PeerJS for low-latency game commands
- **Connection ID**: Phone generates a unique ID, VR headset connects using this ID

## Controls (Phone)

- **← Left**: Move piece left
- **→ Right**: Move piece right
- **↓ Down**: Move piece down
- **↻ Rotate**: Rotate piece
- **Pause**: Pause/unpause game

## Technical Details

### Architecture

- `index.html` / `vr-tetris.js`: VR headset application
- `phone.html` / `phone-controller.js`: Phone controller UI
- `tetris-game.js`: Core Tetris game logic
- `webrtc-signaling.js`: WebRTC connection and signaling management

### Communication Flow

1. Phone generates Connection ID and creates WebRTC offer
2. Offer is stored in localStorage with Connection ID
3. VR headset polls localStorage for signals matching Connection ID
4. VR headset creates answer and stores it in localStorage
5. Phone receives answer and establishes WebRTC connection
6. Game commands are sent via WebRTC DataChannel

### Limitations

- Requires internet connection (for PeerJS signaling servers)
- Requires HTTPS or localhost (WebRTC requirement)
- First connection may take a few seconds to establish
- Both devices need to be able to access PeerJS servers

## Browser Compatibility

- **Quest**: Oculus Browser (WebXR support required)
- **Phone**: Modern browsers with WebRTC support (Chrome, Safari, Firefox)

## Development Notes

To test locally without a Quest headset:
- Use Chrome with WebXR emulation flags
- Or test the phone controller separately

## Future Improvements

- Add game state synchronization
- Implement better signaling mechanism (WebSocket fallback)
- Add multiplayer support
- Improve visual effects and animations

