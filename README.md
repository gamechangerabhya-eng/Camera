# Portrait Studio Pro - Tested Media Build

Critical fixes in this build:
- fixed operational state being overwritten by visual status updates, which previously stopped the realtime frame loop
- separate VIDEO and IMAGE segmenters retained
- live inference lock and serialized uploaded-photo processing
- correct mirrored front-camera foreground while backgrounds and downloaded output remain readable
- recording state, download state, and camera shutdown cleanup
- image and video background upload
- photo capture plus processed canvas video recording
- explicit GitHub Actions workflow with `flutter analyze` before build

Run repository checks with `python test/verify_project.py`.
