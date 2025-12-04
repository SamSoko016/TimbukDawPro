// Timbuk Synthesizer - Patch Manager
// Handles patch saving, loading, and organization

class PatchManager {
    constructor(audioEngine, uiControls) {
        this.audioEngine = audioEngine;
        this.uiControls = uiControls;
        this.currentPatchName = 'Init';
        this.patches = new Map();
        this.recentPatches = [];
        this.favoritePatches = [];
        this.userPatches = [];
        
        // Storage keys
        this.STORAGE_KEY = 'timbuk_patches';
        this.RECENT_KEY = 'timbuk_recent_patches';
        this.FAVORITES_KEY = 'timbuk_favorite_patches';
        
        // Default factory patches
        this.factoryPatches = new Map();
        
        this.init();
    }

    init() {
        this.loadFactoryPatches();
        this.loadUserPatches();
        this.setupEventListeners();
        this.updatePatchSelect();
    }

    loadFactoryPatches() {
        // Factory patches that come with Timbuk
        this.factoryPatches.set('Init', {
            name: 'Init',
            category: 'Init',
            author: 'Sam Soko',
            description: 'Clean initial patch',
            tags: ['basic', 'init'],
            data: this.getFactoryInitPatch()
        });

        this.factoryPatches.set('Warm Bass', {
            name: 'Warm Bass',
            category: 'Bass',
            author: 'Sam Soko',
            description: 'Classic analog bass with warmth',
            tags: ['bass', 'warm', 'analog'],
            data: this.getFactoryWarmBassPatch()
        });

        this.factoryPatches.set('Bright Lead', {
            name: 'Bright Lead',
            category: 'Lead',
            author: 'Sam Soko',
            description: 'Cutting lead for solos',
            tags: ['lead', 'bright', 'solo'],
            data: this.getFactoryBrightLeadPatch()
        });

        this.factoryPatches.set('Ethereal Pad', {
            name: 'Ethereal Pad',
            category: 'Pad',
            author: 'Sam Soko',
            description: 'Lush atmospheric pad',
            tags: ['pad', 'atmospheric', 'ethereal'],
            data: this.getFactoryEtherealPadPatch()
        });

        this.factoryPatches.set('Techno Arp', {
            name: 'Techno Arp',
            category: 'Arpeggio',
            author: 'Sam Soko',
            description: 'Driving techno arpeggio',
            tags: ['arp', 'techno', 'driving'],
            data: this.getFactoryTechnoArpPatch()
        });

        this.factoryPatches.set('Vintage Strings', {
            name: 'Vintage Strings',
            category: 'Strings',
            author: 'Sam Soko',
            description: 'Classic string ensemble sound',
            tags: ['strings', 'vintage', 'ensemble'],
            data: this.getFactoryVintageStringsPatch()
        });

        this.factoryPatches.set('Synth Brass', {
            name: 'Synth Brass',
            category: 'Brass',
            author: 'Sam Soko',
            description: 'Bold synthetic brass',
            tags: ['brass', 'bold', 'synthetic'],
            data: this.getFactorySynthBrassPatch()
        });

        this.factoryPatches.set('Cosmic FX', {
            name: 'Cosmic FX',
            category: 'FX',
            author: 'Sam Soko',
            description: 'Spacey effects and textures',
            tags: ['fx', 'space', 'texture'],
            data: this.getFactoryCosmicFXPatch()
        });
    }

