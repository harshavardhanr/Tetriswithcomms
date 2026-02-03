import { WebRTCSignaling, PeerJSSignaling } from './webrtc-signaling.js';

class PhoneController {
    constructor() {
        this.signaling = null;
        this.peerSignaling = null;
        this.connectionId = null;
        this.isConnected = false;
        this.isHost = true;
        
        this.init();
    }
    
    async init() {
        // Setup controls first
        this.setupControls();
        
        // Pre-fill code from URL if present
        const urlParams = new URLSearchParams(window.location.search);
        const urlId = urlParams.get('id');
        const codeInput = document.getElementById('connectionCode');
        if (urlId) {
            codeInput.value = urlId.toUpperCase().substring(0, 8);
        } else {
            codeInput.value = this.generateConnectionId();
        }
        codeInput.placeholder = 'e.g. ABC123';
        
        this.updateStatus('Ready', 'Enter code & click Start');
    }
    
    generateConnectionId() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }
    
    async startConnection() {
        this.connectionId = document.getElementById('connectionCode').value.trim().toUpperCase();
        if (!this.connectionId || this.connectionId.length < 4) {
            this.updateStatus('Error', 'Enter at least 4 characters');
            return;
        }
        
        const btn = document.getElementById('btnConnect');
        if (btn) { btn.disabled = true; btn.textContent = 'Waiting...'; }
        
        this.peerSignaling = new PeerJSSignaling(this.connectionId, this.isHost);
        this.signaling = new WebRTCSignaling((message) => this.handleMessage(message));
        try {
            // Initialize PeerJS signaling
            await this.peerSignaling.initialize((message) => {
                this.handleMessage(message);
            });
            
            this.updateStatus('Ready', 'Waiting for VR headset to connect');
        } catch (error) {
            console.error('Error starting connection:', error);
            this.updateStatus('Connection Error', error.message);
        }
    }
    
    setupControls() {
        document.getElementById('btnConnect').addEventListener('click', () => this.startConnection());
        
        document.getElementById('connectionCode').addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        });
        
        document.getElementById('left').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.sendCommand('left');
        });
        
        document.getElementById('right').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.sendCommand('right');
        });
        
        document.getElementById('down').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.sendCommand('down');
        });
        
        document.getElementById('rotate').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.sendCommand('rotate');
        });
        
        document.getElementById('pause').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.sendCommand('pause');
        });
        
        // Also support click for testing
        document.getElementById('left').addEventListener('click', () => this.sendCommand('left'));
        document.getElementById('right').addEventListener('click', () => this.sendCommand('right'));
        document.getElementById('down').addEventListener('click', () => this.sendCommand('down'));
        document.getElementById('rotate').addEventListener('click', () => this.sendCommand('rotate'));
        document.getElementById('pause').addEventListener('click', () => this.sendCommand('pause'));
        
        // Keyboard support for testing
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowLeft':
                    this.sendCommand('left');
                    break;
                case 'ArrowRight':
                    this.sendCommand('right');
                    break;
                case 'ArrowDown':
                    this.sendCommand('down');
                    break;
                case 'ArrowUp':
                case ' ':
                    this.sendCommand('rotate');
                    break;
                case 'p':
                case 'P':
                    this.sendCommand('pause');
                    break;
            }
        });
    }
    
    sendCommand(command) {
        // Send via PeerJS connection
        if (this.peerSignaling && this.isConnected) {
            this.peerSignaling.sendSignal({
                type: 'command',
                command: command
            });
        } else {
            console.log('Not connected, command:', command);
        }
    }
    
    handleMessage(message) {
        if (message.type === 'connected' || message.type === 'peerReady') {
            this.isConnected = true;
            this.updateStatus('Connected', 'VR headset ready');
            document.getElementById('connectionInfo').textContent = 'Connected to VR headset';
            document.getElementById('connectionInfo').style.color = '#0f0';
        } else if (message.type === 'disconnected') {
            this.isConnected = false;
            this.updateStatus('Disconnected', 'Waiting for VR headset');
            document.getElementById('connectionInfo').textContent = 'Disconnected';
            document.getElementById('connectionInfo').style.color = '#ff0';
        }
    }
    
    updateStatus(status, info) {
        document.getElementById('status').textContent = status;
        if (info) {
            document.getElementById('connectionInfo').textContent = info;
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new PhoneController();
    });
} else {
    new PhoneController();
}

