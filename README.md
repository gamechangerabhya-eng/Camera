# Portrait Studio AI - Precision Mask Edition

## Detection upgrades
- 3x3 confidence smoothing to remove isolated mask noise
- Largest central connected-person selection
- Temporal mask smoothing to reduce live edge flicker
- Optional Portrait Cleanup designed to reject connected chairs, desks and side objects
- Adjustable detection precision and edge refinement
- Professional responsive desktop/mobile UI

## Recommended tuning
- Head-and-shoulders portrait: Portrait Cleanup ON, precision 58-66
- Full body: Portrait Cleanup OFF, precision 52-62
- Hair disappearing: lower precision or raise edge refinement
- Chair retained: turn Portrait Cleanup ON and raise precision gradually
