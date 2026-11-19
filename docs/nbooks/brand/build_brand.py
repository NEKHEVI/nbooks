"""Logo NBooks : harfang NEKHEVI v2 (fichiers de Fred, non modifiés) + mot « NBooks » en Geist.

Aucune génération d'image : le symbole est repris tel quel des DECLINAISONS NEKHEVI v2,
le mot est converti en tracés depuis la police Geist (OFL) installée avec le webapp.
Relancer : python docs\\nbooks\\brand\\build_brand.py  (depuis la racine du dépôt)
"""
import io
import os
import re
import shutil

import pymupdf as fitz
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
SRC = r'C:\DEV\CODEGOD\RAWLF\NEKHEVI\ASSETS\LOGO\DECLINAISONS\svg'
FONT = os.path.join(ROOT, 'packages', 'webapp', 'node_modules', '@fontsource-variable', 'geist',
                    'files', 'geist-latin-wght-normal.woff2')
OUT = os.path.join(ROOT, 'docs', 'nbooks', 'brand')
PUBLIC = os.path.join(ROOT, 'packages', 'webapp', 'public', 'nbooks')
SERVER_IMG = os.path.join(ROOT, 'packages', 'server', 'static', 'images')

INK = '#0B0B0C'
PAPER = '#F5F4F1'
COLORS = {
    'fond-sombre': {'n': '#DEA543', 'rest': '#FFFFFF'},
    'fond-clair': {'n': '#BB8221', 'rest': '#0B0B0C'},
}
WEIGHT = 620
WORD = 'NBooks'


def read_svg(name):
    s = open(os.path.join(SRC, name), encoding='utf-8').read()
    vb = [float(v) for v in re.search(r'viewBox="([^"]+)"', s).group(1).split()]
    inner = re.search(r'<g>(.*)</g>', s, re.S).group(1)
    return vb, inner


def word_paths(cap_height, x0, baseline, colors):
    """Tracés SVG du mot, coordonnées SVG (y vers le bas). Retourne (svg, largeur)."""
    font = TTFont(FONT)
    font = instancer.instantiateVariableFont(font, {'wght': WEIGHT})
    gs = font.getGlyphSet()
    cmap = font.getBestCmap()
    upm = font['head'].unitsPerEm
    cap = getattr(font['OS/2'], 'sCapHeight', 0) or int(upm * 0.7)
    scale = cap_height / cap
    tracking = -0.02 * upm
    x = 0.0
    parts = []
    for i, ch in enumerate(WORD):
        gname = cmap[ord(ch)]
        pen = SVGPathPen(gs)
        tpen = TransformPen(pen, (scale, 0, 0, -scale, x0 + x * scale, baseline))
        gs[gname].draw(tpen)
        fill = colors['n'] if i == 0 else colors['rest']
        parts.append(f'<path fill="{fill}" d="{pen.getCommands()}"/>')
        x += gs[gname].width + (tracking if i < len(WORD) - 1 else 0)
    # Largeur réelle : bornes du dernier glyphe.
    last = cmap[ord(WORD[-1])]
    bp = BoundsPen(gs)
    gs[last].draw(bp)
    width = (x - gs[last].width + bp.bounds[2]) * scale
    return '\n'.join(parts), width


def svg_doc(vb, body, title):
    w, h = vb[2], vb[3]
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb[0]:.2f} {vb[1]:.2f} {w:.2f} {h:.2f}" '
            f'width="{round(w)}" height="{round(h)}"><title>{title}</title>{body}</svg>\n')


def render(svg_text, width_px, out_png, background=None):
    doc = fitz.open(stream=svg_text.encode('utf-8'), filetype='svg')
    page = doc[0]
    zoom = width_px / page.rect.width
    pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=background is None)
    img = Image.open(io.BytesIO(pix.tobytes('png'))).convert('RGBA')
    if background:
        bg = Image.new('RGBA', img.size, background)
        bg.alpha_composite(img)
        img = bg
    img.save(out_png)
    return img


