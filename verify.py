"""Run route, template, data and local-asset smoke checks with no extra packages."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit
from app import app, read_data


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if name in ('href', 'src') and value and value.startswith('/'):
                self.urls.append(urlsplit(value).path)


def verify():
    app.config['TESTING'] = True
    projects = read_data('projects')
    assert len({p['id'] for p in projects}) == len(projects), 'Duplicate project IDs'
    routes = ['/', '/home', '/about', '/research', '/projects', '/publications', '/journey', '/contact']
    routes += ['/projects/' + p['id'] for p in projects]
    assets = set()
    with app.test_client() as client:
        for route in routes:
            response = client.get(route)
            assert response.status_code == 200, route
            html = response.get_data(as_text=True)
            assert '<html lang="zh-Hant">' in html, route
            assert '<title>' in html and 'id="main"' in html, route
            parser = Links()
            parser.feed(html)
            assets.update(parser.urls)
            print('PASS', route)
        for url in sorted(assets):
            assert client.get(url).status_code == 200, 'Broken local link: ' + url
        entrance = client.get('/').get_data(as_text=True)
        assert 'id="intro-enter"' in entrance and 'href="/home"' in entrance
        assert 'class="hero container"' in client.get('/home').get_data(as_text=True)
        avatar = client.get('/asset/icon.webp')
        assert avatar.mimetype == 'image/png' and avatar.data.startswith(b'\x89PNG\r\n\x1a\n')
        for url in ['/does-not-exist', '/projects/does-not-exist']:
            response = client.get(url)
            assert response.status_code == 404
            assert 'A SMALL DETOUR' in response.get_data(as_text=True)
        assert client.post('/contact').status_code == 405
        # New JSON entries must use the generic route and template without HTML edits.
        source_loader = app.view_functions['project_detail'].__globals__['read_data']
        prototype = dict(projects[0], id='new-project-check', title='New project check')
        app.view_functions['project_detail'].__globals__['read_data'] = lambda name: projects + [prototype] if name == 'projects' else source_loader(name)
        try:
            assert client.get('/projects/new-project-check').status_code == 200
        finally:
            app.view_functions['project_detail'].__globals__['read_data'] = source_loader
    for path in (Path(__file__).parent / 'data').glob('*.json'):
        read_data(path.stem)
    print(f'PASS: {len(routes)} pages, {len(assets)} local links/assets, custom 404s, JSON extension, demo POST disabled.')


if __name__ == '__main__':
    verify()
