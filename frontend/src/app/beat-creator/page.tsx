'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import '../../styles/beat-creator.css';
import { beatCreatorConfig } from '@/config/beat-creator-config';

interface Track {
    id: string;
    name: string;
    difficulty: number;
    src: string;
}

interface BeatCreatorConfig {
    INFO: {
        browserTitle: string;
        title: string;
        subtitle: string;
        tipText: string;
    };
    TRACKS: Track[];
    BUTTONS: {
        backToGame: string;
        playRecord: string;
        stop: string;
        reset: string;
        copyBeatmap: string;
    };
    STEPS: {
        step1: string;
        step2: string;
        step3: string;
    };
    SUBMIT: {
        apiUrl: string;
        nameLabel: string;
        namePlaceholder: string;
        commentLabel: string;
        commentPlaceholder: string;
        submitButton: string;
    };
    MESSAGES: {
        selectMusic: string;
        readyToRecord: string;
        recording: string;
        recordingDone: string;
        copied: string;
        copyFailed: string;
        noBeatmap: string;
        submitting: string;
        submitSuccess: string;
        submitFailed: string;
        noApiUrl: string;
    };
    STATS: {
        beatCount: string;
        lastBeat: string;
    };
}

export default function BeatCreatorPage() {
    const router = useRouter();
    const [config, setConfig] = useState<typeof beatCreatorConfig | null>(beatCreatorConfig);
    const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [beatmap, setBeatmap] = useState<number[]>([]);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [tapMessage, setTapMessage] = useState('');
    const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });
    const [userName, setUserName] = useState('');
    const [userComment, setUserComment] = useState('');
    const [offset, setOffset] = useState(0);
    const [testPlaying, setTestPlaying] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const startTimeRef = useRef(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const isPlayingRef = useRef(false);
    const nextBeatIndexRef = useRef(0);

    // Set initial title and messages from config
    useEffect(() => {
        if (config) {
            setTapMessage(config.MESSAGES.selectMusic);
            document.title = config.INFO.browserTitle;
        }
    }, [config]);

    // Select track
    const selectTrack = (track: Track) => {
        if (!config) return;

        setSelectedTrack(track);
        setBeatmap([]);
        setElapsedTime(0);

        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        audioRef.current = new Audio(track.src);
        audioRef.current.addEventListener('ended', stopRecording);
        audioRef.current.addEventListener('loadedmetadata', () => {
            setTapMessage(config.MESSAGES.readyToRecord);
        });
    };

    // Start recording
    const startRecording = () => {
        if (!audioRef.current || !config) return;

        audioRef.current.currentTime = 0;
        audioRef.current.play();
        startTimeRef.current = Date.now();
        setIsPlaying(true);
        isPlayingRef.current = true;
        setTapMessage(config.MESSAGES.recording);

        timerRef.current = setInterval(() => {
            setElapsedTime(Date.now() - startTimeRef.current);
        }, 10);
    };

    // Stop recording
    const stopRecording = () => {
        if (!config) return;

        if (audioRef.current) {
            audioRef.current.pause();
        }

        setIsPlaying(false);
        isPlayingRef.current = false;
        setTapMessage(`${config.MESSAGES.recordingDone} (${beatmap.length}개 비트)`);

        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
    };

    // Play beep sound (NEW)
    const playBeep = () => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.value = 1200;
            gain.gain.value = 0.1;

            osc.start();
            osc.stop(ctx.currentTime + 0.05);
        } catch (e) {
            console.error(e);
        }
    };

    // Test Play (Playback with beats) (NEW)
    const toggleTestPlay = () => {
        if (!audioRef.current || !config) return;

        if (testPlaying) {
            // Stop
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setTestPlaying(false);
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        // Start
        audioRef.current.currentTime = 0;
        audioRef.current.play();
        startTimeRef.current = Date.now();
        setTestPlaying(true);
        nextBeatIndexRef.current = 0;

        timerRef.current = setInterval(() => {
            const currentElapsed = Date.now() - startTimeRef.current;
            setElapsedTime(currentElapsed);

            // Check for beats to play
            while (nextBeatIndexRef.current < beatmap.length) {
                const beatTime = beatmap[nextBeatIndexRef.current];
                // Apply manual offset here for testing
                // If offset is positive, we play the beat LATER (so it matches a delayed audio?)
                // Actually usually: Visual Time = Audio Time + Offset.
                // Here we want to hear the beat at RecordedTime + UserOffset
                if (currentElapsed >= beatTime + offset) {
                    playBeep();
                    nextBeatIndexRef.current++;
                } else {
                    break;
                }
            }
        }, 10);

        audioRef.current.onended = () => {
            setTestPlaying(false);
            if (timerRef.current) clearInterval(timerRef.current);
        };
    };

    // Reset
    const resetBeatmap = () => {
        if (!config) return;

        setBeatmap([]);
        setElapsedTime(0);

        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }

        setIsPlaying(false);
        isPlayingRef.current = false;

        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        if (selectedTrack) {
            setTapMessage(config.MESSAGES.readyToRecord);
        } else {
            setTapMessage(config.MESSAGES.selectMusic);
        }

        setStatusMessage({ text: '', type: '' });
    };

    // Handle tap
    const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        if (!isPlayingRef.current) return;

        const time = Date.now() - startTimeRef.current;
        setBeatmap(prev => [...prev, time]);

        // Haptic feedback
        if (navigator.vibrate) navigator.vibrate(30);
    };

    // Format time display
    const formatTime = (ms: number) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const centis = Math.floor((ms % 1000) / 10);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
    };

    // Submit beatmap
    const submitBeatmap = async () => {
        if (!config || !selectedTrack) return;

        if (beatmap.length === 0) {
            setStatusMessage({ text: config.MESSAGES.noBeatmap, type: 'error' });
            return;
        }

        if (!config.SUBMIT.apiUrl) {
            setStatusMessage({ text: config.MESSAGES.noApiUrl, type: 'error' });
            return;
        }

        setStatusMessage({ text: config.MESSAGES.submitting, type: 'loading' });

        const payload = {
            action: 'beatmap',
            name: userName.trim() || '익명',
            track: selectedTrack.name,
            beatCount: beatmap.length,
            comment: `${userComment.trim()} (Offset used: ${offset}ms)`,
            beatmap: JSON.stringify(beatmap),
            timestamp: new Date().toISOString()
        };

        try {
            await fetch(config.SUBMIT.apiUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            setStatusMessage({ text: config.MESSAGES.submitSuccess, type: 'success' });
            setUserName('');
            setUserComment('');
        } catch (err) {
            console.error('Submit error:', err);
            setStatusMessage({ text: config.MESSAGES.submitFailed, type: 'error' });
        }
    };

    if (!config) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="beat-creator-container">
            {/* Floating Back Button */}
            <button className="floating-back-btn" onClick={() => router.push('/')}>
                {config.BUTTONS.backToGame}
            </button>

            <div className="container">
                <div className="header">
                    <h1 className="page-title">{config.INFO.title}</h1>
                    <p className="page-subtitle">{config.INFO.subtitle}</p>
                </div>

                <div className="info-box">
                    <strong>💡 Tip:</strong> <span style={{ whiteSpace: 'pre-line' }}>{config.INFO.tipText}</span>
                </div>

                {/* Offset Adjustment Tool (NEW) */}
                <div className="section" style={{ border: '1px solid #FFD700' }}>
                    <div className="section-title">
                        <span>🔧 싱크 조절 (Offset Testing)</span>
                    </div>
                    <div style={{ marginBottom: '10px', fontSize: '14px', opacity: 0.8 }}>
                        비트가 음악보다 늦게 들리면 (-) 값, 빨리 들리면 (+) 값으로 조절해보세요.
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                            type="range"
                            min="-500"
                            max="500"
                            step="10"
                            value={offset}
                            onChange={(e) => setOffset(Number(e.target.value))}
                            style={{ flex: 1 }}
                        />
                        <span style={{ fontWeight: 'bold', width: '60px', textAlign: 'right' }}>{offset}ms</span>
                    </div>
                </div>

                {/* Step 1: Music Selection */}
                <div className="section">
                    <div className="section-title">
                        <span className="step-number">1</span>
                        <span>{config.STEPS.step1}</span>
                    </div>
                    <div className="music-grid">
                        {config.TRACKS.map(track => (
                            <div
                                key={track.id}
                                className={`music-card ${selectedTrack?.id === track.id ? 'selected' : ''}`}
                                onClick={() => selectTrack(track)}
                            >
                                <div className="check">✓</div>
                                <div className="icon">🎵</div>
                                <div className="name">{track.name}</div>
                                <div className="stars">{'⭐'.repeat(track.difficulty)}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step 2: Recording */}
                <div className="section">
                    <div className="section-title">
                        <span className="step-number">2</span>
                        <span>{config.STEPS.step2}</span>
                    </div>

                    <div className="time-display">{formatTime(elapsedTime)}</div>

                    <div
                        className={`tap-area ${!selectedTrack ? 'disabled' : ''}`}
                        onClick={handleTap}
                        onTouchStart={handleTap}
                    >
                        <div className="tap-icon">🎵</div>
                        <span>{tapMessage}</span>
                    </div>

                    <div className="controls">
                        <button
                            className="btn btn-play"
                            onClick={startRecording}
                            disabled={!selectedTrack || isPlaying}
                        >
                            {config.BUTTONS.playRecord}
                        </button>
                        <button
                            className="btn btn-stop"
                            onClick={stopRecording}
                            disabled={!isPlaying}
                        >
                            {config.BUTTONS.stop}
                        </button>
                        <button
                            className="btn"
                            style={{ background: testPlaying ? '#FF6B6B' : '#9C27B0', color: 'white' }}
                            onClick={toggleTestPlay}
                            disabled={beatmap.length === 0 || isPlaying}
                        >
                            {testPlaying ? '⏹️ 테스트 중지' : '🎧 비트 들어보기'}
                        </button>
                        <button className="btn btn-reset" onClick={resetBeatmap}>
                            {config.BUTTONS.reset}
                        </button>
                    </div>

                    <div className="stats">
                        <div className="stat-item">
                            <div className="stat-value">{beatmap.length}</div>
                            <div className="stat-label">{config.STATS.beatCount}</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value">{beatmap.length > 0 ? beatmap[beatmap.length - 1] : '-'}</div>
                            <div className="stat-label">{config.STATS.lastBeat}</div>
                        </div>
                    </div>

                    <div className="beat-preview">
                        {beatmap.map((_, i) => (
                            <div key={i} className="beat-dot">{i + 1}</div>
                        ))}
                    </div>
                </div>

                {/* Step 3: Submit */}
                <div className="section">
                    <div className="section-title">
                        <span className="step-number">3</span>
                        <span>{config.STEPS.step3}</span>
                    </div>

                    <div className="input-group">
                        <label>{config.SUBMIT.nameLabel}</label>
                        <input
                            type="text"
                            value={userName}
                            onChange={e => setUserName(e.target.value)}
                            placeholder={config.SUBMIT.namePlaceholder}
                            maxLength={20}
                        />
                    </div>

                    <div className="input-group">
                        <label>{config.SUBMIT.commentLabel}</label>
                        <textarea
                            value={userComment}
                            onChange={e => setUserComment(e.target.value)}
                            placeholder={config.SUBMIT.commentPlaceholder}
                        />
                    </div>

                    <div className={`beatmap-output ${beatmap.length === 0 ? 'empty' : ''}`}>
                        {beatmap.length === 0
                            ? '비트맵이 여기에 표시됩니다...'
                            : `beatmap: [${beatmap.join(', ')}]`}
                    </div>

                    <button
                        className="copy-btn"
                        onClick={submitBeatmap}
                        disabled={beatmap.length === 0 || !selectedTrack}
                    >
                        {config.SUBMIT.submitButton}
                    </button>

                    {statusMessage.text && (
                        <div className={`status-message ${statusMessage.type}`}>
                            {statusMessage.text}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