def main():
    for d in (OUT, os.path.join(OUT, 'svg'), os.path.join(OUT, 'png'), PUBLIC):
        os.makedirs(d, exist_ok=True)
    made = []

    for variant, colors in COLORS.items():
        vb, sym = read_svg(f'nekhevi-symbole-couleur-{variant}.svg')
        x, y, w, h = vb
        # Symbole seul
        sym_svg = svg_doc(vb, f'<g>{sym}</g>', f'NBooks symbole {variant}')
        # Mot seul et horizontal : hauteur de capitale = 40 % du symbole, centré verticalement.
        cap = h * 0.40
        gap = h * 0.20
        baseline = y + h / 2 + cap / 2
        word, ww = word_paths(cap, x + w + gap, baseline, colors)
        hz_vb = [x, y, w + gap + ww + h * 0.02, h]
        hz_svg = svg_doc(hz_vb, f'<g>{sym}</g><g>{word}</g>', f'NBooks horizontal {variant}')
        word_only, ww2 = word_paths(cap, 0, cap, colors)
        mot_svg = svg_doc([0, -cap * 0.02, ww2, cap * 1.04], f'<g>{word_only}</g>', f'NBooks mot {variant}')
        for kind, text in (('symbole', sym_svg), ('horizontal', hz_svg), ('mot', mot_svg)):
            name = f'nbooks-{kind}-{variant}'
            p = os.path.join(OUT, 'svg', name + '.svg')
            open(p, 'w', encoding='utf-8').write(text)
            shutil.copy(p, os.path.join(PUBLIC, name + '.svg'))
            render(text, 1200, os.path.join(OUT, 'png', name + '-1200.png'))
            made.append(name)

    # Icône d'application : symbole simplifié A sur une tuile graphite.
    vb, sym_a = read_svg('propositions-petite-taille/nekhevi-symbole-simplifie-A-couleur-fond-sombre.svg')
    x, y, w, h = vb

    def tile_svg(safe, radius_ratio):
        side = w / safe
        cx, cy = x + w / 2, y + h / 2
        tx, ty = cx - side / 2, cy - side / 2
        r = side * radius_ratio
        body = (f'<rect x="{tx:.2f}" y="{ty:.2f}" width="{side:.2f}" height="{side:.2f}" rx="{r:.2f}" fill="{INK}"/>'
                f'<g>{sym_a}</g>')
        return svg_doc([tx, ty, side, side], body, 'NBooks icone')

    icon = tile_svg(0.70, 0.22)
    maskable = tile_svg(0.56, 0.0)
    open(os.path.join(OUT, 'svg', 'nbooks-icone.svg'), 'w', encoding='utf-8').write(icon)
    open(os.path.join(PUBLIC, 'favicon.svg'), 'w', encoding='utf-8').write(icon)
    for size in (192, 512):
        render(icon, size, os.path.join(PUBLIC, f'icon-{size}.png'))
    render(maskable, 512, os.path.join(PUBLIC, 'icon-maskable-512.png'))
    render(tile_svg(0.66, 0.0), 180, os.path.join(PUBLIC, 'apple-touch-icon.png'), background=INK)
    ico = render(icon, 256, os.path.join(OUT, 'png', 'nbooks-icone-256.png'))
    ico.save(os.path.join(PUBLIC, 'favicon.ico'), sizes=[(16, 16), (32, 32), (48, 48)])
    render(icon, 32, os.path.join(PUBLIC, 'favicon-32.png'))

    # Logo des courriels et des PDF (papier blanc) : horizontal fond clair, PNG transparent.
    os.makedirs(SERVER_IMG, exist_ok=True)
    shutil.copy(os.path.join(OUT, 'png', 'nbooks-horizontal-fond-clair-1200.png'),
                os.path.join(SERVER_IMG, 'nbooks-logo.png'))
    shutil.copy(os.path.join(OUT, 'svg', 'nbooks-horizontal-fond-clair.svg'),
                os.path.join(SERVER_IMG, 'nbooks-logo.svg'))
    print('OK', len(made), 'logos +', 'icones ->', PUBLIC)


if __name__ == '__main__':
    main()