    getFactoryInitPatch() {
        return {
            oscillators: {
                osc1: {
                    waveform: 'sine',
                    volume: -6,
                    detune: 0,
                    octave: 0
                },
                osc2: {
                    waveform: 'sawtooth',
                    volume: -Infinity,
                    detune: 0,
                    octave: 0
                }
            },
            filter: {
                type: 'lowpass',
                cutoff: 1000,
                resonance: 1,
                envelopeAmount: 0
            },
            envelopes: {
                amplitude: {
                    attack: 0.01,
                    decay: 0.1,
                    sustain: 0.3,
                    release: 1
                },
                filter: {
                    attack: 0.1,
                    decay: 0.2,
                    sustain: 0.2,
                    release: 0.8
                }
            },
            lfo: {
                rate: 1,
                depth: 0,
                target: 'none'
            },
            effects: {
                reverb: {
                    mix: 0
                },
                delay: {
                    time: 0.125,
                    feedback: 0.3,
                    mix: 0
                }
            },
            master: {
                volume: 0,
                warmth: 0
            }
        };
    }

    getFactoryWarmBassPatch() {
        return {
            oscillators: {
                osc1: {
                    waveform: 'sawtooth',
                    volume: -3,
                    detune: -2,
                    octave: -2
                },
                osc2: {
                    waveform: 'pulse',
                    volume: -6,
                    detune: 2,
                    octave: -1
                }
            },
            filter: {
                type: 'lowpass',
                cutoff: 500,
                resonance: 3,
                envelopeAmount: 0.6
            },
            envelopes: {
                amplitude: {
                    attack: 0.005,
                    decay: 0.2,
                    sustain: 0.7,
                    release: 0.3
                },
                filter: {
                    attack: 0.01,
                    decay: 0.4,
                    sustain: 0.3,
                    release: 0.6
                }
            },
            lfo: {
                rate: 3,
                depth: 0.15,
                target: 'filter'
            },
            effects: {
                reverb: {
                    mix: 0.1
                },
                delay: {
                    time: 0.083,
                    feedback: 0.2,
                    mix: 0.05
                }
            },
            master: {
                volume: -3,
                warmth: 0.4
            }
        };
    }

    getFactoryBrightLeadPatch() {
        return {
            oscillators: {
                osc1: {
                    waveform: 'sawtooth',
                    volume: -3,
                    detune: -1,
                    octave: 0
                },
                osc2: {
                    waveform: 'square',
                    volume: -3,
                    detune: 5,
                    octave: 0
                }
            },
            filter: {
                type: 'lowpass',
                cutoff: 2500,
                resonance: 2.5,
                envelopeAmount: 0.4
            },
            envelopes: {
                amplitude: {
                    attack: 0.02,
                    decay: 0.15,
                    sustain: 0.6,
                    release: 0.4
                },
                filter: {
                    attack: 0.05,
                    decay: 0.3,
                    sustain: 0.4,
                    release: 0.7
                }
            },
            lfo: {
                rate: 6,
                depth: 0.25,
                target: 'pitch'
            },
            effects: {
                reverb: {
                    mix: 0.2
                },
                delay: {
                    time: 0.25,
                    feedback: 0.4,
                    mix: 0.1
                }
            },
            master: {
                volume: -6,
                warmth: 0.2
            }
        };
    }

    getFactoryEtherealPadPatch() {
        return {
            oscillators: {
                osc1: {
                    waveform: 'sine',
                    volume: -9,
                    detune: -5,
                    octave: 0
                },
                osc2: {
                    waveform: 'triangle',
                    volume: -9,
                    detune: 5,
                    octave: 0
                }
            },
            filter: {
                type: 'lowpass',
                cutoff: 1800,
                resonance: 1.2,
                envelopeAmount: 0.3
            },
            envelopes: {
                amplitude: {
                    attack: 2.0,
                    decay: 3.0,
                    sustain: 0.8,
                    release: 4.0
                },
                filter: {
                    attack: 2.5,
                    decay: 3.5,
                    sustain: 0.5,
                    release: 5.0
                }
            },
            lfo: {
                rate: 0.3,
                depth: 0.2,
                target: 'filter'
            },
            effects: {
                reverb: {
                    mix: 0.5
                },
                delay: {
                    time: 0.75,
                    feedback: 0.7,
                    mix: 0.3
                }
            },
            master: {
                volume: -9,
                warmth: 0.5
            }
        };
    }

