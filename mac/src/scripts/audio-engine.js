// Timbuk Synthesizer - Audio Engine
// Powered by Tone.js for professional audio synthesis

class TimbukAudioEngine {
    constructor() {
        this.audioContext = null;
        this.masterOutput = null;
        this.analyser = null;
        
        // Synthesis components
        this.oscillators = {};
        this.filters = {};
        this.envelopes = {};
        this.lfo = null;
        this.effects = {};
        
        // Current state
        this.activeNotes = new Map();
        this.currentPatch = null;
        this.isInitialized = false;
        
        // Performance monitoring
        this.cpuMonitor = null;
        this.cpuUsage = 0;
        
        // Initialize audio context
        this.init();
    }

    async init() {
        try {
            // Initialize Tone.js audio context
            this.audioContext = new Tone.Context();
            await this.audioContext.resume();
            
            // Create master output chain
            this.setupMasterOutput();
            
            // Create synthesis components
            this.setupOscillators();
            this.setupFilters();
            this.setupEnvelopes();
            this.setupLFO();
            this.setupEffects();
            
            // Setup analysis
            this.setupAnalyser();
            
            // Setup CPU monitoring
            this.setupCPUMonitor();
            
            this.isInitialized = true;
            console.log('Timbuk Audio Engine initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize audio engine:', error);
            throw error;
        }
    }

    setupMasterOutput() {
        // Master limiter to prevent clipping
        this.limiter = new Tone.Limiter(-0.1).toDestination();
        
        // Master volume control
        this.masterVolume = new Tone.Volume(0).connect(this.limiter);
        
        // Analog warmth/saturation
        this.warmth = new Tone.Chebyshev(1).connect(this.masterVolume);
        this.warmth.order = 1;
        this.warmth.oversample = '4x';
        
        // Compressor for professional sound
        this.compressor = new Tone.Compressor(-12, 3).connect(this.warmth);
        
        // Master output
        this.masterOutput = this.compressor;
        
        // Analyser for visualization
        this.analyser = new Tone.Analyser('waveform', 512);
        this.fftAnalyser = new Tone.FFT(512);
        this.masterOutput.connect(this.analyser);
        this.masterOutput.connect(this.fftAnalyser);
    }

    setupOscillators() {
        // Oscillator 1
        this.oscillators.osc1 = {
            oscillator: new Tone.Oscillator(440, 'sine'),
            volume: new Tone.Volume(-6),
            detune: new Tone.Detune(),
            octave: 0,
            waveform: 'sine'
        };
        
        // Oscillator 2
        this.oscillators.osc2 = {
            oscillator: new Tone.Oscillator(440, 'sawtooth'),
            volume: new Tone.Volume(-Infinity),
            detune: new Tone.Detune(),
            octave: 0,
            waveform: 'sawtooth'
        };
        
        // Mix oscillators
        this.oscMixer = new Tone.Add();
        
        // Connect oscillator chain
        Object.values(this.oscillators).forEach(osc => {
            osc.volume.connect(this.oscMixer);
            osc.oscillator.connect(osc.volume);
            osc.detune.connect(osc.oscillator.detune);
        });
        
        this.oscMixer.connect(this.masterOutput);
    }

    setupFilters() {
        // Main filter
        this.filters.main = {
            filter: new Tone.Filter(1000, 'lowpass', -12),
            cutoff: 1000,
            resonance: 1,
            type: 'lowpass',
            envelopeAmount: 0
        };
        
        // Connect filter
        this.oscMixer.connect(this.filters.main.filter);
        this.filters.main.filter.connect(this.masterOutput);
    }

    setupEnvelopes() {
        // Amplitude envelope
        this.envelopes.amplitude = {
            envelope: new Tone.AmplitudeEnvelope({
                attack: 0.01,
                decay: 0.1,
                sustain: 0.3,
                release: 1
            }),
            attack: 0.01,
            decay: 0.1,
            sustain: 0.3,
            release: 1
        };
        
        // Filter envelope
        this.envelopes.filter = {
            envelope: new Tone.Envelope({
                attack: 0.1,
                decay: 0.2,
                sustain: 0.2,
                release: 0.8
            }),
            attack: 0.1,
            decay: 0.2,
            sustain: 0.2,
            release: 0.8
        };
        
        // Connect envelopes
        this.filters.main.filter.connect(this.envelopes.amplitude.envelope);
        this.envelopes.amplitude.envelope.connect(this.masterOutput);
        
        // Filter envelope to filter frequency
        this.envelopes.filter.envelope.connect(this.filters.main.filter.frequency);
    }

