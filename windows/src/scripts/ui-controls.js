// Timbuk Synthesizer - UI Controls
// Handles all user interface interactions and parameter mapping

class UIControls {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.knobs = new Map();
        this.sliders = new Map();
        this.toggles = new Map();
        this.isInitialized = false;
        
        // Parameter ranges and scaling
        this.paramRanges = {
            'osc1-volume': { min: -Infinity, max: 0, default: -6 },
            'osc1-detune': { min: -100, max: 100, default: 0 },
            'osc1-octave': { min: -2, max: 2, default: 0, step: 1 },
            'osc2-volume': { min: -Infinity, max: 0, default: -Infinity },
            'osc2-detune': { min: -100, max: 100, default: 0 },
            'osc2-octave': { min: -2, max: 2, default: 0, step: 1 },
            'filter-cutoff': { min: 20, max: 20000, default: 1000, exponential: true },
            'filter-resonance': { min: 0.1, max: 30, default: 1 },
            'filter-env': { min: 0, max: 1, default: 0 },
            'amp-attack': { min: 0.001, max: 5, default: 0.01 },
            'amp-decay': { min: 0.001, max: 5, default: 0.1 },
            'amp-sustain': { min: 0, max: 1, default: 0.3 },
            'amp-release': { min: 0.01, max: 10, default: 1 },
            'filter-attack': { min: 0.001, max: 5, default: 0.1 },
            'filter-decay': { min: 0.001, max: 5, default: 0.2 },
            'filter-sustain': { min: 0, max: 1, default: 0.2 },
            'filter-release': { min: 0.01, max: 10, default: 0.8 },
            'lfo-rate': { min: 0.1, max: 20, default: 1 },
            'lfo-depth': { min: 0, max: 1, default: 0 },
            'reverb-mix': { min: 0, max: 1, default: 0 },
            'delay-time': { min: 0.01, max: 2, default: 0.125 },
            'delay-feedback': { min: 0, max: 0.95, default: 0.3 },
            'master-volume': { min: -60, max: 12, default: 0 },
            'analog-warmth': { min: 0, max: 1, default: 0 }
        };
        
