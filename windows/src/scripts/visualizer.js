// Timbuk Synthesizer - Audio Visualizer
// Real-time waveform and spectrum visualization

class AudioVisualizer {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.oscilloscopeCanvas = null;
        this.spectrumCanvas = null;
        this.oscilloscopeCtx = null;
        this.spectrumCtx = null;
        
        // Visualization settings
        this.isRunning = false;
        this.animationId = null;
        this.oscilloscopeColor = '#ff6b35';
        this.spectrumColor = '#ff8c42';
        this.gridColor = 'rgba(168, 163, 184, 0.2)';
        this.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        
        // Visualization modes
        this.oscilloscopeMode = 'line'; // 'line', 'dots', 'filled'
        this.spectrumMode = 'bars'; // 'bars', 'line', 'heatmap'
        
        // Performance monitoring
        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        
        this.init();
    }

    init() {
        this.setupCanvases();
        this.setupEventListeners();
        this.start();
    }

    setupCanvases() {
        this.oscilloscopeCanvas = document.getElementById('oscilloscope');
        this.spectrumCanvas = document.getElementById('spectrum');
        
        if (!this.oscilloscopeCanvas || !this.spectrumCanvas) {
            console.warn('Visualizer canvases not found');
            return;
        }
        
        this.oscilloscopeCtx = this.oscilloscopeCanvas.getContext('2d');
        this.spectrumCtx = this.spectrumCanvas.getContext('2d');
        
        // Set canvas dimensions
        this.resizeCanvases();
        
        // Handle high DPI displays
        this.setupHighDPI();
    }

    setupHighDPI() {
        const dpr = window.devicePixelRatio || 1;
        
        // Oscilloscope canvas
        const oscRect = this.oscilloscopeCanvas.getBoundingClientRect();
        this.oscilloscopeCanvas.width = oscRect.width * dpr;
        this.oscilloscopeCanvas.height = oscRect.height * dpr;
        this.oscilloscopeCtx.scale(dpr, dpr);
        
        // Spectrum canvas
        const specRect = this.spectrumCanvas.getBoundingClientRect();
        this.spectrumCanvas.width = specRect.width * dpr;
        this.spectrumCanvas.height = specRect.height * dpr;
        this.spectrumCtx.scale(dpr, dpr);
    }

    resizeCanvases() {
        // Set display size
        const displayWidth = 400;
        const displayHeight = 200;
        
        this.oscilloscopeCanvas.style.width = displayWidth + 'px';
        this.oscilloscopeCanvas.style.height = displayHeight + 'px';
        this.spectrumCanvas.style.width = displayWidth + 'px';
        this.spectrumCanvas.style.height = displayHeight + 'px';
    }

    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => {
            this.setupHighDPI();
        });
        
        // Keyboard events for visualization control
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            switch(e.key.toLowerCase()) {
                case 'v':
                    this.toggleVisualization();
                    break;
                case '1':
                    this.setOscilloscopeMode('line');
                    break;
                case '2':
                    this.setOscilloscopeMode('dots');
                    break;
                case '3':
                    this.setOscilloscopeMode('filled');
                    break;
                case '4':
                    this.setSpectrumMode('bars');
                    break;
                case '5':
                    this.setSpectrumMode('line');
                    break;
                case '6':
                    this.setSpectrumMode('heatmap');
                    break;
            }
        });
        
        // Note events for reactive visualization
        document.addEventListener('keyboard:noteOn', (e) => {
            this.onNoteOn(e.detail);
        });
        
        document.addEventListener('keyboard:noteOff', (e) => {
            this.onNoteOff(e.detail);
        });
    }

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.animate();
    }

    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    toggleVisualization() {
        if (this.isRunning) {
            this.stop();
        } else {
            this.start();
        }
    }

    animate() {
        if (!this.isRunning) return;
        
        this.animationId = requestAnimationFrame(() => this.animate());
        
        // Update FPS counter
        this.updateFPS();
        
        // Get audio data
        const waveformData = this.audioEngine.getWaveformData();
        const spectrumData = this.audioEngine.getSpectrumData();
        
        // Draw visualizations
        this.drawOscilloscope(waveformData);
        this.drawSpectrum(spectrumData);
    }

    updateFPS() {
        this.frameCount++;
        const now = performance.now();
        
        if (now - this.lastFpsUpdate >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdate = now;
            
            // Update CPU display
            this.updateCPUStatus();
        }
    }

    updateCPUStatus() {
        const cpuElement = document.getElementById('cpu-status');
        if (cpuElement) {
            const cpuUsage = this.audioEngine.getCPUUsage();
            cpuElement.textContent = `CPU: ${cpuUsage.toFixed(1)}%`;
            
            // Color code CPU usage
            if (cpuUsage < 50) {
                cpuElement.className = 'text-success';
            } else if (cpuUsage < 75) {
                cpuElement.className = 'text-warning';
            } else {
                cpuElement.className = 'text-danger';
            }
        }
    }

    drawOscilloscope(waveformData) {
        if (!this.oscilloscopeCtx || !waveformData.length) return;
        
        const width = this.oscilloscopeCanvas.width / (window.devicePixelRatio || 1);
        const height = this.oscilloscopeCanvas.height / (window.devicePixelRatio || 1);
        const ctx = this.oscilloscopeCtx;
        
        // Clear canvas
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, width, height);
        
        // Draw grid
        this.drawGrid(ctx, width, height);
        
        // Draw waveform
        ctx.strokeStyle = this.oscilloscopeColor;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.oscilloscopeColor;
        
        switch(this.oscilloscopeMode) {
            case 'line':
                this.drawWaveformLine(ctx, waveformData, width, height);
                break;
            case 'dots':
                this.drawWaveformDots(ctx, waveformData, width, height);
                break;
            case 'filled':
                this.drawWaveformFilled(ctx, waveformData, width, height);
                break;
        }
        
        ctx.shadowBlur = 0;
    }

    drawWaveformLine(ctx, data, width, height) {
        ctx.beginPath();
        
        const sliceWidth = width / data.length;
        let x = 0;
        
        for (let i = 0; i < data.length; i++) {
            const v = data[i];
            const y = (v + 1) * height / 2;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            
            x += sliceWidth;
        }
        
        ctx.stroke();
    }

    drawWaveformDots(ctx, data, width, height) {
        const sliceWidth = width / data.length;
        let x = 0;
        
        ctx.fillStyle = this.oscilloscopeColor;
        
        for (let i = 0; i < data.length; i++) {
            const v = data[i];
            const y = (v + 1) * height / 2;
            
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
            
            x += sliceWidth;
        }
    }

    drawWaveformFilled(ctx, data, width, height) {
        ctx.beginPath();
        
        const sliceWidth = width / data.length;
        let x = 0;
        
        ctx.moveTo(0, height / 2);
        
        for (let i = 0; i < data.length; i++) {
            const v = data[i];
            const y = (v + 1) * height / 2;
            ctx.lineTo(x, y);
            x += sliceWidth;
        }
        
        ctx.lineTo(width, height / 2);
        ctx.closePath();
        
        // Create gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, this.oscilloscopeColor + '40');
        gradient.addColorStop(0.5, this.oscilloscopeColor + '80');
        gradient.addColorStop(1, this.oscilloscopeColor + '40');
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Draw line on top
        ctx.strokeStyle = this.oscilloscopeColor;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    drawSpectrum(spectrumData) {
        if (!this.spectrumCtx || !spectrumData.length) return;
        
        const width = this.spectrumCanvas.width / (window.devicePixelRatio || 1);
        const height = this.spectrumCanvas.height / (window.devicePixelRatio || 1);
        const ctx = this.spectrumCtx;
        
        // Clear canvas
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, width, height);
        
        // Draw grid
        this.drawGrid(ctx, width, height);
        
        // Convert FFT data to magnitude
        const magnitudeData = this.calculateMagnitude(spectrumData);
        
        // Draw spectrum
        switch(this.spectrumMode) {
            case 'bars':
                this.drawSpectrumBars(ctx, magnitudeData, width, height);
                break;
            case 'line':
                this.drawSpectrumLine(ctx, magnitudeData, width, height);
                break;
            case 'heatmap':
                this.drawSpectrumHeatmap(ctx, magnitudeData, width, height);
                break;
        }
    }

    calculateMagnitude(fftData) {
        const magnitudeData = [];
        const halfLength = fftData.length / 2;
        
        for (let i = 0; i < halfLength; i++) {
            const real = fftData[i * 2];
            const imag = fftData[i * 2 + 1];
            const magnitude = Math.sqrt(real * real + imag * imag);
            magnitudeData.push(magnitude);
        }
        
        return magnitudeData;
    }

    drawSpectrumBars(ctx, data, width, height) {
        const barWidth = width / data.length;
        const maxMagnitude = Math.max(...data);
        
        ctx.fillStyle = this.spectrumColor;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.spectrumColor;
        
        for (let i = 0; i < data.length; i++) {
            const barHeight = (data[i] / maxMagnitude) * height * 0.8;
            const x = i * barWidth;
            const y = height - barHeight;
            
            // Create gradient for each bar
            const gradient = ctx.createLinearGradient(0, y, 0, height);
            gradient.addColorStop(0, this.spectrumColor);
            gradient.addColorStop(1, this.spectrumColor + '60');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, barWidth - 1, barHeight);
        }
        
        ctx.shadowBlur = 0;
    }

    drawSpectrumLine(ctx, data, width, height) {
        const sliceWidth = width / data.length;
        const maxMagnitude = Math.max(...data);
        
        ctx.strokeStyle = this.spectrumColor;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.spectrumColor;
        
        ctx.beginPath();
        
        for (let i = 0; i < data.length; i++) {
            const x = i * sliceWidth;
            const y = height - (data[i] / maxMagnitude) * height * 0.8;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    drawSpectrumHeatmap(ctx, data, width, height) {
        // This would create a more complex heatmap visualization
        // For now, we'll use a simplified version
        const sliceWidth = width / data.length;
        const maxMagnitude = Math.max(...data);
        
        for (let i = 0; i < data.length; i++) {
            const x = i * sliceWidth;
            const intensity = data[i] / maxMagnitude;
            
            // Create color based on intensity
            const hue = (1 - intensity) * 240; // Blue to red
            const color = `hsl(${hue}, 100%, 50%)`;
            
            ctx.fillStyle = color;
            ctx.fillRect(x, 0, sliceWidth - 1, height);
        }
    }

    drawGrid(ctx, width, height) {
        ctx.strokeStyle = this.gridColor;
        ctx.lineWidth = 1;
        
        // Horizontal lines
        for (let i = 0; i <= 4; i++) {
            const y = (height / 4) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // Vertical lines
        for (let i = 0; i <= 8; i++) {
            const x = (width / 8) * i;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        // Center lines
        ctx.strokeStyle = this.gridColor + '40';
        ctx.lineWidth = 2;
        
        // Horizontal center line
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        
        // Vertical center line
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.stroke();
    }

    onNoteOn(noteData) {
        // Visual feedback when note is pressed
        this.flashVisualization();
    }

    onNoteOff(noteData) {
        // Visual feedback when note is released
    }

    flashVisualization() {
        // Temporary color change on note events
        const originalOscColor = this.oscilloscopeColor;
        const originalSpecColor = this.spectrumColor;
        
        this.oscilloscopeColor = '#ff9800';
        this.spectrumColor = '#ffc107';
        
        setTimeout(() => {
            this.oscilloscopeColor = originalOscColor;
            this.spectrumColor = originalSpecColor;
        }, 100);
    }

    // Visualization mode setters
    setOscilloscopeMode(mode) {
        if (['line', 'dots', 'filled'].includes(mode)) {
            this.oscilloscopeMode = mode;
            this.showStatus(`Oscilloscope mode: ${mode}`, 'info');
        }
    }

    setSpectrumMode(mode) {
        if (['bars', 'line', 'heatmap'].includes(mode)) {
            this.spectrumMode = mode;
            this.showStatus(`Spectrum mode: ${mode}`, 'info');
        }
    }

    setColorScheme(scheme) {
        switch(scheme) {
            case 'classic':
                this.oscilloscopeColor = '#00ff00';
                this.spectrumColor = '#00ff00';
                break;
            case 'fire':
                this.oscilloscopeColor = '#ff6b35';
                this.spectrumColor = '#ff8c42';
                break;
            case 'ocean':
                this.oscilloscopeColor = '#00bfff';
                this.spectrumColor = '#1e90ff';
                break;
            case 'purple':
                this.oscilloscopeColor = '#9b59b6';
                this.spectrumColor = '#8e44ad';
                break;
        }
    }

    showStatus(message, type = 'info') {
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `text-${type}`;
            
            setTimeout(() => {
                statusElement.textContent = 'Ready';
                statusElement.className = '';
            }, 2000);
        }
    }

    // Utility methods
    getFPS() {
        return this.fps;
    }

    getVisualizationMode() {
        return {
            oscilloscope: this.oscilloscopeMode,
            spectrum: this.spectrumMode
        };
    }

    takeScreenshot() {
        // Create a combined screenshot of both visualizers
        const combinedCanvas = document.createElement('canvas');
        const combinedCtx = combinedCanvas.getContext('2d');
        
        const oscWidth = this.oscilloscopeCanvas.width;
        const oscHeight = this.oscilloscopeCanvas.height;
        const specWidth = this.spectrumCanvas.width;
        const specHeight = this.spectrumCanvas.height;
        
        combinedCanvas.width = oscWidth + specWidth;
        combinedCanvas.height = Math.max(oscHeight, specHeight);
        
        combinedCtx.drawImage(this.oscilloscopeCanvas, 0, 0);
        combinedCtx.drawImage(this.spectrumCanvas, oscWidth, 0);
        
        // Download the screenshot
        const link = document.createElement('a');
        link.download = `timbuk_visualizer_${Date.now()}.png`;
        link.href = combinedCanvas.toDataURL();
        link.click();
    }

    // Cleanup
    dispose() {
        this.stop();
        
        if (this.oscilloscopeCtx) {
            this.oscilloscopeCtx.clearRect(0, 0, this.oscilloscopeCanvas.width, this.oscilloscopeCanvas.height);
        }
        
        if (this.spectrumCtx) {
            this.spectrumCtx.clearRect(0, 0, this.spectrumCanvas.width, this.spectrumCanvas.height);
        }
    }
}

// Initialize visualizer when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.audioVisualizer = new AudioVisualizer(window.timbukAudioEngine);
});