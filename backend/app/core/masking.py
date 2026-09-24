import re


def is_valid_tckn(number: str) -> bool:
    if len(number) != 11 or not number.isdigit():
        return False
    if number[0] == "0":
        return False

    digits = [int(d) for d in number]

    odd_sum = sum(digits[0:9:2])
    even_sum = sum(digits[1:8:2])

    digit10 = ((odd_sum * 7) - even_sum) % 10
    if digit10 != digits[9]:
        return False

    digit11 = sum(digits[0:10]) % 10
    if digit11 != digits[10]:
        return False

    return True


def _mask_tckn_candidate(match: re.Match) -> str:
    candidate = match.group(0)
    return "[TCKN_GİZLENDİ]" if is_valid_tckn(candidate) else candidate


def mask_sensitive_data(content: str) -> str:
    # Önce IBAN (en spesifik desen, TR ile başlıyor)
    content = re.sub(r"TR\d{2}(?:\s?\d{4}){5}\s?\d{2}", "[IBAN_GİZLENDİ]", content)
    # Sonra telefon
    content = re.sub(r"0[\s-]?5\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}", "[TELEFON_GİZLENDİ]", content)
    # En son TC kimlik (en genel desen, en son çalışmalı ki başkalarının içine girmesin)
    # — 11 haneli adaylardan sadece resmi checksum algoritmasını geçenler maskelenir
    content = re.sub(r"[1-9]\d{10}", _mask_tckn_candidate, content)
    return content
