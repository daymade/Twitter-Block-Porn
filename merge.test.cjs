const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs'), path = require('node:path'), os = require('node:os')
const { spawnSync } = require('node:child_process')
const script = path.join(__dirname, 'merge.sh')
const member = id => ({ id_str: id, screen_name: 'synthetic_' + id, name: 'Synthetic ' + id })
function write (root, name, value) { const file = path.join(root, name); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(value) + '\n') }
function fixture () {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'public-list-merge-test-'))
  write(root, 'lists/snapshot/900.json', [member('102')])
  write(root, 'lists/900.json', [member('101')])
  write(root, 'lists/lists.json', [member('101')])
  write(root, 'lists/block.json', [member('201')])
  write(root, 'lists/all.json', [member('101'), member('201')])
  fs.writeFileSync(path.join(root, 'lists/snapshot/900.json.snapshot'), 'Previous derived snapshot bytes\n')
  return root
}
function inventory (root) {
  const rows = []
  function visit (dir) { for (const name of fs.readdirSync(dir).sort()) { const file = path.join(dir, name); if (fs.statSync(file).isDirectory()) visit(file); else rows.push([path.relative(root, file), fs.readFileSync(file).toString('base64')]) } }
  visit(path.join(root, 'lists')); return rows
}
const run = (root, env = {}) => spawnSync('bash', [script], { cwd: root, env: { ...process.env, ...env }, encoding: 'utf8' })
const read = (root, file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'))
const ids = rows => rows.map(row => row.id_str)
function checkFailureUnchanged (root, env) {
  const before = inventory(root), result = run(root, env)
  assert.notEqual(result.status, 0, result.stdout + result.stderr)
  assert.deepEqual(inventory(root), before, result.stderr)
  return result
}
function dispose (root) { fs.rmSync(root, { recursive: true, force: true }) }

test('public list merge preserves historical union and adds curated block entries', () => {
  const root = fixture()
  try {
    const result = run(root); assert.equal(result.status, 0, result.stderr)
    assert.deepEqual(ids(read(root, 'lists/900.json')), ['101', '102'])
    assert.deepEqual(ids(read(root, 'lists/lists.json')), ['101', '102'])
    assert.deepEqual(ids(read(root, 'lists/all.json')), ['101', '102', '201'])
    assert.deepEqual(read(root, 'lists/snapshot/900.json.snapshot'), [member('102')])
    write(root, 'lists/snapshot/900.json', [])
    assert.equal(run(root).status, 0)
    assert.deepEqual(ids(read(root, 'lists/900.json')), ['101', '102'])
  } finally { dispose(root) }
})
test('first use and duplicate valid IDs preserve optional display-field compatibility and string precision', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'public-list-first-use-'))
  try {
    const rows = [{ id_str: '123456789012345678901234567890', name: null }, { id_str: '102', screen_name: null }, { id_str: '102', screen_name: null }]
    write(root, 'lists/snapshot/900.json', rows)
    const result = run(root); assert.equal(result.status, 0, result.stderr)
    assert.deepEqual(ids(read(root, 'lists/all.json')), ['102', '123456789012345678901234567890'])
    assert.deepEqual(read(root, 'lists/snapshot/900.json.snapshot'), rows.map(row => ({ id_str: row.id_str, screen_name: row.screen_name ?? null, name: row.name ?? null })))
  } finally { dispose(root) }
})
test('repeating the same valid batch leaves every list byte and output mtime unchanged', () => {
  const root = fixture()
  try {
    assert.equal(run(root).status, 0)
    const before = inventory(root), times = before.map(([name]) => [name, fs.statSync(path.join(root, name), { bigint: true }).mtimeNs])
    const result = run(root); assert.equal(result.status, 0, result.stderr)
    assert.deepEqual(inventory(root), before)
    assert.deepEqual(times.map(([name]) => [name, fs.statSync(path.join(root, name), { bigint: true }).mtimeNs]), times)
  } finally { dispose(root) }
})
const badSnapshots = [null, {}, [null], ['wrong'], [1], [{}], [{ id_str: null }], [{ id_str: 103 }], [{ id_str: '' }], [{ id_str: '１２３' }], [{ id_str: '-103' }]]
for (const [index, bad] of badSnapshots.entries()) test('invalid late snapshot rejects the entire batch without writes: ' + index, () => {
  const root = fixture()
  try { write(root, 'lists/snapshot/999.json', bad); checkFailureUnchanged(root) } finally { dispose(root) }
})
for (const destination of ['lists/900.json', 'lists/lists.json', 'lists/block.json']) test('malformed historical or curated input is never replaced by an empty list: ' + destination, () => {
  const root = fixture()
  try { write(root, destination, {}); checkFailureUnchanged(root) } finally { dispose(root) }
})
for (const badText of ['', '{broken-json']) test('empty or invalid JSON historical input refuses with zero writes: ' + JSON.stringify(badText), () => {
  const root = fixture()
  try { fs.writeFileSync(path.join(root, 'lists/900.json'), badText); checkFailureUnchanged(root) } finally { dispose(root) }
})
test('reserved snapshot basename cannot collide with the curated block input', () => {
  const root = fixture()
  try { write(root, 'lists/snapshot/block.json', [member('301')]); checkFailureUnchanged(root) } finally { dispose(root) }
})
test('a failed jq merge command is propagated before publishing any batch output', () => {
  const root = fixture()
  try {
    const bin = path.join(root, 'bin'); fs.mkdirSync(bin)
    const actualJq = spawnSync('which', ['jq'], { encoding: 'utf8' }).stdout.trim()
    const wrapper = path.join(bin, 'jq')
    fs.writeFileSync(wrapper, '#!/bin/bash\nif [[ "$1" == "-s" && "$2" != "-e" ]]; then echo "Synthetic jq merge failure" >&2; exit 19; fi\nexec "$REAL_JQ" "$@"\n', { mode: 0o700 })
    const result = checkFailureUnchanged(root, { PATH: bin + path.delimiter + process.env.PATH, REAL_JQ: actualJq })
    assert.match(result.stderr, /cannot merge|Synthetic jq merge failure/)
  } finally { dispose(root) }
})
for (const kind of ['source-byte-change', 'missing-history-appears', 'snapshot-set-grows']) test('prepublish guard refuses a calculation-time input change: ' + kind, () => {
  const root = fixture()
  try {
    const bin = path.join(root, 'bin'); fs.mkdirSync(bin)
    const actualJq = spawnSync('which', ['jq'], { encoding: 'utf8' }).stdout.trim()
    const marker = path.join(root, 'mutation-once')
    let mutationPath = 'lists/snapshot/900.json'
    let content = null
    if (kind === 'missing-history-appears') {
      mutationPath = 'lists/900.json'
      fs.unlinkSync(path.join(root, mutationPath))
      content = JSON.stringify([member('301')]) + '\n'
    }
    if (kind === 'snapshot-set-grows') {
      mutationPath = 'lists/snapshot/999.json'
      content = JSON.stringify([member('302')]) + '\n'
    }
    const wrapper = path.join(bin, 'jq')
    fs.writeFileSync(wrapper, '#!/bin/bash\nif [[ "$1" == "-s" && "$2" != "-e" && ! -e "$MUTATION_MARKER" ]]; then\n  touch "$MUTATION_MARKER"\n  if [[ "$MUTATION_KIND" == "source-byte-change" ]]; then printf "\\n" >> "$MUTATION_PATH"; else printf "%s" "$MUTATION_CONTENT" > "$MUTATION_PATH"; fi\nfi\nexec "$REAL_JQ" "$@"\n', { mode: 0o700 })
    const before = inventory(root)
    const originalMutationBytes = fs.existsSync(path.join(root, mutationPath)) ? fs.readFileSync(path.join(root, mutationPath), 'utf8') : null
    const result = run(root, { PATH: bin + path.delimiter + process.env.PATH, REAL_JQ: actualJq,
      MUTATION_MARKER: marker, MUTATION_KIND: kind, MUTATION_PATH: path.join(root, mutationPath), MUTATION_CONTENT: content || '' })
    assert.notEqual(result.status, 0, result.stdout + result.stderr)
    assert.equal(fs.existsSync(marker), true, 'actual jq calculation must reach the mutation')
    assert.match(result.stderr, kind === 'source-byte-change' ? /input changed/ : kind === 'missing-history-appears' ? /first-use history appeared/ : /snapshot set changed/)
    const expectedMutation = kind === 'source-byte-change' ? originalMutationBytes + '\n' : content
    assert.equal(fs.readFileSync(path.join(root, mutationPath), 'utf8'), expectedMutation)
    assert.deepEqual(inventory(root).filter(([name]) => name !== mutationPath), before.filter(([name]) => name !== mutationPath))
  } finally { dispose(root) }
})
test('a block-only first batch with no snapshots succeeds under Bash nounset', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'public-list-block-only-'))
  try {
    write(root, 'lists/block.json', [member('401')])
    const result = run(root)
    assert.equal(result.status, 0, result.stdout + result.stderr)
    assert.deepEqual(read(root, 'lists/lists.json'), [])
    assert.deepEqual(read(root, 'lists/all.json'), [member('401')])
    assert.deepEqual(read(root, 'lists/block.json'), [member('401')])
    assert.deepEqual(fs.readdirSync(path.join(root, 'lists')).sort(), ['all.json', 'block.json', 'lists.json'])
  } finally { dispose(root) }
})

for (const target of ['lists/all.json', 'lists/snapshot/900.json.snapshot']) test('publication refuses an output directory before any list rename: ' + target, () => {
  const root = fixture()
  try {
    fs.unlinkSync(path.join(root, target))
    fs.mkdirSync(path.join(root, target))
    fs.writeFileSync(path.join(root, target, 'preserved-synthetic-marker'), 'Original directory member bytes\n')
    const result = checkFailureUnchanged(root)
    assert.match(result.stderr, /output is not a regular file/)
    assert.equal(fs.existsSync(path.join(root, target, path.basename(target))), false, 'mv must not publish a nested output')
  } finally { dispose(root) }
})
