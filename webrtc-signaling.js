// WebRTC Signaling and Connection Management
export class WebRTCSignaling {
    constructor(onMessage) {
        this.onMessage = onMessage;
        this.peerConnection = null;
        this.dataChannel = null;
        this.connectionId = this.generateConnectionId();
        this.isConnected = false;
        
        // Use free STUN servers (no local server needed)
        this.configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };
    }
    
    generateConnectionId() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }
    
    getConnectionId() {
        return this.connectionId;
    }
    
    async createOffer() {
        this.peerConnection = new RTCPeerConnection(this.configuration);
        
        // Create data channel for game commands
        this.dataChannel = this.peerConnection.createDataChannel('game', {
            ordered: true
        });
        
        this.setupDataChannel();
        this.setupPeerConnection();
        
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        
        return {
            type: 'offer',
            sdp: offer.sdp,
            connectionId: this.connectionId
        };
    }
    
    async createAnswer(offerSdp) {
        this.peerConnection = new RTCPeerConnection(this.configuration);
        
        this.setupPeerConnection();
        
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription({
            type: 'offer',
            sdp: offerSdp
        }));
        
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        
        return {
            type: 'answer',
            sdp: answer.sdp
        };
    }
    
    async setAnswer(answerSdp) {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription({
            type: 'answer',
            sdp: answerSdp
        }));
    }
    
    async setOffer(offerSdp) {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription({
            type: 'offer',
            sdp: offerSdp
        }));
        
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        
        return {
            type: 'answer',
            sdp: answer.sdp
        };
    }
    
    setupDataChannel() {
        if (!this.dataChannel) return;
        
        this.dataChannel.onopen = () => {
            console.log('Data channel opened');
            this.isConnected = true;
            if (this.onMessage) {
                this.onMessage({ type: 'connected' });
            }
        };
        
        this.dataChannel.onclose = () => {
            console.log('Data channel closed');
            this.isConnected = false;
            if (this.onMessage) {
                this.onMessage({ type: 'disconnected' });
            }
        };
        
        this.dataChannel.onerror = (error) => {
            console.error('Data channel error:', error);
        };
        
        this.dataChannel.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (this.onMessage) {
                    this.onMessage(message);
                }
            } catch (e) {
                console.error('Error parsing message:', e);
            }
        };
    }
    
    setupPeerConnection() {
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                // ICE candidates can be sent to peer if needed
                // For simplicity, we'll rely on STUN servers
            }
        };
        
        this.peerConnection.onconnectionstatechange = () => {
            console.log('Connection state:', this.peerConnection.connectionState);
            if (this.peerConnection.connectionState === 'connected') {
                this.isConnected = true;
            } else if (this.peerConnection.connectionState === 'disconnected' ||
                       this.peerConnection.connectionState === 'failed') {
                this.isConnected = false;
            }
        };
    }
    
    sendMessage(message) {
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
            this.dataChannel.send(JSON.stringify(message));
            return true;
        }
        return false;
    }
    
    close() {
        if (this.dataChannel) {
            this.dataChannel.close();
        }
        if (this.peerConnection) {
            this.peerConnection.close();
        }
        this.isConnected = false;
    }
}

// PeerJS-based signaling (uses free PeerJS servers, no local server needed)
export class PeerJSSignaling {
    constructor(connectionId, isHost = false) {
        this.connectionId = connectionId;
        this.isHost = isHost;
        this.peer = null;
        this.connection = null;
        this.onMessageCallback = null;
    }
    
    async initialize(onMessage) {
        this.onMessageCallback = onMessage;
        
        try {
            // Wait for PeerJS library to be available
            let retries = 10;
            while (typeof Peer === 'undefined' && retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 100));
                retries--;
            }
            
            if (typeof Peer === 'undefined') {
                await this.loadPeerJS();
            }
            
