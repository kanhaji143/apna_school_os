import os
import sys
import wave
import speech_recognition as sr

wav_path = r"D:\School_Lakshya\Audio\record-1795347156968.wav"
out_path = r"D:\School_Lakshya\Audio\transcript.txt"

r = sr.Recognizer()

with wave.open(wav_path, "rb") as wf:
    framerate = wf.getframerate()
    nframes = wf.getnframes()
    total_seconds = nframes / float(framerate)

print(f"Total audio length: {total_seconds:.1f} seconds ({total_seconds/60:.2f} mins)")

chunk_duration = 25  # 25 seconds chunks
current_offset = 0

with open(out_path, "w", encoding="utf-8") as out_f:
    out_f.write(f"=== AUDIO TRANSCRIPTION: {os.path.basename(wav_path)} ===\n")
    out_f.write(f"Total Duration: {total_seconds/60:.2f} minutes\n\n")

while current_offset < total_seconds:
    duration = min(chunk_duration, total_seconds - current_offset)
    min_start = int(current_offset // 60)
    sec_start = int(current_offset % 60)
    time_label = f"[{min_start:02d}:{sec_start:02d}]"

    try:
        with sr.AudioFile(wav_path) as source:
            source.DURATION = total_seconds
            # record chunk
            audio = r.record(source, offset=current_offset, duration=duration)
            try:
                # Recognize in Hindi (India)
                text = r.recognize_google(audio, language="hi-IN")
            except sr.UnknownValueError:
                text = "[...अस्पष्ट / मौन...]"
            except Exception as e:
                text = f"[त्रुटि: {e}]"
    except Exception as e:
        text = f"[ऑडियो एरर: {e}]"

    line = f"{time_label} {text}"
    print(line)
    sys.stdout.flush()

    with open(out_path, "a", encoding="utf-8") as out_f:
        out_f.write(line + "\n")

    current_offset += duration

print("\n=== TRANSCRIPTION COMPLETE ===")
