# Portrait Studio Pro - Alignment & Layout Fix

Critical correction:
The previous front-camera build mirrored the source image before compositing but applied an unmirrored segmentation mask. That placed the person mask over different pixels and could visibly remove part of the face/body while retaining background regions. This build keeps model input, mask, and composited source in the same coordinate system.

UI changes:
- six desktop action buttons fit on one row
- 3-column compact background gallery on wide desktop
- shorter background cards
- tighter detection controls so they remain visible without an inner scrollbar
- mobile keeps the swipeable gallery and two-column controls