    getFactoryTechnoArpPatch() {
        return {
            oscillators: {
                osc1: {
                    waveform: 'square',
                    volume: -6,
                    detune: 0,
                    octave: 1
                },
                osc2: {
                    waveform: 'sawtooth',
                    volume: -12,
                    detune: -7,
                    octave: 0
                }
            },
            filter: {
                type: 'bandpass',
                cutoff: 1500,
                resonance: 6,
                envelopeAmount: 0.7
            },
            envelopes: {
                amplitude: {
                    attack: 0.001,
                    decay: 0.1,
                    sustain: 0,
                    release: 0.05
                },
                filter: {
                    attack: 0.01,
                    decay: 0.2,
                    sustain: 0,
                    release: 0.1
                }
            },
            lfo: {
                rate: 8,
                depth: 0.3,
                target: 'filter'
            },
            effects: {
                reverb: {
                    mix: 0.1
                },
                delay: {
                    time: 0.167,
                    feedback: 0.4,
                    mix: 0.2
                }
            },
            master: {
                volume: -9,
                warmth: 0.3
            }
        };
    }

    getFactoryVintageStringsPatch() {
        return {
            oscillators: {
                osc1: {
                    waveform: 'sawtooth',
                    volume: -12,
                    detune: -3,
                    octave: 0
                },
                osc2: {
                    waveform: 'sawtooth',
                    volume: -12,
                    detune: 3,
                    octave: 0
                }
            },
            filter: {
                type: 'lowpass',
                cutoff: 2000,
                resonance: 1.5,
                envelopeAmount: 0.2
            },
            envelopes: {
                amplitude: {
                    attack: 0.8,
                    decay: 1.5,
                    sustain: 0.6,
                    release: 2.0
                },
                filter: {
                    attack: 1.0,
                    decay: 2.0,
                    sustain: 0.4,
                    release: 3.0
                }
            },
            lfo: {
                rate: 1.5,
                depth: 0.1,
                target: 'amplitude'
            },
            effects: {
                reverb: {
                    mix: 0.3
                },
                delay: {
                    time: 0.333,
                    feedback: 0.5,
                    mix: 0.15
                }
            },
            master: {
                volume: -12,
                warmth: 0.6
            }
        };
    }

    getFactorySynthBrassPatch() {
        return {
            oscillators: {
                osc1: {
                    waveform: 'sawtooth',
                    volume: -3,
                    detune: 0,
                    octave: -1
                },
                osc2: {
                    waveform: 'pulse',
                    volume: -3,
                    detune: 12,
                    octave: 0
                }
            },
            filter: {
                type: 'lowpass',
                cutoff: 1200,
                resonance: 4,
                envelopeAmount: 0.5
            },
            envelopes: {
                amplitude: {
                    attack: 0.05,
                    decay: 0.3,
                    sustain: 0.8,
                    release: 0.2
                },
                filter: {
                    attack: 0.1,
                    decay: 0.5,
                    sustain: 0.6,
                    release: 0.3
                }
            },
            lfo: {
                rate: 4,
                depth: 0.2,
                target: 'amplitude'
            },
            effects: {
                reverb: {
                    mix: 0.15
                },
                delay: {
                    time: 0.2,
                    feedback: 0.3,
                    mix: 0.05
                }
            },
            master: {
                volume: -6,
                warmth: 0.4
            }
        };
    }