    setupLFO() {
        this.lfo = {
            lfo: new Tone.LFO(1, 'sine'),
            rate: 1,
            depth: 0,
            target: 'none',
            started: false
        };
        
        this.lfo.lfo.start();
    }

    setupEffects() {
        // Reverb
        this.effects.reverb = {
            effect: new Tone.Reverb(2),
            wet: new Tone.Gain(0),
            mix: 0
        };
        this.effects.reverb.effect.connect(this.effects.reverb.wet);
        this.effects.reverb.wet.toDestination();
        
        // Delay
        this.effects.delay = {
            effect: new Tone.Delay('8n'),
            feedback: new Tone.FeedbackDelay('4n', 0.3),
            wet: new Tone.Gain(0),
            time: '8n',
            feedbackAmount: 0.3,
            mix: 0
        };
        this.effects.delay.effect.connect(this.effects.delay.wet);
        this.effects.delay.wet.toDestination();
        
        // Connect effects routing
        this.masterOutput.connect(this.effects.reverb.effect);
        this.masterOutput.connect(this.effects.delay.effect);
    }

    setupAnalyser() {
        // Waveform analyser for oscilloscope
        this.waveformAnalyser = this.analyser;
        
        // FFT analyser for spectrum
        this.spectrumAnalyser = this.fftAnalyser;
    }

    setupCPUMonitor() {
        // Simple CPU usage estimation
        this.cpuMonitor = setInterval(() => {
            if (this.audioContext) {
                const currentTime = this.audioContext.currentTime;
                const renderQuantum = this.audioContext.baseLatency;
                const performance = currentTime / renderQuantum;
                this.cpuUsage = Math.min(performance * 10, 100); // Simplified CPU estimation
            }
        }, 100);
    }

    // Note handling
    noteOn(midiNote, velocity = 127) {
        if (!this.isInitialized) return;
        
        const frequency = Tone.Frequency(midiNote, 'midi').toFrequency();
        const noteId = `${midiNote}_${Date.now()}`;
        
        // Create note-specific components
        const noteComponents = {
            id: noteId,
            midiNote: midiNote,
            frequency: frequency,
            velocity: velocity / 127,
            osc1Gain: new Tone.Gain(),
            osc2Gain: new Tone.Gain(),
            noteVolume: new Tone.Volume()
        };
        
        // Set velocity
        noteComponents.noteVolume.volume.value = -20 + (noteComponents.velocity * 20);
        
        // Connect oscillators to note
        this.oscillators.osc1.oscillator.connect(noteComponents.osc1Gain);
        this.oscillators.osc2.oscillator.connect(noteComponents.osc2Gain);
        
        noteComponents.osc1Gain.connect(noteComponents.noteVolume);
        noteComponents.osc2Gain.connect(noteComponents.noteVolume);
        
        noteComponents.noteVolume.connect(this.filters.main.filter);
        
        // Trigger envelopes
        this.envelopes.amplitude.envelope.triggerAttack();
        this.envelopes.filter.envelope.triggerAttack();
        
        // Store active note
        this.activeNotes.set(midiNote, noteComponents);
        
        return noteId;
    }

    noteOff(midiNote) {
        if (!this.isInitialized) return;
        
        const noteComponents = this.activeNotes.get(midiNote);
        if (!noteComponents) return;
        
        // Trigger envelope release
        this.envelopes.amplitude.envelope.triggerRelease();
        this.envelopes.filter.envelope.triggerRelease();
        
        // Clean up after release time
        setTimeout(() => {
            this.disconnectNote(noteComponents);
            this.activeNotes.delete(midiNote);
        }, this.envelopes.amplitude.release * 1000);
    }

    disconnectNote(noteComponents) {
        // Disconnect note-specific components
        if (noteComponents.osc1Gain) {
            noteComponents.osc1Gain.disconnect();
            noteComponents.osc1Gain.dispose();
        }
        if (noteComponents.osc2Gain) {
            noteComponents.osc2Gain.disconnect();
            noteComponents.osc2Gain.dispose();
        }
        if (noteComponents.noteVolume) {
            noteComponents.noteVolume.disconnect();
            noteComponents.noteVolume.dispose();
        }
    }

    // Parameter control methods
    setOscillatorWaveform(oscNumber, waveform) {
        const osc = this.oscillators[`osc${oscNumber}`];
        if (osc) {
            osc.oscillator.type = waveform;
            osc.waveform = waveform;
        }
    }

    setOscillatorVolume(oscNumber, volume) {
        const osc = this.oscillators[`osc${oscNumber}`];
        if (osc) {
            osc.volume.volume.value = volume;
        }
    }

    setOscillatorDetune(oscNumber, detune) {
        const osc = this.oscillators[`osc${oscNumber}`];
        if (osc) {
            osc.detune.value = detune;
        }
    }

