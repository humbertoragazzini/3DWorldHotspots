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
import $ from 'jquery'
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
  // const gui = new GUI();
  // const rotation = {
  //   y: 0,
  // };

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

  // Ambient light to make all the world be on day time
  const ambientLingth = new THREE.AmbientLight("#ffffff", 0);
  // gui.add(ambientLingth, 'intensity',0,10,0.001)
  mainGroup.add(ambientLingth);

  document.getElementById('ambient_off').addEventListener('click',(e)=>{
    if(ambientLingth.intensity === 0){
      ambientLingth.intensity = 5;
      e.currentTarget.querySelector('#night').style.display = 'block'
      e.currentTarget.querySelector('#day').style.display = 'none'
    }else{
      ambientLingth.intensity = 0;
      e.currentTarget.querySelector('#night').style.display = 'none'
      e.currentTarget.querySelector('#day').style.display = 'block'
    }
  })

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
  // gui.add(sunDirectionalLigth.position, 'x',-100,100,0.001)


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
  const raycasterTester = new THREE.Raycaster();

  // Prev object hovered
  let prevObjectHover;

  // Cursor
  const mouse = new THREE.Vector2();

  window.addEventListener("mousemove", (e) => {
    mouse.x = (e.clientX / sizes.width - 0.5) * 2;
    mouse.y = -(e.clientY / sizes.height - 0.5) * 2;
  });

  // click event
  // document.getElementsByTagName('canvas')[0].addEventListener("click", () => {
  //   if (prevObjectHover.userData) {
  //     if (prevObjectHover.visible) {
  //       gsap.fromTo(
  //         prevObjectHover.userData.modal._element,
  //         {
  //           backdropFilter: "blur(0px)",
  //           zIndex: 0,
  //         },
  //         {
  //           backdropFilter: "blur(10px)",
  //           zIndex: 9999,
  //           duration: 1,
  //         }
  //       );
  //       all3DObjects.modalActive = true;
  //       prevObjectHover.userData.modal.show();
  //     }
  //   }
  // });


  // We add all the hotspots and we save them
  const all3DObjects = plotHotspots(hotspotPositions, wolrd3DObject);
  all3DObjects.hotspots.push(wolrd3DObject);
  all3DObjects.modalActive = false;

  // Check if is a modal open to remove rayCaster
  const checkModal = ()=>{
   return document.querySelectorAll('.modal.show')[0] ? false : true;
  }
  
  // Regular controls
  // const controls = new OrbitControls(camera, canvas);
  // html labels controls
  const controls = new OrbitControls(camera, all3DObjects.labelRenderer.domElement);
  controls.maxDistance = 40;
  controls.minDistance = 10;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.maxAzimuthAngle = 0.14;
  controls.minPolarAngle = 0.14;

  const emptyOBJ = {};

  let allhostpots = ''

  // for(let i=0; i<25 ;i++){
  //   const lat = (Math.random()*180)-90
  //   const lon = (Math.random()*360)-180
  //   allhostpots+=`
  //   {
  //     buttonLabel:${i},
  //     name: '${'Section-'+i}',
  //     content:
  //       "<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>",
  //     position: {
  //       lat: -31.153177687953566,
  //       lon: -138.236846184259,
  //     },
  //     rotation: { x: 1.7, y: -0.67, z: -0.1 },
  //     childs: [
  //       {
  //         buttonLabel:'child${i}',
  //         name: "section-child${i}",
  //         content:
  //           "<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>",
  //         position: {
  //           lat: ${lat+2},
  //           lon: ${lon-2},
  //         },
  //         rotation: { x: 1.7, y: -0.67, z: -0.1 },
  //         childs: [],
  //       },{
  //         buttonLabel:'child-0${i}',
  //         name: "section0-child-0${i}",
  //         content:
  //           "<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>",
  //         position: {
  //           lat: ${lat-2},
  //           lon: ${lon-2},
  //         },
  //         rotation: { x: 1.7, y: -0.67, z: -0.1 },
  //         childs: [],
  //       },{
  //         buttonLabel:'child-1${i}',
  //         name: "section-child-1${i}",
  //         content:
  //           "<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>",
  //         position: {
  //           lat: ${lat-1},
  //           lon: ${lon+2},
  //         },
  //         rotation: { x: 1.7, y: -0.67, z: -0.1 },
  //         childs: [],
  //       },{
  //         buttonLabel:'child-2${i}',
  //         name: "section-child-2${i}",
  //         content:
  //           "<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>",
  //         position: {
  //           lat: ${lat+3},
  //           lon: ${lon+3},
  //         },
  //         rotation: { x: 1.7, y: -0.67, z: -0.1 },
  //         childs: [],
  //       },
  //     ],
  //   },
  //   `
  // }

  console.log(allhostpots)

  let pos = new THREE.Vector3();
  setInterval(()=>{
    //Update items before render
    const distance = Math.sqrt(
      Math.pow(camera.position.x, 2) +
        Math.pow(camera.position.y, 2) +
        Math.pow(camera.position.z, 2)
    );
    all3DObjects.hotspots.forEach((hotspot,i)=>{
      if(all3DObjects.hotspots[all3DObjects.hotspots.length-1] !== hotspot){
        pos = pos.setFromMatrixPosition(hotspot.matrixWorld);
        pos.project(camera);
        pos.z = 0;
        raycasterTester.setFromCamera(pos,camera)
        const objectIntercepted = raycasterTester.intersectObjects([all3DObjects.hotspots[all3DObjects.hotspots.length-1],all3DObjects.hotspots[i]])[0].object.userData;
        if(objectIntercepted !== emptyOBJ){
          const btn = objectIntercepted.modalBTN;        
          if(btn){
              switch (objectIntercepted.level) {
                case 1:
                  if (distance > 15) {
                    btn.classList.remove('hidden')
                  } else {
                    btn.classList.add('hidden')
                  }
                  break;
                case 2:
                  if (distance < 15) {
                    btn.classList.remove('hidden')
                  } else {
                    btn.classList.add('hidden')
                  }
                  break;
      
                default:
                  break;
              }
          }else{
            hotspot.userData.modalBTN.classList.add('hidden');
          }
        }
      }
    })
    
  },300)
  let allTheData = ''

  // const tick = () => {
  //   // clock and update
  //   const elapsedTime = clock.getElapsedTime();
  //   // wolrd3DObject.rotation.y = elapsedTime / 200 + rotation.y;

  //   // Cast ray
  //   // if(checkModal()){
  //   //   raycaster.setFromCamera(mouse, camera);
  //   //   if (raycaster.intersectObjects(all3DObjects.hotspots)[2]) {
  //   //     prevObjectHover = raycaster.intersectObjects(all3DObjects.hotspots)[0].object;
  //   //     if (!(raycaster.intersectObjects(all3DObjects.hotspots)[0].object.scale.x > 1)) {
  //   //       if (raycaster.intersectObjects(all3DObjects.hotspots)[0].object.visible && raycaster.intersectObjects(all3DObjects.hotspots)[0].object.userData.modal instanceof bootstrap.Modal){
  //   //         raycaster.intersectObjects(all3DObjects.hotspots)[0].object.userData.enable();
  //   //         document.getElementById("the-body").style.cursor = "pointer";
  //   //       }
  //   //     }
  //   //   } else {
  //   //     if (prevObjectHover) {
  //   //       if (prevObjectHover.userData.modal instanceof bootstrap.Modal) {
  //   //         prevObjectHover.userData.disable();
  //   //         prevObjectHover = null;
  //   //         document.getElementById("the-body").style.cursor = "default";
  //   //       }
  //   //     }
  //   //   }
  //   // }else{
  //   //   if (prevObjectHover) {
  //   //     if (prevObjectHover.userData.modal instanceof bootstrap.Modal) {
  //   //       prevObjectHover.userData.disable();
  //   //       prevObjectHover = null;
  //   //       document.getElementById("the-body").style.cursor = "default";
  //   //     }
  //   //   }
  //   // }






  //   // Raycaster old
  //   // let pos = new THREE.Vector3();
  //   // pos = pos.setFromMatrixPosition(all3DObjects.hotspots[8].matrixWorld);
  //   // console.log(pos)
  //   // pos.project(camera);
  //   // let widthHalf = sizes.width / 2;
  //   // let heightHalf = sizes.height / 2;

  //   // pos.x = pos.x;
  //   // pos.y = pos.y;
  //   // pos.z = 0;

  //   // console.log(pos);

  //   // raycasterTester.setFromCamera(pos,camera)
  //   // console.log(raycasterTester.intersectObjects(all3DObjects.hotspots)[0].object.userData)



  //   // Update controls
  //   controls.update();

  //   // Renderer
  //   renderer.render(scene, camera);
  //   all3DObjects.labelRenderer.render(scene, camera);

  //   // Call tick again on the next frame
  //   window.requestAnimationFrame(tick);
  // };

  // setTimeout(tick,2500)

  let clocks = new THREE.Clock();
  let delta = 0;
// 30 fps
let interval = 1 / 60;


function update() {
  requestAnimationFrame(update);
  delta += clocks.getDelta();

    if (delta  > interval) {
    // Update controls
      controls.update();

    // we check ilumination
    if(ambientLingth.intensity > 0.05){
      wolrd3DObject.material.emissiveIntensity = 0
    }else{
      wolrd3DObject.material.emissiveIntensity = 1
    }

    // Renderer
      // wolrd3DObject.rotation.y = clocks.elapsedTime / 50
      renderer.render(scene, camera);
      all3DObjects.labelRenderer.render(scene, camera);

       delta = delta % interval;
   }
}

update()

});
