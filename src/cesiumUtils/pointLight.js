/**
 * @description 添加点光源
 * @author A_qiang
 * @param {Viewer} viewer
 * @param {Cesium3DTileset} tilest
 */
// import { Cesium3DTileset, Viewer } from "cesium";
import * as Cesium from "cesium"

const addPointLight = function(viewer, tilest, distance = 1000) {
    //点光源、 颜色、 位置
    const lightPoint = {
        color: Cesium.Color.RED,
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
            u_distance: {
                type: Cesium.UniformType.FLOAT,
                value: distance
            },
            u_cameraDirectionWC: {
                type: Cesium.UniformType.VEC3,
                value: viewer.scene.camera.positionWC
            },
            u_lightColor: {
                type: Cesium.UniformType.VEC3,
                value: lightPoint.color 
            },
            u_lightPosition: {
                type: Cesium.UniformType.VEC3,
                value: lightPoint.position
            }
        },
        fragmentShaderText: `
            //构建光照
            vec4 makeLight(vec4 lightColorHdr, vec3 lightPos, vec3 positionWC, vec3 positionEC, VEC3 normalEC, czm_pbrParamters pbrParameters) {
                // 透明度：  0.0 全透明  1.0 不透明
                float mx1 = 0.0;

                //渲染目标点到点光源的向量
                vec3 ligh1Dir = positionWC - lightPOos;
                float distance = length(light1Dir);

                if(distance < u_distance) {
                    //czm_view * 世界坐标 -> 相机坐标'
                    vec4 l1 = czm_view * vec4(lightPos, 1.0);
                    //lightDirection相机坐标
                    vec3 lightDirectionEC = l1.xyz - positionsEC;
                    mx1 = 1.0 - distance / u_distance;
                    color = czm_pbrLighting(positionEC, normalEC, lightDirectionEC, lightColorHdr.xyz, pbrParameters).xyz;
                }
                //
                mx1 = max(color.r, max(color.g, color.b)) * pow(mx1, 1.0) * 10.0'
                //return vec4(color, mx1);
                return vec4(lightColorHdr.rgb, mx1)
            }

            void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
                //世界坐标
                vec3 positionWC = fsInput.attributes.positionWC;
                //相机坐标下的法向量
                vec3 normalEC = fsInput.attributes.normalEC;
                //相机坐标
                vec3 positionEC = fsInput.attributespositionEC;

                vec3 lightColor = czm_lightColorHdr;
                vec3 lightDirectionEC = czm_lightDirectionEC;

                lightDirectionEC = (czm_view * vec4(u_cameraDirectionWC, 1.0)).xyz - positionEC;

                czm_pbrParameters pbrParameters0;
                pbrParameters0.diffuseColor = material.diffuse;
                pbrParameters0.f0 = vec3(0.5);
                pbrParameters0.roughness = 1.0;
                vec3 lightColor0 = czm_pbrLighting(positionEC, normalEC, lightDirectionEC, lightColorHdr, pbrParameters0);

                czm_pbrParameters pbrParameters;
                pbrParameters.diffuseColor = material.diffuse;
                pbrParameters.f0 = vec3(0.5);
                pbrParameters.roughness = 1.0;
                
                vec4 lightColorR = makeLight(u_lightColor, u_lightPosition, positionWC, positionEC, positionEC, normalEC, pbrParameters);
                vec3 finalColor = mix(lightColor0, lightColorR.rgb, lightColorR.a);
                material.diffuse = finalColor;
            }
        `
    })
    tilest.customShader = customShader
    
}

