"""Inline local styles, scripts and fonts for offline single-file distribution."""
from pathlib import Path
import re, base64
root=Path(__file__).resolve().parents[1]
out=root/'standalone';out.mkdir(exist_ok=True)
def inline_styles(m):
 path=root/m.group(1);css=path.read_text()
 def font(m):
  data=(path.parent/m.group(1)).resolve().read_bytes()
  return 'url("data:font/woff;base64,'+base64.b64encode(data).decode()+'")'
 css=re.sub(r"url\(['\"]?([^'\")]+\.woff)['\"]?\)",font,css)
 return '<style>'+css+'</style>'
def inline_script(m):return '<script>\n'+(root/m.group(1)).read_text()+'\n</script>'
for name in ['pupil.html','cheat.html']:
 s=(root/name).read_text();s=re.sub(r'<link rel="stylesheet" href="([^"]+)">',inline_styles,s)
 s=re.sub(r'<script src="([^"]+)"></script>',inline_script,s)
 (out/name).write_text(s)
 print(name,len(s.encode('utf-8')))
