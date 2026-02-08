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
    const [offset, setOffset] = useState(0);
    const [testPlaying, setTestPlaying] = useState(false);
    const nextBeatIndexRef = useRef(0);

    // ... (existing code)

    // Play beep sound
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

    // Test Play (Playback with beats)
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

    // ... (existing handleTap) ...

    // Update submit to include offset hint
    const submitBeatmap = async () => {
        // ... (existing submit logic)
        const payload = {
            // ...
            comment: `${userComment.trim()} (Offset used: ${offset}ms)`,
            // ...
        };
        // ...
    };

    return (
        <div className="beat-creator-container">
            {/* ... (existing code) ... */}

            <div className="container">
                {/* ... header ... */}

                {/* Offset Adjustment Tool */}
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

                {/* ... (Step 1) ... */}

                {/* Step 2: Recording */}
                <div className="section">
                    {/* ... */}

                    <div className="controls">
                        {/* ... existing buttons ... */}
                        <button
                            className="btn"
                            style={{ background: testPlaying ? '#FF6B6B' : '#9C27B0', color: 'white' }}
                            onClick={toggleTestPlay}
                            disabled={beatmap.length === 0 || isPlaying}
                        >
                            {testPlaying ? '⏹️ 테스트 중지' : '🎧 비트 들어보기'}
                        </button>
                    </div>

                    {/* ... */}
                </div>

                {/* ... */}
            </div>
        </div>
    );
}

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
                </div >

    {/* Step 3: Submit */ }
    < div className = "section" >
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

{
    statusMessage.text && (
        <div className={`status-message ${statusMessage.type}`}>
            {statusMessage.text}
        </div>
    )
}
                </div >
            </div >
        </div >
    );
}
