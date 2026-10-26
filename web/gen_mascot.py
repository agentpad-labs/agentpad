#!/usr/bin/env python3
"""Agent Pad mascot generator — deterministic SVG, three directions.

Design rules for the character:
  * silhouette must read at 40px (a shape, not a face)
  * no house heads (that is pons), no capsule-with-one-eye (too generic)
  * three colours only: void, cyan, magenta (+ cream highlight)
  * the body IS a pad: a thing you press, not an animal
"""
import os

OUT = os.path.dirname(os.path.abspath(__file__))

BG = "#070a0d"
INK = "#f2f7f9"
CYAN = "#22f0ff"
MAGENTA = "#ff3ea5"
DIM = "#16323f"


def frame(w=1024, h=1024):
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 512 512">'
        f'<defs>'
        f'<radialGradient id="glow" cx="50%" cy="42%" r="55%">'
        f'<stop offset="0%" stop-color="#0f2b38"/><stop offset="100%" stop-color="{BG}"/>'
        f'</radialGradient>'
        f'<pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">'
        f'<path d="M32 0H0V32" fill="none" stroke="{DIM}" stroke-width="1" opacity="0.35"/>'
        f'</pattern>'
        f'</defs>'
        f'<rect width="512" height="512" fill="url(#glow)"/>'
        f'<rect width="512" height="512" fill="url(#grid)" opacity="0.5"/>'
    )


def close():
    return "</svg>"


def write(name, body):
    p = os.path.join(OUT, f"{name}.svg")
    with open(p, "w") as f:
        f.write(frame() + body + close())
    print("wrote", p)


# ---------------------------------------------------------------- A. cross pad
# Body is a D-pad cross. The d-pad arms double as arms/legs, the centre is the eye.
a = f"""
<g transform="translate(256 250)">
  <path d="M-70 -150 h140 a26 26 0 0 1 26 26 v74 h74 a26 26 0 0 1 26 26 v74 a26 26 0 0 1 -26 26 h-74 v74
           a26 26 0 0 1 -26 26 h-140 a26 26 0 0 1 -26 -26 v-74 h-74 a26 26 0 0 1 -26 -26 v-74
           a26 26 0 0 1 26 -26 h74 v-74 a26 26 0 0 1 26 -26 z"
        fill="#0b1a22" stroke="{CYAN}" stroke-width="10"/>
  <circle cx="0" cy="0" r="46" fill="{CYAN}" opacity="0.16"/>
  <circle cx="0" cy="0" r="30" fill="{INK}"/>
  <circle cx="0" cy="0" r="14" fill="#070a0d"/>
  <circle cx="8" cy="-9" r="5" fill="{CYAN}"/>
  <path d="M-14 46 q14 12 28 0" fill="none" stroke="{MAGENTA}" stroke-width="7" stroke-linecap="round"/>
  <rect x="-52" y="150" width="16" height="52" rx="8" fill="{CYAN}" opacity="0.9"/>
  <rect x="-8" y="150" width="16" height="76" rx="8" fill="{MAGENTA}"/>
  <rect x="36" y="150" width="16" height="52" rx="8" fill="{CYAN}" opacity="0.9"/>
  <path d="M-8 -150 v-26" stroke="{MAGENTA}" stroke-width="8" stroke-linecap="round"/>
  <circle cx="-8" cy="-186" r="13" fill="{MAGENTA}"/>
</g>
"""
write("mascot-A-cross", a)

# ----------------------------------------------------------------- B. keypad
b = f"""
<g transform="translate(256 246)">
  <rect x="-128" y="-120" width="256" height="256" rx="54" fill="#0b1a22" stroke="{CYAN}" stroke-width="10"/>
  <rect x="-96" y="-88" width="192" height="86" rx="24" fill="{INK}"/>
  <circle cx="-34" cy="-45" r="16" fill="#070a0d"/>
  <circle cx="34" cy="-45" r="16" fill="#070a0d"/>
  <circle cx="-30" cy="-49" r="6" fill="{CYAN}"/>
  <circle cx="38" cy="-49" r="6" fill="{CYAN}"/>
  <path d="M-22 22 q22 22 44 0" fill="none" stroke="{MAGENTA}" stroke-width="8" stroke-linecap="round"/>
  <g fill="{CYAN}">
    <circle cx="-72" cy="64" r="12"/><circle cx="-24" cy="64" r="12"/>
    <circle cx="24" cy="64" r="12"/><circle cx="72" cy="64" r="12"/>
  </g>
  <g fill="{MAGENTA}" opacity="0.9">
    <circle cx="-48" cy="102" r="8"/><circle cx="0" cy="102" r="8"/><circle cx="48" cy="102" r="8"/>
  </g>
  <path d="M-128 40 h-30" stroke="{CYAN}" stroke-width="9" stroke-linecap="round"/>
  <path d="M128 40 h30" stroke="{CYAN}" stroke-width="9" stroke-linecap="round"/>
  <g transform="translate(0 -168)">
    <path d="M0 0 v-22" stroke="{MAGENTA}" stroke-width="8" stroke-linecap="round"/>
    <circle cx="0" cy="-38" r="14" fill="{MAGENTA}"/>
  </g>
</g>
"""
write("mascot-B-keypad", b)

# -------------------------------------------------------------- C. launch pad
c = f"""
<g transform="translate(256 258)">
  <path d="M-140 40 h280 a20 20 0 0 1 20 20 v86 a20 20 0 0 1 -20 20 h-280 a20 20 0 0 1 -20 -20 v-86
           a20 20 0 0 1 20 -20 z" fill="#0b1a22" stroke="{CYAN}" stroke-width="10"/>
  <path d="M-96 40 v-56 a96 96 0 0 1 192 0 v56" fill="#0b1a22" stroke="{CYAN}" stroke-width="10"/>
  <rect x="-64" y="-40" width="128" height="66" rx="26" fill="{INK}"/>
  <circle cx="-26" cy="-8" r="15" fill="#070a0d"/>
  <circle cx="26" cy="-8" r="15" fill="#070a0d"/>
  <circle cx="-22" cy="-12" r="5" fill="{MAGENTA}"/>
  <circle cx="30" cy="-12" r="5" fill="{MAGENTA}"/>
  <g fill="{CYAN}">
    <rect x="-92" y="84" width="40" height="14" rx="7"/>
    <rect x="52" y="84" width="40" height="14" rx="7"/>
  </g>
  <g>
    <path d="M-26 166 q10 -34 0 -56" fill="none" stroke="{MAGENTA}" stroke-width="10" stroke-linecap="round"/>
    <path d="M0 178 q12 -42 0 -68" fill="none" stroke="{CYAN}" stroke-width="10" stroke-linecap="round"/>
    <path d="M26 166 q10 -34 0 -56" fill="none" stroke="{MAGENTA}" stroke-width="10" stroke-linecap="round"/>
  </g>
</g>
"""
write("mascot-C-launchpad", c)
