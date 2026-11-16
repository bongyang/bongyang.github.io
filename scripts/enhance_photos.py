"""Gently clean up photos for the site and save them as WebP + JPEG.

Usage:
  python3 scripts/enhance_photos.py OUTDIR SOURCE NAME [SOURCE NAME ...] [--sizes 800,1600]

Without --sizes: writes OUTDIR/NAME.webp and OUTDIR/NAME.jpg at the photo's own size.
With --sizes:    writes OUTDIR/NAME-800.webp, OUTDIR/NAME-1600.webp (and .jpg), one
                 pair per width. Used for the full-width banner.

What it does (and does not do):
- Light denoising to soften JPEG block artefacts from re-compressed copies
  (e.g. photos saved from LinkedIn), then a mild unsharp mask.
- When a requested width is larger than the source, it upscales with Lanczos
  and a light sharpen. This makes small copies look less soft on big screens;
  it cannot add real detail.
- No cropping, recolouring or retouching: the picture stays the same.
- Strips metadata (EXIF, GPS) from the output.

When you have the original camera files, run them through this script instead;
they will look noticeably better than the LinkedIn copies.
Needs: pip install opencv-python-headless pillow
"""
import os
import sys

import cv2
from PIL import Image


def clean(img):
    img = cv2.fastNlMeansDenoisingColored(img, None, 3, 3, 7, 21)
    blur = cv2.GaussianBlur(img, (0, 0), 1.1)
    return cv2.addWeighted(img, 1.5, blur, -0.5, 0)


def to_width(img, w):
    h0, w0 = img.shape[:2]
    if w == w0:
        return img
    h = round(h0 * w / w0)
    if w < w0:
        return cv2.resize(img, (w, h), interpolation=cv2.INTER_AREA)
    up = cv2.resize(img, (w, h), interpolation=cv2.INTER_LANCZOS4)
    blur = cv2.GaussianBlur(up, (0, 0), 1.6)
    return cv2.addWeighted(up, 1.35, blur, -0.35, 0)


def save(img, path):
    pil = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
    pil.save(path + '.webp', 'WEBP', quality=80, method=6)
    pil.save(path + '.jpg', 'JPEG', quality=82, optimize=True, progressive=True)
    print(f'{os.path.basename(path)}: {pil.width}x{pil.height}')


def main(argv):
    sizes = None
    if '--sizes' in argv:
        k = argv.index('--sizes')
        sizes = [int(s) for s in argv[k + 1].split(',')]
        argv = argv[:k] + argv[k + 2:]
    if len(argv) < 3 or len(argv) % 2 == 0:
        sys.exit(__doc__)
    out, pairs = argv[0], argv[1:]
    os.makedirs(out, exist_ok=True)
    for i in range(0, len(pairs), 2):
        src, name = pairs[i], pairs[i + 1]
        img = cv2.imread(src, cv2.IMREAD_COLOR)
        if img is None:
            sys.exit(f'Cannot read {src}')
        img = clean(img)
        if sizes:
            for w in sizes:
                save(to_width(img, w), os.path.join(out, f'{name}-{w}'))
        else:
            save(img, os.path.join(out, name))


if __name__ == '__main__':
    main(sys.argv[1:])
