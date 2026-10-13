const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('static/js/previews.js', 'utf8');
const classify = vm.runInNewContext(
  source.slice(source.indexOf('  function resource'), source.indexOf('  function viewer')) + ';resource',
  { URL, location: { href: 'http://127.0.0.1:5000/', origin: 'http://127.0.0.1:5000' } }
);
let count = 0;
for (const project of JSON.parse(fs.readFileSync('data/projects.json', 'utf8'))) {
  for (const link of project.links || []) {
    if (/youtu|drive.google/.test(link.url)) {
      assert.ok(classify(link.url), link.url);
      count++;
    }
  }
}
assert.equal(classify('https://youtu.be/tvgUO9hY3Fw?t=1m30s').src,
  'https://www.youtube-nocookie.com/embed/tvgUO9hY3Fw?start=90');
assert.equal(classify('javascript:alert(1)'), null);
assert.equal(classify('https://youtube.com.evil.test/watch?v=tvgUO9hY3Fw'), null);
assert.equal(classify('/static/files/collocation-errors-paper.pdf').type, 'document');
assert.equal(classify('/static/images/research/fukui-conference.jpg').type, 'image');
assert.equal(classify('https://drive.google.com/open?id=abc&resourcekey=xyz').src,
  'https://drive.google.com/file/d/abc/preview?resourcekey=xyz');
console.log(`PASS: ${count} existing video/Drive links, PDF, image, timestamp and URL checks.`);
