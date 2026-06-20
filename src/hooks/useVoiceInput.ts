import { useState, useEffect, useCallback, useRef } from "react";

export function useVoiceInput(onTranscript: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = "en-US";

        rec.onstart = () => setIsListening(true);
        rec.onend = () => setIsListening(false);
        rec.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setError(event.error);
          setIsListening(false);
        };
        rec.onresult = (event: any) => {
          const resultText = event.results[0][0].transcript;
          if (onTranscriptRef.current) {
            onTranscriptRef.current(resultText);
          }
        };

        setRecognition(rec);
      } else {
        setError("Web Speech API not supported in this browser");
      }
    }
  }, []);

  const startListening = useCallback(() => {
    if (recognition) {
      setError(null);
      try {
        recognition.start();
      } catch (err) {
        console.error("Failed to start voice recognition:", err);
      }
    }
  }, [recognition]);

  const stopListening = useCallback(() => {
    if (recognition) {
      try {
        recognition.stop();
      } catch (err) {
        console.error("Failed to stop voice recognition:", err);
      }
    }
  }, [recognition]);

  return {
    isListening,
    startListening,
    stopListening,
    error,
    isSupported: !!recognition,
  };
}
