#!/usr/bin/env python3
"""Agent Pad mascot — MIX direction.

Silhouette from A (cross pad: reads at 40px), face from B (visor panel, two eyes),
launch flame and side grips from C. One character, three borrowed traits.
"""
import os

OUT = os.path.dirname(os.path.abspath(__file__))
BG, CYAN, MAGENTA, INK, DIM = "#070a0d", "#22f0ff", "#ff3ea5", "#f2f7f9", "#16323f"

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 512 512">
<defs>
  <radialGradient id="g" cx="50%" cy="40%" r="58%">
    <stop offset="0%" stop-color="#10303c"/><stop offset="100%" stop-color="{BG}"/>
  </radialGradient>
  <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
    <path d="M32 0H0V32" fill="none" stroke="{DIM}" stroke-width="1" opacity="0.35"/>
  </pattern>
  <linearGradient id="visor" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#dfe9ee"/>
  </linearGradient>
</defs>
<rect width="512" height="512" fill="url(#g)"/>
<rect width="512" height="512" fill="url(#grid)" opacity="0.45"/>

<g transform="translate(256 244)">
  <!-- cross pad body (A) -->
  <path d="M-72 -148 h144 a28 28 0 0 1 28 28 v72 h72 a28 28 0 0 1 28 28 v72
           a28 28 0 0 1 -28 28 h-72 v72 a28 28 0 0 1 -28 28 h-144 a28 28 0 0 1 -28 -28 v-72
           h-72 a28 28 0 0 1 -28 -28 v-72 a28 28 0 0 1 28 -28 h72 v-72 a28 28 0 0 1 28 -28 z"
        fill="#0b1a22" stroke="{CYAN}" stroke-width="10" stroke-linejoin="round"/>

  <!-- grips from C -->
  <rect x="-150" y="-6" width="26" height="72" rx="13" fill="{CYAN}" opacity="0.85"/>
  <rect x="124" y="-6" width="26" height="72" rx="13" fill="{CYAN}" opacity="0.85"/>

  <!-- visor face from B -->
  <rect x="-84" y="-52" width="168" height="84" rx="26" fill="url(#visor)"/>
  <circle cx="-34" cy="-12" r="17" fill="#070a0d"/>
  <circle cx="34" cy="-12" r="17" fill="#070a0d"/>
  <circle cx="-29" cy="-17" r="6" fill="{CYAN}"/>
  <circle cx="39" cy="-17" r="6" fill="{CYAN}"/>
  <path d="M-20 22 q20 20 40 0" fill="none" stroke="{MAGENTA}" stroke-width="8" stroke-linecap="round"/>

  <!-- keys from B -->
  <g fill="{CYAN}">
    <circle cx="-46" cy="62" r="9"/><circle cx="0" cy="62" r="9"/><circle cx="46" cy="62" r="9"/>
  </g>

  <!-- antenna from A -->
  <path d="M0 -148 v-26" stroke="{MAGENTA}" stroke-width="8" stroke-linecap="round"/>
  <circle cx="0" cy="-186" r="13" fill="{MAGENTA}"/>

  <!-- launch flame from C -->
  <g>
    <path d="M-30 186 q11 -36 0 -58" fill="none" stroke="{MAGENTA}" stroke-width="10" stroke-linecap="round"/>
    <path d="M0 200 q13 -46 0 -72" fill="none" stroke="{CYAN}" stroke-width="10" stroke-linecap="round"/>
    <path d="M30 186 q11 -36 0 -58" fill="none" stroke="{MAGENTA}" stroke-width="10" stroke-linecap="round"/>
  </g>
</g>
</svg>'''

p = os.path.join(OUT, "mascot-mix.svg")
open(p, "w").write(svg)
print("wrote", p)