        this.init();
    }

    init() {
        this.setupKnobs();
        this.setupSliders();
        this.setupToggles();
        this.setupSelects();
        this.setupButtons();
        this.setupKeyboardShortcuts();
        this.isInitialized = true;
    }

    setupKnobs() {
        const knobElements = document.querySelectorAll('.knob-control[data-param]');
        
        knobElements.forEach(knobControl => {
            const param = knobControl.dataset.param;
            const knob = knobControl.querySelector('.knob');
            const range = this.paramRanges[param];
            
            if (!range) return;
            
            const knobInstance = new Knob(knob, {
                min: range.min,
                max: range.max,
                value: range.default,
                step: range.step || 0.01,
                exponential: range.exponential || false,
                onChange: (value) => this.handleParameterChange(param, value)
            });
            
            // Add value display
            const valueDisplay = document.createElement('div');
            valueDisplay.className = 'knob-value';
            valueDisplay.textContent = this.formatParameterValue(param, range.default);
            knobControl.appendChild(valueDisplay);
            
            // Update value display on change
            knobInstance.on('change', (value) => {
                valueDisplay.textContent = this.formatParameterValue(param, value);
            });
            
            this.knobs.set(param, knobInstance);
        });
    }

    setupSliders() {
        const sliderElements = document.querySelectorAll('.slider-control[data-param]');
        
        sliderElements.forEach(sliderControl => {
            const param = sliderControl.dataset.param;
            const slider = sliderControl.querySelector('.slider');
            const range = this.paramRanges[param];
            
            if (!range) return;
            
            slider.min = range.min;
            slider.max = range.max;
            slider.step = range.step || 0.01;
            slider.value = range.default;
            
            slider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.handleParameterChange(param, value);
            });
            
            this.sliders.set(param, slider);
        });
    }

    setupToggles() {
        const toggleElements = document.querySelectorAll('.toggle-control[data-param]');
        
        toggleElements.forEach(toggleControl => {
            const param = toggleControl.dataset.param;
            const toggleSwitch = toggleControl.querySelector('.toggle-switch');
            
            toggleSwitch.addEventListener('click', () => {
                toggleSwitch.classList.toggle('active');
                const value = toggleSwitch.classList.contains('active');
                this.handleParameterChange(param, value);
            });
            
            this.toggles.set(param, toggleSwitch);
        });
    }

    setupSelects() {
        // Waveform selects
        const waveformSelects = document.querySelectorAll('.waveform-select');
        waveformSelects.forEach(select => {
            const oscNumber = select.dataset.osc;
            
            select.addEventListener('change', (e) => {
                this.audioEngine.setOscillatorWaveform(oscNumber, e.target.value);
            });
        });
        
        // Filter type select
        const filterTypeSelect = document.getElementById('filterType');
        if (filterTypeSelect) {
            filterTypeSelect.addEventListener('change', (e) => {
                this.audioEngine.setFilterType(e.target.value);
            });
        }
        
        // LFO target select
        const lfoTargetSelect = document.getElementById('lfoTarget');
        if (lfoTargetSelect) {
            lfoTargetSelect.addEventListener('change', (e) => {
                this.audioEngine.setLFOTarget(e.target.value);
            });
        }
        
        // Patch select
        const patchSelect = document.getElementById('patchSelect');
        if (patchSelect) {
            patchSelect.addEventListener('change', (e) => {
                this.loadPresetPatch(e.target.value);
            });
        }
    }

    setupButtons() {
        // Panic button
        const panicButton = document.getElementById('panic');
        if (panicButton) {
            panicButton.addEventListener('click', () => {
                this.audioEngine.panic();
                this.showStatus('All notes stopped', 'warning');
            });
        }
        
        // Patch control buttons
        const newPatchButton = document.getElementById('newPatch');
        if (newPatchButton) {
            newPatchButton.addEventListener('click', () => {
                this.resetToInitPatch();
            });
        }
        
        const savePatchButton = document.getElementById('savePatch');
        if (savePatchButton) {
            savePatchButton.addEventListener('click', () => {
                this.saveCurrentPatch();
            });
        }
        
        const loadPatchButton = document.getElementById('loadPatch');
        if (loadPatchButton) {
            loadPatchButton.addEventListener('click', () => {
                this.loadPatchFromFile();
            });
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Prevent shortcuts when typing in inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            switch(e.key.toLowerCase()) {
                case 'n':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.resetToInitPatch();
                    }
                    break;
                case 's':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.saveCurrentPatch();
                    }
                    break;
                case 'o':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.loadPatchFromFile();
                    }
                    break;
                case 'escape':
                    this.audioEngine.panic();
                    this.showStatus('All notes stopped', 'warning');
                    break;
            }
        });
    }

    handleParameterChange(param, value) {
        switch(param) {
            // Oscillator parameters
            case 'osc1-volume':
                this.audioEngine.setOscillatorVolume(1, value);
                break;
            case 'osc1-detune':
                this.audioEngine.setOscillatorDetune(1, value);
                break;
            case 'osc1-octave':
                this.audioEngine.setOscillatorOctave(1, Math.round(value));
                break;
            case 'osc2-volume':
                this.audioEngine.setOscillatorVolume(2, value);
                break;
            case 'osc2-detune':
                this.audioEngine.setOscillatorDetune(2, value);
                break;
            case 'osc2-octave':
                this.audioEngine.setOscillatorOctave(2, Math.round(value));
                break;
            
            // Filter parameters
            case 'filter-cutoff':
                this.audioEngine.setFilterCutoff(value);
                break;
            case 'filter-resonance':
                this.audioEngine.setFilterResonance(value);
                break;
            case 'filter-env':
                this.audioEngine.setFilterEnvelopeAmount(value);
                break;
            
            // Amplitude envelope
            case 'amp-attack':
                this.updateAmplitudeEnvelope('attack', value);
                break;
            case 'amp-decay':
                this.updateAmplitudeEnvelope('decay', value);
                break;
            case 'amp-sustain':
                this.updateAmplitudeEnvelope('sustain', value);
                break;
            case 'amp-release':
                this.updateAmplitudeEnvelope('release', value);
                break;
            
            // Filter envelope
            case 'filter-attack':
                this.updateFilterEnvelope('attack', value);
                break;
            case 'filter-decay':
                this.updateFilterEnvelope('decay', value);
                break;
            case 'filter-sustain':
                this.updateFilterEnvelope('sustain', value);
                break;
            case 'filter-release':
                this.updateFilterEnvelope('release', value);
                break;
            
            // LFO parameters
            case 'lfo-rate':
                this.audioEngine.setLFORate(value);
                break;
            case 'lfo-depth':
                this.audioEngine.setLFODepth(value);
                break;
            
            // Effects parameters
            case 'reverb-mix':
                this.audioEngine.setReverbMix(value);
                break;
            case 'delay-time':
                this.audioEngine.setDelayTime(value);
                break;
            case 'delay-feedback':
                this.audioEngine.setDelayFeedback(value);
                break;
            
            // Master parameters
            case 'master-volume':
                this.audioEngine.setMasterVolume(value);
                break;
            case 'analog-warmth':
                this.audioEngine.setAnalogWarmth(value);
                break;
        }
    }

    updateAmplitudeEnvelope(param, value) {
        const currentPatch = this.audioEngine.getCurrentPatch();
        const env = currentPatch.envelopes.amplitude;
        env[param] = value;
        this.audioEngine.setAmplitudeEnvelope(env.attack, env.decay, env.sustain, env.release);
    }

    updateFilterEnvelope(param, value) {
        const currentPatch = this.audioEngine.getCurrentPatch();
        const env = currentPatch.envelopes.filter;
        env[param] = value;
        this.audioEngine.setFilterEnvelope(env.attack, env.decay, env.sustain, env.release);
    }

    formatParameterValue(param, value) {
        switch(param) {
            case 'osc1-volume':
            case 'osc2-volume':
                return value === -Infinity ? '-∞' : `${value.toFixed(1)}dB`;
            case 'osc1-detune':
            case 'osc2-detune':
                return `${value.toFixed(0)}¢`;
            case 'osc1-octave':
            case 'osc2-octave':
                return `${Math.round(value)}`;
            case 'filter-cutoff':
                return value < 1000 ? `${value.toFixed(0)}Hz` : `${(value/1000).toFixed(1)}kHz`;
            case 'filter-resonance':
                return value.toFixed(1);
            case 'filter-env':
            case 'lfo-depth':
            case 'reverb-mix':
            case 'delay-feedback':
            case 'analog-warmth':
            case 'amp-sustain':
            case 'filter-sustain':
                return `${(value * 100).toFixed(0)}%`;
            case 'amp-attack':
            case 'amp-decay':
            case 'amp-release':
            case 'filter-attack':
            case 'filter-decay':
            case 'filter-release':
                return value < 1 ? `${(value * 1000).toFixed(0)}ms` : `${value.toFixed(2)}s`;
            case 'lfo-rate':
                return `${value.toFixed(1)}Hz`;
            case 'delay-time':
                return `${value.toFixed(3)}s`;
            case 'master-volume':
                return `${value.toFixed(1)}dB`;
            default:
                return value.toFixed(2);
        }
    }

    // Patch management
    resetToInitPatch() {
        const initPatch = this.getInitPatch();
        this.audioEngine.loadPatch(initPatch);
        this.updateUIFromPatch(initPatch);
        this.showStatus('Loaded Init patch', 'success');
    }

    getInitPatch() {
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

    loadPresetPatch(presetName) {
        const presets = this.getPresetPatches();
        const preset = presets[presetName];
        
        if (preset) {
            this.audioEngine.loadPatch(preset);
            this.updateUIFromPatch(preset);
            this.showStatus(`Loaded ${presetName} preset`, 'success');
        }
    }

    getPresetPatches() {
        return {
            'init': this.getInitPatch(),
            'bass': {
                oscillators: {
                    osc1: {
                        waveform: 'sawtooth',
                        volume: 0,
                        detune: 0,
                        octave: -2
                    },
                    osc2: {
                        waveform: 'square',
                        volume: -6,
                        detune: -5,
                        octave: -1
                    }
                },
                filter: {
                    type: 'lowpass',
                    cutoff: 800,
                    resonance: 4,
                    envelopeAmount: 0.8
                },
                envelopes: {
                    amplitude: {
                        attack: 0.001,
                        decay: 0.1,
                        sustain: 0.8,
                        release: 0.2
                    },
                    filter: {
                        attack: 0.01,
                        decay: 0.3,
                        sustain: 0.2,
                        release: 0.5
                    }
                },
                lfo: {
                    rate: 4,
                    depth: 0.1,
                    target: 'filter'
                },
                effects: {
                    reverb: {
                        mix: 0.1
                    },
                    delay: {
                        time: 0.125,
                        feedback: 0.2,
                        mix: 0
                    }
                },
                master: {
                    volume: -3,
                    warmth: 0.3
                }
            },
            'lead': {
                oscillators: {
                    osc1: {
                        waveform: 'sawtooth',
                        volume: -3,
                        detune: 0,
                        octave: 0
                    },
                    osc2: {
                        waveform: 'sawtooth',
                        volume: -3,
                        detune: 7,
                        octave: 0
                    }
                },
                filter: {
                    type: 'lowpass',
                    cutoff: 2000,
                    resonance: 2,
                    envelopeAmount: 0.5
                },
                envelopes: {
                    amplitude: {
                        attack: 0.05,
                        decay: 0.2,
                        sustain: 0.4,
                        release: 0.5
                    },
                    filter: {
                        attack: 0.1,
                        decay: 0.3,
                        sustain: 0.3,
                        release: 0.8
                    }
                },
                lfo: {
                    rate: 6,
                    depth: 0.2,
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
            },
            'pad': {
                oscillators: {
                    osc1: {
                        waveform: 'sine',
                        volume: -6,
                        detune: -3,
                        octave: 0
                    },
                    osc2: {
                        waveform: 'triangle',
                        volume: -6,
                        detune: 3,
                        octave: 0
                    }
                },
                filter: {
                    type: 'lowpass',
                    cutoff: 1500,
                    resonance: 1.5,
                    envelopeAmount: 0.3
                },
                envelopes: {
                    amplitude: {
                        attack: 1.5,
                        decay: 2,
                        sustain: 0.7,
                        release: 3
                    },
                    filter: {
                        attack: 2,
                        decay: 2.5,
                        sustain: 0.4,
                        release: 4
                    }
                },
                lfo: {
                    rate: 0.5,
                    depth: 0.1,
                    target: 'filter'
                },
                effects: {
                    reverb: {
                        mix: 0.4
                    },
                    delay: {
                        time: 0.5,
                        feedback: 0.6,
                        mix: 0.2
                    }
                },
                master: {
                    volume: -9,
                    warmth: 0.4
                }
            },
            'arp': {
                oscillators: {
                    osc1: {
                        waveform: 'square',
                        volume: -6,
                        detune: 0,
                        octave: 1
                    },
                    osc2: {
                        waveform: 'sawtooth',
                        volume: -Infinity,
                        detune: 0,
                        octave: 0
                    }
                },
                filter: {
                    type: 'bandpass',
                    cutoff: 1200,
                    resonance: 8,
                    envelopeAmount: 0.6
                },
                envelopes: {
                    amplitude: {
                        attack: 0.01,
                        decay: 0.15,
                        sustain: 0,
                        release: 0.1
                    },
                    filter: {
                        attack: 0.01,
                        decay: 0.2,
                        sustain: 0,
                        release: 0.15
                    }
                },
                lfo: {
                    rate: 8,
                    depth: 0.3,
                    target: 'filter'
                },
                effects: {
                    reverb: {
                        mix: 0.15
                    },
                    delay: {
                        time: 0.167,
                        feedback: 0.35,
                        mix: 0.25
                    }
                },
                master: {
                    volume: -12,
                    warmth: 0.1
                }
            }
        };
    }

    updateUIFromPatch(patch) {
        // Update oscillators
        this.knobs.get('osc1-volume')?.setValue(patch.oscillators.osc1.volume);
        this.knobs.get('osc1-detune')?.setValue(patch.oscillators.osc1.detune);
        this.knobs.get('osc1-octave')?.setValue(patch.oscillators.osc1.octave);
        this.knobs.get('osc2-volume')?.setValue(patch.oscillators.osc2.volume);
        this.knobs.get('osc2-detune')?.setValue(patch.oscillators.osc2.detune);
        this.knobs.get('osc2-octave')?.setValue(patch.oscillators.osc2.octave);
        
        // Update filter
        this.knobs.get('filter-cutoff')?.setValue(patch.filter.cutoff);
        this.knobs.get('filter-resonance')?.setValue(patch.filter.resonance);
        this.knobs.get('filter-env')?.setValue(patch.filter.envelopeAmount);
        
        // Update envelopes
        this.knobs.get('amp-attack')?.setValue(patch.envelopes.amplitude.attack);
        this.knobs.get('amp-decay')?.setValue(patch.envelopes.amplitude.decay);
        this.knobs.get('amp-sustain')?.setValue(patch.envelopes.amplitude.sustain);
        this.knobs.get('amp-release')?.setValue(patch.envelopes.amplitude.release);
        
        this.knobs.get('filter-attack')?.setValue(patch.envelopes.filter.attack);
        this.knobs.get('filter-decay')?.setValue(patch.envelopes.filter.decay);
        this.knobs.get('filter-sustain')?.setValue(patch.envelopes.filter.sustain);
        this.knobs.get('filter-release')?.setValue(patch.envelopes.filter.release);
        
        // Update LFO
        this.knobs.get('lfo-rate')?.setValue(patch.lfo.rate);
        this.knobs.get('lfo-depth')?.setValue(patch.lfo.depth);
        
        // Update effects
        this.knobs.get('reverb-mix')?.setValue(patch.effects.reverb.mix);
        this.knobs.get('delay-time')?.setValue(patch.effects.delay.time);
        this.knobs.get('delay-feedback')?.setValue(patch.effects.delay.feedback);
        
        // Update master
        this.knobs.get('master-volume')?.setValue(patch.master.volume);
        this.knobs.get('analog-warmth')?.setValue(patch.master.warmth);
        
        // Update selects
        document.querySelector('[data-osc="1"]').value = patch.oscillators.osc1.waveform;
        document.querySelector('[data-osc="2"]').value = patch.oscillators.osc2.waveform;
        document.getElementById('filterType').value = patch.filter.type;
        document.getElementById('lfoTarget').value = patch.lfo.target;
    }

    saveCurrentPatch() {
        const patch = this.audioEngine.getCurrentPatch();
        const patchJSON = JSON.stringify(patch, null, 2);
        
        const blob = new Blob([patchJSON], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `timbuk_patch_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showStatus('Patch saved successfully', 'success');
    }

    loadPatchFromFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const patch = JSON.parse(event.target.result);
                    this.audioEngine.loadPatch(patch);
                    this.updateUIFromPatch(patch);
                    this.showStatus('Patch loaded successfully', 'success');
                } catch (error) {
                    this.showStatus('Failed to load patch: Invalid file format', 'error');
                }
            };
            reader.readAsText(file);
        });
        
        input.click();
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

    // Utility methods
    getParameterRange(param) {
        return this.paramRanges[param] || { min: 0, max: 1, default: 0 };
    }

    setParameterValue(param, value) {
        const knob = this.knobs.get(param);
        const slider = this.sliders.get(param);
        const toggle = this.toggles.get(param);
        
        if (knob) {
            knob.setValue(value);
        } else if (slider) {
            slider.value = value;
            this.handleParameterChange(param, value);
        } else if (toggle) {
            const isActive = Boolean(value);
            if (isActive) {
                toggle.classList.add('active');
            } else {
                toggle.classList.remove('active');
            }
            this.handleParameterChange(param, isActive);
        }
    }
}

// Simple Knob class implementation
class Knob {
    constructor(element, options = {}) {
        this.element = element;
        this.options = {
            min: 0,
            max: 1,
            value: 0.5,
            step: 0.01,
            exponential: false,
            onChange: () => {},
            ...options
        };
        
        this.value = this.options.value;
        this.isDragging = false;
        this.startAngle = 0;
        this.startY = 0;
        
        this.init();
    }

    init() {
        this.element.addEventListener('mousedown', this.onMouseDown.bind(this));
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));
        
        this.element.addEventListener('touchstart', this.onTouchStart.bind(this));
        document.addEventListener('touchmove', this.onTouchMove.bind(this));
        document.addEventListener('touchend', this.onTouchEnd.bind(this));
        
        this.updateRotation();
    }

    onMouseDown(e) {
        this.isDragging = true;
        this.startY = e.clientY;
        this.startValue = this.value;
        e.preventDefault();
    }

    onMouseMove(e) {
        if (!this.isDragging) return;
        
        const deltaY = this.startY - e.clientY;
        const range = this.options.max - this.options.min;
        const sensitivity = 200;
        
        let deltaValue = (deltaY / sensitivity) * range;
        
        if (this.options.exponential) {
            const logMin = Math.log(Math.max(this.options.min, 0.001));
            const logMax = Math.log(this.options.max);
            const logRange = logMax - logMin;
            deltaValue = Math.exp(logMin + (this.startValue * logRange)) * (deltaY / sensitivity);
        }
        
        this.value = Math.max(this.options.min, Math.min(this.options.max, this.startValue + deltaValue));
        this.value = Math.round(this.value / this.options.step) * this.options.step;
        
        this.updateRotation();
        this.options.onChange(this.value);
    }

    onMouseUp() {
        this.isDragging = false;
    }

    onTouchStart(e) {
        this.isDragging = true;
        this.startY = e.touches[0].clientY;
        this.startValue = this.value;
        e.preventDefault();
    }

    onTouchMove(e) {
        if (!this.isDragging) return;
        
        const deltaY = this.startY - e.touches[0].clientY;
        const range = this.options.max - this.options.min;
        const sensitivity = 200;
        
        let deltaValue = (deltaY / sensitivity) * range;
        
        if (this.options.exponential) {
            const logMin = Math.log(Math.max(this.options.min, 0.001));
            const logMax = Math.log(this.options.max);
            const logRange = logMax - logMin;
            deltaValue = Math.exp(logMin + (this.startValue * logRange)) * (deltaY / sensitivity);
        }
        
        this.value = Math.max(this.options.min, Math.min(this.options.max, this.startValue + deltaValue));
        this.value = Math.round(this.value / this.options.step) * this.options.step;
        
        this.updateRotation();
        this.options.onChange(this.value);
    }

    onTouchEnd() {
        this.isDragging = false;
    }

    updateRotation() {
        const normalized = (this.value - this.options.min) / (this.options.max - this.options.min);
        const rotation = -135 + (normalized * 270);
        this.element.style.transform = `rotate(${rotation}deg)`;
    }

    setValue(value) {
        this.value = Math.max(this.options.min, Math.min(this.options.max, value));
        this.value = Math.round(this.value / this.options.step) * this.options.step;
        this.updateRotation();
        this.options.onChange(this.value);
    }

    getValue() {
        return this.value;
    }

    on(event, callback) {
        if (event === 'change') {
            this.options.onChange = callback;
        }
    }
}

// Initialize UI controls when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.uiControls = new UIControls(window.timbukAudioEngine);
});