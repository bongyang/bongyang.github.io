"""Gently clean up a photo for the gallery and save it as WebP + JPEG.

Usage:  python3 scripts/enhance_photos.py SOURCE.jpg NAME [SOURCE.jpg NAME ...]
Writes: assets/img/gallery/NAME.webp and assets/img/gallery/NAME.jpg

What it does (and does not do):
- Light denoising to soften JPEG block artefacts from re-compressed copies
  (e.g. photos saved from LinkedIn), then a mild unsharp mask.
- No cropping, resizing, recolouring or retouching: the picture stays the same.
- Strips metadata (EXIF, GPS) from the output.

When you have the original camera files, run them through this script instead;
they will look noticeably better than the LinkedIn copies.
Needs: pip install opencv-python-headless pillow
"""
import os
import sys

import cv2
from PIL import Image

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'img', 'gallery')
MAX_SIDE = 1600  # only shrinks very large originals; never enlarges


def enhance(src, name):
    img = cv2.imread(src, cv2.IMREAD_COLOR)
    if img is None:
        sys.exit(f'Cannot read {src}')
    h, w = img.shape[:2]
    if max(h, w) > MAX_SIDE:
        s = MAX_SIDE / max(h, w)
        img = cv2.resize(img, (round(w * s), round(h * s)), interpolation=cv2.INTER_AREA)
    img = cv2.fastNlMeansDenoisingColored(img, None, 3, 3, 7, 21)
    blur = cv2.GaussianBlur(img, (0, 0), 1.1)
    img = cv2.addWeighted(img, 1.5, blur, -0.5, 0)
    pil = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
    os.makedirs(OUT, exist_ok=True)
    pil.save(os.path.join(OUT, name + '.webp'), 'WEBP', quality=82, method=6)
    pil.save(os.path.join(OUT, name + '.jpg'), 'JPEG', quality=84, optimize=True, progressive=True)
    print(f'{name}: {pil.width}x{pil.height}')


if __name__ == '__main__':
    args = sys.argv[1:]
    if not args or len(args) % 2:
        sys.exit(__doc__)
    for i in range(0, len(args), 2):
        enhance(args[i], args[i + 1])
