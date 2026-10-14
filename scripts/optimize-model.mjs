/**
 * Optimizes the tattoo-machine GLB for the mobile bundle.
 *
 * Why not Draco/Meshopt? Both decoders rely on WebAssembly + Web Workers to
 * decompress at runtime, and neither is available in Hermes/React Native. A
 * Draco-compressed asset would simply fail to decode on device. This pipeline
 * instead bakes the compression at build time and emits `KHR_mesh_quantization`,
 * which three.js's `GLTFLoader` decodes natively with no wasm.
 *
 * The 3D engine (`src/components/ui/tattoo-machine-3d.tsx`) replaces every
 * material at runtime with its own `MeshStandardMaterial`, so the source
 * textures and their UV sets are dead weight on mobile and are stripped here.
 *
 * Run with: npm run model:optimize
 */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, quantize, simplify, weld } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const INPUT = new URL('../assets/models/tattoo-machine.glb', import.meta.url);
const OUTPUT = new URL('../assets/models/tattoo-machine.glb', import.meta.url);

/** Vertex attributes the R3F engine actually reads (positions + lighting normals). */
const KEEP_ATTRIBUTES = new Set(['POSITION', 'NORMAL']);

/** Simplify ratio: fraction of vertices kept (0-1). Higher = more detail. */
const SIMPLIFY_RATIO = 0.5;
/** Simplification error tolerance, as a fraction of mesh extent. */
const SIMPLIFY_ERROR = 0.001;

/** Marker extension added by `quantize()`; used to guard against re-running. */
const QUANTIZE_EXTENSION = 'KHR_mesh_quantization';

function stripMaterialTextures(document) {
  const root = document.getRoot();
  for (const material of root.listMaterials()) {
    material.setBaseColorTexture(null);
    material.setMetallicRoughnessTexture(null);
    material.setNormalTexture(null);
    material.setOcclusionTexture(null);
    material.setEmissiveTexture(null);
    // No emissive texture means a white emissive factor would blow the model out.
    material.setEmissiveFactor([0, 0, 0]);
  }
}

function stripUnusedAttributes(document) {
  for (const mesh of document.getRoot().listMeshes()) {
    for (const primitive of mesh.listPrimitives()) {
      for (const semantic of primitive.listSemantics()) {
        if (!KEEP_ATTRIBUTES.has(semantic)) {
          primitive.setAttribute(semantic, null);
        }
      }
    }
  }
}

function mb(bytes) {
  return (bytes / 1e6).toFixed(2);
}

async function main() {
  const before = (await stat(INPUT)).size;

  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  const source = await readFile(INPUT);
  const document = await io.readBinary(new Uint8Array(source));

  const alreadyOptimized = document
    .getRoot()
    .listExtensionsUsed()
    .some((extension) => extension.extensionName === QUANTIZE_EXTENSION);
  if (alreadyOptimized) {
    console.log(
      `[model:optimize] ${fileURLToPath(INPUT)} already contains ${QUANTIZE_EXTENSION}; ` +
        'skipping to avoid double-processing. Re-run against the raw source asset instead.',
    );
    return;
  }

  stripMaterialTextures(document);
  stripUnusedAttributes(document);

  await document.transform(
    dedup(),
    // weld() only merges equal vertices once attribute seams (UV/tangent) are gone.
    weld(),
    simplify({ simplifier: MeshoptSimplifier, ratio: SIMPLIFY_RATIO, error: SIMPLIFY_ERROR }),
    // prune() removes the now-orphaned textures, images, samplers and accessors.
    prune(),
    // KHR_mesh_quantization: natively decoded by GLTFLoader, no wasm needed.
    quantize(),
  );

  const glb = await io.writeBinary(document);
  await writeFile(OUTPUT, glb);

  const after = (await stat(OUTPUT)).size;
  const pct = ((1 - after / before) * 100).toFixed(1);
  console.log(
    `[model:optimize] ${fileURLToPath(INPUT)}\n` +
      `  before: ${mb(before)} MB\n` +
      `  after:  ${mb(after)} MB  (-${pct}%)`,
  );
}

main().catch((error) => {
  console.error('[model:optimize] failed:', error);
  process.exitCode = 1;
});
