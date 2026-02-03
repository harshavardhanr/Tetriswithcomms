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
        if (btn) { btn.disabled = true; btn.textContent = 'Starting…'; }
        
        if (this.peerSignaling) {
            this.peerSignaling.close();
            this.peerSignaling = null;
        }
        
        this.peerSignaling = new PeerJSSignaling(this.connectionId, this.isHost);
        this.signaling = new WebRTCSignaling((message) => this.handleMessage(message));
        try {
            this.updateStatus('Connecting…', 'Registering code…');
            await this.peerSignaling.initialize((message) => {
                this.handleMessage(message);
            });
            // If peer opened already, handleMessage('peerReady') will update UI; else wait for it
            if (!document.getElementById('btnConnect').disabled) {
                this.updateStatus('Ready', 'Type this code on the VR headset');
                const btn = document.getElementById('btnConnect');
                if (btn) { btn.textContent = 'Waiting for VR…'; btn.disabled = true; }
            }
        } catch (error) {
            console.error('Error starting connection:', error);
            this.updateStatus('Connection Error', error.message);
            const btn = document.getElementById('btnConnect');
            if (btn) { btn.disabled = false; btn.textContent = 'Start & wait for VR'; }
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
        if (!this.peerSignaling) return;
        const sent = this.peerSignaling.sendSignal({ type: 'command', command });
        if (!sent && this.isConnected) {
            console.warn('Command not sent (connection may have dropped):', command);
        }
    }
    
    handleMessage(message) {
        if (message.type === 'peerReady') {
            this.isConnected = false;
            this.updateStatus('Ready', 'Type this code on the VR headset');
            document.getElementById('connectionInfo').textContent = 'Waiting for VR to connect…';
            document.getElementById('connectionInfo').style.color = '#ff0';
            const btn = document.getElementById('btnConnect');
            if (btn) { btn.textContent = 'Waiting for VR…'; btn.disabled = true; }
        } else if (message.type === 'connected') {
            this.isConnected = true;
            this.updateStatus('Connected', 'VR headset ready');
            document.getElementById('connectionInfo').textContent = 'Connected to VR headset';
            document.getElementById('connectionInfo').style.color = '#0f0';
            const btn = document.getElementById('btnConnect');
            if (btn) { btn.textContent = 'Connected'; btn.disabled = true; }
        } else if (message.type === 'peerError') {
            this.isConnected = false;
            const details = message.details ? ` (${message.details})` : '';
            this.updateStatus('Connection Error', `${message.error}${details}`);
            const btn = document.getElementById('btnConnect');
            if (btn) { btn.textContent = 'Start & wait for VR'; btn.disabled = false; }
        } else if (message.type === 'disconnected') {
            this.isConnected = false;
            this.updateStatus('Disconnected', 'Waiting for VR headset');
            document.getElementById('connectionInfo').textContent = 'Disconnected';
            document.getElementById('connectionInfo').style.color = '#ff0';
            const btn = document.getElementById('btnConnect');
            if (btn) { btn.textContent = 'Start & wait for VR'; btn.disabled = false; }
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

