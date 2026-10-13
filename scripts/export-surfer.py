# Bake the hero surfer out of Blender into public/surfer.bin.
#
# The model is a wireframe in Blender only by way of a node modifier: "Surfer"
# is an ordinary triangle mesh whose every edge is swept into a round strand,
# backed by a white copy of the surface that hides the strands behind it. The
# page redraws exactly that in WebGL (src/components/incubator/), so all it
# needs is the edges and the surface, not the swept tubes, which would be
# twenty times the bytes and still look worse than lines drawn at screen width.
#
# The board was baked differently: its strands are real geometry, one little
# six-sided tube per edge, sitting on one larger piece that is the surface. The
# tubes are turned back into edges by taking the centre of each end ring.
#
# Output, little-endian:
#   uint32 vertexCount, edgeCount, triangleCount
#   float32 xyz * vertexCount      Y-up, metres, feet on y = 0, spun about x/z 0
#   uint16  ab  * edgeCount
#   uint16  abc * triangleCount
#
# The .blend is not in the repo (scripts/fixtures/ is gitignored, like the other
# source art). Run it with Blender 4.2 or later:
#   blender -b scripts/fixtures/surfer_wave_pose.blend --python scripts/export-surfer.py -- public/surfer.bin

import struct
import sys

import bmesh
import bpy
from mathutils import Vector

out = sys.argv[sys.argv.index('--') + 1]

P, E, T = [], [], []


def add(v):
    # Blender is Z-up; WebGL convention here is Y-up, with -Y becoming +Z.
    P.append(Vector((v.x, v.z, -v.y)))
    return len(P) - 1


def components(bm):
    seen, comps = set(), []
    for v in bm.verts:
        if v.index in seen:
            continue
        stack, comp = [v], []
        seen.add(v.index)
        while stack:
            x = stack.pop()
            comp.append(x)
            for e in x.link_edges:
                y = e.other_vert(x)
                if y.index not in seen:
                    seen.add(y.index)
                    stack.append(y)
        comps.append(comp)
    return sorted(comps, key=len)


# The surfer: every base edge is a strand, every face is surface.
ob = bpy.data.objects['Surfer']
mw = ob.matrix_world
base = len(P)
for v in ob.data.vertices:
    add(mw @ v.co)
for e in ob.data.edges:
    E.append((base + e.vertices[0], base + e.vertices[1]))
bm = bmesh.new()
bm.from_mesh(ob.data)
bmesh.ops.triangulate(bm, faces=bm.faces)
for f in bm.faces:
    T.append(tuple(base + v.index for v in f.verts))
bm.free()

# The board: the largest connected piece is the surface, the rest are strands.
ob = bpy.data.objects['Surfboard']
mw = ob.matrix_world
bm = bmesh.new()
bm.from_mesh(ob.data)
comps = components(bm)
surface = {v.index for v in comps[-1]}
bmesh.ops.triangulate(bm, faces=[f for f in bm.faces if f.verts[0].index in surface])
bm.verts.ensure_lookup_table()
vmap = {i: add(mw @ bm.verts[i].co) for i in sorted(surface)}
for f in bm.faces:
    if f.verts[0].index in surface:
        T.append(tuple(vmap[v.index] for v in f.verts))

ends = {}


def end(p):
    # Neighbouring strands share an end; merging them keeps the vertex count
    # at one per board corner instead of one per strand end.
    k = tuple(round(c, 4) for c in p)
    if k not in ends:
        ends[k] = add(p)
    return ends[k]


for comp in comps[:-1]:
    pts = [mw @ v.co for v in comp]
    a = max(pts, key=lambda p: (p - pts[0]).length)
    b = max(pts, key=lambda p: (p - a).length)
    axis = (b - a).normalized()
    pts.sort(key=lambda p: (p - a).dot(axis))
    h = len(pts) // 2
    E.append((end(sum(pts[:h], Vector()) / h), end(sum(pts[h:], Vector()) / (len(pts) - h))))
bm.free()

# Stand it on y = 0 and centre it on the turntable's axis.
lo = Vector((min(p.x for p in P), min(p.y for p in P), min(p.z for p in P)))
hi = Vector((max(p.x for p in P), max(p.y for p in P), max(p.z for p in P)))
shift = Vector(((lo.x + hi.x) / 2, lo.y, (lo.z + hi.z) / 2))
P = [p - shift for p in P]

with open(out, 'wb') as f:
    f.write(struct.pack('<3I', len(P), len(E), len(T)))
    f.write(struct.pack(f'<{len(P) * 3}f', *(c for p in P for c in p)))
    f.write(struct.pack(f'<{len(E) * 2}H', *(i for e in E for i in e)))
    f.write(struct.pack(f'<{len(T) * 3}H', *(i for t in T for i in t)))

print(f'surfer.bin: {len(P)} vertices, {len(E)} edges, {len(T)} triangles; size {tuple(round(c, 3) for c in hi - lo)}')
