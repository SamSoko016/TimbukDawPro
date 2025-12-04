// Timbuk Synthesizer - Virtual Keyboard
// Handles both on-screen piano and computer keyboard input

class VirtualKeyboard {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.keyboardElement = null;
        this.activeKeys = new Map();
        this.midiNoteMap = new Map();
        this.computerKeyMap = new Map();
        this.currentOctave = 4;
        this.isInitialized = false;
        
        // Keyboard layout
        this.noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        this.whiteKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        this.blackKeys = ['C#', 'D#', 'F#', 'G#', 'A#'];
        
        // Computer keyboard mapping (QWERTY layout)
        this.keyboardMapping = {
            // Octave 3
            'z': 48, // C3
            's': 49, // C#3
            'x': 50, // D3
            'd': 51, // D#3
            'c': 52, // E3
            'v': 53, // F3
            'g': 54, // F#3
            'b': 55, // G3
            'h': 56, // G#3
            'n': 57, // A3
            'j': 58, // A#3
            'm': 59, // B3
            
            // Octave 4
            'q': 60, // C4
            '2': 61, // C#4
            'w': 62, // D4
            '3': 63, // D#4
            'e': 64, // E4
            'r': 65, // F4
            '5': 66, // F#4
            't': 67, // G4
            '6': 68, // G#4
            'y': 69, // A4
            '7': 70, // A#4
            'u': 71, // B4
            
            // Octave 5
            'i': 72, // C5
            '9': 73, // C#5
            'o': 74, // D5
            '0': 75, // D#5
            'p': 76, // E5
            
            // Sustain pedal
            ' ': 'sustain' // Spacebar for sustain
        };
        
