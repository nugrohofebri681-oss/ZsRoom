# Geometry audit — batuphat_town

**FAIL 4 · WARN 8 · OK 6**

| Severity | Check | Detail | Area (m²) |
|---|---|---|---|
| OK | shared right-of-way | ground[2] road (0,2950 8000×300) lies inside ground[1] pavement (0,2600 8000×1000) and draws above it by rank | 240 |
| OK | junction | ground[1] pavement (0,2600 8000×1000) × ground[15] plaza (4860,3250 500×350): crossing resolved by rank — pavement draws over plaza; markings stop at the junction | 17.5 |
| OK | junction | ground[3] road (4600,300 260×2300) × ground[5] lane (300,1450 7400×180): crossing resolved by rank — road draws over lane; markings stop at the junction | 4.7 |
| OK | junction | ground[4] road (4600,3600 260×1960) × ground[12] lane (3200,4350 4500×170): crossing resolved by rank — road draws over lane; markings stop at the junction | 4.4 |
| OK | junction | ground[4] road (4600,3600 260×1960) × ground[14] lane (3200,5300 4500×160): crossing resolved by rank — road draws over lane; markings stop at the junction | 4.2 |
| OK | same-material join | ground[10] lane (1600,3600 150×1700) × ground[11] lane (300,4350 2900×150): same material joins (drawn once where covered) | 2.3 |
| WARN | roof hides a path | workplace (h 420 cm) visually covers ground[5] lane (300,1450 7400×180) behind it; the building fades when Zila walks there | 1.7 |
| WARN | roof hides a path | house_s1 (h 360 cm) visually covers ground[1] pavement (0,2600 8000×1000) behind it; the building fades when Zila walks there | 8.4 |
| WARN | roof hides a path | house_s2 (h 360 cm) visually covers ground[1] pavement (0,2600 8000×1000) behind it; the building fades when Zila walks there | 8.4 |
| WARN | roof hides a path | shop_s3 (h 360 cm) visually covers ground[1] pavement (0,2600 8000×1000) behind it; the building fades when Zila walks there | 7.3 |
| WARN | roof hides a path | shop_s3 (h 360 cm) visually covers ground[15] plaza (4860,3250 500×350) behind it; the building fades when Zila walks there | 5.6 |
| WARN | roof hides a path | house_s4 (h 360 cm) visually covers ground[1] pavement (0,2600 8000×1000) behind it; the building fades when Zila walks there | 8.4 |
| WARN | roof hides a path | house_s5 (h 360 cm) visually covers ground[1] pavement (0,2600 8000×1000) behind it; the building fades when Zila walks there | 8.4 |
| WARN | roof hides a path | house_s6 (h 360 cm) visually covers ground[1] pavement (0,2600 8000×1000) behind it; the building fades when Zila walks there | 8.4 |
| FAIL | building on a path/road | house_t1 footprint (3460,5150 480×400) intersects ground[14] lane (3200,5300 4500×160) | 7.7 |
| FAIL | building on a path/road | house_t2 footprint (5060,5150 480×400) intersects ground[14] lane (3200,5300 4500×160) | 7.7 |
| FAIL | building on a path/road | house_t3 footprint (6260,5150 480×400) intersects ground[14] lane (3200,5300 4500×160) | 7.7 |
| FAIL | fence across a path | fence (300,3615 15×1685) blocks ground[11] lane (300,4350 2900×150) | 0.2 |
