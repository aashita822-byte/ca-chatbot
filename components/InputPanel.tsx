// FIX: Add TypeScript definitions for the Web Speech API (SpeechRecognition)
// as they are not standard and may not be included in default TS lib files.
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onstart: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: { new(): SpeechRecognition };
    webkitSpeechRecognition: { new(): SpeechRecognition };
  }
}

import React, { useState, useRef, useEffect } from 'react';
import { ChatStyle } from '../types';
import { SendIcon, MicIcon, MicOffIcon, VolumeOnIcon, VolumeOffIcon } from './icons';

interface InputPanelProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  chatStyle: ChatStyle;
  setChatStyle: (style: ChatStyle) => void;
  isVoiceOutputEnabled: boolean;
  setIsVoiceOutputEnabled: (enabled: boolean) => void;
}

const InputPanel: React.FC<InputPanelProps> = ({
  onSendMessage,
  isLoading,
  chatStyle,
  setChatStyle,
  isVoiceOutputEnabled,
  setIsVoiceOutputEnabled,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [micError, setMicError] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      const errorMsg = 'Speech recognition not supported in this browser.';
      console.warn(errorMsg);
      setMicError(errorMsg);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    recognition.onstart = () => {
        setIsRecording(true);
        setMicError('');
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setInputValue(finalTranscript + interimTranscript);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };
    
    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error, event.message);
        let errorMsg = 'An unknown speech recognition error occurred.';
        if (event.error === 'not-allowed') {
            errorMsg = "Microphone access denied. To use voice input, please enable microphone access in your browser settings for this site.";
        } else if (event.error === 'no-speech') {
            errorMsg = "No speech was detected. Please try again.";
        } else if (event.error === 'audio-capture') {
            errorMsg = "Microphone not available. Please check your hardware and permissions.";
        } else if (event.error === 'network') {
            errorMsg = "A network error occurred for speech recognition. Please check your connection.";
        }
        setMicError(errorMsg);
        setIsRecording(false);
    };

    recognitionRef.current = recognition;
    
    return () => {
        recognitionRef.current?.abort();
    };
  }, []);

  const handleMicClick = () => {
    if (!recognitionRef.current) return;
    
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setInputValue('');
      setMicError('');
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Error starting recognition:", e);
        setMicError("Could not start voice recording. Please try again in a moment.");
      }
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue);
      setInputValue('');
      if (isRecording) {
        recognitionRef.current?.stop();
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700 shadow-t-lg">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center gap-4 mb-3">
            <button 
              onClick={() => setChatStyle('qa')} 
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${chatStyle === 'qa' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
              Q&A Style
            </button>
            <button 
              onClick={() => setChatStyle('discussion')} 
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${chatStyle === 'discussion' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
              Discussion Style
            </button>
        </div>
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
           <button
            type="button"
            onClick={() => setIsVoiceOutputEnabled(!isVoiceOutputEnabled)}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label={isVoiceOutputEnabled ? "Disable voice output" : "Enable voice output"}
          >
            {isVoiceOutputEnabled ? <VolumeOnIcon /> : <VolumeOffIcon />}
          </button>
          <button
            type="button"
            onClick={handleMicClick}
            className={`p-2 rounded-full transition-colors ${
              isRecording 
              ? 'text-red-500 bg-red-100 dark:bg-red-900/50 animate-pulse' 
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            disabled={isLoading}
            aria-label={isRecording ? "Stop recording" : "Start recording"}
          >
            {isRecording ? <MicOffIcon /> : <MicIcon />}
          </button>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask anything about your CA studies..."
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50 dark:bg-gray-700 transition-shadow"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
            disabled={isLoading || !inputValue.trim()}
             aria-label="Send message"
          >
            <SendIcon />
          </button>
        </form>
        {micError && <p className="text-center text-red-500 text-sm mt-2 px-3">{micError}</p>}
      </div>
    </div>
  );
};

export default InputPanel;