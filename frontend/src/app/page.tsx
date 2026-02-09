'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import '@/styles/game.css';

import Link from 'next/link';

import { gameConfig } from '@/config/game-config';
import { TRACKS, Track } from '@/data/tracks';

// Types
// Track interface and GameConfig interface can be imported or kept if they match structure
// For simplicity, we'll rely on the imported types/objects structure

type BeatNote = {
  index: number;
  targetTime: number;
  hit: boolean;
  startX: number;
  startY: number;
  emoji: string;
  judgment?: Judgment;
  hitTime?: number;
}

type GameScreen = 'title' | 'tutorial' | 'info' | 'countdown' | 'playing' | 'result';
type Judgment = 'perfect' | 'great' | 'good' | 'miss';
type Difficulty = 'easy' | 'normal' | 'hard';

export default function GamePage() {
  // Game State
  const [screen, setScreen] = useState<GameScreen>('title');
  const [config] = useState(gameConfig);
  const [tracks] = useState<Track[]>(TRACKS);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');

  // Gameplay State
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [lives, setLives] = useState(3);
  const [judgments, setJudgments] = useState({ perfect: 0, great: 0, good: 0, miss: 0 });
  const [lastJudgment, setLastJudgment] = useState<Judgment | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [progress, setProgress] = useState(0);
  const [shakerIndex, setShakerIndex] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [characterGlow, setCharacterGlow] = useState(false);
  const [missCharacter, setMissCharacter] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = typeof window.navigator === "undefined" ? "" : navigator.userAgent;
      const mobile = Boolean(userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i));
      setIsMobile(mobile);
    };
    checkMobile();
  }, []);

  // Force re-render counter
  const [renderTick, setRenderTick] = useState(0);

  // Refs for game loop (mutable, no re-render)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const beatNotesRef = useRef<BeatNote[]>([]);
  const lastNoteCountRef = useRef(0);
  const beatIndexRef = useRef(0);
  const startTimeRef = useRef(0);
  const elapsedTimeRef = useRef(0);
  const lastNoteTimeRef = useRef(0);
  const lastNoteAngleRef = useRef(0);
  const gameLoopRef = useRef<number | null>(null);
  const isPlayingRef = useRef(false);
  const audioDurationRef = useRef(0);

  // Gameplay refs for real-time access
  const livesRef = useRef(3);
  const comboRef = useRef(0);
  const scoreRef = useRef(0);
  const judgmentsRef = useRef({ perfect: 0, great: 0, good: 0, miss: 0 });
  const configRef = useRef(gameConfig);
  const selectedTrackRef = useRef<Track | null>(null);
  const difficultyRef = useRef<Difficulty>('normal');

  // Sync refs with state
  useEffect(() => { configRef.current = config; }, [config]);
  useEffect(() => { selectedTrackRef.current = selectedTrack; }, [selectedTrack]);
  useEffect(() => { difficultyRef.current = difficulty; }, [difficulty]);

  // Haptic feedback
  const haptic = (duration: number) => {
    if (navigator.vibrate) navigator.vibrate(duration);
  };

  // Participant count (localStorage)
  const getParticipantCount = () => {
    if (typeof window === 'undefined') return 1000;
    return parseInt(localStorage.getItem('participantCount') || '1000');
  };
  const incrementParticipantCount = () => {
    const count = getParticipantCount() + 1;
    localStorage.setItem('participantCount', count.toString());
    return count;
  };

  // Get difficulty settings (non-reactive for game loop)
  const getDifficultySettings = () => {
    const cfg = configRef.current;
    const diff = difficultyRef.current;
    return cfg?.DIFFICULTY_SETTINGS[diff] || {
      successThreshold: 60,
      timingMultiplier: 1,
      hitZoneScale: 1,
      lives: 3,
      medals: { gold: 90, silver: 75, bronze: 60 },
    };
  };

  // Get track duration
  const getTrackDuration = (track: Track) => {
    const beatmap = track.beatmap || [];
    const lastBeat = beatmap.length > 0 ? beatmap[beatmap.length - 1] : 30000;
    return lastBeat + 2000;
  };

  // Set initial selected track
  useEffect(() => {
    const availableTrack = tracks.find(t => t.available);
    if (availableTrack) setSelectedTrack(availableTrack);
  }, [tracks]);

  // End game
  const endGame = useCallback(() => {
    console.log('Ending game...');
    isPlayingRef.current = false;

    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // Sync refs to state
    setScore(scoreRef.current);
    setCombo(comboRef.current);
    setLives(livesRef.current);
    setJudgments({ ...judgmentsRef.current });

    // Calculate success
    const track = selectedTrackRef.current;
    const totalNotes = track?.beatmap?.length || 1;
    const hitCount = judgmentsRef.current.perfect + judgmentsRef.current.great;
    const accuracy = Math.round((hitCount / totalNotes) * 1000) / 10;
    const settings = getDifficultySettings();
    const success = livesRef.current > 0 && accuracy >= settings.successThreshold;

    console.log('Game ended:', { accuracy, success, lives: livesRef.current });
    setIsSuccess(success);
    setScreen('result');
    incrementParticipantCount();

    // Play sound
    const cfg = configRef.current;
    if (cfg?.ASSETS) {
      const soundUrl = success ? cfg.ASSETS.soundSuccess : cfg.ASSETS.soundFail;
      new Audio(soundUrl).play().catch(() => { });
    }
  }, []);

  // Register judgment (called from game loop)
  const registerJudgment = useCallback((judgment: Judgment, noteIndex?: number) => {
    const cfg = configRef.current;
    if (!cfg) return;

    console.log('Judgment:', judgment);
    judgmentsRef.current[judgment]++;
    setLastJudgment(judgment);

    if (judgment !== 'miss') {
      comboRef.current++;
      scoreRef.current += cfg.SCORING[judgment] + (comboRef.current * cfg.SCORING.combo_bonus);

      // Character glow effect
      setCharacterGlow(true);
      setTimeout(() => setCharacterGlow(false), 150);
      setMissCharacter(false);

      // Haptic
      haptic(judgment === 'perfect' ? 50 : 30);
    } else {
      comboRef.current = 0;
      livesRef.current--;

      // Show miss character
      setMissCharacter(true);
      setTimeout(() => setMissCharacter(false), 300);

      if (livesRef.current <= 0) {
        endGame();
      }
    }

    // Sync to state for display
    setScore(scoreRef.current);
    setCombo(comboRef.current);
    setMaxCombo(prev => Math.max(prev, comboRef.current));
    setLives(livesRef.current);
  }, [endGame, haptic]);

  // Create beat note
  const createBeatNote = useCallback((index: number, targetTime: number): BeatNote => {
    let angle: number;
    if (lastNoteTimeRef.current && (targetTime - lastNoteTimeRef.current < 300)) {
      angle = lastNoteAngleRef.current;
    } else {
      angle = Math.random() * 360;
    }

    lastNoteTimeRef.current = targetTime;
    lastNoteAngleRef.current = angle;

    const radian = angle * (Math.PI / 180);
    const radius = Math.max(window.innerWidth, window.innerHeight) * 0.6;
    const startX = Math.cos(radian) * radius;
    const startY = Math.sin(radian) * radius;

    const cfg = configRef.current;
    const ingredients = cfg?.ASSETS?.ingredients || ['🎵'];
    const emoji = ingredients[Math.floor(Math.random() * ingredients.length)];

    return { index, targetTime, hit: false, startX, startY, emoji };
  }, []);

  // Game loop - runs every frame
  const runGameLoop = useCallback(() => {
    if (!isPlayingRef.current) return;

    const track = selectedTrackRef.current;
    const cfg = configRef.current;
    if (!track || !cfg) return;

    const mobileOffset = 0; // Remove forced delay
    const elapsed = Date.now() - startTimeRef.current - mobileOffset;
    elapsedTimeRef.current = elapsed;

    const settings = getDifficultySettings();
    const missWindow = cfg.TIMING.miss * settings.timingMultiplier;
    const beatmap = track.beatmap;
    const offset = track.offset || 0;
    const lookAhead = 1500;

    // Create new beat notes
    while (beatIndexRef.current < beatmap.length) {
      const beatTime = beatmap[beatIndexRef.current] + offset;
      if (beatTime - elapsed <= lookAhead) {
        const note = createBeatNote(beatIndexRef.current, beatTime);
        beatNotesRef.current.push(note);
        beatIndexRef.current++;
      } else {
        break;
      }
    }

    // Check for misses
    for (const note of beatNotesRef.current) {
      if (note.hit) continue;
      const timeDiff = note.targetTime - elapsed;
      if (timeDiff < -missWindow) {
        note.hit = true;
        note.judgment = 'miss';
        note.hitTime = elapsed;
        registerJudgment('miss');
      }
    }

    // Remove old notes
    beatNotesRef.current = beatNotesRef.current.filter(note => {
      const timeDiff = note.targetTime - elapsed;
      return timeDiff > -missWindow - 100;
    });

    // Update progress
    // Use audio duration if available, otherwise fallback to beatmap calculation
    const duration = audioDurationRef.current > 0
      ? audioDurationRef.current
      : getTrackDuration(track);

    const prog = Math.min(100, (elapsed / duration) * 100);
    setProgress(prog);

    // Force re-render ONLY if note count changes (spawn/destroy)
    // This prevents React from re-rendering 60 times a second
    if (beatNotesRef.current.length !== lastNoteCountRef.current) {
      setRenderTick(t => t + 1);
      lastNoteCountRef.current = beatNotesRef.current.length;
    }

    // Direct DOM manipulation for smooth 60fps on mobile
    const currentElapsed = elapsedTimeRef.current;
    beatNotesRef.current.forEach(note => {
      const el = document.getElementById(`note-${note.index}`);
      if (el) {
        const timeDiff = note.targetTime - currentElapsed;
        const lookAhead = 1500;
        const missWindow = cfg.TIMING.miss * settings.timingMultiplier;

        // Logic for visibility
        const isRecentlyHit = note.hit && note.hitTime && (currentElapsed - note.hitTime < 200);
        const shouldShow = (!note.hit && timeDiff > -missWindow - 100) || isRecentlyHit;

        if (shouldShow) {
          const prog = 1 - (timeDiff / lookAhead);
          const curX = note.startX * (1 - prog);
          const curY = note.startY * (1 - prog);

          el.style.display = 'block';
          el.style.transform = `translate(calc(-50% + ${curX}px), calc(-50% + ${curY}px))`;

          // Update hit status class if needed
          if (note.hit && note.judgment && !el.classList.contains(note.judgment)) {
            el.classList.add(note.judgment);
          }
        } else {
          el.style.display = 'none';
        }
      }
    });

    gameLoopRef.current = requestAnimationFrame(runGameLoop);
  }, [createBeatNote, registerJudgment, endGame]);

  // Reset game state
  const resetGameState = useCallback(() => {
    console.log('Resetting game state...');
    isPlayingRef.current = false;

    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // Reset refs
    beatNotesRef.current = [];
    beatIndexRef.current = 0;
    elapsedTimeRef.current = 0;
    lastNoteTimeRef.current = 0;
    lastNoteAngleRef.current = 0;
    scoreRef.current = 0;
    comboRef.current = 0;
    livesRef.current = getDifficultySettings().lives;
    judgmentsRef.current = { perfect: 0, great: 0, good: 0, miss: 0 };

    // Reset state
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setJudgments({ perfect: 0, great: 0, good: 0, miss: 0 });
    setLastJudgment(null);
    setProgress(0);
    setRenderTick(0);
    lastNoteCountRef.current = 0;
  }, []);

  // Begin playing
  const beginPlaying = useCallback(() => {
    const track = selectedTrackRef.current;
    const cfg = configRef.current;
    if (!track || !cfg) return;

    console.log('Beginning game with track:', track.name);
    resetGameState();

    const settings = getDifficultySettings();
    livesRef.current = settings.lives;
    setLives(settings.lives);
    setScreen('playing');

    const startDelay = 1000;

    setTimeout(() => {
      // Create audio instance
      audioRef.current = new Audio(track.src);

      // Load duration
      audioRef.current.addEventListener('loadedmetadata', () => {
        if (audioRef.current) {
          audioDurationRef.current = audioRef.current.duration * 1000;
          console.log('Audio duration loaded:', audioDurationRef.current);
        }
      });

      // SYNC FIX: Wait for 'playing' event to start game loop
      // This ensures visuals align with actual audio start time (handling buffering)
      audioRef.current.addEventListener('playing', () => {
        console.log('Audio playing event received - starting game loop');
        startTimeRef.current = Date.now();
        isPlayingRef.current = true;

        if (!gameLoopRef.current) {
          gameLoopRef.current = requestAnimationFrame(runGameLoop);
        }
      });

      // Game completion
      audioRef.current.addEventListener('ended', () => {
        console.log('Audio ended - finishing game');
        endGame();
      });

      // Generate beat notes before playing
      // We need to pre-generate some notes or ensure logic handles 0 elapsed time correctly

      // Play audio
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));

      console.log('Game initialized, waiting for audio...');
    }, startDelay);
  }, [resetGameState, runGameLoop]);

  // Start countdown
  const startCountdown = useCallback(() => {
    setScreen('countdown');
    let count = config?.GAME.countdownSeconds || 3;
    setCountdown(count);

    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(interval);
        beginPlaying();
      }
    }, 1000);
  }, [config, beginPlaying]);

  // Start difficulty info
  const startDifficultyInfo = useCallback(() => {
    setScreen('info');
    setTimeout(() => {
      startCountdown();
    }, config?.GAME.infoScreenDuration || 3000);
  }, [config, startCountdown]);

  // Handle tap
  const handleTap = useCallback(() => {
    if (!isPlayingRef.current) return;

    const cfg = configRef.current;
    if (!cfg) return;

    const elapsed = elapsedTimeRef.current;
    const settings = getDifficultySettings();

    let closestNote: BeatNote | null = null;
    let closestDiff = Infinity;

    for (const note of beatNotesRef.current) {
      if (note.hit) continue;
      const diff = Math.abs(note.targetTime - elapsed);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestNote = note;
      }
    }

    const missWindow = cfg.TIMING.miss * settings.timingMultiplier;

    if (closestNote && closestDiff <= missWindow) {
      const perfectWindow = cfg.TIMING.perfect * settings.timingMultiplier;
      const greatWindow = cfg.TIMING.great * settings.timingMultiplier;
      const goodWindow = cfg.TIMING.good * settings.timingMultiplier;

      let judgment: Judgment;
      if (closestDiff <= perfectWindow) judgment = 'perfect';
      else if (closestDiff <= greatWindow) judgment = 'great';
      else if (closestDiff <= goodWindow) judgment = 'good';
      else judgment = 'miss';

      // Mark note as hit with judgment for animation
      closestNote.hit = true;
      closestNote.judgment = judgment;
      closestNote.hitTime = elapsed;

      registerJudgment(judgment, closestNote.index);
    }

    // Shaker animation
    if (cfg.ASSETS.shaker?.length) {
      setShakerIndex(prev => (prev + 1) % cfg.ASSETS.shaker.length);
    }
  }, [registerJudgment]);

  // Calculate accuracy for display
  const getAccuracy = useCallback(() => {
    const track = selectedTrack;
    if (!track?.beatmap?.length) return 0;
    const totalNotes = track.beatmap.length;
    const hitCount = judgments.perfect + judgments.great;
    return Math.round((hitCount / totalNotes) * 1000) / 10;
  }, [selectedTrack, judgments]);

  // Share
  const share = async () => {
    if (!config) return;
    const shareUrl = config.SHARE.url || window.location.href;
    const trackName = selectedTrack?.name || '???';
    const text = config.SHARE.resultText
      .replace('{track}', trackName)
      .replace('{score}', score.toLocaleString());

    if (navigator.share) {
      try {
        await navigator.share({ title: config.STRINGS.gameName, text, url: shareUrl });
      } catch { }
    } else {
      try {
        await navigator.clipboard.writeText(`${text}\n${shareUrl}`);
        alert('링크가 복사되었습니다!');
      } catch { }
    }
  };

  // Retry
  const retry = () => {
    resetGameState();
    startCountdown();
  };

  // Loading
  if (!config) {
    return <div className="loading">Loading...</div>;
  }

  const S = config.STRINGS;
  const A = config.ASSETS;
  const settings = config.DIFFICULTY_SETTINGS[difficulty] || getDifficultySettings();

  // Calculate note positions for rendering (include recently hit notes for animation)
  // Calculate note initial positions for rendering (include recently hit notes for animation)
  // OPTIMIZATION: We only re-render this list when notes are added/removed.
  // Their positions are updated directly in the game loop via DOM manipulation.
  const allNotes = beatNotesRef.current;

  // Keyboard controls for PC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (['Space', 'Enter', 'KeyF', 'KeyJ', 'KeyD', 'KeyK'].includes(e.code)) {
        if (screen === 'playing') {
          handleTap();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, handleTap]);

  return (
    <div id="app">
      {/* Title Screen */}
      {screen === 'title' && (
        <div className="screen active" id="title-screen">
          <div className="logo-container" id="rolling-banner">
            <div className="rolling-track">
              {S.rollingMessages.map((msg: string, i: number) => (
                <span key={i} className="rolling-item">{msg}</span>
              ))}
              {S.rollingMessages.map((msg: string, i: number) => (
                <span key={`dup-${i}`} className="rolling-item">{msg}</span>
              ))}
            </div>
          </div>

          <h1 className="title game-title">{S.title}</h1>
          <h2 className="subtitle">{S.gameName}</h2>

          <div className="character-container">
            <img src={A.characterIdle} alt="캐릭터" />
          </div>

          <p className="body-text">{S.gameDesc}</p>

          <button className="btn btn-primary" onClick={() => setScreen('tutorial')}>
            {S.startButton}
          </button>
        </div>
      )}

      {/* Tutorial Popup */}
      {screen === 'tutorial' && (
        <div className="popup-overlay active">
          <div className="popup tutorial-popup">
            <button className="popup-close-btn" onClick={() => setScreen('title')}>&times;</button>
            <div className="tutorial-content">
              <h2 className="subtitle">{S.tutorialTitle}</h2>

              <div className="tutorial-animation rhythm-tutorial">
                <div className="tutorial-beat-demo">
                  <div className="demo-note">🎵</div>
                  <div className="demo-hit-zone">👆</div>
                </div>
              </div>

              <p className="body-text tutorial-desc">{S.tutorialDesc}</p>

              {/* Difficulty Selection */}
              <div className="difficulty-section">
                <h3 className="section-title">⚡ 난이도 선택</h3>
                <div className="difficulty-list">
                  {(['easy', 'normal', 'hard'] as Difficulty[]).map(d => (
                    <button
                      key={d}
                      className={`difficulty-btn ${d} ${difficulty === d ? 'active' : ''}`}
                      onClick={() => setDifficulty(d)}
                    >
                      {d.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Track Selection */}
              <div className="track-selection">
                <h3 className="track-section-title">🎵 음악 선택</h3>
                <div className="track-list">
                  {tracks.map(track => (
                    <div
                      key={track.id}
                      className={`track-card ${!track.available ? 'locked' : ''} ${selectedTrack?.id === track.id ? 'selected' : ''}`}
                      onClick={() => track.available && setSelectedTrack(track)}
                    >
                      <div className="track-info">
                        <span className="track-name">{track.name}</span>
                        {!track.available && <span className="track-status">Coming Soon</span>}
                      </div>
                      <div className="track-difficulty">
                        {[1, 2, 3].map(i => (
                          <span key={i} className={`star ${i <= track.difficulty ? 'filled' : ''}`}>★</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button className="btn btn-primary" onClick={startDifficultyInfo}>
                {S.tutorialButton}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Difficulty Info Screen */}
      {screen === 'info' && (
        <div className="screen active" id="difficulty-info-screen">
          <h2 className="subtitle">{S.difficultyInfo.title}</h2>
          <h1 className={`title difficulty-text ${difficulty}`} style={{ fontSize: '48px', margin: '20px 0' }}>
            {S.difficultyInfo.labels[difficulty]}
          </h1>
          <p className="body-text" style={{ fontSize: '24px', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
            {S.difficultyInfo.desc
              .replace('{scale}', S.difficultyInfo.scales[difficulty])
              .replace('{lives}', settings.lives.toString())}
          </p>
        </div>
      )}

      {/* Countdown Screen */}
      {screen === 'countdown' && (
        <div className="screen active" id="countdown-screen">
          <span key={countdown} className="countdown-number">{countdown}</span>
        </div>
      )}

      {/* Game Screen */}
      {screen === 'playing' && (
        <div
          className="screen active"
          id="game-screen"
          onPointerDown={handleTap}
        >
          <div className="game-header">
            <div className="rhythm-header">
              <div className="score-display">{score.toLocaleString()}</div>
              <div className="lives-display">
                {Array.from({ length: settings.lives }).map((_, i) => (
                  <span key={i} className={`heart ${i >= lives ? 'lost' : ''}`}>❤️</span>
                ))}
              </div>
            </div>
            <div className="progress-container">
              <div className="progress-bar" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="rhythm-game-area">
            <div id="beat-track">
              {allNotes.map(note => (
                <div
                  key={note.index}
                  id={`note-${note.index}`}
                  className={`beat-note ${note.judgment || ''}`}
                  // Initial position off-screen or calculated once
                  style={{
                    transform: `translate(-50%, -50%)`, // script will update this
                    display: 'none', // script will show this
                  }}
                >
                  {note.emoji}
                </div>
              ))}
            </div>

            <div
              className="hit-zone"
              style={{ transform: `translate(-50%, -50%) scale(${settings.hitZoneScale})` }}
            >
              <span className="hit-zone-icon">👆</span>
            </div>

            {lastJudgment && (
              <div className={`judgment-display ${lastJudgment}`}>
                {S.judgments[lastJudgment]}
              </div>
            )}

            {combo >= 5 && (
              <div className="combo-display">{combo} COMBO!</div>
            )}
          </div>

          <div className={`game-character rhythm-character ${characterGlow ? 'active-glow' : ''}`}>
            <img src={missCharacter && A.miss ? A.miss : (A.shaker?.[shakerIndex] || A.characterIdle)} alt="캐릭터" />
          </div>

          <p className="tap-hint">{S.tapHint}</p>
        </div>
      )}

      {/* Result Popup */}
      {screen === 'result' && (
        <div className="popup-overlay active">
          <div className="popup result-popup">
            <button className="popup-close-btn" onClick={() => setScreen('title')}>&times;</button>

            {isSuccess ? (
              <>
                {(() => {
                  const accuracy = getAccuracy();
                  let medal = S.medals.bronze;
                  if (accuracy >= settings.medals.gold) medal = S.medals.gold;
                  else if (accuracy >= settings.medals.silver) medal = S.medals.silver;
                  return (
                    <>
                      <span className="result-icon">{medal.icon}</span>
                      <h2 className="result-title">{medal.title}</h2>
                      <div className="result-character">
                        <img src={A.characterWin} alt="결과" />
                      </div>
                      <p className="body-text">{medal.desc}</p>
                    </>
                  );
                })()}
              </>
            ) : (
              <>
                <span className="result-icon">{S.fail.icon}</span>
                <h2 className="result-title">{S.fail.title}</h2>
                <div className="result-character">
                  <img src={A.characterFail} alt="결과" />
                </div>
                <p className="body-text">{S.fail.desc}</p>
              </>
            )}

            <div className="result-stats">
              <div className="stat-row">
                <span className="stat-label">{S.yourRecord}</span>
                <span className="stat-value">{score.toLocaleString()}점</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">{S.avgRecord}</span>
                <span className="stat-value">{getAccuracy()}%</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">{S.mySpeed}</span>
                <span className="stat-value">{judgments.perfect} / {selectedTrack?.beatmap?.length || 0}</span>
              </div>
            </div>

            <div className="result-buttons">
              <button className="btn btn-primary" onClick={() => setScreen('tutorial')}>
                {S.resultButtons.changeTrack}
              </button>
              <button className="btn btn-primary" onClick={retry}>
                {S.resultButtons.retry}
              </button>
              <button className="btn btn-success" onClick={share}>
                {S.resultButtons.share}
              </button>
            </div>

            <Link href="/beat-creator" className="text-link">{S.resultButtons.createBeat}</Link>
          </div>
        </div>
      )}
    </div>
  );
}
