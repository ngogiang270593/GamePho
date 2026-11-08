import * as THREE from 'three';
import { WorldCoordinateAdapter } from './WorldCoordinateAdapter';
import type { MapBuilding } from '../world';

export interface ThreeSceneOptions { width: number; height: number; worldWidth: number; worldHeight: number }

export class ThreeSceneRenderer {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.OrthographicCamera;
  readonly renderer: THREE.WebGLRenderer;
  readonly adapter: WorldCoordinateAdapter;
  private disposables: THREE.Object3D[] = [];
  private frame = 0;
  constructor(private host: HTMLElement, options: ThreeSceneOptions) {
    this.adapter = new WorldCoordinateAdapter(options.worldWidth, options.worldHeight);
    this.camera = new THREE.OrthographicCamera(-8, 8, 6, -6, .1, 100);
    this.camera.position.set(8, 11, 8); this.camera.lookAt(0, 0, 0);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(this.renderer.domElement);
    this.buildEnvironment(options);
    this.resize(options.width, options.height);
    this.animate();
  }
  private add(object: THREE.Object3D) { this.scene.add(object); this.disposables.push(object); return object; }
  private buildEnvironment(options: ThreeSceneOptions) {
    this.scene.background = new THREE.Color('#a9bd91');
    this.scene.fog = new THREE.Fog('#a9bd91', 18, 42);
    this.add(new THREE.HemisphereLight('#fff5d6', '#58735d', 2.2));
    const sun = new THREE.DirectionalLight('#fff0c5', 3.1); sun.position.set(-10, 18, 8); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); this.add(sun);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(this.adapter.size(options.worldWidth), this.adapter.size(options.worldHeight)), new THREE.MeshStandardMaterial({ color: '#91ad78', roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; this.add(ground);
    const road = new THREE.Mesh(new THREE.PlaneGeometry(this.adapter.size(options.worldWidth * .92), this.adapter.size(105)), new THREE.MeshStandardMaterial({ color: '#77786e', roughness: .92 }));
    road.rotation.x = -Math.PI / 2; road.position.y = .012; road.receiveShadow = true; this.add(road);
    const cross = road.clone(); cross.scale.set(this.adapter.size(105) / this.adapter.size(options.worldWidth * .92), 1, this.adapter.size(options.worldWidth * .92) / this.adapter.size(105)); this.add(cross);
    // A shallow river and a simple wooden bridge establish the test water zone.
    const river = new THREE.Mesh(new THREE.PlaneGeometry(this.adapter.size(380), this.adapter.size(145)), new THREE.MeshPhysicalMaterial({ color: '#4f9aaa', roughness: .18, metalness: .05, transmission: .08, transparent: true, opacity: .86 }));
    river.rotation.x = -Math.PI / 2; river.position.set(this.adapter.mapToWorld({ x: 1110, y: 850 }).x, .035, this.adapter.mapToWorld({ x: 1110, y: 850 }).z); this.add(river);
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(this.adapter.size(170), .16, this.adapter.size(36)), new THREE.MeshStandardMaterial({ color: '#9a6946', roughness: .8 }));
    bridge.position.set(this.adapter.mapToWorld({ x: 1110, y: 850 }).x, .16, this.adapter.mapToWorld({ x: 1110, y: 850 }).z); bridge.castShadow = true; this.add(bridge);
  }
  addBuilding(building: MapBuilding) {
    const p = this.adapter.mapToWorld({ x: building.x + building.width / 2, y: building.y + building.height / 2 });
    const group = new THREE.Group(); group.position.set(p.x, 0, p.z);
    const body = new THREE.Mesh(new THREE.BoxGeometry(this.adapter.size(building.width), this.adapter.size(building.height) * .42, this.adapter.size(building.height) * .68), new THREE.MeshStandardMaterial({ color: building.color, roughness: .78 }));
    body.position.y = body.geometry.parameters.height / 2; body.castShadow = true; body.receiveShadow = true; group.add(body);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(this.adapter.size(building.width) * .72, this.adapter.size(building.height) * .22, 4), new THREE.MeshStandardMaterial({ color: building.roof, roughness: .72 }));
    roof.rotation.y = Math.PI / 4; roof.position.y = body.geometry.parameters.height + roof.geometry.parameters.height / 2; roof.castShadow = true; group.add(roof);
    return this.add(group);
  }
  addTree(point: { x: number; y: number }, scale = 1) {
    const p = this.adapter.mapToWorld(point); const group = new THREE.Group(); group.position.set(p.x, 0, p.z); group.scale.setScalar(scale);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.09, .13, 1.1, 8), new THREE.MeshStandardMaterial({ color: '#76563d', roughness: 1 })); trunk.position.y = .55; trunk.castShadow = true; group.add(trunk);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(.72, 1), new THREE.MeshStandardMaterial({ color: '#4f8158', roughness: .95 })); crown.position.y = 1.35; crown.castShadow = true; group.add(crown);
    return this.add(group);
  }
  resize(width: number, height: number) { const aspect = Math.max(.1, width / height); const view = 8; this.camera.left = -view * aspect; this.camera.right = view * aspect; this.camera.top = view; this.camera.bottom = -view; this.camera.updateProjectionMatrix(); this.renderer.setSize(width, height, false); }
  animate = () => { this.frame = requestAnimationFrame(this.animate); this.renderer.render(this.scene, this.camera); };
  dispose() { cancelAnimationFrame(this.frame); this.disposables.forEach(object => object.traverse(child => { const mesh = child as THREE.Mesh; mesh.geometry?.dispose(); const material = mesh.material; if (Array.isArray(material)) material.forEach(item => item.dispose()); else material?.dispose(); })); this.renderer.dispose(); this.renderer.domElement.remove(); }
}
