#!/usr/bin/env python3
"""Generate PWA PNG icons (no third-party deps)."""

from __future__ import annotations

import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "icons"


def chunk(tag: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)


def write_png(path: Path, size: int, rgba: bytes) -> None:
    raw = b""
    stride = size * 4
    for y in range(size):
        raw += b"\x00" + rgba[y * stride : (y + 1) * stride]
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    path.write_bytes(
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def in_poly(x: float, y: float, pts: list[tuple[float, float]]) -> bool:
    inside = False
    j = len(pts) - 1
    for i, (xi, yi) in enumerate(pts):
        xj, yj = pts[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi + 1e-9) + xi:
            inside = not inside
        j = i
    return inside


def circle(x: float, y: float, cx: float, cy: float, r: float) -> bool:
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r


def render(size: int) -> bytes:
    # Top-down airliner pointing up-right (leave / depart).
    fuselage = [
        (0.34, 0.66),
        (0.38, 0.58),
        (0.58, 0.38),
        (0.70, 0.30),
        (0.74, 0.34),
        (0.62, 0.44),
        (0.42, 0.68),
        (0.36, 0.70),
    ]
    wing = [
        (0.36, 0.48),
        (0.18, 0.40),
        (0.22, 0.50),
        (0.46, 0.56),
        (0.70, 0.66),
        (0.64, 0.58),
        (0.48, 0.52),
    ]
    tail = [
        (0.34, 0.62),
        (0.22, 0.58),
        (0.26, 0.66),
        (0.38, 0.68),
    ]
    out = bytearray(size * size * 4)
    for y in range(size):
        for x in range(size):
            u, v = x / (size - 1), y / (size - 1)
            # Dark navy with a faint blue glow in the upper-right.
            t = ((u - 0.3) ** 2 + (v - 0.25) ** 2) ** 0.5
            r = int(lerp(8, 20, 1 - min(t, 1)))
            g = int(lerp(10, 36, 1 - min(t, 1)))
            b = int(lerp(16, 64, 1 - min(t, 1)))
            if circle(u, v, 0.50, 0.50, 0.36) and not circle(u, v, 0.50, 0.50, 0.30):
                r, g, b = 10, 132, 255
            if in_poly(u, v, fuselage) or in_poly(u, v, wing) or in_poly(u, v, tail):
                r, g, b = 242, 242, 247
            # Small clock pip (leave-by)
            if circle(u, v, 0.72, 0.28, 0.07):
                r, g, b = 48, 209, 88
            i = (y * size + x) * 4
            out[i : i + 4] = bytes((r, g, b, 255))
    return bytes(out)


def main() -> None:
    ROOT.mkdir(parents=True, exist_ok=True)
    for name, size in (("apple-touch-icon.png", 180), ("icon-192.png", 192), ("icon-512.png", 512)):
        write_png(ROOT / name, size, render(size))
        print(f"wrote {name} ({size}x{size})")


if __name__ == "__main__":
    main()
