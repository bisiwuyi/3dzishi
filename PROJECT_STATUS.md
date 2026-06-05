# Project Status

## Current Branch

- `codex/chinese-pose-library-shortcuts`
- Remote tracking: `target/main` (`git@github.com:bisiwuyi/3dzishi.git`)

## Implemented

- Chinese UI for the posture editor.
- Local posture preset library backed by `localStorage`.
- `X` / `Y` / `Z` rotation-axis shortcuts with input-focus protection.
- Reference image pose MVP:
  - Upload a reference image.
  - Preview the image and detected body skeleton.
  - Run MediaPipe Pose Landmarker in the browser.
  - Apply single-person large-joint pose estimates to the current mannequin.
- Responsive panel behavior:
  - Desktop panels keep the original left/right layout.
  - Narrow screens scale fixed panels so the control surfaces do not overlap.

## Reference Pose Scope

This first version estimates only coarse body joints:

- torso tilt
- head turn/nod
- shoulders to elbows to wrists
- hips to knees to ankles
- elbow and knee bends

It intentionally does not yet handle fingers, precise ankles, multiple people, occlusion recovery, or full 3D depth reconstruction.

## Validation

- `node --check src\editor\posture-editor.js`
- HTTP check for `http://localhost:5174/src/editor/posture-editor.html`
- Chrome/Playwright blank-image flow: MediaPipe loads and reports no person.
- Chrome/Playwright full-body reference image flow: detected and applied 15 joints.
- Chrome/Playwright mobile layout check: left and right panels do not overlap at 390px width.
