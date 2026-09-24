import json
import logging
import os

from dotenv import load_dotenv
from openai import OpenAI
import subprocess
import imageio_ffmpeg
load_dotenv()

logger = logging.getLogger(__name__)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

ANALYSIS_PROMPT = """
Aşağıdaki çağrı merkezi transkriptini analiz et. Cevabını SADECE şu JSON 
formatında ver, başka hiçbir açıklama ekleme:

{{
  "summary": "çağrının 2-3 cümlelik özeti",
  "sentiment": "positive" veya "negative" veya "neutral",
  "sentiment_score": -1.0 ile 1.0 arasında sayısal bir değer,
  "topic": "çağrının ana konusu (örn. Fatura Sorunu, Teknik Destek)",
  "keywords": ["anahtar", "kelime", "listesi"]
}}

Transkript:
{transcript}
"""


def analyze_transcript(transcript_text: str) -> dict:
    prompt = ANALYSIS_PROMPT.format(transcript=transcript_text)

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
    )

    message = response.choices[0].message
    logger.info("HAM CEVAP: %s", repr(message.content))
    logger.info("REFUSAL: %s", repr(getattr(message, "refusal", None)))
    logger.info("FINISH REASON: %s", repr(response.choices[0].finish_reason))

    result = json.loads(message.content)
    return result

def convert_to_mp3(input_path: str, output_path: str):
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    subprocess.run(
        [ffmpeg_exe, "-y", "-i", input_path, "-ar", "16000", "-ac", "1", output_path],
        check=True,
        capture_output=True,
    )
    
def transcribe_audio(audio_file_path: str) -> str:
    with open(audio_file_path, "rb") as audio_file:
        transcription = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            language="tr",
        )
    return transcription.text
    result = json.loads(response.choices[0].message.content)
    return result