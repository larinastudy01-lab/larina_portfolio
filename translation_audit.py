"""List rendered text to audit the bilingual dictionary (no browser required)."""
from html.parser import HTMLParser
from app import app, read_data
import json
import re
from pathlib import Path


class Text(HTMLParser):
    def __init__(self):
        super().__init__()
        self.values = set()
        self.skip = 0

    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style', 'code', 'pre'):
            self.skip += 1
        for key, value in attrs:
            if key in ('placeholder', 'aria-label', 'data-reflection'):
                self.values.add(value)

    def handle_endtag(self, tag):
        if tag in ('script', 'style', 'code', 'pre'):
            self.skip -= 1

    def handle_data(self, text):
        value = ' '.join(text.split())
        if not self.skip and any(c.isalpha() for c in value):
            self.values.add(value)


def rendered_strings():
    parser = Text()
    with app.test_client() as client:
        for route in ['/', '/home', '/about', '/research', '/projects', '/publications', '/journey', '/contact', '/missing'] + ['/projects/' + p['id'] for p in read_data('projects')]:
            parser.feed(client.get(route).get_data(as_text=True))
    return parser.values


if __name__ == '__main__':
    pairs = json.loads((Path(__file__).parent / 'static/i18n/translations.json').read_text(encoding='utf-8'))
    known = {value for pair in pairs for value in pair}
    preserved = {'AI', 'LARINA', 'LC', 'Larina.', 'Yen-Yu Chen', '陳彥妤',
                 'Yen-Yu Chen / 陳彥妤', 'Yen-Yu Chen · 陳彥妤', 'V1', 'EN',
                 'React', 'Node.js', 'Supabase / PostgreSQL', 'OpenAI API',
                 'Recharts', 'pgvector', 'RReliefF', 'GitHub', 'LinkedIn',
                 'SRT', 'PM', 'CBT', 'SSG', 'DCCS', 'LB',
                 'IIAI AAI 2026', 'you@example.com', 'Switch to English',
                 'Yen-Yu Chen, Han-Zhong Guo, Wen-Chun Lin, Chih-Kai Chang'}

    def covered(value):
        if value in known or value in preserved:
            return True
        if re.fullmatch(r'\d+ projects?', value):
            return True
        if ' — Larina / Yen-Yu Chen' in value:
            return covered(value.removesuffix(' — Larina / Yen-Yu Chen'))
        if value.startswith('← '):
            return covered(value[2:])
        if value.endswith((' ↗', ' →')):
            return covered(value[:-2])
        version = re.fullmatch(r'(.*) / (V1|2026)', value)
        if version:
            return covered(version[1])
        for separator in [' · ', ' → ', ' / ']:
            if separator in value:
                return all(covered(part) or part.isnumeric() for part in value.split(separator))
        return False

    missing = sorted(value for value in rendered_strings() if not covered(value))
    print(json.dumps(missing, ensure_ascii=False, indent=2))
    assert not missing, 'Untranslated rendered text remains'
    print(f'PASS: translation coverage for {len(rendered_strings())} rendered strings; {len(pairs)} bilingual entries.')