        this.init();
    }

    init() {
        this.createKeyboard();
        this.setupEventListeners();
        this.setupComputerKeyboard();
        this.setupOctaveControls();
        this.isInitialized = true;
    }

    createKeyboard() {
        this.keyboardElement = document.getElementById('keyboard');
        if (!this.keyboardElement) return;
        
        // Create 3 octaves (C3-B5)
        const startMidiNote = 48; // C3
        const endMidiNote = 76;   // E5
        
        for (let midiNote = startMidiNote; midiNote <= endMidiNote; midiNote++) {
            const noteIndex = midiNote % 12;
            const octave = Math.floor(midiNote / 12) - 1;
            const noteName = this.noteNames[noteIndex];
            
            const key = this.createKey(midiNote, noteName, octave);
            this.keyboardElement.appendChild(key);
            this.midiNoteMap.set(midiNote, key);
        }
        
        // Add octave markers
        this.addOctaveMarkers();
    }

    createKey(midiNote, noteName, octave) {
        const key = document.createElement('div');
        key.className = 'piano-key';
        key.dataset.midiNote = midiNote;
        key.dataset.noteName = noteName;
        key.dataset.octave = octave;
        
        const isBlackKey = this.blackKeys.includes(noteName);
        if (isBlackKey) {
            key.classList.add('black');
        }
        
        // Add note label
        const label = document.createElement('span');
        label.className = 'key-label';
        label.textContent = noteName + octave;
        key.appendChild(label);
        
        // Add computer keyboard shortcut
        const shortcut = this.getMidiNoteShortcut(midiNote);
        if (shortcut) {
            const shortcutLabel = document.createElement('span');
            shortcutLabel.className = 'keyboard-shortcut';
            shortcutLabel.textContent = shortcut.toUpperCase();
            key.appendChild(shortcutLabel);
        }
        
        // Add velocity indicator
        const velocityIndicator = document.createElement('div');
        velocityIndicator.className = 'velocity-indicator';
        key.appendChild(velocityIndicator);
        
        return key;
    }

    addOctaveMarkers() {
        const octaves = [3, 4, 5];
        octaves.forEach(octave => {
            const marker = document.createElement('div');
            marker.className = 'octave-marker';
            marker.textContent = `C${octave}`;
            
            // Position the marker at the start of each octave
            const cKey = this.keyboardElement.querySelector(`[data-note-name="C"][data-octave="${octave}"]`);
            if (cKey) {
                cKey.appendChild(marker);
            }
        });
    }

    setupEventListeners() {
        // Mouse events
        this.keyboardElement.addEventListener('mousedown', this.onMouseDown.bind(this));
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));
        
        // Touch events for mobile
        this.keyboardElement.addEventListener('touchstart', this.onTouchStart.bind(this));
        document.addEventListener('touchmove', this.onTouchMove.bind(this));
        document.addEventListener('touchend', this.onTouchEnd.bind(this));
        
        // Prevent context menu on right click
        this.keyboardElement.addEventListener('contextmenu', e => e.preventDefault());
    }

    setupComputerKeyboard() {
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
    }

    setupOctaveControls() {
        // Create octave controls
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'keyboard-controls';
        
        const octaveControl = document.createElement('div');
        octaveControl.className = 'octave-control';
        
        const octaveDown = document.createElement('button');
        octaveDown.textContent = 'Oct -';
        octaveDown.addEventListener('click', () => this.changeOctave(-1));
        
        const octaveDisplay = document.createElement('span');
        octaveDisplay.className = 'octave-display';
        octaveDisplay.textContent = this.currentOctave;
        
        const octaveUp = document.createElement('button');
        octaveUp.textContent = 'Oct +';
        octaveUp.addEventListener('click', () => this.changeOctave(1));
        
        octaveControl.appendChild(octaveDown);
        octaveControl.appendChild(octaveDisplay);
        octaveControl.appendChild(octaveUp);
        
        // Sustain indicator
        const sustainIndicator = document.createElement('div');
        sustainIndicator.className = 'sustain-indicator';
        sustainIndicator.innerHTML = `
            <div class="sustain-led"></div>
            <span>Sustain</span>
        `;
        
        controlsContainer.appendChild(octaveControl);
        controlsContainer.appendChild(sustainIndicator);
        
        this.keyboardElement.parentElement.appendChild(controlsContainer);
        
        this.octaveDisplay = octaveDisplay;
        this.sustainIndicator = sustainIndicator;
    }

    onMouseDown(e) {
        if (e.target.classList.contains('piano-key')) {
            e.preventDefault();
            this.startNote(e.target);
        }
    }

    onMouseMove(e) {
        // Handle dragging across keys
        if (e.buttons === 1) { // Left mouse button is pressed
            const key = document.elementFromPoint(e.clientX, e.clientY);
            if (key && key.classList.contains('piano-key') && !key.classList.contains('active')) {
                this.startNote(key);
            }
        }
    }

    onMouseUp() {
        // Release all currently pressed keys
        this.activeKeys.forEach((noteData, key) => {
            this.stopNote(key);
        });
    }

    onTouchStart(e) {
        if (e.target.classList.contains('piano-key')) {
            e.preventDefault();
            this.startNote(e.target);
        }
    }

    onTouchMove(e) {
        // Handle touch sliding across keys
        const touch = e.touches[0];
        const key = document.elementFromPoint(touch.clientX, touch.clientY);
        if (key && key.classList.contains('piano-key') && !key.classList.contains('active')) {
            this.startNote(key);
        }
    }

    onTouchEnd() {
        // Release all currently pressed keys
        this.activeKeys.forEach((noteData, key) => {
            this.stopNote(key);
        });
    }

    onKeyDown(e) {
        // Prevent repeats and ignore when typing in inputs
        if (e.repeat || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        const key = e.key.toLowerCase();
        const midiNote = this.keyboardMapping[key];
        
        if (midiNote === 'sustain') {
            // Spacebar for sustain
            this.sustainOn();
            return;
        }
        
        if (midiNote !== undefined) {
            e.preventDefault();
            const keyElement = this.midiNoteMap.get(midiNote);
            if (keyElement && !keyElement.classList.contains('active')) {
                this.startNote(keyElement);
                keyElement.classList.add('computer-key');
            }
        }
        
        // Octave switching with arrow keys
        if (key === 'arrowup') {
            e.preventDefault();
            this.changeOctave(1);
        } else if (key === 'arrowdown') {
            e.preventDefault();
            this.changeOctave(-1);
        }
    }

    onKeyUp(e) {
        const key = e.key.toLowerCase();
        const midiNote = this.keyboardMapping[key];
        
        if (midiNote === 'sustain') {
            this.sustainOff();
            return;
        }
        
        if (midiNote !== undefined) {
            e.preventDefault();
            const keyElement = this.midiNoteMap.get(midiNote);
            if (keyElement) {
                this.stopNote(keyElement);
                keyElement.classList.remove('computer-key');
            }
        }
    }

    startNote(keyElement) {
        if (keyElement.classList.contains('active')) return;
        
        const midiNote = parseInt(keyElement.dataset.midiNote);
        const noteName = keyElement.dataset.noteName;
        const octave = parseInt(keyElement.dataset.octave);
        
        // Calculate velocity based on key position or use default
        const velocity = this.calculateVelocity(keyElement);
        
        // Start the note in the audio engine
        const noteId = this.audioEngine.noteOn(midiNote, velocity);
        
        // Store note data
        this.activeKeys.set(keyElement, {
            midiNote: midiNote,
            noteId: noteId,
            velocity: velocity,
            startTime: Date.now()
        });
        
        // Update UI
        keyElement.classList.add('active');
        this.updateVelocityIndicator(keyElement, velocity);
        
        // Emit event for visualizer
        this.emitNoteEvent('noteOn', { midiNote, velocity, noteName, octave });
    }

    stopNote(keyElement) {
        if (!keyElement.classList.contains('active')) return;
        
        const noteData = this.activeKeys.get(keyElement);
        if (!noteData) return;
        
        // Stop the note in the audio engine
        this.audioEngine.noteOff(noteData.midiNote);
        
        // Remove from active notes
        this.activeKeys.delete(keyElement);
        
        // Update UI with delay for visual feedback
        setTimeout(() => {
            keyElement.classList.remove('active');
            keyElement.classList.remove('glow');
            this.clearVelocityIndicator(keyElement);
        }, 50);
        
        // Emit event for visualizer
        this.emitNoteEvent('noteOff', { 
            midiNote: noteData.midiNote, 
            velocity: noteData.velocity,
            duration: Date.now() - noteData.startTime
        });
    }

    calculateVelocity(keyElement) {
        // Calculate velocity based on Y position of click/touch
        const rect = keyElement.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2;
        
        // This would be enhanced with actual mouse/touch position
        // For now, use a fixed velocity with slight randomization
        return Math.max(64, Math.min(127, 100 + Math.random() * 20));
    }

    updateVelocityIndicator(keyElement, velocity) {
        const indicator = keyElement.querySelector('.velocity-indicator');
        if (indicator) {
            const intensity = velocity / 127;
            indicator.style.opacity = intensity;
            indicator.style.transform = `scale(${0.8 + intensity * 0.4})`;
        }
        
        // Add glow effect for higher velocities
        if (velocity > 100) {
            keyElement.classList.add('glow');
        }
    }

    clearVelocityIndicator(keyElement) {
        const indicator = keyElement.querySelector('.velocity-indicator');
        if (indicator) {
            indicator.style.opacity = '0';
            indicator.style.transform = 'scale(1)';
        }
    }

    changeOctave(delta) {
        this.currentOctave = Math.max(0, Math.min(8, this.currentOctave + delta));
        
        if (this.octaveDisplay) {
            this.octaveDisplay.textContent = this.currentOctave;
        }
        
        // Update keyboard mapping for new octave
        this.updateKeyboardMapping();
        
        // Visual feedback
        if (this.octaveDisplay) {
            this.octaveDisplay.style.color = 'var(--accent-color)';
            setTimeout(() => {
                this.octaveDisplay.style.color = '';
            }, 200);
        }
    }

    updateKeyboardMapping() {
        // This would update the keyboard mapping based on the current octave
        // For simplicity, we're using a fixed mapping that covers multiple octaves
    }

    sustainOn() {
        if (this.sustainIndicator) {
            this.sustainIndicator.classList.add('active');
        }
        
        // Implement sustain logic in audio engine
        this.audioEngine.setSustain(true);
    }

    sustainOff() {
        if (this.sustainIndicator) {
            this.sustainIndicator.classList.remove('active');
        }
        
        // Implement sustain release logic in audio engine
        this.audioEngine.setSustain(false);
    }

    getMidiNoteShortcut(midiNote) {
        // Find the computer key that maps to this MIDI note
        for (const [key, note] of Object.entries(this.keyboardMapping)) {
            if (note === midiNote) {
                return key;
            }
        }
        return null;
    }

    emitNoteEvent(type, data) {
        // Emit custom events for other components to listen to
        const event = new CustomEvent(`keyboard:${type}`, {
            detail: data
        });
        document.dispatchEvent(event);
    }

    // Utility methods
    getActiveNotes() {
        return Array.from(this.activeKeys.values());
    }

    getActiveNoteCount() {
        return this.activeKeys.size;
    }

    isNoteActive(midiNote) {
        for (const noteData of this.activeKeys.values()) {
            if (noteData.midiNote === midiNote) {
                return true;
            }
        }
        return false;
    }

    panic() {
        // Stop all notes immediately
        this.activeKeys.forEach((noteData, key) => {
            this.stopNote(key);
        });
        this.audioEngine.panic();
    }

    // MIDI integration
    onMidiNoteOn(midiNote, velocity) {
        const keyElement = this.midiNoteMap.get(midiNote);
        if (keyElement && !keyElement.classList.contains('active')) {
            this.startNote(keyElement);
            keyElement.classList.add('midi-key');
        }
    }

    onMidiNoteOff(midiNote) {
        const keyElement = this.midiNoteMap.get(midiNote);
        if (keyElement) {
            this.stopNote(keyElement);
            keyElement.classList.remove('midi-key');
        }
    }

    // Visual feedback methods
    highlightScale(scale) {
        // Highlight notes in a specific scale
        this.clearHighlights();
        
        scale.forEach(midiNote => {
            const keyElement = this.midiNoteMap.get(midiNote);
            if (keyElement) {
                keyElement.classList.add('scale-highlight');
            }
        });
    }

    clearHighlights() {
        this.keyboardElement.querySelectorAll('.scale-highlight').forEach(key => {
            key.classList.remove('scale-highlight');
        });
    }

    showNoteNames(show = true) {
        this.keyboardElement.querySelectorAll('.key-label').forEach(label => {
            label.style.display = show ? 'block' : 'none';
        });
    }

    showKeyboardShortcuts(show = true) {
        this.keyboardElement.querySelectorAll('.keyboard-shortcut').forEach(label => {
            label.style.display = show ? 'block' : 'none';
        });
    }

    // Accessibility
    setKeySize(size) {
        // size: 'small', 'medium', 'large'
        this.keyboardElement.className = `piano-keyboard ${size}`;
    }

    // Cleanup
    dispose() {
        this.activeKeys.forEach((noteData, key) => {
            this.stopNote(key);
        });
        
        document.removeEventListener('keydown', this.onKeyDown.bind(this));
        document.removeEventListener('keyup', this.onKeyUp.bind(this));
        document.removeEventListener('mousemove', this.onMouseMove.bind(this));
        document.removeEventListener('mouseup', this.onMouseUp.bind(this));
        document.removeEventListener('touchmove', this.onTouchMove.bind(this));
        document.removeEventListener('touchend', this.onTouchEnd.bind(this));
    }
}

// Helper function to generate scale notes
class ScaleGenerator {
    static getMajorScale(rootNote) {
        const intervals = [0, 2, 4, 5, 7, 9, 11];
        return intervals.map(interval => rootNote + interval);
    }

    static getMinorScale(rootNote) {
        const intervals = [0, 2, 3, 5, 7, 8, 10];
        return intervals.map(interval => rootNote + interval);
    }

    static getPentatonicScale(rootNote) {
        const intervals = [0, 2, 4, 7, 9];
        return intervals.map(interval => rootNote + interval);
    }

    static getBluesScale(rootNote) {
        const intervals = [0, 3, 5, 6, 7, 10];
        return intervals.map(interval => rootNote + interval);
    }
}

// Initialize virtual keyboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.virtualKeyboard = new VirtualKeyboard(window.timbukAudioEngine);
});