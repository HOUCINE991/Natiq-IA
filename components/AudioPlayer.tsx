import React, { useRef, useState, useEffect } from 'react';
import { Language } from '../types';

interface AudioPlayerProps {
  audioUrl: string;
  onDownload: () => void;
  onRegenerate: () => void;
  language: Language;
  t: any;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, onDownload, onRegenerate, language, t }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
      // Auto play when loaded
      audio.play().catch(e => console.log("Auto-play prevented", e));
      setIsPlaying(true);
    };

    const updateTime = () => setCurrentTime(audio.currentTime);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', onEnded);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.volume = vol;
      setVolume(vol);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-800 rounded-2xl p-5 shadow-xl border border-slate-700 mt-6 animate-fade-in">
      <audio ref={audioRef} src={audioUrl} />
      
      {/* Top Controls: Play/Pause and Time */}
      <div className="flex flex-col gap-5">
        
        <div className="flex items-center gap-4">
          <button 
            onClick={togglePlay}
            className="w-14 h-14 flex-shrink-0 flex items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/30 active:scale-95 touch-manipulation"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 pl-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>

          {/* Progress Bar */}
          <div className="flex-1 flex flex-col justify-center gap-1.5">
             <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-3 bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 touch-none"
            />
            <div className="flex justify-between text-xs font-medium text-slate-400 font-mono px-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-slate-700/50 w-full" />

        {/* Bottom Controls: Actions */}
        <div className="flex flex-col gap-4">
          
          {/* Volume Control */}
          <div className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-400 hover:accent-slate-300"
              />
          </div>

          <div className="grid grid-cols-2 gap-3">
             <button
              onClick={onRegenerate}
              className="px-4 py-3 rounded-xl text-sm font-bold text-slate-300 bg-slate-700 hover:bg-slate-600 transition-colors flex items-center justify-center gap-2 active:scale-95 touch-manipulation"
            >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
               {t.regenerate}
            </button>
            <button
              onClick={onDownload}
              className="px-4 py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 touch-manipulation"
            >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {t.download}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AudioPlayer;