"""Create the source delivery with an explicit allowlist; never include local secrets."""
from pathlib import Path
import hashlib
import json
import zipfile

ROOT = Path(__file__).resolve().parents[1]
TOP = '永嘉有礼_v2'
ROOT_FILES = {
    '.env.example', '.gitignore', '.dockerignore', 'README.md', 'DESIGN.md',
    'package.json', 'server.mjs', 'start.bat', 'start.sh',
    'configure-key.ps1', 'Dockerfile', 'render.yaml', '先看这里.txt',
}
ALLOWED = {
    'public': {'.html', '.css', '.js', '.svg', '.png'},
    'miniprogram': {'.json', '.js', '.wxml', '.wxss', '.png'},
    'lib': {'.mjs'}, 'tests': {'.mjs'}, 'scripts': {'.mjs', '.cjs', '.py'},
    'docs': {'.md'}, 'media': {'.png'},
    'verification': {'.json', '.txt'},
}

def collect():
    files = [ROOT / name for name in sorted(ROOT_FILES)]
    for folder, suffixes in ALLOWED.items():
        for file in sorted((ROOT / folder).rglob('*')):
            if not file.is_file() or file.suffix not in suffixes:
                continue
            rel = file.relative_to(ROOT)
            if file.is_symlink() or file.name == 'project.private.config.json':
                continue
            if any(part.startswith('.') or part in {'node_modules', '__pycache__'} for part in rel.parts):
                continue
            files.append(file)
    for file in files:
        if not file.is_file() or file.is_symlink() or ROOT not in file.resolve().parents:
            raise ValueError('Invalid delivery file: ' + file.name)
    return files

def main():
    files = collect()
    for line in (ROOT / '.env.example').read_text(encoding='utf-8').splitlines():
        if line.strip().startswith('DEEPSEEK_API_KEY=') and line.split('=', 1)[1].strip():
            raise ValueError('Example key must remain empty')
    out = ROOT / 'deliverables'
    out.mkdir(exist_ok=True)
    target = out / '永嘉有礼_v2_整合包.zip'
    manifest = {
        'name': '永嘉有礼', 'version': '2.0.0',
        'files': [{'path': f.relative_to(ROOT).as_posix(), 'bytes': f.stat().st_size,
                   'sha256': hashlib.sha256(f.read_bytes()).hexdigest()} for f in files],
    }
    with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for f in files:
            z.write(f, TOP + '/' + f.relative_to(ROOT).as_posix())
        z.writestr(TOP + '/MANIFEST.json', json.dumps(manifest, ensure_ascii=False, indent=2))
    with zipfile.ZipFile(target) as z:
        if z.testzip() is not None:
            raise ValueError('ZIP integrity check failed')
        for record in manifest['files']:
            data = z.read(TOP + '/' + record['path'])
            if hashlib.sha256(data).hexdigest() != record['sha256']:
                raise ValueError('Hash mismatch: ' + record['path'])
        assert not any('/.env' in n and not n.endswith('/.env.example') for n in z.namelist())
        assert not any(n.endswith(('.webm', '.mp4', 'project.private.config.json')) for n in z.namelist())
    digest = hashlib.sha256(target.read_bytes()).hexdigest()
    (out / 'SHA256.txt').write_text(digest + '  ' + target.name + '\n', encoding='utf-8')
    report = {'zip': str(target), 'files': len(files) + 1, 'bytes': target.stat().st_size,
              'sha256': digest, 'zip_crc': 'passed', 'entry_hashes': 'passed'}
    (out / 'package-check.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
