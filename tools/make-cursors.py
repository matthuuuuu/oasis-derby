"""
Builds the mouse cursor from assets/cursors/glove-source.png (the white glove).

    python tools/make-cursors.py        (needs Pillow:  pip install pillow)

The picture is used as-is: only the white background around the glove is made
see-through (the glove itself stays exactly as drawn), then it is resized to
cursor size. Makes, in assets/cursors/:
  glove.png      32px cursor
  glove@2x.png   64px copy for sharp (high-resolution) screens
and prints the hotspot (the tip of the pointing finger) for css/styles.css.
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets' / 'cursors'
SRC = OUT / 'glove-source.png'
SIZE = 32  # cursor size in CSS pixels


def cut_out(img):
    """White background around the glove -> transparent; crop to the glove."""
    rgb = img.convert('RGB')
    gray = rgb.convert('L')
    w, h = rgb.size
    # flood the outside from every edge pixel that isn't part of the black outline
    mask = gray.point(lambda v: 0 if v < 128 else 255)
    for x in range(w):
        for y in (0, h - 1):
            if mask.getpixel((x, y)) == 255:
                ImageDraw.floodfill(mask, (x, y), 128)
    for y in range(h):
        for x in (0, w - 1):
            if mask.getpixel((x, y)) == 255:
                ImageDraw.floodfill(mask, (x, y), 128)
    out = Image.new('RGBA', (w, h))
    po, pm, pg, pr = out.load(), mask.load(), gray.load(), rgb.load()
    for y in range(h):
        for x in range(w):
            if pm[x, y] == 128:  # outside the glove: see-through (keeping the outline's soft edge)
                po[x, y] = (0, 0, 0, 255 - pg[x, y])
            else:  # the glove itself, exactly as drawn
                r, g, b = pr[x, y]
                po[x, y] = (r, g, b, 255)
    return out.crop(out.getbbox())


def build():
    glove = cut_out(Image.open(SRC))
    k = SIZE / max(glove.size)  # the glove fills the whole cursor
    w, h = round(glove.width * k), round(glove.height * k)
    # hotspot = the tip of the pointing finger (the glove's leftmost point)
    a = glove.getchannel('A').load()
    tip = next(x for x in range(glove.width) if any(a[x, y] > 128 for y in range(glove.height)))
    ys = [y for y in range(glove.height) if a[tip, y] > 128]
    hot = (round(tip * k), round(sum(ys) / len(ys) * k))
    for scale, name in ((1, 'glove.png'), (2, 'glove@2x.png')):
        c = Image.new('RGBA', (SIZE * scale, SIZE * scale), (0, 0, 0, 0))
        c.alpha_composite(glove.resize((w * scale, h * scale), Image.LANCZOS), (0, 0))
        c.save(OUT / name)
    print('hotspot', hot[0], hot[1])


if __name__ == '__main__':
    build()
