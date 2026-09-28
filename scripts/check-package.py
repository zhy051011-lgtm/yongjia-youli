"""Extract and start the delivery itself; uses a temporary directory under this project."""
from pathlib import Path
import argparse
import json
import os
import subprocess
import tempfile
import time
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[1]

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--node', default='node')
    args = parser.parse_args()
    cache = ROOT / '.cache'
    cache.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='package-smoke-', dir=cache) as temp:
        target = Path(temp).resolve()
        assert ROOT in target.parents
        with zipfile.ZipFile(ROOT / 'deliverables' / '永嘉有礼_v2_整合包.zip') as z:
            for name in z.namelist():
                if not (target / name).resolve().is_relative_to(target):
                    raise ValueError('Unsafe archive path')
            z.extractall(target)
        app = target / '永嘉有礼_v2'
        env = dict(os.environ, PORT='3191', DEEPSEEK_API_KEY='', ALLOWED_ORIGIN='')
        proc = subprocess.Popen([args.node, 'server.mjs'], cwd=app, env=env,
                                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        try:
            base = 'http://127.0.0.1:3191'
            for attempt in range(50):
                if proc.poll() is not None:
                    raise RuntimeError('Extracted server failed to start')
                try:
                    with urllib.request.urlopen(base + '/api/health', timeout=1) as r:
                        health = json.load(r)
                    break
                except OSError:
                    time.sleep(0.1)
            else:
                raise RuntimeError('Extracted server did not become ready')
            assert health['ok'] and not health['aiConfigured'] and health['resources'] == 6
            with urllib.request.urlopen(base) as r:
                assert '永嘉有礼' in r.read().decode('utf-8')
            body = json.dumps({'profile': {'duration': 240}}).encode()
            req = urllib.request.Request(base + '/api/plan', data=body,
                                         headers={'Content-Type': 'application/json'})
            with urllib.request.urlopen(req) as r:
                plan = json.load(r)['plan']
            assert len(plan['stops']) >= 2 and plan['used'] <= 240
        finally:
            proc.terminate()
            proc.wait(timeout=10)
    report = {'status': 'passed', 'checks': ['ZIP 解压', '解压后服务启动', '首页返回', '资源就绪', '实际规则规划'],
              'scope': '本地 Node 运行验证；不包含模型调用、微信编译或公网部署'}
    (ROOT / 'verification' / 'package-smoke.json').write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
