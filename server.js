const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files
app.use(express.static('public'));

// Store connected clients
const clients = {
  headset: null,
  controller: null
};

wss.on('connection', (ws, req) => {
  console.log('New connection established');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      // Register client type
      if (data.type === 'register') {
        if (data.role === 'headset') {
          clients.headset = ws;
          console.log('Headset connected');
          ws.send(JSON.stringify({ type: 'registered', role: 'headset' }));
        } else if (data.role === 'controller') {
          clients.controller = ws;
          console.log('Controller connected');
          ws.send(JSON.stringify({ type: 'registered', role: 'controller' }));

          // Notify headset that controller is connected
          if (clients.headset && clients.headset.readyState === WebSocket.OPEN) {
            clients.headset.send(JSON.stringify({ type: 'controller_connected' }));
          }
        }
      }

      // Forward control messages from controller to headset
      else if (data.type === 'control' && ws === clients.controller) {
        if (clients.headset && clients.headset.readyState === WebSocket.OPEN) {
          clients.headset.send(JSON.stringify(data));
        }
      }

      // Forward game state from headset to controller
      else if (data.type === 'game_state' && ws === clients.headset) {
        if (clients.controller && clients.controller.readyState === WebSocket.OPEN) {
          clients.controller.send(JSON.stringify(data));
        }
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    if (ws === clients.headset) {
      console.log('Headset disconnected');
      clients.headset = null;
      if (clients.controller && clients.controller.readyState === WebSocket.OPEN) {
        clients.controller.send(JSON.stringify({ type: 'headset_disconnected' }));
      }
    } else if (ws === clients.controller) {
      console.log('Controller disconnected');
      clients.controller = null;
      if (clients.headset && clients.headset.readyState === WebSocket.OPEN) {
        clients.headset.send(JSON.stringify({ type: 'controller_disconnected' }));
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Headset: http://YOUR_IP:${PORT}/headset.html`);
  console.log(`Controller: http://YOUR_IP:${PORT}/controller.html`);
});