    getFactoryCosmicFXPatch() {
        return {
            oscillators: {
                osc1: {
                    waveform: 'triangle',
                    volume: -12,
                    detune: -10,
                    octave: 1
                },
                osc2: {
                    waveform: 'sine',
                    volume: -12,
                    detune: 10,
                    octave: 2
                }
            },
            filter: {
                type: 'notch',
                cutoff: 3000,
                resonance: 2,
                envelopeAmount: 0.8
            },
            envelopes: {
                amplitude: {
                    attack: 3.0,
                    decay: 4.0,
                    sustain: 0.2,
                    release: 5.0
                },
                filter: {
                    attack: 2.0,
                    decay: 5.0,
                    sustain: 0,
                    release: 6.0
                }
            },
            lfo: {
                rate: 0.2,
                depth: 0.4,
                target: 'filter'
            },
            effects: {
                reverb: {
                    mix: 0.7
                },
                delay: {
                    time: 1.0,
                    feedback: 0.8,
                    mix: 0.4
                }
            },
            master: {
                volume: -15,
                warmth: 0.7
            }
        };
    }

    setupEventListeners() {
        // IPC events from Electron main process
        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            
            ipcRenderer.on('new-patch', () => {
                this.createNewPatch();
            });
            
            ipcRenderer.on('save-patch', () => {
                this.savePatchDialog();
            });
            
            ipcRenderer.on('load-patch', () => {
                this.loadPatchDialog();
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            if (e.ctrlKey || e.metaKey) {
                switch(e.key.toLowerCase()) {
                    case 's':
                        e.preventDefault();
                        this.quickSave();
                        break;
                    case 'shift+s':
                        e.preventDefault();
                        this.savePatchDialog();
                        break;
                    case 'o':
                        e.preventDefault();
                        this.loadPatchDialog();
                        break;
                    case 'n':
                        e.preventDefault();
                        this.createNewPatch();
                        break;
                }
            }
        });
    }

    loadUserPatches() {
        try {
            // Load from localStorage
            const savedPatches = localStorage.getItem(this.STORAGE_KEY);
            if (savedPatches) {
                const patches = JSON.parse(savedPatches);
                patches.forEach(patch => {
                    this.patches.set(patch.name, patch);
                });
            }
            
            // Load recent patches
            const recent = localStorage.getItem(this.RECENT_KEY);
            if (recent) {
                this.recentPatches = JSON.parse(recent);
            }
            
            // Load favorites
            const favorites = localStorage.getItem(this.FAVORITES_KEY);
            if (favorites) {
                this.favoritePatches = JSON.parse(favorites);
            }
        } catch (error) {
            console.error('Error loading user patches:', error);
        }
    }

