// Scheletro di una scena three.js da copiare: tetto ai pixel, istanze, ciclo in vista, pulizia.
import * as THREE from "three";
import { cappedPixelRatio, deviceCount } from "./gate";
import type { SceneHandle } from "./scene-host";

/*
 * Si carica con import() da SceneHost. Regole (ML04):
 * - una sola geometria e un solo materiale condivisi, InstancedMesh per gli elementi ripetuti;
 * - densità di pixel con tetto e metà degli elementi sul telefono;
 * - renderer a basso consumo per le scene decorative;
 * - il ciclo continuo gira solo in vista; se c'è movimento autonomo oltre 5 secondi serve
 *   un comando di pausa nella pagina (MV05), collegato a setManualPause;
 * - destroy() libera tutto quello che è stato creato.
 */

export function mount(canvas: HTMLCanvasElement, { width, height }: { width: number; height: number }): SceneHandle {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(cappedPixelRatio());
  renderer.setSize(width, height, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 2, 10);

  const count = deviceCount(600);
  const geometry = new THREE.ConeGeometry(0.3, 1.2, 8);
  const material = new THREE.MeshStandardMaterial({ color: 0x6b7a4a });
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  const m = new THREE.Matrix4();
  for (let i = 0; i < count; i++) {
    m.setPosition((i % 30) - 15, 0, -Math.floor(i / 30) * 1.5);
    mesh.setMatrixAt(i, m);
  }
  scene.add(mesh, new THREE.HemisphereLight(0xffffff, 0x444433, 1.2));

  let progress = 0;
  const draw = () => {
    camera.position.z = 10 - progress * 20;
    renderer.render(scene, camera);
  };
  // Questa scena si muove solo con lo scroll: si ridisegna quando cambia, senza ciclo.
  // Una scena con movimento autonomo usa visibleLoop(canvas, draw) da motion/visible-loop.
  draw();

  return {
    progress: (value) => {
      progress = value;
      draw();
    },
    resize: (w, h) => {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      draw();
    },
    destroy: () => {
      geometry.dispose();
      material.dispose();
      mesh.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
