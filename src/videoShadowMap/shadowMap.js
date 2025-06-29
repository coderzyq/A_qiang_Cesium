import {
  Camera,
  Cartesian2,
  Cartesian3,
  Cartesian4,
  Color,
  DebugCameraPrimitive,
  Math,
  PerspectiveFrustum,
  PixelDatatype,
  PixelFormat,
  PostProcessStage,
  ShadowMap,
  Texture,
} from "cesium";
import * as Cesium from "cesium";
import ECEF from "../utils/ecef";

/**
 * 实现视频融合（ShadowMap）
 */
export default class ShadowMapVideo {
  constructor(viewer, options) {
    this.viewer = viewer;
    // this.url = url
    // this.position = position
    this.options = options;
    // this.position = options.position;
    this.CT = new ECEF();
    let option = this.initCameraParam();
    this.near = option.near || 0.1;
    this.cameraPosition = option.cameraPosition;
    this.position = option.position;
    this.alpha = option.alpha || 1;
    this.url = option.url;
    this.debugFrustum = Cesium.defaultValue(option.debugFrustum, !0);
    this.aspectRatio = option.aspectRatio || 1;
    this.fov = option.fov || 400;
    if (!this.cameraPosition || !this.position) {
      console.log("位置坐标错误");
      return;
    }
    //创建视频ElementVideo
    this.videoEle = this.activeVideo(this.url);
    // this.camera = this.getOrientation();
    this.camera = this.createFrustum(this.viewer, this.position);
    this.shadowMap = this.createShadowMap1();
    this.addCameraFrustum();
    this.shadowMapVideo(this.viewer, this.camera, this.position);
    //设置镜头视野
    // //添加视锥体
    // this.createShadowMap()
    // //后处理操作
    // this.addPostProcess()
  }
  //激活视频
  //设置镜头视野
  //创建ShadowMap
  //添加视锥体
  //后处理操作

  /**
   * 初始化配置参数
   */
  initCameraParam() {
    console.log(this.options);
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
    console.log(viewPoint, "viewPoint");
    let position = Cesium.Cartesian3.fromDegrees(
      viewPoint.longitude,
      viewPoint.latitude,
      viewPoint.altitude
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
      fov: this.options.fov,
      debugFrustum: this.options.debugFrustum,
    };
  }

  /**
   * 创建视频elementVideo
   */
  activeVideo(videoUrl) {
    let videoEle = document.createElement("video");
    videoEle.controls = true; // 使用正确的属性名
    videoEle.autoplay = true; // 设置为布尔值
    videoEle.preload = "auto";
    videoEle.loop = true;
    videoEle.muted = true; // 确保视频是静音的
    // videoEle.src = videoUrl; // 直接设置src属性
    videoEle.style.cssText =
      "position:absolute;left:0px;top:0px;width:400px;height:300px;";
    videoEle.style.visibility = "hidden";
    document.body.appendChild(videoEle);
    let vId = "vid" + new Date().getTime();
    videoEle.setAttribute("id", vId);

    let player = videojs(vId);
    player.ready((e) => {
      let sources = [
        {
          src: videoUrl,
          type: "application/x-mpegURL",
        },
      ];
      player.src(sources);
      player.load();
    });
    return videoEle;
  }

  /**
   * 创建ShadowMap
   */
  createShadowMap() {
    let camera = new Cesium.Camera(this.viewer.scene);
    camera.position = this.cameraPosition;
    camera.direction = Cesium.Cartesian3.subtract(
      this.position,
      this.cameraPosition,
      new Cesium.Cartesian3(0, 0, 0)
    ); //计算两个笛卡尔的组分差异。
    camera.up = Cesium.Cartesian3.normalize(
      this.cameraPosition,
      new Cesium.Cartesian3(0, 0, 0)
    ); // 归一化
    let distance = Cesium.Cartesian3.distance(
      this.position,
      this.cameraPosition
    );

    camera.frustum = new Cesium.PerspectiveFrustum({
      fov: Cesium.Math.toRadians(this.fov),
      aspectRatio: 1, //this.aspectRatio,//纵横比例
      near: this.near,
      far: distance,
    });
    this.viewShadowMap = new Cesium.ShadowMap({
      lightCamera: camera,
      enable: !1,
      isPointLight: !1,
      isSpotLight: !0,
      cascadesEnabled: !1,
      context: this.viewer.scene.context,
      pointLightRadius: distance,
    });
  }

