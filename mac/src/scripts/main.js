// Timbuk Synthesizer - Main Application
// Initializes and coordinates all components

class TimbukApplication {
    constructor() {
        this.audioEngine = null;
        this.uiControls = null;
        this.virtualKeyboard = null;
        this.audioVisualizer = null;
        this.patchManager = null;
        
        this.isInitialized = false;
        this.isAudioSuspended = false;
        
        // Application settings
        this.settings = {
            autoStart: true,
            visualizerEnabled: true,
            keyboardEnabled: true,
            theme: 'dark'
        };
        
        this.init();
    }

    async init() {
        try {
            // Show loading status
            this.updateStatus('Initializing Timbuk Synthesizer...');
            
            // Initialize components in order
            await this.initializeAudioEngine();
            await this.initializeUI();
            await this.initializeKeyboard();
            await this.initializeVisualizer();
            await this.initializePatchManager();
            
            // Setup application-wide event listeners
            this.setupApplicationEvents();
            
            // Load settings
            this.loadSettings();
            
            // Initialize with default patch
            this.loadInitialPatch();
            
            this.isInitialized = true;
            this.updateStatus('Timbuk Synthesizer Ready', 'success');
            
            console.log('Timbuk Synthesizer initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Timbuk:', error);
            this.updateStatus('Initialization Failed', 'error');
            this.showError('Failed to initialize Timbuk Synthesizer: ' + error.message);
        }
    }