            if (this.isHost) {
                // Phone creates peer with connection ID
                this.peer = new Peer(this.connectionId, {
                    host: '0.peerjs.com',
                    port: 443,
                    path: '/',
                    secure: true
                });
                
                this.peer.on('open', (id) => {
                    console.log('PeerJS connected as:', id);
                    if (this.onMessageCallback) {
                        this.onMessageCallback({ type: 'peerReady', id });
                    }
                });
                
                this.peer.on('connection', (conn) => {
                    console.log('Received connection from:', conn.peer);
                    this.setupConnection(conn);
                });
            } else {
                // VR connects to phone's peer ID
                this.peer = new Peer({
                    host: '0.peerjs.com',
                    port: 443,
                    path: '/',
                    secure: true
                });
                
                this.peer.on('open', (id) => {
                    console.log('PeerJS connected as:', id);
                    // Connect to phone
                    const conn = this.peer.connect(this.connectionId, {
                        reliable: true
                    });
                    this.setupConnection(conn);
                });
            }
            
            this.peer.on('error', (err) => {
                console.error('PeerJS error:', err);
                // Fallback to manual signaling if PeerJS fails
                if (err.type === 'peer-unavailable' && !this.isHost) {
                    // Try again after a delay
                    setTimeout(() => {
                        if (this.peer && !this.peer.destroyed) {
                            const conn = this.peer.connect(this.connectionId, {
                                reliable: true
                            });
                            this.setupConnection(conn);
                        }
                    }, 1000);
                }
            });
        } catch (error) {
            console.error('Error initializing PeerJS:', error);
            throw error;
        }
    }
    
    async loadPeerJS() {
        return new Promise((resolve, reject) => {
            if (typeof Peer !== 'undefined') {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    setupConnection(conn) {
        this.connection = conn;
        
        conn.on('open', () => {
            console.log('Data connection opened');
            if (this.onMessageCallback) {
                this.onMessageCallback({ type: 'connected' });
            }
        });
        
        conn.on('data', (data) => {
            if (this.onMessageCallback) {
                this.onMessageCallback(data);
            }
        });
        
        conn.on('close', () => {
            console.log('Data connection closed');
            if (this.onMessageCallback) {
                this.onMessageCallback({ type: 'disconnected' });
            }
        });
        
        conn.on('error', (err) => {
            console.error('Connection error:', err);
        });
    }
    
    sendSignal(signal) {
        if (!this.connection) return false;
        const isOpen = this.connection.open === true;
        if (isOpen) {
            try {
                this.connection.send(signal);
                return true;
            } catch (e) {
                console.error('PeerJS send failed:', e);
                return false;
            }
        }
        return false;
    }
    
    close() {
        if (this.connection) {
            this.connection.close();
        }
        if (this.peer && !this.peer.destroyed) {
            this.peer.destroy();
        }
    }
}

// Simple signaling using localStorage and polling (works without server)
// Fallback option if PeerJS is not available
export class SimpleSignaling {
    constructor(connectionId, isHost = false) {
        this.connectionId = connectionId;
        this.isHost = isHost;
        this.storageKey = `tetris_signaling_${connectionId}`;
        this.pollInterval = null;
    }
    
    startPolling(onSignal) {
        this.pollInterval = setInterval(() => {
            const signal = localStorage.getItem(this.storageKey);
            if (signal) {
                try {
                    const data = JSON.parse(signal);
                    if (data.from !== (this.isHost ? 'phone' : 'vr')) {
                        onSignal(data);
                        localStorage.removeItem(this.storageKey);
                    }
                } catch (e) {
                    console.error('Error parsing signal:', e);
                }
            }
        }, 500);
    }
    
    sendSignal(signal) {
        signal.from = this.isHost ? 'phone' : 'vr';
        signal.timestamp = Date.now();
        localStorage.setItem(this.storageKey, JSON.stringify(signal));
        
        // Clean up old signals after 5 seconds
        setTimeout(() => {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                try {
                    const data = JSON.parse(stored);
                    if (data.timestamp === signal.timestamp) {
                        localStorage.removeItem(this.storageKey);
                    }
                } catch (e) {}
            }
        }, 5000);
    }
    
    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }
}

