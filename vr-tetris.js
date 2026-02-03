import { TetrisGame } from './tetris-game.js';
import { WebRTCSignaling, PeerJSSignaling } from './webrtc-signaling.js';

// Import Three.js from CDN (will be loaded in HTML)
let THREE;

class VRTetris {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.xrSession = null;
        this.game = null;
        this.signaling = null;
        this.peerSignaling = null;
        this.connectionId = null;
        this.isConnected = false;
        
        this.boardGroup = null;
        this.blockSize = 0.1;
        this.boardWidth = 10;
        this.boardHeight = 20;
        
        this.init();
    }
    
    async init() {
        // Load Three.js
        THREE = await import('three');
        
        // Setup Three.js scene (before connect)
        this.setupScene();
        
        // Setup WebXR (shows Enter VR after connect)
        await this.setupWebXR();
        
        // Start game loop
        this.game = new TetrisGame();
        this.animate();
        
        // Show connect panel - user must enter code and click Connect
        this.setupConnectUI();
    }
    
    setupConnectUI() {
        const panel = document.getElementById('connectPanel');
        const codeInput = document.getElementById('connectionCode');
        const btnConnect = document.getElementById('btnConnect');
        
        if (!panel || !codeInput || !btnConnect) return;
        
        codeInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        });
        
        codeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') btnConnect.click();
        });
        
        btnConnect.onclick = () => this.connectWithCode();
        
        // Pre-fill from URL if present
        const urlParams = new URLSearchParams(window.location.search);
        const urlId = urlParams.get('id');
        if (urlId) codeInput.value = urlId.toUpperCase().substring(0, 8);
    }
    
    async connectWithCode() {
        const codeInput = document.getElementById('connectionCode');
        this.connectionId = codeInput?.value?.trim().toUpperCase();
        
        if (!this.connectionId || this.connectionId.length < 4) {
            this.updateStatus('Error', 'Enter at least 4 characters');
            return;
        }
        
        const panel = document.getElementById('connectPanel');
        if (panel) panel.style.display = 'none';
        
        const enterBtn = document.getElementById('enterVRBtn');
        if (enterBtn) enterBtn.style.display = 'block';
        
        this.updateStatus('Connecting...', `Code: ${this.connectionId}`);
        
        await this.setupConnection();
    }
    
    generateConnectionId() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }
    
    async setupConnection() {
        if (!this.connectionId) return;
        
        try {
            this.updateStatus('Connecting…', `Code: ${this.connectionId}`);
            this.peerSignaling = new PeerJSSignaling(this.connectionId, false);
            this.signaling = new WebRTCSignaling((message) => this.handleMessage(message));
            await this.peerSignaling.initialize((message) => this.handleMessage(message));
            if (!this.isConnected) {
                this.updateStatus('Connecting to phone…', `Code: ${this.connectionId} - Click Enter VR when ready`);
            }
        } catch (error) {
            console.error('Connection setup error:', error);
            const panel = document.getElementById('connectPanel');
            if (panel) { panel.style.display = 'block'; panel.querySelector('input')?.focus(); }
            this.updateStatus('Connection failed', error.message || 'Check code matches phone');
        }
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = null; // Transparent for passthrough
        
        // Camera will be set by WebXR
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        // Renderer - alpha: true for passthrough/AR
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.xr.enabled = true;
        this.renderer.setClearColor(0x000000, 0); // Transparent clear
        document.body.appendChild(this.renderer.domElement);
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 5);
        this.scene.add(directionalLight);
        
        // Create board
        this.createBoard();
        
        // Add score display
        this.createScoreDisplay();
    }
    
    createBoard() {
        this.boardGroup = new THREE.Group();
        
        // Board frame
        const frameGeometry = new THREE.BoxGeometry(
            this.boardWidth * this.blockSize + 0.2,
            this.boardHeight * this.blockSize + 0.2,
            0.1
        );
        const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        frame.position.z = -0.05;
        this.boardGroup.add(frame);
        
        // Grid lines
        const gridMaterial = new THREE.LineBasicMaterial({ color: 0x222222 });
        
        // Vertical lines
        for (let x = 0; x <= this.boardWidth; x++) {
            const points = [
                new THREE.Vector3(x * this.blockSize - this.boardWidth * this.blockSize / 2, 
                                 -this.boardHeight * this.blockSize / 2, 0),
                new THREE.Vector3(x * this.blockSize - this.boardWidth * this.blockSize / 2, 
                                 this.boardHeight * this.blockSize / 2, 0)
            ];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, gridMaterial);
            this.boardGroup.add(line);
        }
        
        // Horizontal lines
        for (let y = 0; y <= this.boardHeight; y++) {
            const points = [
                new THREE.Vector3(-this.boardWidth * this.blockSize / 2, 
                                 y * this.blockSize - this.boardHeight * this.blockSize / 2, 0),
                new THREE.Vector3(this.boardWidth * this.blockSize / 2, 
                                 y * this.blockSize - this.boardHeight * this.blockSize / 2, 0)
            ];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, gridMaterial);
            this.boardGroup.add(line);
        }
        
        // Position board in front of user
        this.boardGroup.position.set(0, 1.5, -2);
        this.scene.add(this.boardGroup);
        
        // Store block meshes
        this.blockMeshes = [];
    }
    
    createScoreDisplay() {
        // Score will be displayed as text in 3D space
        // For simplicity, we'll use HTML overlay
    }
    
    async setupWebXR() {
        if (!navigator.xr) {
            this.updateStatus('WebXR not available', 'Please use a Quest headset');
            return;
        }
        const arSupported = await navigator.xr.isSessionSupported('immersive-ar');
        const vrSupported = await navigator.xr.isSessionSupported('immersive-vr');
        const mode = arSupported ? 'immersive-ar' : (vrSupported ? 'immersive-vr' : null);
        
        if (mode) {
            this.xrMode = mode;
            const button = document.createElement('button');
            button.id = 'enterVRBtn';
            button.textContent = arSupported ? 'Enter VR (Passthrough)' : 'Enter VR';
            button.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);padding:20px;font-size:24px;z-index:1000;display:none;cursor:pointer;';
            button.onclick = () => { this.enterVR(); };
            document.body.appendChild(button);
        } else {
            this.updateStatus('WebXR not supported', 'Please use a Quest headset');
        }
    }
    
    async enterVR() {
        const button = document.getElementById('enterVRBtn');
        if (button) {
            button.disabled = true;
            button.textContent = 'Starting…';
        }
        const mode = this.xrMode || 'immersive-ar';
        try {
            const opts = mode === 'immersive-ar'
                ? { optionalFeatures: ['local-floor'] }
                : { requiredFeatures: ['local-floor'] };
            this.xrSession = await navigator.xr.requestSession(mode, opts);
            await this.renderer.xr.setSession(this.xrSession);
            if (button) button.remove();
            this.updateStatus('VR Active', mode === 'immersive-ar' ? 'Passthrough' : 'VR');
        } catch (error) {
            console.error('Error entering VR:', error);
            this.updateStatus('VR Error', error.message || String(error));
            if (button) {
                button.disabled = false;
                button.textContent = (mode === 'immersive-ar' ? 'Enter VR (Passthrough)' : 'Enter VR');
            }
        }
    }
    
    handleMessage(message) {
        if (message.type === 'connected') {
            this.isConnected = true;
            this.updateStatus('Connected', 'Phone controller ready');
        } else if (message.type === 'disconnected') {
            this.isConnected = false;
            this.updateStatus('Disconnected', 'Waiting for connection...');
        } else if (message.type === 'command') {
            this.handleCommand(message.command);
        } else if (message.type === 'gameState') {
            // Sync game state if needed
        } else if (message.type === 'peerReady') {
            this.updateStatus('Ready', `Peer ID: ${message.id}`);
        }
    }
    
    handleCommand(command) {
        if (!this.game) return;
        
        switch (command) {
            case 'left':
                this.game.movePiece(-1, 0);
                break;
            case 'right':
                this.game.movePiece(1, 0);
                break;
            case 'down':
                this.game.movePiece(0, 1);
                break;
            case 'rotate':
                this.game.rotatePiece();
                break;
            case 'hardDrop':
                this.game.hardDrop();
                break;
            case 'pause':
                this.game.togglePause();
                break;
        }
        
        this.updateBoard();
    }
    
    updateBoard() {
        if (!this.game || !this.boardGroup) return;
        
        // Remove old blocks
        this.blockMeshes.forEach(mesh => {
            this.boardGroup.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
        });
        this.blockMeshes = [];
        
        const state = this.game.getBoardState();
        
        // Create blocks for filled cells
        const blockGeometry = new THREE.BoxGeometry(
            this.blockSize * 0.9,
            this.blockSize * 0.9,
            this.blockSize * 0.9
        );
        
        for (let y = 0; y < state.board.length; y++) {
            for (let x = 0; x < state.board[y].length; x++) {
                if (state.board[y][x] === 1) {
                    // Locked block
                    const material = new THREE.MeshStandardMaterial({ 
                        color: 0x00ff00,
                        emissive: 0x004400
                    });
                    const block = new THREE.Mesh(blockGeometry, material);
                    block.position.set(
                        x * this.blockSize - this.boardWidth * this.blockSize / 2 + this.blockSize / 2,
                        (this.boardHeight - y - 1) * this.blockSize - this.boardHeight * this.blockSize / 2 + this.blockSize / 2,
                        this.blockSize / 2
                    );
                    this.boardGroup.add(block);
                    this.blockMeshes.push(block);
                } else if (state.board[y][x] === 2) {
                    // Current piece
                    const material = new THREE.MeshStandardMaterial({ 
                        color: 0x00ffff,
                        emissive: 0x004444
                    });
                    const block = new THREE.Mesh(blockGeometry, material);
                    block.position.set(
                        x * this.blockSize - this.boardWidth * this.blockSize / 2 + this.blockSize / 2,
                        (this.boardHeight - y - 1) * this.blockSize - this.boardHeight * this.blockSize / 2 + this.blockSize / 2,
                        this.blockSize / 2
                    );
                    this.boardGroup.add(block);
                    this.blockMeshes.push(block);
                }
            }
        }
        
        // Update score display
        document.getElementById('gameStatus').innerHTML = 
            `Score: ${state.score} | Level: ${state.level} | Lines: ${state.lines}`;
        
        if (state.gameOver) {
            document.getElementById('gameStatus').innerHTML += '<br>GAME OVER';
        } else if (state.paused) {
            document.getElementById('gameStatus').innerHTML += '<br>PAUSED';
        }
    }
    
    animate() {
        this.renderer.setAnimationLoop(() => {
            if (this.game) {
                this.game.drop();
                this.updateBoard();
            }
            
            this.renderer.render(this.scene, this.camera);
        });
    }
    
    updateStatus(status, info) {
        document.getElementById('connectionStatus').textContent = status;
        if (info) {
            document.getElementById('gameStatus').textContent = info;
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new VRTetris();
    });
} else {
    new VRTetris();
}