    async initializeAudioEngine() {
        this.updateStatus('Initializing audio engine...');
        
        this.audioEngine = window.timbukAudioEngine;
        
        if (!this.audioEngine) {
            throw new Error('Audio engine not available');
        }
        
        // Wait for audio engine to be ready
        if (!this.audioEngine.isInitialized) {
            await new Promise(resolve => {
                const checkInterval = setInterval(() => {
                    if (this.audioEngine.isInitialized) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
            });
        }
    }

    async initializeUI() {
        this.updateStatus('Initializing user interface...');
        
        this.uiControls = window.uiControls;
        
        if (!this.uiControls) {
            throw new Error('UI controls not available');
        }
        
        // Wait for UI controls to be ready
        if (!this.uiControls.isInitialized) {
            await new Promise(resolve => {
                const checkInterval = setInterval(() => {
                    if (this.uiControls.isInitialized) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
            });
        }
    }

    async initializeKeyboard() {
        this.updateStatus('Initializing virtual keyboard...');
        
        this.virtualKeyboard = window.virtualKeyboard;
        
        if (!this.virtualKeyboard) {
            throw new Error('Virtual keyboard not available');
        }
        
        // Wait for keyboard to be ready
        if (!this.virtualKeyboard.isInitialized) {
            await new Promise(resolve => {
                const checkInterval = setInterval(() => {
                    if (this.virtualKeyboard.isInitialized) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
            });
        }
    }

    async initializeVisualizer() {
        this.updateStatus('Initializing audio visualizer...');
        
        this.audioVisualizer = window.audioVisualizer;
        
        if (!this.audioVisualizer) {
            console.warn('Audio visualizer not available');
            return;
        }
        
        // Visualizer starts automatically
        this.settings.visualizerEnabled = true;
    }

    async initializePatchManager() {
        this.updateStatus('Initializing patch manager...');
        
        this.patchManager = window.patchManager;
        
        if (!this.patchManager) {
            throw new Error('Patch manager not available');
        }
    }

    setupApplicationEvents() {
        // Window events
        window.addEventListener('beforeunload', this.onBeforeUnload.bind(this));
        window.addEventListener('resize', this.onResize.bind(this));
        window.addEventListener('blur', this.onBlur.bind(this));
        window.addEventListener('focus', this.onFocus.bind(this));
        
        // Electron IPC events
        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            
            ipcRenderer.on('suspend-audio', () => {
                this.suspendAudio();
            });
            
            ipcRenderer.on('resume-audio', () => {
                this.resumeAudio();
            });
            
            ipcRenderer.on('app-menu-action', (event, action) => {
                this.handleMenuAction(action);
            });
        }
        
        // Keyboard events
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        
        // Audio context events
        if (this.audioEngine && this.audioEngine.audioContext) {
            this.audioEngine.audioContext.onstatechange = this.onAudioStateChange.bind(this);
        }
        
        // Performance monitoring
        this.setupPerformanceMonitoring();
        
        // Error handling
        window.addEventListener('error', this.onGlobalError.bind(this));
        window.addEventListener('unhandledrejection', this.onUnhandledRejection.bind(this));
    }

    setupPerformanceMonitoring() {
        // Monitor performance and show warnings if needed
        setInterval(() => {
            if (this.audioEngine) {
                const cpuUsage = this.audioEngine.getCPUUsage();
                
                if (cpuUsage > 80) {
                    this.updateStatus(`High CPU usage: ${cpuUsage.toFixed(1)}%`, 'warning');
                }
                
                if (cpuUsage > 95) {
                    this.handleHighCPUUsage();
                }
            }
        }, 5000);
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('timbuk_settings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
            
            // Apply settings
            this.applySettings();
        } catch (error) {
            console.warn('Failed to load settings:', error);
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('timbuk_settings', JSON.stringify(this.settings));
        } catch (error) {
            console.warn('Failed to save settings:', error);
        }
    }

    applySettings() {
        // Apply visualizer setting
        if (this.audioVisualizer) {
            if (this.settings.visualizerEnabled) {
                this.audioVisualizer.start();
            } else {
                this.audioVisualizer.stop();
            }
        }
        
        // Apply keyboard setting
        if (this.virtualKeyboard) {
            // Keyboard doesn't have enable/disable yet, but we could add it
        }
        
        // Apply theme
        this.applyTheme(this.settings.theme);
    }

    applyTheme(theme) {
        document.body.className = `theme-${theme}`;
    }

    loadInitialPatch() {
        if (this.patchManager) {
            this.patchManager.loadPatch('Init');
        }
    }

    // Event handlers
    onBeforeUnload(event) {
        // Save current state before closing
        this.saveSettings();
        
        if (this.patchManager) {
            this.patchManager.saveUserPatches();
        }
        
        // Clean up audio
        if (this.audioEngine) {
            this.audioEngine.panic();
        }
    }

    onResize() {
        // Handle window resize
        if (this.audioVisualizer) {
            this.audioVisualizer.setupHighDPI();
        }
    }

    onBlur() {
        // Suspend audio when window loses focus to save power
        this.suspendAudio();
    }

    onFocus() {
        // Resume audio when window gains focus
        this.resumeAudio();
    }

    onKeyDown(event) {
        // Global keyboard shortcuts
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
        
        if (event.ctrlKey || event.metaKey) {
            switch(event.key.toLowerCase()) {
                case ',':
                    event.preventDefault();
                    this.openSettings();
                    break;
                case 'h':
                    event.preventDefault();
                    this.showHelp();
                    break;
            }
        }
        
        // Function keys
        if (event.key.startsWith('F') && event.key.length === 2) {
            const fNumber = parseInt(event.key.substring(1));
            if (fNumber >= 1 && fNumber <= 12) {
                this.handleFunctionKey(fNumber);
                event.preventDefault();
            }
        }
    }

    onAudioStateChange() {
        if (!this.audioEngine || !this.audioEngine.audioContext) return;
        
        const state = this.audioEngine.audioContext.state;
        
        switch(state) {
            case 'suspended':
                this.updateStatus('Audio suspended - click to resume', 'warning');
                this.isAudioSuspended = true;
                break;
            case 'running':
                this.updateStatus('Audio running', 'success');
                this.isAudioSuspended = false;
                break;
            case 'closed':
                this.updateStatus('Audio context closed', 'error');
                break;
        }
        
        this.updateMIDIStatus();
    }

    onGlobalError(event) {
        console.error('Global error:', event.error);
        this.updateStatus('An error occurred', 'error');
    }

    onUnhandledRejection(event) {
        console.error('Unhandled promise rejection:', event.reason);
        this.updateStatus('An error occurred', 'error');
    }

    // Audio control methods
    suspendAudio() {
        if (this.audioEngine && this.audioEngine.audioContext && 
            this.audioEngine.audioContext.state === 'running') {
            this.audioEngine.audioContext.suspend();
        }
    }

    resumeAudio() {
        if (this.audioEngine && this.audioEngine.audioContext && 
            this.audioEngine.audioContext.state === 'suspended') {
            this.audioEngine.audioContext.resume();
        }
    }

    handleHighCPUUsage() {
        // Automatically disable visualizer if CPU is too high
        if (this.settings.visualizerEnabled) {
            this.settings.visualizerEnabled = false;
            this.applySettings();
            this.saveSettings();
            this.updateStatus('Visualizer disabled due to high CPU usage', 'warning');
        }
    }

    // Menu action handlers
    handleMenuAction(action) {
        switch(action) {
            case 'new-patch':
                this.createNewPatch();
                break;
            case 'save-patch':
                this.savePatch();
                break;
            case 'load-patch':
                this.loadPatch();
                break;
            case 'export-patch':
                this.exportCurrentPatch();
                break;
            case 'panic':
                this.panic();
                break;
            case 'settings':
                this.openSettings();
                break;
            case 'about':
                this.showAbout();
                break;
            case 'help':
                this.showHelp();
                break;
        }
    }

    handleFunctionKey(fNumber) {
        // F1-F12 for quick patch loading
        const patchNames = Array.from(this.patchManager?.factoryPatches.keys() || []);
        if (fNumber <= patchNames.length) {
            this.patchManager?.loadPatch(patchNames[fNumber - 1]);
        }
    }

    // Application methods
    createNewPatch() {
        this.patchManager?.createNewPatch();
    }

    savePatch() {
        this.patchManager?.savePatchDialog();
    }

    loadPatch() {
        this.patchManager?.loadPatchDialog();
    }

    exportCurrentPatch() {
        if (this.patchManager && this.patchManager.currentPatchName) {
            this.patchManager.exportPatch(this.patchManager.currentPatchName);
        }
    }

    panic() {
        this.audioEngine?.panic();
        this.virtualKeyboard?.panic();
        this.updateStatus('All notes stopped', 'warning');
    }

    openSettings() {
        // Create settings dialog
        this.showSettingsDialog();
    }

    showAbout() {
        this.showAboutDialog();
    }

    showHelp() {
        this.showHelpDialog();
    }

    // Dialog methods
    showSettingsDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'dialog-overlay';
        dialog.innerHTML = `
            <div class="dialog">
                <div class="dialog-header">
                    <h2>Settings</h2>
                    <button class="dialog-close">&times;</button>
                </div>
                <div class="dialog-body">
                    <div class="setting-group">
                        <label>
                            <input type="checkbox" id="visualizer-enabled" ${this.settings.visualizerEnabled ? 'checked' : ''}>
                            Enable Audio Visualizer
                        </label>
                    </div>
                    <div class="setting-group">
                        <label>
                            <input type="checkbox" id="auto-start" ${this.settings.autoStart ? 'checked' : ''}>
                            Auto-start Audio
                        </label>
                    </div>
                    <div class="setting-group">
                        <label>Theme</label>
                        <select id="theme-select">
                            <option value="dark" ${this.settings.theme === 'dark' ? 'selected' : ''}>Dark</option>
                            <option value="light" ${this.settings.theme === 'light' ? 'selected' : ''}>Light</option>
                        </select>
                    </div>
                </div>
                <div class="dialog-footer">
                    <button class="btn btn-primary">Save</button>
                    <button class="btn btn-secondary">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Handle dialog interactions
        dialog.querySelector('.dialog-close').addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
        
        dialog.querySelector('.btn-primary').addEventListener('click', () => {
            this.settings.visualizerEnabled = dialog.querySelector('#visualizer-enabled').checked;
            this.settings.autoStart = dialog.querySelector('#auto-start').checked;
            this.settings.theme = dialog.querySelector('#theme-select').value;
            
            this.applySettings();
            this.saveSettings();
            document.body.removeChild(dialog);
        });
        
        dialog.querySelector('.btn-secondary').addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
    }

    showAboutDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'dialog-overlay';
        dialog.innerHTML = `
            <div class="dialog">
                <div class="dialog-header">
                    <h2>About Timbuk</h2>
                    <button class="dialog-close">&times;</button>
                </div>
                <div class="dialog-body">
                    <div class="about-content">
                        <h3>Timbuk Analog Modelling Synthesizer</h3>
                        <p>Version 1.0.0</p>
                        <p>Created by Sam Soko</p>
                        <hr>
                        <p>A professional analog modeling synthesizer featuring:</p>
                        <ul>
                            <li>Dual oscillators with multiple waveforms</li>
                            <li>Voltage-controlled filter with resonance</li>
                            <li>ADSR envelopes for amplitude and filter</li>
                            <li>LFO with multiple modulation targets</li>
                            <li>Built-in effects (reverb, delay)</li>
                            <li>Real-time audio visualization</li>
                            <li>Virtual piano keyboard</li>
                            <li>Patch management system</li>
                        </ul>
                        <p>Built with modern web technologies and Tone.js audio engine.</p>
                        <p>&copy; 2024 Sam Soko. All rights reserved.</p>
                    </div>
                </div>
                <div class="dialog-footer">
                    <button class="btn btn-primary">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        dialog.querySelector('.dialog-close').addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
        
        dialog.querySelector('.btn-primary').addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
    }

    showHelpDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'dialog-overlay';
        dialog.innerHTML = `
            <div class="dialog">
                <div class="dialog-header">
                    <h2>Help & Shortcuts</h2>
                    <button class="dialog-close">&times;</button>
                </div>
                <div class="dialog-body">
                    <div class="help-content">
                        <h3>Keyboard Shortcuts</h3>
                        <div class="shortcut-group">
                            <h4>Patch Management</h4>
                            <ul>
                                <li><kbd>Ctrl+N</kbd> - New patch</li>
                                <li><kbd>Ctrl+S</kbd> - Quick save</li>
                                <li><kbd>Ctrl+Shift+S</kbd> - Save patch with dialog</li>
                                <li><kbd>Ctrl+O</kbd> - Load patch</li>
                                <li><kbd>F1-F8</kbd> - Load factory patches</li>
                            </ul>
                        </div>
                        <div class="shortcut-group">
                            <h4>Piano Keyboard</h4>
                            <ul>
                                <li><kbd>Z-M</kbd> - Octave 3 (white keys)</li>
                                <li><kbd>S, D, G, H, J</kbd> - Octave 3 (black keys)</li>
                                <li><kbd>Q-P</kbd> - Octave 4 (white keys)</li>
                                <li><kbd>2, 3, 5, 6, 7</kbd> - Octave 4 (black keys)</li>
                                <li><kbd>I-P</kbd> - Octave 5 (white keys)</li>
                                <li><kbd>9, 0</kbd> - Octave 5 (black keys)</li>
                                <li><kbd>Space</kbd> - Sustain pedal</li>
                                <li><kbd>↑/↓</kbd> - Change octave</li>
                            </ul>
                        </div>
                        <div class="shortcut-group">
                            <h4>Visualization</h4>
                            <ul>
                                <li><kbd>V</kbd> - Toggle visualizer</li>
                                <li><kbd>1-3</kbd> - Oscilloscope modes</li>
                                <li><kbd>4-6</kbd> - Spectrum modes</li>
                            </ul>
                        </div>
                        <div class="shortcut-group">
                            <h4>General</h4>
                            <ul>
                                <li><kbd>Esc</kbd> - Panic (stop all sounds)</li>
                                <li><kbd>Ctrl+,</kbd> - Settings</li>
                                <li><kbd>Ctrl+H</kbd> - Help</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="dialog-footer">
                    <button class="btn btn-primary">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        dialog.querySelector('.dialog-close').addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
        
        dialog.querySelector('.btn-primary').addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (document.body.contains(errorDiv)) {
                document.body.removeChild(errorDiv);
            }
        }, 5000);
    }

    // UI update methods
    updateStatus(message, type = 'info') {
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `text-${type}`;
        }
    }

    updateMIDIStatus() {
        const midiElement = document.getElementById('midi-status');
        if (midiElement) {
            // Check for MIDI support
            if (navigator.requestMIDIAccess) {
                midiElement.textContent = 'MIDI: Available';
                midiElement.className = 'text-success';
            } else {
                midiElement.textContent = 'MIDI: Not Available';
                midiElement.className = 'text-warning';
            }
        }
    }

    // Getters for component access
    getAudioEngine() {
        return this.audioEngine;
    }

    getUIControls() {
        return this.uiControls;
    }

    getVirtualKeyboard() {
        return this.virtualKeyboard;
    }

    getAudioVisualizer() {
        return this.audioVisualizer;
    }

    getPatchManager() {
        return this.patchManager;
    }

    getVersion() {
        return '1.0.0';
    }

    // Application lifecycle
    restart() {
        // Restart the application
        this.dispose();
        setTimeout(() => {
            this.init();
        }, 100);
    }

    dispose() {
        // Clean up all components
        if (this.audioVisualizer) {
            this.audioVisualizer.dispose();
        }
        
        if (this.virtualKeyboard) {
            this.virtualKeyboard.dispose();
        }
        
        if (this.patchManager) {
            this.patchManager.dispose();
        }
        
        if (this.audioEngine) {
            this.audioEngine.dispose();
        }
        
        this.isInitialized = false;
    }
}

// Add dialog styles to the document
const dialogStyles = `
<style>
.dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
}

.dialog {
    background: var(--panel-color);
    border: 1px solid var(--panel-border);
    border-radius: 12px;
    min-width: 400px;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid var(--panel-border);
}

.dialog-header h2 {
    margin: 0;
    color: var(--text-primary);
}

.dialog-close {
    background: none;
    border: none;
    color: var(--text-secondary);
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 4px;
}

.dialog-close:hover {
    background: var(--knob-color);
    color: var(--text-primary);
}

.dialog-body {
    padding: 20px;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 20px;
    border-top: 1px solid var(--panel-border);
}

.about-content h3 {
    color: var(--accent-color);
    margin-bottom: 10px;
}

.help-content h3 {
    color: var(--accent-color);
    margin-bottom: 15px;
}

.help-content h4 {
    color: var(--text-primary);
    margin-bottom: 10px;
}

.shortcut-group {
    margin-bottom: 20px;
}

.shortcut-group ul {
    list-style: none;
    padding: 0;
}

.shortcut-group li {
    margin-bottom: 5px;
    display: flex;
    align-items: center;
}

.shortcut-group kbd {
    background: var(--knob-color);
    border: 1px solid var(--panel-border);
    border-radius: 4px;
    padding: 2px 6px;
    margin-right: 10px;
    font-family: monospace;
    font-size: 0.9em;
    min-width: 80px;
    text-align: center;
}

.setting-group {
    margin-bottom: 15px;
}

.setting-group label {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--text-primary);
}

.setting-group select {
    background: var(--knob-color);
    color: var(--text-primary);
    border: 1px solid var(--panel-border);
    padding: 8px;
    border-radius: 4px;
    margin-left: 10px;
}

.error-message {
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--danger-color);
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    max-width: 400px;
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', dialogStyles);

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a moment for all scripts to load
    setTimeout(() => {
        window.timbukApp = new TimbukApplication();
    }, 100);
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TimbukApplication;
}