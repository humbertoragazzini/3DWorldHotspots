//TODO.setFromSphericalCoords ( radius : Float, phi : Float, theta : Float ) : this
//Sets this vector from the spherical coordinates radius, phi and theta. To position object in the sphere

import * as THREE from "three";
import GUI from "lil-gui";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/all";
import { TextureLoader } from "three";
import * as bootstrap from "bootstrap";
import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/examples/jsm/renderers/CSS2DRenderer";
gsap.registerPlugin(ScrollTrigger);



/**
 * Add objs
 */
let labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = "absolute";
labelRenderer.domElement.style.top = "0";
document.body.appendChild(labelRenderer.domElement);

  
window.addEventListener('resize',()=>{
  labelRenderer.setSize( window.innerWidth, window.innerHeight );
})

const geometryHotspot = new THREE.BoxGeometry(0.05, 0.05,0.05);

const all3DObjectsHotspot = [];
const hotSpotsMesh = [];
if(window.location.hash === '#debug'){
  // Dev tools
  var gui = new GUI();
}

const adjustPosition = (hotspot, wolrd3DObject, newHotspot, hotspotContainerDiv) => {
  var hotspotSpherical = {
    lat: THREE.MathUtils.degToRad(90 - hotspot.position.lat),
    lon: THREE.MathUtils.degToRad(hotspot.position.lon),
  };

  var radius = 10.25 ;

  var newHotspotVector = new THREE.Vector3().setFromSphericalCoords(
    radius,
    hotspotSpherical.lat,
    hotspotSpherical.lon
  );
  // check we did it correctly
  var spherical = new THREE.Spherical().setFromVector3(newHotspotVector);

  newHotspot.position.setFromSphericalCoords(
    spherical.radius,
    spherical.phi,
    spherical.theta
  );

  var lookDirection = new THREE.Vector3();
  var target = new THREE.Vector3();
  lookDirection
    .subVectors(newHotspot.position, new THREE.Vector3(0, 0, 0))
    .normalize();
  target.copy(wolrd3DObject.position).add(lookDirection);

  newHotspot.lookAt(target);
  newHotspot.add(hotspotContainerDiv)


};
let mainLevel = 1;
let childLevel = 1;
export default function plotHotspots(hotspotPositions, wolrd3DObject, level) {
  console.log(level)
  // Init level
  if (level === undefined) {
  }
  console.log(level)

  // Loaders
  const textureLoader = new TextureLoader();

  //hotspot
  const hotspotMapTexture = textureLoader.load("textures/hotspot/hotspot5.png");
  hotspotMapTexture.colorSpace = THREE.SRGBColorSpace;

  hotspotPositions.forEach((hotspot,i) => {
    
    // Modals
    const templateModal = document.querySelector("#modal-template");
    const cloneModal = templateModal.content.cloneNode(true);
    cloneModal
      .querySelector("#close-header")
      .addEventListener("pointerdown", () => {
        mymodal.hide();
      });
    cloneModal
      .querySelector("#close-footer")
      .addEventListener("pointerdown", () => {
        mymodal.hide();
      });
      cloneModal.querySelector(".modal").id = hotspot.name;
      cloneModal.querySelector("#exampleModalLabel").innerHTML = hotspot.name;
    cloneModal.querySelector(".modal-body").innerHTML = `${hotspot.content}`;
    document.getElementById("the-body").append(cloneModal);

    const mymodal = new bootstrap.Modal(
      document.getElementById(hotspot.name),
      {}
    );
    const materialHotspot = new THREE.MeshBasicMaterial({
      color: "#aaaaaa",
      opacity:1,
      transparent:true
    });
    
    // Modal BTNs
    const template = document.querySelector("#modal_btn");
    const cloneBTN = template.content.cloneNode(true);
    cloneBTN.querySelector(".text_out").innerHTML = hotspot.buttonLabel;
    cloneBTN.querySelector(".btn_modal_opener").id = hotspot.name.replace(/\s/g, '');
    // document.getElementById("canvas-container").append(cloneBTN);
    

    const pointerLight = new THREE.PointLight("#fff", 0);
    const newHotspot = new THREE.Mesh(geometryHotspot, materialHotspot);
    newHotspot.add(pointerLight);
    // newHotspot.castShadow = true;Program Info Log: FRAGMENT shader uniforms count exceeds MAX_FRAGMENT_UNIFORM_VECTORS(1024)

    //TODO make the debug tools for hotspot better
    // for debug
    const hotspotGuiObj = {
      position: {
        lat: hotspot.position.lat,
        lon: hotspot.position.lon,
      },
    };      
    
    // const hotspotDiv = document.getElementById(hotspot.name.replace(/\s/g, ''));
    const hotspotDiv = cloneBTN.getElementById(hotspot.name.replace(/\s/g, ''));
    hotspotDiv.addEventListener('pointerdown',(e)=>{
      console.log('clicked')
      mymodal.show();
    })
    const hotspotContainerDiv = new CSS2DObject(hotspotDiv);
    hotspotContainerDiv.position.set(0,0,0);
    newHotspot.userData.modalBTN = hotspotDiv;
    newHotspot.userData.modal = mymodal;
    newHotspot.userData.name = hotspot.name;
    newHotspot.userData.level = level === undefined ? mainLevel : level; 
    console.log(level === undefined ? mainLevel : level)
    newHotspot.userData.enable = ()=>{
      newHotspot.material.color.set("#ffffff");
      newHotspot.children[0].intensity = 1;
    }; 
    newHotspot.userData.disable = ()=>{
      newHotspot.material.color.set("#bbbbbb");
      newHotspot.children[0].intensity = 0.25;
    }; 
    all3DObjectsHotspot.push(newHotspot);

    wolrd3DObject.add(newHotspot);


    adjustPosition(hotspot, wolrd3DObject, newHotspot,hotspotContainerDiv);

    if (hotspot.childs.length > 0) {
      plotHotspots(hotspot.childs, wolrd3DObject, mainLevel + childLevel);
      if(hotspotPositions.length - 1 == i){
        mainLevel++
      }
    }

    if(window.location.hash === '#debug'){
      // Dev tools
      const newGroup = gui.addFolder(hotspot.name)
      newGroup.close()
      newGroup
        .add(hotspotGuiObj.position, "lat")
        .min(-180)
        .max(180)
        .step(0.0001)
        .onChange((value) => {
          adjustPosition(hotspotGuiObj, wolrd3DObject, newHotspot);
        });
      newGroup
        .add(hotspotGuiObj.position, "lon")
        .min(-180)
        .max(180)
        .step(0.0001)
        .onChange((value) => {
          adjustPosition(hotspotGuiObj, wolrd3DObject, newHotspot);
        });
        }
  });



  return { hotspots: all3DObjectsHotspot, levels: 2, labelRenderer: labelRenderer };
}