  /**
   * 获取ShadowMap位置
   */
  getOrientation() {
    let direction = Cesium.Cartesian3.normalize(
      Cesium.Cartesian3.subtract(
        this.position,
        this.cameraPosition,
        new Cesium.Cartesian3()
      ),
      new Cesium.Cartesian3()
    );
    let up = Cesium.Cartesian3.normalize(
      this.cameraPosition,
      new Cesium.Cartesian3()
    );
    let camera = new Cesium.Camera(this.viewer.scene);
    camera.position = this.cameraPosition;
    camera.direction = direction;
    camera.up = up;
    direction = camera.directionWC;
    up = camera.upWC;

    let rightWC = camera.rightWC;
    let cartesian3 = new Cesium.Cartesian3();
    let matrix3 = new Cesium.Matrix3();
    let quaternion = new Cesium.Quaternion();
    rightWC = Cesium.Cartesian3.negate(rightWC, cartesian3);

    Cesium.Matrix3.setColumn(matrix3, 0, rightWC, matrix3);
    Cesium.Matrix3.setColumn(matrix3, 1, up, matrix3);
    Cesium.Matrix3.setColumn(matrix3, 2, direction, matrix3);
    let orientation = Cesium.Quaternion.fromRotationMatrix(matrix3, quaternion);
    this.orientation = orientation;
    return camera
  }

  /**
   * 创建视锥体
   */
  addCameraFrustum() {
    this.cameraFrustum = new Cesium.Primitive({
      geometryInstances: new Cesium.GeometryInstance({
        geometry: new Cesium.FrustumGeometry({
          origin: this.cameraPosition,
          orientation: this.orientation,
          frustum: this.shadowMap._lightCamera.frustum,
        }),
      }),
      appearance: new Cesium.MaterialAppearance({
        material: Cesium.Material.fromType("Color"),
      }),
      asynchronous: !1,
      show: true,
    });
    this.cameraFrustum.appearance.material.uniforms.color =
      Cesium.Color.AQUA.withAlpha(0.5);
    this.viewer.scene.primitives.add(this.cameraFrustum);
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
        return Cartesian4.fromElements(
          texelStepSize.x,
          texelStepSize.y,
          bias.depthBias,
          bias.normalShadingSmooth,
          this.combinedUniforms1
        );
      },
      shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarkness: () => {
        return Cartesian4.fromElements(
          bias.normalOffsetScale,
          this.viewShadowMap._distance,
          this.viewShadowMap.maximumDistance,
          this.viewShadowMap._darkness,
          this.combinedUniforms2
        );
      },
      combinedUniforms1: new Cartesian4(),
      combinedUniforms2: new Cartesian4(),
    };
    this.viewer.scene.postProcessStages.add(
      new PostProcessStage({
        fragmentShader: fragmentShader,
        uniforms: uniforms,
      })
    );
  }

  //创建视频视锥体
  createFrustum(viewer, position) {
    const camera = new Cesium.Camera(viewer.scene);
    camera.frustum.fov = Math.PI_OVER_THREE;
    camera.frustum.near = 1.0;
    camera.frustum.far = 100000.0;
    // const orientation = cameraOrientation(camera, position, position)
    // console.log(orientation, 'orientation');
    camera.setView({
      destination: Cartesian3.fromDegrees(
        position.lon,
        position.lat,
        position.height
      ),
      // orientation: orientation
    });
    const cameraPrimitive = new Cesium.DebugCameraPrimitive({
      camera: camera,
      color: Color.RED,
      show: true,
      updateOnChange: true,
    });
    viewer.scene.primitives.add(cameraPrimitive);
    return camera;
  }
  //创建ShadowMap
  createShadowMap1() {
    const shadowMap = new Cesium.ShadowMap({
      lightCamera: this.camera,
      context: this.viewer.scene.context,
      isSpotLight: !0,
      isPointLight: !1,
      cascadesEnabled: !1,
    });
    this.viewer.scene.shadowMap = shadowMap;
    return shadowMap;
  }

  shadowMapVideo = async () => {
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
   } `;
    let bias = this.shadowMap._primitiveBias;
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
        return this.shadowMap._shadowMapTexture;
      },
      shadowMap_matrix: () => {
        return this.shadowMap._shadowMapMatrix;
      },
      shadowMap_lightPositionEC: () => {
        return this.shadowMap._lightPositionEC;
      },
      shadowMap_texelSizeDepthBiasAndNormalShadingSmooth: () => {
        var texelStepSize = scratchTexelStepSize;
        texelStepSize.x = 1.0 / this.shadowMap._textureSize.x;
        texelStepSize.y = 1.0 / this.shadowMap._textureSize.y;
        return Cartesian4.fromElements(
          texelStepSize.x,
          texelStepSize.y,
          bias.depthBias,
          bias.normalShadingSmooth,
          this.combinedUniforms1
        );
      },
      shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarkness: () => {
        return Cartesian4.fromElements(
          bias.normalOffsetScale,
          this.shadowMap._distance,
          this.shadowMap.maximumDistance,
          this.shadowMap._darkness,
          this.combinedUniforms2
        );
      },
      combinedUniforms1: new Cartesian4(),
      combinedUniforms2: new Cartesian4(),
    };
    this.viewer.scene.postProcessStages.add(
      new PostProcessStage({
        fragmentShader: fragmentShader,
        uniforms: uniforms,
      })
    );
  };
}
