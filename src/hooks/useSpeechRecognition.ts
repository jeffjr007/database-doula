import { useState, useRef, useCallback, useEffect } from 'react';

interface SpeechRecognitionResult {
  transcript: string;
  isListening: boolean;
  error: string | null;
  isSupported: boolean;
}

interface UseSpeechRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onEnd?: () => void;
}

// Extend Window interface for SpeechRecognition
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

export const useSpeechRecognition = (options: UseSpeechRecognitionOptions = {}): SpeechRecognitionResult & {
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
} => {
  const {
    language = 'pt-BR',
    continuous = true,
    interimResults = true,
    onResult,
    onEnd,
  } = options;

  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');

  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognitionAPI();
    
    const recognition = recognitionRef.current;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = language;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let currentFinalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          currentFinalTranscript += result[0].transcript + ' ';
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (currentFinalTranscript) {
        finalTranscriptRef.current += currentFinalTranscript;
      }

      const fullTranscript = finalTranscriptRef.current + interimTranscript;
      setTranscript(fullTranscript.trim());
      
      if (onResult) {
        onResult(fullTranscript.trim(), !!currentFinalTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      
      // Don't treat 'no-speech' or 'aborted' as errors
      if (event.error === 'no-speech' || event.error === 'aborted') {
        return;
      }
      
      setError(getErrorMessage(event.error));
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (onEnd) {
        onEnd();
      }
    };

    return () => {
      if (recognition) {
        recognition.abort();
      }
    };
  }, [isSupported, language, continuous, interimResults, onResult, onEnd]);

  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) {
      setError('Reconhecimento de voz não suportado neste navegador');
      return;
    }

    setError(null);
    finalTranscriptRef.current = '';
    setTranscript('');
    
    try {
      recognitionRef.current.start();
    } catch (e) {
      // Already started, ignore
      console.warn('Recognition already started');
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = '';
    setTranscript('');
  }, []);

  return {
    transcript,
    isListening,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
};

function getErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'not-allowed':
      return 'Permissão de microfone negada. Por favor, permita o acesso ao microfone.';
    case 'no-speech':
      return 'Nenhuma fala detectada. Tente novamente.';
    case 'audio-capture':
      return 'Nenhum microfone detectado.';
    case 'network':
      return 'Erro de conexão. Verifique sua internet.';
    case 'service-not-allowed':
      return 'Serviço de reconhecimento não disponível.';
    default:
      return `Erro de reconhecimento: ${errorCode}`;
  }
}
