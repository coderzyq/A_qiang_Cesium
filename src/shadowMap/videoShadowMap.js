import * as Cesium from "cesium";
import ECEF from "../utils/ecef";
export default class VideoShadowMap {
  constructor(viewer, options) {
    this.viewer = viewer;
    this.options = options;
    this.CT = new ECEF();
    let option = this.initCameraParam();
    if (!option.cameraPosition || !option.position) {
      console.log("位置坐标错误");
      return;
    }
  }

  //初始化相机参数
  initCameraParam() {
    let viewPoint = this.CT.enu_to_ecef(
      {
        longitude: this.options.position.x * 1,
        latitude: this.options.position.y * 1,
        height: this.options.position.z * 1,
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
      viewPoint.height
    );
    let cameraPosition = Cesium.Cartesian3.fromDegrees(
        this.options.position.x * 1,
        this.options.position.y * 1,
        this.options.position.z * 1
    )
    return {
        url: this.options.url,
        cameraPosition: cameraPosition,
        position: position,
        alpha: this.options.alpha,
        near: this.options.near,
        far: this.options.far,
        debugFrustum: this.options.debugFrustum
    }
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
    videoElement.autoplay = true;
    videoElement.preload = "auto"
    videoElement.loop = true;
    videoElement.muted = true
    videoElement.style.cssText = "position:absolute;left:0px;top:0px;width:400px;height:400px;"
    videoElement.style.visibility = "hidden"
    document.body.appendChild(videoElement);
    let vId = new Date().getTime();
    videoElement.setAttribute("id", vId);

    let player = videojs(vId);
    player.ready(e => {
        let sources = [
            {
                src: videoUrl,
                type: "application/x-mpegURL"
            }
        ]
        player.src(sources);
        player.load();
    })
    return videoElement
  }

  /**
   * 创建视频视锥体
   */
  createFrustum() { 
    const camera = new Cesium.Camera(this.viewer.scene);
    camera.frustum.fov = Cesium.Math.PI_OVER_THREE
    camera.frustum.near = 1;
    camera.frustum.far = 1000;
    camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(this.position.lon, this.position.lat, this.position.height)
    })
    const cameraPrimitive = new Cesium.DebugCameraPrimitive({
        camera: camera,
        color: Cesium.Color.RED,
        show: true,
        updateOnChange: true
    })
    this.viewer.scene.primitives.add(cameraPrimitive)
    return camera
  }

  /**
   * 创建ShadowMap
   */
  createShadowMap() { 
    let camera = new Cesium.Camera(this.viewer.scene)
    camera.position = this.cameraPosition
    //计算两个笛卡尔的组分差异
    camera.direction = Cesium.Cartesian3.subtract(
        this.position, this.options.cameraPosition, new Cesium.Cartesian3()
    )
    camera.up = Cesium.Cartesian3.normalize(this.options.cameraPosition, new Cesium.Cartesian3())
    let distance = Cesium.Cartesian3.distance(this.options.position, this.options.cameraPosition)

    camera.frustum = new Cesium.PerspectiveFrustum({
        fov: Cesium.Math.toRadians(this.options.fov),
        aspectRatio: 1,
        near: this.options.near,
        far: distance
    })
    this.viewShadowMap = new Cesium.ShadowMap({
        lightCamera: camera,
        enabled: false,
        isPointLight: false,
        isSpotLight: true,
        cascadesEnabled: false,
        context: this.viewer.scene.context,
        pointLightRadius: distance
    })
  }
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
}
