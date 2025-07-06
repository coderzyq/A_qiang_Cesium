import * as Cesium from "cesium";
import ECEF from "../utils/ecef";
export default class VideoShadowMap {
  constructor(viewer, options) {
    this.viewer = viewer;
    this.scene = viewer.scene;
    this.options = options;
    this.url = options.tileset
    this.CT = new ECEF();
    this.option = this.initCameraParam();
    if (!this.option.cameraPosition || !this.option.position) {
      console.log("位置坐标错误");
      return;
    }
this.addTileset()
    //创建视频ElementVideo
    this.videoEle = this.activeElementVideo(this.options.url);
    //创建相机视锥体
    this.camera = this.createFrustum(this.viewer, this.options.position);
    //创建ShadowMap
    this.shadowMap = this.createShadowMap();
    // //添加postprocess
    this.addPostProcess();
  }

//添加倾斜摄影
    async addTileset() {
        const tileset = await Cesium.Cesium3DTileset.fromUrl(this.url)
        console.log(tileset);
        
        this.viewer.scene.primitives.add(tileset)
    }
  //初始化相机参数
  initCameraParam() {
    console.log(this.options.position);
    let viewPoint = this.CT.enu_to_ecef(
      {
        longitude: this.options.position.x * 1,
        latitude: this.options.position.y * 1,
        altitude: this.options.position.z * 1,
      },
      {
        distance: this.options.far,
        azimuth: this.options.rotation.y * 1,
        elevation: this.options.rotation.x * 1,
      }
    );
    let position = Cesium.Cartesian3.fromDegrees(
      viewPoint.longitude,
      viewPoint.latitude,
      viewPoint.height
    );
    let cameraPosition = Cesium.Cartesian3.fromDegrees(
      this.options.position.x * 1,
      this.options.position.y * 1,
      this.options.position.z * 1
    );
    return {
      url: this.options.url,
      cameraPosition: cameraPosition,
      position: position,
      alpha: this.options.alpha,
      near: this.options.near,
      far: this.options.far,
      debugFrustum: this.options.debugFrustum,
    };
  }
  //初始化相机
  initCamera() {
    let { position, heading, pitch, roll } = this.options;
    let camera = new Cesium.Camera(this.viewer.scene);
    //设置相机的位置和视角
    camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(
        position[0],
        position[1],
        position[2]
      ),
      orientation: {
        heading: Cesium.Math.toRadians(heading),
        pitch: Cesium.Math.toRadians(pitch),
        roll: Cesium.Math.toRadians(roll),
      },
    });
    //设置相机的锥体
    camera.frustum = new Cesium.PerspectiveFrustum({
      fov: Cesium.Math.toRadians(60),
      aspectRatio: 1,
      near: 1,
      far: 1000,
    });

    let cameraPrimitive = new Cesium.DebugCameraPrimitive({
      camera: camera,
      color: Cesium.Color.RED,
      show: true,
    });

    this.viewer.scene.primitives.add(cameraPrimitive);

    this.viewer.zoomTo(cameraPrimitive);
  }

  /**
   * 创建视频elementVideo
   */
  activeElementVideo(videoUrl) {
    let videoElement = document.createElement("video");
    videoElement.controls = true;
    videoElement.autoplay = "autoplay";
    videoElement.preload = "auto";
    videoElement.loop = true;
    videoElement.muted = true;
    videoElement.style.cssText =
      "position:absolute;left:0px;top:0px;width:400px;height:400px;";
    videoElement.style.visibility = "hidden";
    document.body.appendChild(videoElement);
    let vId = new Date().getTime();
    console.log(vId, "videoElement");
    videoElement.setAttribute("id", vId);

    setTimeout(() => {
      try {
        // 使用元素引用而非ID更可靠
        const player = videojs(videoElement);

        player.ready(() => {
          player.src({
            src: videoUrl,
            type: "application/x-mpegURL", // HLS流
          });
          player.load();
        });
      } catch (error) {
        console.error("VideoJS初始化失败:", error);
      }
    }, 0); // 延迟到下一个事件循环

    return videoElement;
  }

  /**
   * 创建视频视锥体
   */
  createFrustum(viewer, position) {
    const camera = new Cesium.Camera(this.scene);
    camera.frustum.near = 0.1;
    camera.frustum.far = 200;
    camera.frustum.fov = Cesium.Math.PI_OVER_THREE;
    camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(
        113.0625945534971,
        22.646893657887965,
        253.03951455221826
      ),
    });
    this.cameraPrimitive = new Cesium.DebugCameraPrimitive({
      camera: camera,
      color: Cesium.Color.RED,
      show: true,
      updateOnChange: true,
    });
    viewer.scene.primitives.add(this.cameraPrimitive);
    return camera;
  }

  
  createShadowMap() {
    const shadowMap = new Cesium.ShadowMap({
      lightCamera: this.camera,
      context: this.viewer.scene.context,
      isSpotLight: !0,
      isPointLight: !1,
      cascadesEnabled: !1,
    });
    this.viewShadowMap = this.viewer.scene.shadowMap = shadowMap;
    return shadowMap;
  }

  /**
   * 添加后处理程序
   */
  addPostProcess() {
    let fragmentShader = `
       uniform sampler2D colorTexture;
       in vec2 v_textureCoordinates;
       uniform sampler2D depthTexture;

       uniform sampler2D shadowMap_texture;
       uniform sampler2D videoTexture;
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

       void main() {
           vec4 color = texture(colorTexture, v_textureCoordinates);
           out_FragColor = texture(colorTexture, v_textureCoordinates);
           float depth = czm_unpackDepth(texture(depthTexture, v_textureCoordinates));
           if (depth >= 1.0) {
               return;
           }
            //当前像素的坐标（相机坐标系）
            vec4 eyeCoordinate4 = czm_windowToEyeCoordinates(gl_FragCoord.xy, depth);
            vec4 positionEC = eyeCoordinate4 /eyeCoordinate4.w;
            //复制的源码开始
            vec3 normalEC = vec3(1.);
            czm_shadowParameters shadowParameters;
            shadowParameters.texelStepSize = shadowMap_texelSizeDepthBiasAndNormalShadingSmooth.xy;
            shadowParameters.depthBias = shadowMap_texelSizeDepthBiasAndNormalShadingSmooth.z;
            shadowParameters.normalShadingSmooth = shadowMap_texelSizeDepthBiasAndNormalShadingSmooth.w;
            shadowParameters.darkness = shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarkness.w;
            shadowParameters.depthBias *= max(depth * .01, 1.);
            vec3 directionEC = normalize(positionEC.xyz - shadowMap_lightPositionEC.xyz);
           float nDotL = clamp(dot(normalEC, -directionEC), 0.0, 1.0);

           //作用是将视空间坐标转到阴影贴图的坐标(这里的转换结果就是所需要的阴影贴图坐标)
           vec4 shadowPosition = shadowMap_matrix * positionEC;

           shadowPosition /= shadowPosition.w;

           if (any(lessThan(shadowPosition.xyz, vec3(0.0))) || any(greaterThan(shadowPosition.xyz, vec3(1.0))))
           {
               return;
           }
           shadowParameters.texCoords = shadowPosition.xy;
           shadowParameters.depth = shadowPosition.z;
           shadowParameters.nDotL = nDotL;
           float visibility = _czm_shadowVisibility(shadowMap_texture, shadowParameters);
           //复制的源码结束
           if(visibility==1.){
              //用shadowPosition对视频纹理数据采样
              vec4 videoColor = texture(videoTexture, shadowPosition.xy);
              out_FragColor = vec4(videoColor.xyz, 1.);
           }
   }
   `;
    let bias = this.viewShadowMap._primitiveBias;
    let scratchTexelStepSize = new Cesium.Cartesian2();
    let uniforms = {
      videoTexture: () => {
        return Cesium.Texture.create({
          context: this.viewer.scene.context,
          source: this.videoEle,
          width: 1,
          height: 1,
          pixelFormat: Cesium.PixelFormat.RGBA,
          pixelDatatype: Cesium.PixelDatatype.UNSIGNED_BYTE,
        });
        // return texture
      },
      shadowMap_texture: () => {
        return this.viewShadowMap._shadowMapTexture;
      },
      shadowMap_matrix: () => {
        return this.viewShadowMap._shadowMapMatrix;
      },
      shadowMap_lightPositionEC: () => {
        return this.viewShadowMap._lightPositionEC;
      },
      shadowMap_texelSizeDepthBiasAndNormalShadingSmooth: () => {
        var texelStepSize = scratchTexelStepSize;
        texelStepSize.x = 1.0 / this.viewShadowMap._textureSize.x;
        texelStepSize.y = 1.0 / this.viewShadowMap._textureSize.y;
        return Cesium.Cartesian4.fromElements(
          texelStepSize.x,
          texelStepSize.y,
          bias.depthBias,
          bias.normalShadingSmooth,
          new Cesium.Cartesian4()
        );
      },
      shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarkness: () => {
        return Cesium.Cartesian4.fromElements(
          bias.normalOffsetScale,
          this.viewShadowMap._distance,
          this.viewShadowMap.maximumDistance,
          this.viewShadowMap._darkness,
          new Cesium.Cartesian4()
        );
      },
    };
    this.viewer.scene.postProcessStages.add(
      new Cesium.PostProcessStage({
        fragmentShader: fragmentShader,
        uniforms: uniforms,
      })
    );
  }
}