    setOscillatorOctave(oscNumber, octave) {
        const osc = this.oscillators[`osc${oscNumber}`];
        if (osc) {
            osc.octave = octave;
            osc.detune.value = octave * 1200; // 1200 cents per octave
        }
    }

    setFilterCutoff(cutoff) {
        this.filters.main.filter.frequency.value = cutoff;
        this.filters.main.cutoff = cutoff;
    }

    setFilterResonance(resonance) {
        this.filters.main.filter.Q.value = resonance;
        this.filters.main.resonance = resonance;
    }

    setFilterType(type) {
        this.filters.main.filter.type = type;
        this.filters.main.type = type;
    }

    setFilterEnvelopeAmount(amount) {
        this.filters.main.envelopeAmount = amount;
        // Scale the envelope amount
        this.envelopes.filter.envelope.max = 10000 * amount;
    }

    setAmplitudeEnvelope(attack, decay, sustain, release) {
        this.envelopes.amplitude.envelope.set({
            attack: attack,
            decay: decay,
            sustain: sustain,
            release: release
        });
        
        this.envelopes.amplitude.attack = attack;
        this.envelopes.amplitude.decay = decay;
        this.envelopes.amplitude.sustain = sustain;
        this.envelopes.amplitude.release = release;
    }

    setFilterEnvelope(attack, decay, sustain, release) {
        this.envelopes.filter.envelope.set({
            attack: attack,
            decay: decay,
            sustain: sustain,
            release: release
        });
        
        this.envelopes.filter.attack = attack;
        this.envelopes.filter.decay = decay;
        this.envelopes.filter.sustain = sustain;
        this.envelopes.filter.release = release;
    }

    setLFORate(rate) {
        this.lfo.lfo.frequency.value = rate;
        this.lfo.rate = rate;
    }

    setLFODepth(depth) {
        this.lfo.depth = depth;
        this.updateLFORouting();
    }

    setLFOTarget(target) {
        this.lfo.target = target;
        this.updateLFORouting();
    }

    updateLFORouting() {
        // Disconnect existing LFO routing
        this.lfo.lfo.disconnect();
        
        if (this.lfo.target === 'none' || this.lfo.depth === 0) return;
        
        const scaledDepth = this.lfo.depth * 100;
        
        switch (this.lfo.target) {
            case 'pitch':
                this.lfo.lfo.connect(this.oscillators.osc1.detune);
                this.lfo.lfo.connect(this.oscillators.osc2.detune);
                break;
            case 'filter':
                const lfoGain = new Tone.Gain(scaledDepth);
                this.lfo.lfo.connect(lfoGain);
                lfoGain.connect(this.filters.main.filter.frequency);
                break;
            case 'amplitude':
                const lfoAmpGain = new Tone.Gain(this.lfo.depth);
                this.lfo.lfo.connect(lfoAmpGain);
                lfoAmpGain.connect(this.masterVolume);
                break;
        }
    }

    setReverbMix(mix) {
        this.effects.reverb.wet.gain.value = mix;
        this.effects.reverb.mix = mix;
    }

    setDelayTime(time) {
        this.effects.delay.effect.delayTime.value = time;
        this.effects.delay.time = time;
    }

    setDelayFeedback(feedback) {
        this.effects.delay.feedback.feedback.value = feedback;
        this.effects.delay.feedbackAmount = feedback;
    }

    setDelayMix(mix) {
        this.effects.delay.wet.gain.value = mix;
        this.effects.delay.mix = mix;
    }

    setMasterVolume(volume) {
        this.masterVolume.volume.value = volume;
    }

    setAnalogWarmth(warmth) {
        const amount = warmth * 50; // Scale warmth amount
        this.warmth.order = Math.max(1, Math.min(5, Math.floor(warmth * 5)));
        this.warmth.oversample = warmth > 0.5 ? '4x' : '2x';
    }

    // Panic button - stop all sounds
    panic() {
        this.activeNotes.forEach((note, midiNote) => {
            this.noteOff(midiNote);
        });
        this.activeNotes.clear();
    }

    // Get audio data for visualization
    getWaveformData() {
        if (!this.waveformAnalyser) return new Float32Array(512);
        return this.waveformAnalyser.getValue();
    }

    getSpectrumData() {
        if (!this.spectrumAnalyser) return new Float32Array(256);
        return this.spectrumAnalyser.getValue();
    }

    getCPUUsage() {
        return this.cpuUsage;
    }

