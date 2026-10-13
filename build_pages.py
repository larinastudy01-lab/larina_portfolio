"""Export the Flask portfolio as a static GitHub Pages site."""
import argparse
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
import re
import shutil
from urllib.parse import quote, unquote, urlsplit, urlunsplit

from app import ROOT, app, read_data

URL_ATTRIBUTES = {'href', 'src', 'action', 'poster', 'data-dictionary',
                  'data-svg-zh', 'data-svg-en'}
ATTRIBUTE = re.compile(
    r'(?P<attribute>\b(?:href|src|action|poster|content|data-dictionary|data-svg-zh|data-svg-en)\s*=\s*)'
    r'(?P<quote>[\"\'])(?P<url>/(?!/)[^\"\']*)(?P=quote)')


class LocalLinks(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []

    def handle_starttag(self, tag, attrs):
        self.urls.extend(value for name, value in attrs
                         if name in URL_ATTRIBUTES and value)


def build(base_url):
    parsed = urlsplit(base_url)
    if parsed.scheme not in {'http', 'https'} or not parsed.netloc or parsed.query or parsed.fragment:
        raise ValueError('--base-url must be an absolute HTTP(S) site URL')
    base_path = parsed.path.rstrip('/')
    origin = urlunsplit((parsed.scheme, parsed.netloc, '', '', ''))
    base_url = origin + base_path
    routes = ['/', '/home', '/about', '/research', '/projects',
              '/publications', '/journey', '/contact']
    routes += ['/projects/' + project['id'] for project in read_data('projects')]
    route_set = set(routes)
    output = ROOT / '_site'
    output.mkdir(exist_ok=True)

    def published_path(route):
        return base_path + (route.rstrip('/') + '/' if route != '/' else '/')

    def rewrite(match):
        url = urlsplit(unescape(match['url']))
        path = published_path(url.path) if url.path in route_set else base_path + url.path
        value = urlunsplit(('', '', path, url.query, url.fragment))
        return match['attribute'] + match['quote'] + value + match['quote']

    app.config['TESTING'] = True
    with app.test_client() as client:
        for route in routes + ['/__static_404__']:
            response = client.get(route, base_url=origin)
            expected = 404 if route == '/__static_404__' else 200
            if response.status_code != expected:
                raise RuntimeError(f'Cannot render {route}: HTTP {response.status_code}')
            html = ATTRIBUTE.sub(rewrite, response.get_data(as_text=True))
            canonical = base_url + '/404.html' if expected == 404 else origin + published_path(route)
            html = re.sub(r'(<meta property="og:url" content=")[^"]*(">)',
                          lambda match: match[1] + canonical + match[2], html)
            target = output / '404.html' if expected == 404 else output / route.strip('/') / 'index.html'
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(html, encoding='utf-8')

    for folder in ['static', 'asset']:
        shutil.copytree(ROOT / folder, output / folder, dirs_exist_ok=True)
    (output / '.nojekyll').touch()
    sitemap = ['<?xml version="1.0" encoding="UTF-8"?>',
               '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    sitemap += [f'  <url><loc>{origin}{quote(published_path(route), safe="/")}</loc></url>'
                for route in routes]
    sitemap.append('</urlset>')
    (output / 'sitemap.xml').write_text('\n'.join(sitemap) + '\n', encoding='utf-8')
    (output / 'robots.txt').write_text(f'User-agent: *\nAllow: /\nSitemap: {base_url}/sitemap.xml\n', encoding='utf-8')

    # Check the actual exported pages, including alternate-language diagrams and fetch URLs.
    checked = set()
    for page in output.rglob('*.html'):
        parser = LocalLinks()
        parser.feed(page.read_text(encoding='utf-8'))
        for value in parser.urls:
            url = urlsplit(value)
            if url.scheme or url.netloc or not url.path.startswith('/'):
                continue
            if base_path and not url.path.startswith(base_path + '/'):
                raise RuntimeError(f'Link escapes the site path in {page}: {value}')
            relative = unquote(url.path[len(base_path):]).lstrip('/')
            target = output / relative
            if target.is_dir():
                target /= 'index.html'
            if not target.is_file():
                raise RuntimeError(f'Broken exported link in {page}: {value}')
            checked.add(url.path)
    print(f'Exported {len(routes)} pages and custom 404 to {output}')
    print(f'Verified {len(checked)} local page, image, stylesheet, script, and data URLs')
    print(f'Site URL: {base_url}/')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-url', required=True, help='Public URL, including the repository path')
    build(parser.parse_args().base_url)
