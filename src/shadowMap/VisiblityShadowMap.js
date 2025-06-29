import * as Cesium from "cesium";

export default class VisiblityShadowMap { 
    constructor(viewer, url) { 
        if (!viewer) {
            throw new Error("viewer is required");
        }
        this.viewer = viewer;
        this.camera = viewer.camera;
        this.scene = viewer.scene;
        this.shadowMap = undefined;
        this.url = url
        //添加倾斜摄影
        this.addTileset()
        //1.创建相机
        this.createLightCamera()
        //2.创建ShadowMap
        this.createShadowMap()
        //3.创建一个后处理
        this.createPostProcessStage()
    }

    //添加倾斜摄影
    async addTileset() {
        const tileset = await Cesium.Cesium3DTileset.fromUrl(this.url) 
        this.viewer.scene.primitives.add(tileset)
    }
    createLightCamera() { 
        this.camera = new Cesium.Camera(this.scene)
        this.camera.frustum.near = 0.1
        this.camera.frustum.far = 5000
        this.camera.frustum.fov = Cesium.Math.PI_OVER_THREE
        this.camera.setView({
            destination: new Cesium.Cartesian3( -2307082.014701444, 5418677.990564013, 2440917.1505572563)
        })
        this.cameraPrimitive = new Cesium.DebugCameraPrimitive({
            camera: this.camera,
            color: Cesium.Color.RED,
            show: true,
            updateOnChange: true
        })
        this.scene.primitives.add(this.cameraPrimitive)
    }

    createShadowMap() {
        this.shadowMap = new Cesium.ShadowMap({
            lightCamera: this.camera,
            context: this.scene.context,
            isPointLight: false,
            isSpotLight: true,
            cascadesEnabled: false
        })
        this.scene.shadowMap = this.shadowMap
    }

    createPostProcessStage() {
        let uniforms = {
            shadowMap_texture: () => {
                return this.shadowMap._shadowMapTexture
            },
            shadowMap_matrix: () => {
                return this.shadowMap._shadowMapMatrix
            },
            shadowMap_lightPositionEC: () => {
                return this.shadowMap._lightPositionEC
            },
            shadowMap_texelSizeDepthBiasAndNormalShadingSmooth: () => {
                const texelStepSize = new Cesium.Cartesian2()
                texelStepSize.x = 1.0 / this.shadowMap._textureSize.x;
                texelStepSize.y = 1.0 / this.shadowMap._textureSize.y;
                return Cesium.Cartesian4.fromElements(
                    texelStepSize.x,
                    texelStepSize.y,
                    this.shadowMap._primitiveBias.depthBias,
                    this.shadowMap._primitiveBias.normalShadingSmooth,
                    new Cesium.Cartesian4()
                )
            },
            shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarkness: () => {
                return Cesium.Cartesian4.fromElements(
                    this.shadowMap._primitiveBias.normalOffsetScale,
                    this.shadowMap._distance,
                    this.shadowMap.maximumDistance,
                    this.shadowMap._darkness,
                    new Cesium.Cartesian4()
                )
            }
        }

        let fragmentShader = `
            uniform sampler2D colorTexture;
            in vec2 v_textureCoordinates;
            uniform sampler2D depthTexture;
            //相关变量的定义
            uniform sampler2D shadowMap_texture;
            uniform mat4 shadowMap_matrix;
            uniform vec4 shadowMap_lightPositionEC;
            uniform vec4 shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarkness;
            uniform vec4 shadowMap_texelSizeDepthBiasAndNormalShadingSmooth;
            //重写了czm_shadowVisibility方法
            float _czm_shadowVisibility(sampler2D shadowMap, czm_shadowParameters shadowParameters)
            {
                float depthBias = shadowParameters.depthBias;
                float depth = shadowParameters.depth;
                float nDotL = shadowParameters.nDotL;
                float normalShadingSmooth = shadowParameters.normalShadingSmooth;
                float darkness = shadowParameters.darkness;
                vec2 uv = shadowParameters.texCoords;
                depth -= depthBias;
                float visibility = czm_shadowDepthCompare(shadowMap, uv, depth);
                return visibility;
            }
            
            void main()
            { 
                vec4 color = texture(colorTexture, v_textureCoordinates);
                out_FragColor = texture(colorTexture, v_textureCoordinates);
                float depth = czm_unpackDepth(texture(depthTexture, v_textureCoordinates));
                if (depth > 1.0) {
                    return;
                }
                //当前像素的坐标(相机坐标系)
                vec4 eyeCoordinate4 = czm_windowToEyeCoordinates(gl_FragCoord.xy, depth);
                vec4 positionEC = eyeCoordinate4 / eyeCoordinate4.w;
                //复制源码的开始
                vec3 normalEC = vec3(1.);
                czm_shadowParameters shadowParameters;
                shadowParameters.texelStepSize = shadowMap_texelSizeDepthBiasAndNormalShadingSmooth.xy;
                shadowParameters.depthBias = shadowMap_texelSizeDepthBiasAndNormalShadingSmooth.z;
                shadowParameters.normalShadingSmooth = shadowMap_texelSizeDepthBiasAndNormalShadingSmooth.w;
                shadowParameters.darkness = shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarkness.w;
                shadowParameters.depthBias *= max(depth * 0.1, 1.);
                vec3 directionEC = normalize(positionEC.xyz - shadowMap_lightPositionEC.xyz);
                float nDotL = clamp(dot(normalEC, -directionEC), 0.0, 1.0);

                vec4 shadowPosition = shadowMap_matrix * positionEC;
                shadowPosition /= shadowPosition.w;
                if (any(lessThan(shadowPosition.xyz, vec3(0.))) || any(greaterThanEqual(shadowPosition.xyz, vec3(1.)))) {
                    return;
                }  
                shadowParameters.texCoords = shadowPosition.xy;
                shadowParameters.depth = shadowPosition.z;
                shadowParameters.nDotL = nDotL;
                float visibility = _czm_shadowVisibility(shadowMap_texture, shadowParameters);
                //复制源码结束
                if (visibility == 1.) {
                    out_FragColor += vec4(0., 1., 0., 0.5); //可视为绿色
                } else {
                    out_FragColor += vec4(1., 0., 0., 0.2); //不可视为红色
                }
            }
        `
        const postProcessStage= new Cesium.PostProcessStage({
            fragmentShader: fragmentShader,
            uniforms: uniforms
        })
        this.scene.postProcessStages.add(postProcessStage)
    }
}