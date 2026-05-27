"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseSpeechRecognitionOptions {
  onTranscript: (text: string) => void;
  enabled: boolean;
}

export function useSpeechRecognition({
  onTranscript,
  enabled,
}: UseSpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  useEffect(() => {
    const w = window as Window & {
      SpeechRecognition?: new () => unknown;
      webkitSpeechRecognition?: new () => unknown;
    };
    const SpeechRecognitionCtor =
      w.SpeechRecognition ?? w.webkitSpeechRecognition;
    setSupported(!!SpeechRecognitionCtor);

    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor() as {
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      onresult: ((event: { resultIndex: number; results: { length: number; [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
      onend: (() => void) | null;
      start: () => void;
      stop: () => void;
    };

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      if (transcript) onTranscriptRef.current(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

  const toggle = useCallback(() => {
    if (!enabled || !recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [enabled, isListening]);

  return { isListening, supported, toggle };
}
