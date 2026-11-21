# Exact generation and export record

transparent_background=false. No environment template PNG exists in this foundation; JSON spec and projection cube used. Floor generated first; selected floor export conditions all wall candidates.

## Candidate A

Original: `exec-91869712-5fed-471a-81e1-3109463b3622.png`

References:

- `art/approved/prop_bed_zila/prop_bed_zila_v001.png`
- `art/approved/prop_nightstand_zila/prop_nightstand_zila_v001.png`
- `art-bible/perspective/projection_cube.png`
- `review-gallery/candidates/floor-b.png`

```text
Original premium hand-illustrated HD2D ZsRoom seamless WALL STRIP, match painted furniture references and floor anchor. Fully opaque, edge-to-edge, NO room scene, NO floor, furniture, window, objects, labels or border. Straight front elevation, verticals straight, repeats ONLY horizontally seamlessly. Image aspect120:540 = 2:9 narrow tall strip, full270cm wall. From TOP: crown cream moulding y0–12px; soft dusty BLUSH wallpaper y12–356px; thin cream chair rail y356–364px; cream wainscot ONE understated inset rectangular panel y364–516px; cream skirting y516–540px. Exact relative band positions crucial. Wallpaper quiet subtle brushed paper texture, no large floral shapes, vignette, highlights or gradient. Optional very faint regular pinstripes. Cream#F6EBDD, blush#F4C7D3 gently muted, warm grey-plum tinyshadow. Upperleft subtle form shading ONLY on moulding, no global lightgradient. Left and right edge MATCH for every row. No isolated illustration: whole image wall texture. Painted not photo/3D/vector/pixel. Candidate A: plain very soft blush paper, restrained cream flat-panel joinery.
```

## Candidate B

Original: `exec-595c5add-0566-428d-8945-ebeff188bb13.png`

References:

- `art/approved/prop_bed_zila/prop_bed_zila_v001.png`
- `art/approved/prop_nightstand_zila/prop_nightstand_zila_v001.png`
- `art-bible/perspective/projection_cube.png`
- `review-gallery/candidates/floor-b.png`

```text
Original premium hand-illustrated HD2D ZsRoom seamless WALL STRIP, match painted furniture references and floor anchor. Fully opaque, edge-to-edge, NO room scene, NO floor, furniture, window, objects, labels or border. Straight front elevation, verticals straight, repeats ONLY horizontally seamlessly. Image aspect120:540 = 2:9 narrow tall strip, full270cm wall. From TOP: crown cream moulding y0–12px; soft dusty BLUSH wallpaper y12–356px; thin cream chair rail y356–364px; cream wainscot ONE understated inset rectangular panel y364–516px; cream skirting y516–540px. Exact relative band positions crucial. Wallpaper quiet subtle brushed paper texture, no large floral shapes, vignette, highlights or gradient. Optional very faint regular pinstripes. Cream#F6EBDD, blush#F4C7D3 gently muted, warm grey-plum tinyshadow. Upperleft subtle form shading ONLY on moulding, no global lightgradient. Left and right edge MATCH for every row. No isolated illustration: whole image wall texture. Painted not photo/3D/vector/pixel. Candidate B: plain matte blush paper WITHOUT stripes or dots, gentle handbrushed texture; elegant narrow cream moulding and one shallow inset panel. Wallpaper exactly upper64% of image below crown.
```

## Candidate C

Original: `exec-b9f8fc41-21c7-42f9-b270-6d8c77c4f52a.png`

References:

- `art/approved/prop_bed_zila/prop_bed_zila_v001.png`
- `art/approved/prop_nightstand_zila/prop_nightstand_zila_v001.png`
- `art-bible/perspective/projection_cube.png`
- `review-gallery/candidates/floor-b.png`

```text
Original premium hand-illustrated HD2D ZsRoom seamless WALL STRIP, match painted furniture references and floor anchor. Fully opaque, edge-to-edge, NO room scene, NO floor, furniture, window, objects, labels or border. Straight front elevation, verticals straight, repeats ONLY horizontally seamlessly. Image aspect120:540 = 2:9 narrow tall strip, full270cm wall. From TOP: crown cream moulding y0–12px; soft dusty BLUSH wallpaper y12–356px; thin cream chair rail y356–364px; cream wainscot ONE understated inset rectangular panel y364–516px; cream skirting y516–540px. Exact relative band positions crucial. Wallpaper quiet subtle brushed paper texture, no large floral shapes, vignette, highlights or gradient. Optional very faint regular pinstripes. Cream#F6EBDD, blush#F4C7D3 gently muted, warm grey-plum tinyshadow. Upperleft subtle form shading ONLY on moulding, no global lightgradient. Left and right edge MATCH for every row. No isolated illustration: whole image wall texture. Painted not photo/3D/vector/pixel. Candidate C: desaturated dusty blush leaning cream, plain very lowcontrast paper. Extremely slim understated panel mouldings, no decorative flourishes. Calm restful backdrop, exact bands.
```

## Export

Band-aware Lanczos export to120x540. Original B source rows0,64,1478,1515,2073,2172 mapped to0,12,356,364,516,540. This adjusts generator proportions, not invented replacement art. Symmetric horizontal edge-colour correction fading across6px. Fully opaque RGBA.

```python
from PIL import Image
import numpy as np
from pathlib import Path
r=Path('/workspace/ZsRoom-art-batch-e')
# Source band boundaries measured from actual generated pixels; map to official projected heights.
bounds={'a':[0,57,1470,1502,2083,2172],'b':[0,64,1478,1515,2073,2172],'c':[0,50,1305,1332,1806,1881]}
dest=[0,12,356,364,516,540]
for c in 'abc':
 im=Image.open(r/f'art/source/env_wall_bedroom/v001/candidate-{c}.png').convert('RGB');out=Image.new('RGB',(120,540))
 for i in range(5):
  part=im.crop((0,bounds[c][i],im.width,bounds[c][i+1])).resize((120,dest[i+1]-dest[i]),Image.Resampling.LANCZOS);out.paste(part,(0,dest[i]))
 a=np.array(out,dtype=float);before=float(abs(a[:,0]-a[:,-1]).mean());delta=(a[:,-1].copy()-a[:,0].copy())/2
 for i in range(6):
  w=(1-i/6)**2;a[:,i]+=delta*w;a[:,-1-i]-=delta*w
 Image.fromarray(np.uint8(np.clip(np.rint(a),0,255))).convert('RGBA').save(r/f'review-gallery/candidates/wall-{c}.png')
 print(c,'seam before',before,'after',float(abs(a[:,0]-a[:,-1]).mean()))

```
