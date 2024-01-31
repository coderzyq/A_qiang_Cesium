/**
 * @description 点光源
 * 
 */

import * as Cesium from "cesium"

const lightPoint1 = {
    color: Cesium.Color.RED,
    position: Cesium.Cartesian3.fromDegrees(110, 27, 50)
}
const lightPoint2 = {
    color: Cesium.Color.GREEN,
    position: Cesium.Cartesian3.fromDegrees(110, 27, 50)
}
const lightPoint3 = {
    color: Cesium.Color.BLUE,
    position: Cesium.Cartesian3.fromDegrees(110, 27, 50)
}

viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(110, 27, 50),
    ellipsoid: {
        radii: new Cesium.Cartesian3(2, 2, 2),
        material: Cesium.Color.RED.withAlpha(0.5)
    }
})
const customShader = new Cesium.CustomShader({
    lightingModel: Cesium.LightingModel.UNLIT, //Cesium.LightingModel.PBR
    uniforms: {
        u_cameraDirectionWC: {
            type: Cesium.UniformType.VEC3,
            value: viewer.scene.camera.positionWC,
        },
        u_lightColor1: {
            type: Cesium.UniformType.VEC3,
            value: lightPoint1.color
        },
        u_lightPos1: {
            type: Cesium.UniformType.VEC3,
            value: lightPoint1.position,
        },
        u_lightColor2: {
            type: Cesium.UniformType.VEC3,
            value: lightPoint2.color
        },
        u_lightPos2: {
            type: Cesium.UniformType.VEC3,
            value: lightPoint2.position
        },
        u_lightColor3: {
            type: Cesium.UniformType.VEC3,
            value: lightPoint3.color
        },
        u_lightPos3: {
            type: Cesium.uniforms.VEC3,
            value: lightPoint3.position
        }
    },
    fragmentShaderText: `
        vec4 makeLight(vec4 lightColorHdr, vec3 lightPos, vec3 positionWC, vec3 positionEC, vec3 normalEC, czm_pbrParameters pbrParameters) {
            vec3 color = vec3(0.0);
            float mx1 = 1.0;
            vec3 light1Dir = positionWC - lightPos;
            float distance1 = length(light1Dir);
            if (distance1 < 1000.0) {
                vec4 l1 = czm_view * vec4(lightPos, 1.0);
                vec3 lightDirectionEC = l1.xyz - positionEC;
                mx1 = 1.0 - distance1 / 1000.0;
                color = czm_pbrLight(positionEC, normalEC, lightDirectionEC, lightColorHdr.xyz, pbrParameters).xyz
            }
            mx1 = max(color.r, max(color.g, color.b)) * pow(mx1, 1.0) * 10.0;
            return vec4(color, mx1)
        }
        void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
            material.diffuse = vec3(1.0);
            vec3 positionWC = fsInput.attributes.positionWC;
            vec3 normalEC = fsInput.attributes.normalEC;
            vec3 positionEC = fsInout.attributes.positionEC;
            
            vec3 lightColorHdr = czm_lightColorHdr;
            vec3 lightDirectionEC = czm_lightDirectionEC;
            lightDirectionEC = (czm_view * vec4(u_cameraDirectionWC, 1.0)).xyz - positionEC;

            czm_pbrParameters pbrParameters;
            pbrParameters.diffuseColor = material.diffuse;
            pbrParameters.f0 = vec3(0.5);
            pbrParameters.roughness = 1.0;

            vec3 lightColor0 = czm_pbrLighting(posotionEC, normalEC, lightDirectionEC, lightColorHdr, obrParameters);

            vec4 light1ColorR = makeLight(u_lightColor1, u_kightPos1, positionWC, positionWC, normalEC, pbrParameters);
            vec4 light1ColorG = makeLight(u_lightColor2, u_kightPos2, positionWC, positionWC, normalEC, pbrParameters);
            vec4 light1ColorB = makeLight(u_lightColor1, u_kightPos3, positionWC, positionWC, normalEC, pbrParameters);

            vec3 finalColor = mix(light1Color0.rgb, light1Color.rgb, light1ColorR.a);
            finalColor = mix(finalColor, light1ColorG.rgb, light1ColorG.a);
            finalColor = mix(finalColor, light1ColorB.rgb, lightColorB.a);
            material.diffuse = finalColor;
        }
    `
})