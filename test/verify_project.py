from pathlib import Path
import re, sys, yaml, zipfile
root=Path(__file__).resolve().parents[1]
required=['pubspec.yaml','lib/main.dart','web/index.html','web/app.js','.github/workflows/deploy.yml']
for f in required: assert (root/f).is_file(), f'Missing {f}'
workflow=yaml.safe_load((root/'.github/workflows/deploy.yml').read_text())
assert 'on' in workflow and 'jobs' in workflow
app=(root/'web/app.js').read_text()
checks={
 'camera permission':'getUserMedia', 'camera cleanup':'track=>track.stop()',
 'photo capture':'capture(){', 'canvas video stream':'captureStream(30)',
 'video recorder':'new MediaRecorder', 'video background':'loadVideoBackground',
 'separate video segmenter':"runningMode:'VIDEO'", 'separate image segmenter':"runningMode:'IMAGE'",
 'inference lock':'this.processing', 'photo lock':'this.photoProcessing',
 'status/state separation':'updateStatus(kind,text)', 'custom background':'loadCustomBackground'
}
for name,token in checks.items(): assert token in app, f'Missing {name}: {token}'
assert "setState(" not in app, 'Old broken state/status function still present'
assert len(list((root/'web/backgrounds').glob('*.jpg'))) >= 6
print('All repository static checks passed.')
