import { TextureLoader } from "three";
import { CubeTextureLoader } from "three";
import * as THREE from "three";

const textureLoader = new TextureLoader();
const cubeTextureLoader = new CubeTextureLoader();

export default function buildWorld() {
  // Textures

  /**
   * NightMap
   */
  const nightMapTexture = textureLoader.load(
    "textures/map/night_lights_modified.png"
  );
  nightMapTexture.colorSpace = THREE.SRGBColorSpace;
  nightMapTexture.offset.x = 0.255;
  nightMapTexture.wrapS = 5;

  /**
   * Map
   */
  const worldMapTexture = textureLoader.load(
    "textures/map/8081_earthmap10k.jpg"
  );
  worldMapTexture.colorSpace = THREE.SRGBColorSpace;
  worldMapTexture.offset.x = 0.255;
  worldMapTexture.wrapS = 5;

  /**
   * RoughnessMap
   */
  const roughnessworldMapTexture = textureLoader.load(
    "textures/map/landmask4K.png"
  );
  roughnessworldMapTexture.offset.x = 0.255;
  roughnessworldMapTexture.wrapS = 5;

  /**
   * BumpMap
   */
  const bumpMapworldMapTexture = textureLoader.load(
    "textures/map/earth_bumpmap.jpg"
  );
  bumpMapworldMapTexture.colorSpace = THREE.SRGBColorSpace;
  bumpMapworldMapTexture.offset.x = 0.25;
  bumpMapworldMapTexture.wrapS = 5;

  /**
   * Future cloudMap
   */
  const cloudsdMapTexture = textureLoader.load("textures/map/clouds.jp2");
  cloudsdMapTexture.colorSpace = THREE.SRGBColorSpace;

  /**
   * 3D Object
   */
  const geom = new THREE.SphereGeometry(10, 50, 50);
  const mate = new THREE.MeshStandardMaterial({
    map: worldMapTexture,
    geometryNormal: new THREE.Vector3(0, 0, 0),
    roughnessMap: roughnessworldMapTexture,
    metalnessMap: roughnessworldMapTexture,
    roughness: 0.6,
    metalness: 0.15,
    bumpMap: bumpMapworldMapTexture,
    emissiveMap: nightMapTexture,
    bumpScale: 0.2,
    envMapIntensity: 0,
    emissiveIntensity: 0.5,
    emissive: new THREE.Color(0xffff88),
  });

  /**
   * Custom Shader
   */
  console.log(mate);

  mate.onBeforeCompile = function (shader) {
    shader.vertexShader = shader.vertexShader.replace(
      "#include <normal_vertex>",
      ` 
      #ifndef FLAT_SHADED // normal is computed with derivatives when FLAT_SHADED

        vNormal = normalize( transformedNormal );
      
        #ifdef USE_TANGENT
      
          vTangent = normalize( transformedTangent );
          vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
      
        #endif
      
      #endif
      `
    );
    shader.vertexShader = shader.vertexShader.replace(
      "#include <normal_pars_vertex>",
      ` 
      #ifndef FLAT_SHADED

        varying vec3 vNormal;
      
        #ifdef USE_TANGENT
      
          varying vec3 vTangent;
          varying vec3 vBitangent;
      
        #endif
      
      #endif
      `
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <normal_pars_fragment>",
      ` 
      #ifndef FLAT_SHADED

        varying vec3 vNormal;
      
        #ifdef USE_TANGENT
      
          varying vec3 vTangent;
          varying vec3 vBitangent;
      
        #endif
      
      #endif
      `
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <emissivemap_fragment>",
      ` 
      #ifdef USE_EMISSIVEMAP

        vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
        emissiveColor *= 1.0 - smoothstep(-0.03, 0.0, dot(vNormal, directionalLights[0].direction));
        totalEmissiveRadiance *= emissiveColor.rgb;
      
      #endif
      `
    );
  };

  /**
   * Mesh
   */
  const wolrd3DObject = new THREE.Mesh(geom, mate);

  /**
   * Initial props
   */
  wolrd3DObject.scale.x = 0.75;
  wolrd3DObject.scale.y = 0.75;
  wolrd3DObject.scale.z = 0.75;
  wolrd3DObject.castShadow = true;
  wolrd3DObject.receiveShadow = true;
  wolrd3DObject.updateMatrixWorld();

  return wolrd3DObject;
}
