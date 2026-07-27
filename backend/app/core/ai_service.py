import json
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

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

    result = json.loads(response.choices[0].message.content)
    return result