# Exact generation and export record

transparent_background=false. No environment template PNG exists in this foundation; JSON spec and projection cube used. Floor generated first; selected floor export conditions all wall candidates.

## Candidate A

Original: `exec-73e1694d-7f46-4c4c-88dd-07d7d63a9b9e.png`

References:

- `art/approved/prop_bed_zila/prop_bed_zila_v001.png`
- `art/approved/prop_nightstand_zila/prop_nightstand_zila_v001.png`
- `art-bible/perspective/projection_cube.png`

```text
Produce ORIGINAL hand-painted premium HD2D game texture, same brushfinish as approved ZsRoom bed/nightstand but distinctly LIGHTER honey-oak floor (#D9B58C family) vs dark walnut furniture. Fully opaque edge-to-edge seamless rectangular TILE, aspect256:126 (about2.03:1). Exactly SIX horizontal plank rows, equal height, running east-west; staggered end joints. Plane already projected depth0.7; no convergence, no room, no furniture, no border, no labels or perspective frame. Soft restrained longitudinal oakgrain, no large knots/stains, no obvious repeatedstamp. Low noise, subtly varied boards, very narrow soft joints. Opposite edges match in BOTH X and Y. Neutralwarm upperleft diffuse illumination with no overall gradient/castshadow. Image can be highres but tile proportions exact. Not photo/3D/pixel/vector. Candidate A: soft satin honey oak with delicate narrow grain and quiet balanced board variation.
```

## Candidate B

Original: `exec-e14a2a85-15cf-4d8a-96fd-3d3f8ca43898.png`

References:

- `art/approved/prop_bed_zila/prop_bed_zila_v001.png`
- `art/approved/prop_nightstand_zila/prop_nightstand_zila_v001.png`
- `art-bible/perspective/projection_cube.png`

```text
Produce ORIGINAL hand-painted premium HD2D game texture, same brushfinish as approved ZsRoom bed/nightstand but distinctly LIGHTER honey-oak floor (#D9B58C family) vs dark walnut furniture. Fully opaque edge-to-edge seamless rectangular TILE, aspect256:126 (about2.03:1). Exactly SIX horizontal plank rows, equal height, running east-west; staggered end joints. Plane already projected depth0.7; no convergence, no room, no furniture, no border, no labels or perspective frame. Soft restrained longitudinal oakgrain, no large knots/stains, no obvious repeatedstamp. Low noise, subtly varied boards, very narrow soft joints. Opposite edges match in BOTH X and Y. Neutralwarm upperleft diffuse illumination with no overall gradient/castshadow. Image can be highres but tile proportions exact. Not photo/3D/pixel/vector. Candidate B: paler cream-honey finish, calmer broader grain strokes, less orange; recessed joints very subtle. Six equal rows.
```

## Candidate C

Original: `exec-a089ab0a-544b-40df-a5b7-c72c84187fa4.png`

References:

- `art/approved/prop_bed_zila/prop_bed_zila_v001.png`
- `art/approved/prop_nightstand_zila/prop_nightstand_zila_v001.png`
- `art-bible/perspective/projection_cube.png`

```text
Produce ORIGINAL hand-painted premium HD2D game texture, same brushfinish as approved ZsRoom bed/nightstand but distinctly LIGHTER honey-oak floor (#D9B58C family) vs dark walnut furniture. Fully opaque edge-to-edge seamless rectangular TILE, aspect256:126 (about2.03:1). Exactly SIX horizontal plank rows, equal height, running east-west; staggered end joints. Plane already projected depth0.7; no convergence, no room, no furniture, no border, no labels or perspective frame. Soft restrained longitudinal oakgrain, no large knots/stains, no obvious repeatedstamp. Low noise, subtly varied boards, very narrow soft joints. Opposite edges match in BOTH X and Y. Neutralwarm upperleft diffuse illumination with no overall gradient/castshadow. Image can be highres but tile proportions exact. Not photo/3D/pixel/vector. Candidate C: light desaturated honey oak, restrained painterly grain, avoid chevrons or swirly knots; six planks with minimally contrasted joints. Each row identical21px projected height. No border.
```

## Export

Lanczos resize full original to256x126, no trim. Local symmetric edge-colour correction fading quadratically across8px left/right and2px top/bottom; opposite edge pixels match exactly. Six original plank rows retained.

```python
from PIL import Image
import numpy as np
from pathlib import Path
r=Path('/workspace/ZsRoom-art-batch-e')
for c in 'abc':
 im=Image.open(r/f'art/source/env_floor_planks_honey/v001/candidate-{c}.png').convert('RGB').resize((256,126),Image.Resampling.LANCZOS)
 a=np.array(im,dtype=float)
 before=[float(abs(a[:,0]-a[:,-1]).mean()),float(abs(a[0]-a[-1]).mean())]
 # Blend matching boundary bands only; leave the generated interior and staggered joints intact.
 for axis,n in [(1,8),(0,2)]:
  q=np.moveaxis(a,axis,0);delta=(q[-1].copy()-q[0].copy())/2
  for i in range(n):
   w=(1-i/n)**2;q[i]+=delta*w;q[-1-i]-=delta*w
  a=np.moveaxis(q,0,axis)
 out=Image.fromarray(np.uint8(np.clip(np.rint(a),0,255))).convert('RGBA');out.save(r/f'review-gallery/candidates/floor-{c}.png')
 print(c,'before seam XY',before,'after',[float(abs(a[:,0]-a[:,-1]).mean()),float(abs(a[0]-a[-1]).mean())])

```
