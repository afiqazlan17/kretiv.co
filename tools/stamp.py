# Stamps every /css and /js link in the site's HTML with ?v=<content hash>, so browsers fetch a
# changed file instead of running a cached copy. Run after editing any CSS or JS.
import hashlib, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
REF = re.compile(r'((?:href|src)="/((?:css|js)/[\w.-]+\.(?:css|js)))(?:\?v=[0-9a-f]*)?"')

def digest(rel):
    return hashlib.md5((ROOT / rel).read_bytes()).hexdigest()[:8]

for page in sorted(ROOT.rglob('*.html')):
    if {'.git', 'video', 'tools'} & set(page.relative_to(ROOT).parts):
        continue
    html = page.read_text()
    out = REF.sub(lambda m: f'{m.group(1)}?v={digest(m.group(2))}"', html)
    if out != html:
        page.write_text(out)
        print('stamped', page.relative_to(ROOT))
