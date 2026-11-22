import speech_recognition as sr
import os
import wave
import contextlib

def transcribe_audio():
    audio_path = r"D:\School_Lakshya\Audio\second_audio.wav"
    output_txt = r"D:\School_Lakshya\Audio\second_audio_transcript.txt"
    
    r = sr.Recognizer()
    
    with contextlib.closing(wave.open(audio_path, 'r')) as f:
        frames = f.getnframes()
        rate = f.getframerate()
        duration = frames / float(rate)
    
    print(f"Total duration: {duration:.2f} seconds ({duration/60:.2f} minutes)")
    
    chunk_duration = 20  # 20 seconds chunks
    transcript_lines = []
    
    for start in range(0, int(duration), chunk_duration):
        end = min(start + chunk_duration, int(duration))
        mins, secs = divmod(start, 60)
        time_tag = f"[{mins:02d}:{secs:02d}]"
        
        with sr.AudioFile(audio_path) as source:
            audio_data = r.record(source, offset=start, duration=chunk_duration)
            try:
                text = r.recognize_google(audio_data, language="hi-IN")
                line = f"{time_tag} {text}"
                print(line)
                transcript_lines.append(line)
            except sr.UnknownValueError:
                print(f"{time_tag} [Unrecognized audio / silence]")
            except sr.RequestError as e:
                print(f"{time_tag} [API Error: {e}]")
                
    with open(output_txt, "w", encoding="utf-8") as out:
        out.write("\n".join(transcript_lines))
    print(f"Transcription saved to {output_txt}")

if __name__ == "__main__":
    transcribe_audio()
