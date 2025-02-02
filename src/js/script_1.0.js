//TODO.setFromSphericalCoords ( radius : Float, phi : Float, theta : Float ) : this
//Sets this vector from the spherical coordinates radius, phi and theta. To position object in the sphere

import * as THREE from "three";
import GUI from "lil-gui";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/all";
import { TextureLoader } from "three";
import { CubeTextureLoader } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import hotspotPositions from "./data/hotpots";
import buildWorld from "./World/world3d";
import plotHotspots from "./Hotspot3D/hotspots";
import * as bootstrap from "bootstrap";
gsap.registerPlugin(ScrollTrigger);
// Dev config if is needed
const devConfig = {};
let LVLNumber = 0;

const checkLevel = (hotspotPositions) => {
  LVLNumber++;
  hotspotPositions.forEach((hotspot) => {
    if (hotspot.childs.length > 0) {
      checkLevel(hotspot.childs);
    }
  });
};

document.addEventListener("DOMContentLoaded", () => {
  // Dev tools
  const gui = new GUI();
  const rotation = {
    y: 0,
  };

  gui.add(rotation, "y", -Math.PI * 2, Math.PI * 2, 0.001);

  // Loaders
  const textureLoader = new TextureLoader();
  const cubeTextureLoader = new CubeTextureLoader();

  // EnvironmentMap
  const environment = cubeTextureLoader.load([
    "textures/enviromentMaps/px.png",
    "textures/enviromentMaps/nx.png",
    "textures/enviromentMaps/py.png",
    "textures/enviromentMaps/ny.png",
    "textures/enviromentMaps/pz.png",
    "textures/enviromentMaps/nz.png",
  ]);

  //hotspot
  const hotspotMapTexture = textureLoader.load("textures/hotspot/hotspot5.png");
  hotspotMapTexture.colorSpace = THREE.SRGBColorSpace;

  // Canvas
  const canvas = document.querySelector("canvas.webgl");

  // Scene
  const scene = new THREE.Scene();
  scene.background = environment;
  scene.backgroundBlurriness = 0.5;
  scene.environment = environment;

  // Main group
  const mainGroup = new THREE.Group();

  // Light
  const ambientLingth = new THREE.AmbientLight("#ffffff", 5);
  // mainGroup.add(ambientLingth);

  // We get sizes for ratio and vp of the renderer
  const sizes = {
    width: document.getElementById("canvas-container").getClientRects()[0]
      .width,
    height: document.getElementById("canvas-container").getClientRects()[0]
      .height,
  };

  // Directional Light
  const sunDirectionalLigth = new THREE.DirectionalLight("#ffffff", 3);
  sunDirectionalLigth.shadow.camera.left = -10;
  sunDirectionalLigth.shadow.camera.right = 10;
  sunDirectionalLigth.shadow.camera.top = 10;
  sunDirectionalLigth.shadow.camera.bottom = -10;
  sunDirectionalLigth.shadow.mapSize.width = sizes.height;
  sunDirectionalLigth.shadow.mapSize.height = sizes.width;
  sunDirectionalLigth.shadow.camera.near = 1;
  sunDirectionalLigth.shadow.camera.far = 2000;
  sunDirectionalLigth.shadow.camera.fov = 75;
  sunDirectionalLigth.position.x = -13;
  sunDirectionalLigth.position.y = 1;
  sunDirectionalLigth.position.z = 10;
  sunDirectionalLigth.castShadow = true;
  mainGroup.add(sunDirectionalLigth);

  // 3DWorld
  const wolrd3DObject = buildWorld(sunDirectionalLigth);
  mainGroup.add(wolrd3DObject);

  // we make the sun look the world
  sunDirectionalLigth.lookAt(wolrd3DObject);

  // We capture resize event for camera and ratios
  window.addEventListener("resize", () => {
    // Update sizes
    sizes.width = document
      .getElementById("canvas-container")
      .getClientRects()[0].width;
    sizes.height = document
      .getElementById("canvas-container")
      .getClientRects()[0].height;

    // Update camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });

  // Base camera
  const camera = new THREE.PerspectiveCamera(
    50,
    sizes.width / sizes.height,
    0.001,
    1000
  );
  camera.position.z = 20;
  mainGroup.add(camera);

  // Render Object
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
  });

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  scene.add(mainGroup);

  // Main clock
  const clock = new THREE.Clock();

  // Raycaster
  const raycaster = new THREE.Raycaster();

  // Prev object hovered
  let prevObjectHover;

  // Cursor
  const mouse = new THREE.Vector2();

  window.addEventListener("mousemove", (e) => {
    mouse.x = (e.clientX / sizes.width - 0.5) * 2;
    mouse.y = -(e.clientY / sizes.height - 0.5) * 2;
  });

  // click event
  window.addEventListener("click", () => {
    if (prevObjectHover.userData) {
      if (prevObjectHover.visible) {
        console.log(prevObjectHover.userData.modal._element);
        gsap.fromTo(
          prevObjectHover.userData.modal._element,
          {
            backdropFilter: "blur(0px)",
            zIndex: 0,
          },
          {
            backdropFilter: "blur(10px)",
            zIndex: 9999,
            duration: 1,
          }
        );
        prevObjectHover.userData.modal.show();
      }
    }
  });

  const controls = new OrbitControls(camera, canvas);
  controls.maxDistance = 25;
  controls.minDistance = 10;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.maxAzimuthAngle = 0.14;
  controls.minPolarAngle = 0.14;

  // We add all the hotspots and we save them
  // const all3DObjectsHotspot = plotHotspots(hotspotPositions, wolrd3DObject);
  // all3DObjectsHotspot.push(wolrd3DObject);
  const all3DObjects = plotHotspots(hotspotPositions, wolrd3DObject);
  all3DObjects.hotspots.push(wolrd3DObject);

  const tick = () => {
    // clock and update
    const elapsedTime = clock.getElapsedTime();
    wolrd3DObject.rotation.y = elapsedTime / 200 + rotation.y;

    // Cast ray
    raycaster.setFromCamera(mouse, camera);
    // console.log(all3DObjects.hotspots);
    if (raycaster.intersectObjects(all3DObjects.hotspots)[2]) {
      // console.log(raycaster.intersectObjects(all3DObjects.hotspots)[0]);
      prevObjectHover = raycaster.intersectObjects(all3DObjects.hotspots)[0]
        .object;
      if (
        !(
          raycaster.intersectObjects(all3DObjects.hotspots)[0].object.scale.x >
          1
        )
      ) {
        if (
          raycaster.intersectObjects(all3DObjects.hotspots)[0].object.visible &&
          raycaster.intersectObjects(all3DObjects.hotspots)[0].object.userData
            .modal instanceof bootstrap.Modal
        ) {
          gsap.to(
            raycaster.intersectObjects(all3DObjects.hotspots)[0].object
              .children[0],
            { intensity: 5, ease: "elastic.out(1,0.3)", duration: 1 }
          );
          gsap.to(
            raycaster.intersectObjects(all3DObjects.hotspots)[0].object.scale,
            {
              x: 1.55,
              y: 1.55,
              z: 1.55,
              ease: "elastic.out(1,0.3)",
              duration: 1,
            }
          );
          prevObjectHover.material.color.set("#ffffff");
          document.getElementById("the-body").style.cursor = "pointer";
        }
      }
    } else {
      if (prevObjectHover) {
        if (prevObjectHover.userData.modal instanceof bootstrap.Modal) {
          prevObjectHover.material.color.set("#bbbbbb");
          document.getElementById("the-body").style.cursor = "default";
          gsap.to(prevObjectHover.scale, {
            x: 1,
            y: 1,
            z: 1,
            ease: "elastic.out(1,0.3)",
            duration: 1,
          });
          gsap.to(prevObjectHover.children[0], {
            intensity: 0,
            duration: 0.5,
            onComplete: () => {
              prevObjectHover = null;
            },
          });
        }
      }
    }

    // Update items before render
    const distance = Math.sqrt(
      Math.pow(camera.position.x, 2) +
        Math.pow(camera.position.y, 2) +
        Math.pow(camera.position.z, 2)
    );
    all3DObjects.hotspots.forEach((obj) => {
      if (obj.userData.level) {
        switch (obj.userData.level) {
          case 1:
            if (distance > 12) {
              obj.visible = true;
            } else {
              obj.visible = false;
            }
            break;
          case 2:
            if (distance < 12) {
              obj.visible = true;
            } else {
              obj.visible = false;
            }
            break;
          case 3:
            break;

          default:
            break;
        }
      }
    });

    // Update controls
    controls.update();

    // Renderer
    renderer.render(scene, camera);

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
  };

  tick();
});