    saveUserPatches() {
        try {
            const patches = Array.from(this.patches.values());
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(patches));
            localStorage.setItem(this.RECENT_KEY, JSON.stringify(this.recentPatches));
            localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(this.favoritePatches));
        } catch (error) {
            console.error('Error saving user patches:', error);
        }
    }

    updatePatchSelect() {
        const select = document.getElementById('patchSelect');
        if (!select) return;
        
        // Clear existing options
        select.innerHTML = '';
        
        // Add factory patches
        this.addPatchCategory(select, 'Factory Patches', this.factoryPatches);
        
        // Add user patches
        if (this.userPatches.length > 0) {
            this.addPatchCategory(select, 'User Patches', this.patches, this.userPatches);
        }
        
        // Add recent patches if different
        if (this.recentPatches.length > 0) {
            const recentUserPatches = this.recentPatches.filter(name => this.patches.has(name));
            if (recentUserPatches.length > 0) {
                this.addPatchCategory(select, 'Recent', this.patches, recentUserPatches);
            }
        }
        
        // Select current patch
        select.value = this.currentPatchName;
    }

    addPatchCategory(select, categoryTitle, patchMap, patchNames = null) {
        if (patchNames) {
            // Use provided patch names
            const patches = patchNames.map(name => patchMap.get(name)).filter(Boolean);
            if (patches.length === 0) return;
            
            const optgroup = document.createElement('optgroup');
            optgroup.label = categoryTitle;
            
            patches.forEach(patch => {
                const option = document.createElement('option');
                option.value = patch.name;
                option.textContent = patch.name;
                if (patch.category) {
                    option.textContent += ` (${patch.category})`;
                }
                optgroup.appendChild(option);
            });
            
            select.appendChild(optgroup);
        } else {
            // Use all patches from map
            if (patchMap.size === 0) return;
            
            const optgroup = document.createElement('optgroup');
            optgroup.label = categoryTitle;
            
            patchMap.forEach(patch => {
                const option = document.createElement('option');
                option.value = patch.name;
                option.textContent = patch.name;
                if (patch.category) {
                    option.textContent += ` (${patch.category})`;
                }
                optgroup.appendChild(option);
            });
            
            select.appendChild(optgroup);
        }
    }

    loadPatch(patchName) {
        let patch = this.factoryPatches.get(patchName) || this.patches.get(patchName);
        
        if (!patch) {
            console.warn(`Patch '${patchName}' not found`);
            return false;
        }
        
        // Load patch data into audio engine
        this.audioEngine.loadPatch(patch.data);
        this.uiControls.updateUIFromPatch(patch.data);
        
        // Update UI
        this.currentPatchName = patchName;
        document.getElementById('patchSelect').value = patchName;
        
        // Add to recent patches
        this.addToRecent(patchName);
        
        // Show status
        this.showStatus(`Loaded: ${patch.name}`, 'success');
        
        return true;
    }

    savePatch(name, metadata = {}) {
        const patchData = this.audioEngine.getCurrentPatch();
        
        const patch = {
            name: name,
            category: metadata.category || 'User',
            author: metadata.author || 'User',
            description: metadata.description || '',
            tags: metadata.tags || [],
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            data: patchData
        };
        
        this.patches.set(name, patch);
        this.userPatches.push(name);
        this.addToRecent(name);
        
        this.saveUserPatches();
        this.updatePatchSelect();
        
        this.currentPatchName = name;
        this.showStatus(`Saved: ${name}`, 'success');
        
        return patch;
    }

    deletePatch(name) {
        if (this.factoryPatches.has(name)) {
            this.showStatus('Cannot delete factory patches', 'error');
            return false;
        }
        
        this.patches.delete(name);
        this.userPatches = this.userPatches.filter(n => n !== name);
        this.recentPatches = this.recentPatches.filter(n => n !== name);
        this.favoritePatches = this.favoritePatches.filter(n => n !== name);
        
        this.saveUserPatches();
        this.updatePatchSelect();
        
        this.showStatus(`Deleted: ${name}`, 'warning');
        return true;
    }

    addToRecent(patchName) {
        // Remove if already in list
        this.recentPatches = this.recentPatches.filter(name => name !== patchName);
        
        // Add to beginning
        this.recentPatches.unshift(patchName);
        
        // Keep only last 10
        this.recentPatches = this.recentPatches.slice(0, 10);
        
        this.saveUserPatches();
    }

    toggleFavorite(patchName) {
        const index = this.favoritePatches.indexOf(patchName);
        if (index === -1) {
            this.favoritePatches.push(patchName);
            this.showStatus(`Added to favorites: ${patchName}`, 'success');
        } else {
            this.favoritePatches.splice(index, 1);
            this.showStatus(`Removed from favorites: ${patchName}`, 'info');
        }
        
        this.saveUserPatches();
    }

    createNewPatch() {
        const initPatch = this.getFactoryInitPatch();
        this.audioEngine.loadPatch(initPatch);
        this.uiControls.updateUIFromPatch(initPatch);
        
        this.currentPatchName = 'New Patch';
        this.showStatus('Created new patch', 'info');
    }

    quickSave() {
        if (this.currentPatchName === 'New Patch' || this.currentPatchName === 'Init') {
            this.savePatchDialog();
        } else {
            this.savePatch(this.currentPatchName);
        }
    }

    savePatchDialog() {
        const name = prompt('Enter patch name:', this.currentPatchName);
        if (!name) return;
        
        const category = prompt('Enter category (optional):', 'User');
        const description = prompt('Enter description (optional):', '');
        
        this.savePatch(name, {
            category: category || 'User',
            description: description || ''
        });
    }

    loadPatchDialog() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const patchData = JSON.parse(event.target.result);
                    
                    if (patchData.data) {
                        // Full patch format
                        this.patches.set(patchData.name, patchData);
                        this.userPatches.push(patchData.name);
                        this.loadPatch(patchData.name);
                    } else {
                        // Just patch data
                        const name = file.name.replace('.json', '');
                        this.savePatch(name, { data: patchData });
                        this.loadPatch(name);
                    }
                } catch (error) {
                    this.showStatus('Failed to load patch: Invalid file', 'error');
                }
            };
            reader.readAsText(file);
        });
        
        input.click();
    }

    exportPatch(name) {
        const patch = this.factoryPatches.get(name) || this.patches.get(name);
        if (!patch) {
            this.showStatus(`Patch '${name}' not found`, 'error');
            return;
        }
        
        const blob = new Blob([JSON.stringify(patch, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${patch.name.replace(/[^a-zA-Z0-9]/g, '_')}_timbuk_patch.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showStatus(`Exported: ${patch.name}`, 'success');
    }

    exportAllPatches() {
        const allPatches = {
            factory: Array.from(this.factoryPatches.values()),
            user: Array.from(this.patches.values()),
            exported: new Date().toISOString(),
            version: '1.0',
            synthesizer: 'Timbuk by Sam Soko'
        };
        
        const blob = new Blob([JSON.stringify(allPatches, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `timbuk_all_patches_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showStatus('Exported all patches', 'success');
    }

    importPatches(file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                
                if (data.user && Array.isArray(data.user)) {
                    data.user.forEach(patch => {
                        if (patch.name && patch.data) {
                            this.patches.set(patch.name, patch);
                            if (!this.userPatches.includes(patch.name)) {
                                this.userPatches.push(patch.name);
                            }
                        }
                    });
                    
                    this.saveUserPatches();
                    this.updatePatchSelect();
                    this.showStatus(`Imported ${data.user.length} patches`, 'success');
                } else if (data.name && data.data) {
                    // Single patch
                    this.patches.set(data.name, data);
                    this.userPatches.push(data.name);
                    this.saveUserPatches();
                    this.updatePatchSelect();
                    this.loadPatch(data.name);
                } else {
                    throw new Error('Invalid patch format');
                }
            } catch (error) {
                this.showStatus('Failed to import patches: Invalid file format', 'error');
            }
        };
        reader.readAsText(file);
    }

    getPatchList() {
        const factoryList = Array.from(this.factoryPatches.values());
        const userList = Array.from(this.patches.values());
        
        return {
            factory: factoryList,
            user: userList,
            recent: this.recentPatches.map(name => this.patches.get(name) || this.factoryPatches.get(name)).filter(Boolean),
            favorites: this.favoritePatches.map(name => this.patches.get(name) || this.factoryPatches.get(name)).filter(Boolean)
        };
    }

    searchPatches(query) {
        const allPatches = [
            ...Array.from(this.factoryPatches.values()),
            ...Array.from(this.patches.values())
        ];
        
        const lowerQuery = query.toLowerCase();
        
        return allPatches.filter(patch => 
            patch.name.toLowerCase().includes(lowerQuery) ||
            (patch.category && patch.category.toLowerCase().includes(lowerQuery)) ||
            (patch.description && patch.description.toLowerCase().includes(lowerQuery)) ||
            (patch.tags && patch.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
        );
    }

    showStatus(message, type = 'info') {
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `text-${type}`;
            
            setTimeout(() => {
                statusElement.textContent = 'Ready';
                statusElement.className = '';
            }, 3000);
        }
    }

    // Cleanup
    dispose() {
        this.saveUserPatches();
    }
}

// Initialize patch manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.patchManager = new PatchManager(window.timbukAudioEngine, window.uiControls);
});