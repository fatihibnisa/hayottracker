'use client';

import { useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui';
import { similarityScore } from '@/lib/text-similarity';
import { useT } from '@/lib/settings-context';

export function VoiceQuranCheck({
  referenceText,
  onResult,
}: {
  referenceText: string;
  onResult: (score: number, transcript: string) => void;
}) {
  const t = useT();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const recognitionRef = useRef<any>(null);

  const SpeechRecognitionCtor =
    typeof window !== 'undefined' ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null;

  if (!SpeechRecognitionCtor) {
    return <p className="text-xs text-secondary">{t('religious', 'voiceNotSupported')}</p>;
  }

  function start() {
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'ar-SA';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (e: any) => {
      const text = e.results[0][0].transcript as string;
      setTranscript(text);
      const s = similarityScore(text, referenceText);
      setScore(s);
      onResult(s, text);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  function stop() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Button type="button" variant={listening ? 'danger' : 'secondary'} onClick={listening ? stop : start}>
          {listening ? <Square size={14} /> : <Mic size={14} />}
          <span className="ml-1.5">{listening ? t('religious', 'stopRecording') : t('religious', 'startRecording')}</span>
        </Button>
        {listening && <span className="text-xs text-accent">{t('religious', 'listening')}</span>}
      </div>
      {transcript && <p className="rounded-lg bg-black/[0.03] p-2 text-right text-sm dark:bg-white/5" dir="rtl">{transcript}</p>}
      {score !== null && (
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
            <div
              className="h-full rounded-full"
              style={{ width: `${score}%`, background: score >= 70 ? 'var(--status-good)' : score >= 40 ? 'var(--status-warning)' : 'var(--status-critical)' }}
            />
          </div>
          <span className="text-xs font-semibold">{score}%</span>
        </div>
      )}
      <p className="text-[11px] text-secondary">{t('religious', 'voiceCaveat')}</p>
    </div>
  );
}
