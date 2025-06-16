// Timer.js
import React, { useState, useEffect, useRef } from 'react';
import './Timer.css';
import bellSound from '../../assets/bellSound.mp3';
import StylishAlert from '../StylishAlert/StylishAlert';

export default function Timer({ setShowTimer }) {
  const [timerMinutes, setTimerMinutes] = useState('');
  const [timerSeconds, setTimerSeconds] = useState('');
  const [timerHours, setTimerHours] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerFinished, setTimerFinished] = useState(false);
  const timerIntervalRef = useRef(null);
  const audioRef = useRef(null);

  const [alertMessage, setAlertMessage] = useState('');
  const clearAlert = () => setAlertMessage('');

  // For dragging
  const [timerPosition, setTimerPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // --------------------
  //  TIMER LOGIC
  // --------------------
  const startTimer = () => {
    if (timeLeft === 0) {
      const hours   = parseInt(timerHours, 10)   || 0;
      const minutes = parseInt(timerMinutes, 10) || 0;
      const seconds = parseInt(timerSeconds, 10) || 0;
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;
      if (totalSeconds <= 0) {
        setAlertMessage('Please enter a valid time');
        return;
      }
      setTimeLeft(totalSeconds);
    }
    setIsTimerRunning(true);
    setTimerFinished(false);
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimeLeft(0);
    setTimerFinished(false);
    setTimerHours('');
    setTimerMinutes('');
    setTimerSeconds('');
  };

  const formatTime = (seconds) => {
    const hrs  = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Countdown effect
  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            setTimerFinished(true);
            if (audioRef.current) {
              audioRef.current.play().catch(e => console.log('Audio play failed:', e));
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerRunning, timeLeft]);

  // If dragging, attach event listeners
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      setTimerPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    };
    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  useEffect(() => {
    if (timerFinished) {
      const timeout = setTimeout(() => {
        setTimerFinished(false);
      }, 3000); // 3 iterations of the “pulse” animation
      return () => clearTimeout(timeout);
    }
  }, [timerFinished]);

  // --------------------
  //  DRAG HANDLERS
  // --------------------
  const handleMouseDown = (e) => {
    // Prevent drag if the target is the close button or inside it
    if (e.target.closest('.timer-close')) return;

    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setTimerPosition({
      x: rect.left,
      y: rect.top
    });
  };

  return (
    <div
      className={`floating-timer ${timerFinished ? 'timer-finished' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        ...(timerPosition.x !== 0 || timerPosition.y !== 0
          ? { left: `${timerPosition.x}px`, top: `${timerPosition.y}px`, right: 'auto' }
          : { top: '120px', right: '20px' }
        )
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="timer-header">
        <span>⏰ Kitchen Timer</span>
        <button className="timer-close" onClick={() => setShowTimer(false)}>
          ×
        </button>
      </div>

      {timeLeft === 0 && !isTimerRunning ? (
        <div className="timer-setup">
          {/* HOURS (0-23) */}
          <div className="time-inputs">
            <input
              type="number"
              placeholder="HH"
              value={timerHours}
              onChange={(e) => {
                let v = parseInt(e.target.value, 10);
                if (isNaN(v) || v < 0) v = 0;
                if (v > 23) v = 23; // change this to your desired max
                setTimerHours(v.toString());
              }}
              min="0"
              max="23"
            />
            <span>:</span>

            {/* MINUTES (0–59) */}
            <input
              type="number"
              placeholder="MM"
              value={timerMinutes}
              onChange={(e) => {
                let v = parseInt(e.target.value, 10);
                if (isNaN(v) || v < 0) v = 0;
                if (v > 59) v = 59;
                setTimerMinutes(v.toString());
              }}
              min="0"
              max="59"
            />
            <span>:</span>

            {/* SECONDS (0–59) */}
            <input
              type="number"
              placeholder="SS"
              value={timerSeconds}
              onChange={(e) => {
                let v = parseInt(e.target.value, 10);
                if (isNaN(v) || v < 0) v = 0;
                if (v > 59) v = 59;
                setTimerSeconds(v.toString());
              }}
              min="0"
              max="59"
            />
          </div>
          <button className="timer-reset-btn" onClick={resetTimer}>
            Reset
          </button>
          <button className="timer-start-btn" onClick={startTimer}>
            Start
          </button>
        </div>
      ) : (
        <div className="timer-display">
          <div className="timer-time">{formatTime(timeLeft)}</div>
          <div className="timer-controls">
            <button onClick={isTimerRunning ? pauseTimer : startTimer}>
              {isTimerRunning ? '⏸️' : (timeLeft > 0 ? '▶️' : '▶️')}
            </button>
            <button onClick={resetTimer}>🔄</button>
          </div>
          {timerFinished && <div className="timer-alert">⏰ Time's Up!</div>}
        </div>
      )}

      {alertMessage && (
        <StylishAlert
          message={alertMessage}
          onClose={clearAlert}
          duration={3000}
        />
      )}

      <audio ref={audioRef} preload="auto">
        <source src={bellSound} type="audio/mp3" />
      </audio>
    </div>
  );
}
