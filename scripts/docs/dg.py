# -*- coding: utf-8 -*-
"""Karvan BRD diaqramları üçün kiçik SVG generatoru."""
BRAND="#D6127E"; INK="#1F2227"; MUTED="#6B7280"; LINE="#C9CDD4"
SOFT="#F7F8FA"; BRANDBG="#FFF5FA"; GREY="#6B7280"; GHOST="#9AA1AC"
FONT="DejaVu Sans, Segoe UI, Arial, sans-serif"

HEAD = '''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" font-family="{f}">
<defs>
<marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="{g}"/></marker>
<marker id="ab" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="{b}"/></marker>
<marker id="ad" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="{gh}"/></marker>
</defs>
<rect width="{w}" height="{h}" fill="#FFFFFF"/>'''

def esc(s):
    return s.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;")

class D:
    def __init__(self, w, h, title=None, sub=None):
        self.w, self.h = w, h
        self.p = [HEAD.format(w=w, h=h, f=FONT, g=GREY, b=BRAND, gh=GHOST)]
        if title:
            self.p.append(f'<text x="60" y="54" font-size="27" font-weight="700" fill="{INK}">{esc(title)}</text>')
            if sub:
                self.p.append(f'<text x="60" y="84" font-size="16" fill="{MUTED}">{esc(sub)}</text>')
            self.p.append(f'<line x1="60" y1="102" x2="{w-60}" y2="102" stroke="#E3E5E9" stroke-width="2"/>')

    def box(self, x, y, w, h, title, sub=None, kind="n", r=10, ts=18, ss=14):
        fill, stroke, tc, dash = SOFT, LINE, INK, ""
        if kind == "brand": fill, stroke, tc = BRANDBG, BRAND, BRAND
        elif kind == "w": fill = "#FFFFFF"
        elif kind == "ghost":
            fill, stroke, tc, dash = "#FFFFFF", GHOST, MUTED, ' stroke-dasharray="7 6"'
        elif kind == "ok": fill, stroke, tc = "#F2FBF5", "#58A86B", "#246B38"
        elif kind == "warn": fill, stroke, tc = "#FFF7ED", "#D9962B", "#92540A"
        self.p.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke}" stroke-width="2"{dash}/>')
        cx = x + w / 2
        if sub:
            self.p.append(f'<text x="{cx}" y="{y+h/2-3}" font-size="{ts}" font-weight="700" fill="{tc}" text-anchor="middle">{esc(title)}</text>')
            self.p.append(f'<text x="{cx}" y="{y+h/2+20}" font-size="{ss}" fill="{MUTED}" text-anchor="middle">{esc(sub)}</text>')
        else:
            self.p.append(f'<text x="{cx}" y="{y+h/2+6}" font-size="{ts}" font-weight="700" fill="{tc}" text-anchor="middle">{esc(title)}</text>')
        return (x, y, w, h)

    def lines(self, x, y, items, size=15, lh=22, color=MUTED, anchor="start", weight="400"):
        for k, it in enumerate(items):
            self.p.append(f'<text x="{x}" y="{y+k*lh}" font-size="{size}" fill="{color}" text-anchor="{anchor}" font-weight="{weight}">{esc(it)}</text>')

    def diamond(self, cx, cy, w, h, title, sub=None):
        pts = f"{cx},{cy-h/2} {cx+w/2},{cy} {cx},{cy+h/2} {cx-w/2},{cy}"
        self.p.append(f'<polygon points="{pts}" fill="#FFFFFF" stroke="{LINE}" stroke-width="2"/>')
        if sub:
            self.p.append(f'<text x="{cx}" y="{cy-2}" font-size="16" font-weight="700" fill="{INK}" text-anchor="middle">{esc(title)}</text>')
            self.p.append(f'<text x="{cx}" y="{cy+18}" font-size="13" fill="{MUTED}" text-anchor="middle">{esc(sub)}</text>')
        else:
            self.p.append(f'<text x="{cx}" y="{cy+5}" font-size="16" font-weight="700" fill="{INK}" text-anchor="middle">{esc(title)}</text>')

    def arrow(self, pts, dashed=False, color=None, both=False, width=2):
        color = color or GREY
        mk = "a" if color == GREY else ("ab" if color == BRAND else "ad")
        d = "M" + " L".join(f"{x} {y}" for x, y in pts)
        dash = ' stroke-dasharray="7 6"' if dashed else ""
        start = f' marker-start="url(#{mk})"' if both else ""
        self.p.append(f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{width}"{dash} marker-end="url(#{mk})"{start}/>')

    def label(self, x, y, text, size=14, color=INK, anchor="start", weight="400", bg=False):
        if bg:
            wpx = len(text) * size * 0.56 + 12
            x0 = x - 6 if anchor == "start" else (x - wpx / 2 if anchor == "middle" else x - wpx + 6)
            self.p.append(f'<rect x="{x0}" y="{y-size}" width="{wpx}" height="{size+8}" fill="#FFFFFF" opacity="0.92"/>')
        self.p.append(f'<text x="{x}" y="{y}" font-size="{size}" fill="{color}" text-anchor="{anchor}" font-weight="{weight}">{esc(text)}</text>')

    def legend(self, x, y, items, w=330):
        h = 34 + 26 * len(items)
        self.p.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="10" fill="#FAFBFC" stroke="#E3E5E9" stroke-width="2"/>')
        self.p.append(f'<text x="{x+22}" y="{y+28}" font-size="15" font-weight="700" fill="{INK}">İşarələr</text>')
        for k, (kind, txt) in enumerate(items):
            yy = y + 52 + k * 26
            if kind == "solid":
                self.p.append(f'<line x1="{x+22}" y1="{yy-5}" x2="{x+72}" y2="{yy-5}" stroke="{GREY}" stroke-width="2" marker-end="url(#a)"/>')
            elif kind == "dash":
                self.p.append(f'<line x1="{x+22}" y1="{yy-5}" x2="{x+72}" y2="{yy-5}" stroke="{GHOST}" stroke-width="2" stroke-dasharray="7 6" marker-end="url(#ad)"/>')
            else:
                self.p.append(f'<rect x="{x+22}" y="{yy-16}" width="50" height="16" rx="5" fill="{BRANDBG}" stroke="{BRAND}" stroke-width="2"/>')
            self.p.append(f'<text x="{x+86}" y="{yy}" font-size="14" fill="#4B5563">{esc(txt)}</text>')

    def save(self, path):
        self.p.append("</svg>")
        open(path, "w", encoding="utf-8").write("\n".join(self.p))
        return path
