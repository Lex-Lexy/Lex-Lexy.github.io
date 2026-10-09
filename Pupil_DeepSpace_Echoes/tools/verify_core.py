"""Verify that the preserved original jelly/collision core has not changed."""
from pathlib import Path
import hashlib
import re

root = Path(__file__).resolve().parents[1]
expected = 'e6bad86dcef521b818b3e6a34b6b7b727e901aa812863d02b76b4177957aeb37'
actual = hashlib.sha256((root / 'js/physics.js').read_bytes()).hexdigest()
assert actual == expected, 'Original soft-body/collision core changed'
source = (root / 'js/config.js').read_text()
constants = {
    'PLAYER_R': 24, 'PLAYER_HIT_R': 7, 'ENEMY_SIZE': 42, 'ENEMY_HIT_R': 14,
    'BLOB_VERTS': 32, 'BLOB_SPRING': 120, 'BLOB_DAMP': 8,
    'BLOB_PUSH': .35, 'BLOB_MAX_OFF': 1.35, 'BLOB_MEMBRANE_WOBBLE': .045,
}
for name, value in constants.items():
    match = re.search(r'\b' + name + r'\s*=\s*([\d.]+)', source)
    assert match and float(match[1]) == value, f'{name} changed'
print('Original soft-body core and all collision/elastic constants preserved.')
