"""JSON-backed research portfolio. Run locally with python app.py."""
import json
from pathlib import Path
from flask import Flask, abort, render_template, send_from_directory

ROOT = Path(__file__).resolve().parent
app = Flask(__name__)


def read_data(name):
    with (ROOT / 'data' / f'{name}.json').open(encoding='utf-8') as source:
        return json.load(source)


@app.context_processor
def shared_context():
    return {'nav_items': [('index', 'Home'), ('about', 'About'),
                         ('research', 'Research'), ('projects', 'Projects'),
                         ('publications', 'Publications'), ('journey', 'Journey'),
                         ('contact', 'Contact')],
            'profile': read_data('profile')}


@app.get('/')
def intro():
    return render_template('intro.html', title='Welcome')


@app.get('/asset/icon.webp')
def intro_avatar():
    # The supplied .webp file contains PNG data. Keep its bytes unchanged.
    return send_from_directory(ROOT / 'asset', 'icon.webp', mimetype='image/png')


@app.get('/asset/<filename>')
def door_flower(filename):
    if filename not in {'flower01.webp', 'flower03.webp'}:
        abort(404)
    # Like the portrait, these supplied .webp files contain transparent PNGs.
    return send_from_directory(ROOT / 'asset', filename, mimetype='image/png')


@app.get('/home')
def index():
    return render_template('index.html', page='home', title='Human-centered research',
                           projects=[p for p in read_data('projects') if p.get('featured')][:4],
                           research=read_data('research'), publications=read_data('publications'),
                           timeline=read_data('timeline'))


@app.get('/about')
def about():
    return render_template('about.html', page='about', title='About', timeline=read_data('timeline'), research=read_data('research'))


@app.get('/research')
def research():
    return render_template('research.html', page='research', title='Research', research=read_data('research'), projects=read_data('projects'))


@app.get('/projects')
def projects():
    return render_template('projects.html', page='projects', title='Projects', projects=read_data('projects'))


@app.get('/projects/<project_id>')
def project_detail(project_id):
    projects = read_data('projects')
    project = next((p for p in projects if p['id'] == project_id), None)
    if project is None:
        abort(404)
    return render_template('project_detail.html', page='projects', title=project['title'], project=project,
                           projects=[p for p in projects if p['id'] != project_id][:2])


@app.get('/publications')
def publications():
    return render_template('publications.html', page='publications', title='Publications', publications=read_data('publications'))


@app.get('/journey')
def journey():
    return render_template('journey.html', page='journey', title='Journey', timeline=read_data('timeline'))


@app.get('/contact')
def contact():
    return render_template('contact.html', page='contact', title='Contact')


@app.errorhandler(404)
def not_found(error):
    return render_template('404.html', page='home', title='Page not found'), 404


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=False)
