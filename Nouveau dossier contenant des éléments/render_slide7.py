#!/usr/bin/env python3
"""Rend le slide 7 en image PNG via Pillow."""

from pptx import Presentation
from pptx.util import Pt
from pptx.dml.color import RGBColor
from PIL import Image, ImageDraw, ImageFont
import io, os

BASE = "/Users/anass/Downloads/frais-gestionScolaire 4"
OUT  = os.path.join(BASE, "slide7_preview.png")

prs  = Presentation(os.path.join(BASE, "PRESENTATION_PFE_SECURITE_UPDATED.pptx"))
slide = prs.slides[6]

SCALE = 2.0 * 96 / 914400   # 2x resolution
SW = int(prs.slide_width  * SCALE)
SH = int(prs.slide_height * SCALE)

# ── Couleurs (reproduit le thème bleu foncé de la présentation) ────────────
BG_DARK   = (15,  23,  42)   # slide background
ACCENT    = (56, 189, 248)   # cyan accent
CARD_BG   = (30,  41,  59)   # card background
HDR_BG    = (37,  99, 235)   # card header (bleu)
HDR2_BG   = (16, 185, 129)   # row 2 header (vert/teal)
TXT_WHITE = (255, 255, 255)
TXT_DIM   = (148, 163, 184)
TXT_CYAN  = ( 56, 189, 248)
NOTE_BG   = (15,  23,  42)
NOTE_LINE = (56, 189, 248)

img  = Image.new("RGB", (SW, SH), BG_DARK)
draw = ImageDraw.Draw(img)

def emu(v):
    return int(v * SCALE)

def load_font(size):
    try:
        return ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", size)
    except:
        return ImageFont.load_default()

F_SMALL  = load_font(14)
F_NORMAL = load_font(18)
F_MEDIUM = load_font(20)
F_LARGE  = load_font(26)
F_TITLE  = load_font(32)
F_BOLD   = load_font(22)
F_NOTE   = load_font(15)

# ── Header bar ─────────────────────────────────────────────────────────────
draw.rectangle([0, 0, SW, emu(329040)], fill=(20, 30, 55))
draw.line([0, emu(329040), SW, emu(329040)], fill=ACCENT, width=2)

# Header text
draw.text((emu(320040), emu(73152) + 2), "PFE Cybersécurité · YNOV Campus 2026",
          font=F_SMALL, fill=TXT_DIM)
draw.text((emu(10725912), emu(73152) + 2), "07 / 30", font=F_SMALL, fill=ACCENT)

# Accent stripe (Rectangle 5)
draw.rectangle([emu(411480), emu(1444752),
                emu(411480) + emu(1097280), emu(1444752) + 3],
               fill=ACCENT)

# ── Titre + sous-titre ──────────────────────────────────────────────────────
draw.text((emu(411480), emu(411480)), "CDC §3.3 — CONFORMITÉ",
          font=F_LARGE, fill=ACCENT)
draw.text((emu(411480), emu(640080)),
          "Conformité RGPD (UE 2016/679) — 6 Articles Implémentés",
          font=F_MEDIUM, fill=TXT_WHITE)

# ── Cartes RGPD ────────────────────────────────────────────────────────────
cards = [
    # (col, row, header_color, title, lines)
    (0, 0, HDR_BG,
     "Art. 15 — Droit d'accès",
     ["Export données personnelles",
      "→ DATA_EXPORT loggué dans auditLogs",
      "GET /users/:id/export"]),
    (1, 0, HDR_BG,
     "Art. 16 — Rectification",
     ["Modification données",
      "→ traçabilité complète Firestore",
      "CRUD loggué serverTimestamp()"]),
    (2, 0, HDR_BG,
     "Art. 17 — Droit à l'effacement",
     ["Anonymisation DATA_ANONYMIZE",
      "→ champs remplacés · log conservé",
      "DELETE /users/:id/data"]),
    (0, 1, HDR2_BG,
     "Art. 25 — Privacy by Design",
     ["AES-256-CBC · HTTPS · RBAC",
      "→ principe du moindre privilège",
      "dès la conception architecture"]),
    (1, 1, HDR2_BG,
     "Art. 32 — Sécurité du traitement",
     ["WAF + JWT HS256 + bcrypt 12r",
      "→ rate limiting + lockout",
      "HTTPS/HSTS max-age=31536000"]),
    (2, 1, HDR2_BG,
     "Art. 33 — Notification violation",
     ["Alerte CRITIQUE auditLogs",
      "→ dashboard /monitoring",
      "Procédure 72h documentée"]),
]

COL_L = [emu(411480), emu(4471416), emu(8531352)]
ROW_T = [emu(1600200), emu(3134640)]
CW    = emu(3657600)
CH    = emu(1234440)
HH    = emu(292608)
R     = 8   # border-radius approx

for col, row, hdr_col, title, lines in cards:
    l = COL_L[col]
    t = ROW_T[row]

    # Card background (rounded-ish via rectangle)
    draw.rectangle([l, t, l + CW, t + CH], fill=CARD_BG, outline=(50, 70, 100), width=1)

    # Card header
    draw.rectangle([l, t, l + CW, t + HH], fill=hdr_col)

    # Divider line bottom of header
    draw.line([l, t + HH, l + CW, t + HH], fill=(255, 255, 255, 60), width=1)

    # Header text
    title_x = l + 12
    title_y = t + (HH - 20) // 2
    draw.text((title_x, title_y), title, font=F_BOLD, fill=TXT_WHITE)

    # Body lines
    body_y = t + HH + 18
    for i, line in enumerate(lines):
        color = TXT_DIM if line.startswith("→") else (TXT_CYAN if line.startswith("GET") or line.startswith("DELETE") or line.startswith("CRUD") or "/" in line else TXT_WHITE)
        if i == 0:
            color = TXT_WHITE
        draw.text((l + 18, body_y + i * 26), line, font=F_NOTE, fill=color)

# ── NOTE section ───────────────────────────────────────────────────────────
note_y = emu(5468112)
draw.rectangle([0, note_y, SW, SH], fill=(20, 28, 50))
draw.line([0, note_y, SW, note_y], fill=ACCENT, width=2)
draw.text((emu(365760), note_y + 12), "NOTE", font=F_BOLD, fill=ACCENT)
note_text = (
    "L'Article 33 (notification de violation) est particulièrement important : "
    "en cas d'incident, l'organisation a 72h pour notifier la CNIL. "
    "Le dashboard /monitoring avec ses alertes automatiques permet cette détection rapide."
)
draw.text((emu(365760), note_y + 40), note_text[:120], font=F_NOTE, fill=TXT_DIM)
draw.text((emu(365760), note_y + 60), note_text[120:], font=F_NOTE, fill=TXT_DIM)

img.save(OUT, "PNG", quality=95)
print(f"✅ Aperçu sauvegardé : {OUT} ({SW}x{SH}px)")
