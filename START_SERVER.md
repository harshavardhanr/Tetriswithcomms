# Quick Start Guide

## Easiest Way to Test Locally

### Step 1: Start a Local Server

Open a terminal in this directory and run:

```bash
python3 -m http.server 8000
```

Or if you have Python 2:
```bash
python -m SimpleHTTPServer 8000
```

### Step 2: Access on Your Devices

**On your VR Headset:**
1. Find your computer's local IP address:
   - Windows: `ipconfig` (look for IPv4)
   - Mac/Linux: `ifconfig` or `ip addr` (look for 192.168.x.x)
2. Open browser on headset
3. Go to: `http://YOUR_IP:8000/index.html`
4. Click "Start AR Session"
5. **Note the Peer ID shown on screen**

**On your Phone:**
1. Make sure phone is on the same WiFi network
2. Open browser on phone
3. Go to: `http://YOUR_IP:8000/phone.html`
4. Enter the Peer ID from your headset
5. Click "Connect"

### Important Notes

- **Same WiFi Network**: Both devices must be on the same WiFi
- **HTTPS for Production**: For real deployment, you'll need HTTPS (use ngrok or deploy to GitHub Pages)
- **Some headsets** may require HTTPS even for local testing. If that's the case, use the ngrok method below.

---

## If Local HTTP Doesn't Work (Use HTTPS)

Some VR headsets require HTTPS even for testing. Use this method:

### 1. Install ngrok
Download from: https://ngrok.com/download

### 2. Start your local server
```bash
python3 -m http.server 8000
```

### 3. In another terminal, create HTTPS tunnel
```bash
ngrok http 8000
```

### 4. Use the HTTPS URL ngrok provides
Look for the line like: `Forwarding https://abcd1234.ngrok.io -> http://localhost:8000`

Use that HTTPS URL on both your headset and phone:
- Headset: `https://abcd1234.ngrok.io/index.html`
- Phone: `https://abcd1234.ngrok.io/phone.html`

---

## Alternative: Use GitHub Pages (No Setup Required)

1. Push your code to a public GitHub repository
2. Enable GitHub Pages in repository Settings
3. Access via: `https://yourusername.github.io/yourrepo/index.html`

This provides HTTPS automatically and works from anywhere!