    // Save/load patch functionality
    getCurrentPatch() {
        return {
            oscillators: {
                osc1: {
                    waveform: this.oscillators.osc1.waveform,
                    volume: this.oscillators.osc1.volume.volume.value,
                    detune: this.oscillators.osc1.detune.value,
                    octave: this.oscillators.osc1.octave
                },
                osc2: {
                    waveform: this.oscillators.osc2.waveform,
                    volume: this.oscillators.osc2.volume.volume.value,
                    detune: this.oscillators.osc2.detune.value,
                    octave: this.oscillators.osc2.octave
                }
            },
            filter: {
                type: this.filters.main.type,
                cutoff: this.filters.main.cutoff,
                resonance: this.filters.main.resonance,
                envelopeAmount: this.filters.main.envelopeAmount
            },
            envelopes: {
                amplitude: {
                    attack: this.envelopes.amplitude.attack,
                    decay: this.envelopes.amplitude.decay,
                    sustain: this.envelopes.amplitude.sustain,
                    release: this.envelopes.amplitude.release
                },
                filter: {
                    attack: this.envelopes.filter.attack,
                    decay: this.envelopes.filter.decay,
                    sustain: this.envelopes.filter.sustain,
                    release: this.envelopes.filter.release
                }
            },
            lfo: {
                rate: this.lfo.rate,
                depth: this.lfo.depth,
                target: this.lfo.target
            },
            effects: {
                reverb: {
                    mix: this.effects.reverb.mix
                },
                delay: {
                    time: this.effects.delay.time,
                    feedback: this.effects.delay.feedbackAmount,
                    mix: this.effects.delay.mix
                }
            },
            master: {
                volume: this.masterVolume.volume.value,
                warmth: this.warmth.order / 5
            }
        };
    }

    loadPatch(patch) {
        if (!patch) return;
        
        // Load oscillators
        if (patch.oscillators) {
            Object.keys(patch.oscillators).forEach(oscKey => {
                const osc = patch.oscillators[oscKey];
                const oscNumber = oscKey.replace('osc', '');
                
                this.setOscillatorWaveform(oscNumber, osc.waveform);
                this.setOscillatorVolume(oscNumber, osc.volume);
                this.setOscillatorDetune(oscNumber, osc.detune);
                this.setOscillatorOctave(oscNumber, osc.octave);
            });
        }
        
        // Load filter
        if (patch.filter) {
            this.setFilterType(patch.filter.type);
            this.setFilterCutoff(patch.filter.cutoff);
            this.setFilterResonance(patch.filter.resonance);
            this.setFilterEnvelopeAmount(patch.filter.envelopeAmount);
        }
        
        // Load envelopes
        if (patch.envelopes) {
            if (patch.envelopes.amplitude) {
                const env = patch.envelopes.amplitude;
                this.setAmplitudeEnvelope(env.attack, env.decay, env.sustain, env.release);
            }
            if (patch.envelopes.filter) {
                const env = patch.envelopes.filter;
                this.setFilterEnvelope(env.attack, env.decay, env.sustain, env.release);
            }
        }
        
        // Load LFO
        if (patch.lfo) {
            this.setLFORate(patch.lfo.rate);
            this.setLFODepth(patch.lfo.depth);
            this.setLFOTarget(patch.lfo.target);
        }
        
        // Load effects
        if (patch.effects) {
            if (patch.effects.reverb) {
                this.setReverbMix(patch.effects.reverb.mix);
            }
            if (patch.effects.delay) {
                this.setDelayTime(patch.effects.delay.time);
                this.setDelayFeedback(patch.effects.delay.feedback);
                this.setDelayMix(patch.effects.delay.mix);
            }
        }
        
        // Load master
        if (patch.master) {
            this.setMasterVolume(patch.master.volume);
            this.setAnalogWarmth(patch.master.warmth);
        }
        
        this.currentPatch = patch;
    }

    // Cleanup
    dispose() {
        if (this.cpuMonitor) {
            clearInterval(this.cpuMonitor);
        }
        
        // Dispose all Tone.js components
        Object.values(this.oscillators).forEach(osc => {
            osc.oscillator.dispose();
            osc.volume.dispose();
            osc.detune.dispose();
        });
        
        Object.values(this.filters).forEach(filter => {
            filter.filter.dispose();
        });
        
        Object.values(this.envelopes).forEach(env => {
            env.envelope.dispose();
        });
        
        if (this.lfo) {
            this.lfo.lfo.dispose();
        }
        
        Object.values(this.effects).forEach(effect => {
            effect.effect.dispose();
            effect.wet.dispose();
        });
        
        if (this.masterOutput) {
            this.masterOutput.dispose();
        }
        
        if (this.audioContext) {
            this.audioContext.dispose();
        }
    }
}

// Initialize the audio engine
window.timbukAudioEngine = new TimbukAudioEngine();