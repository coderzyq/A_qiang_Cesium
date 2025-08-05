import * as Cesium from "cesium";
import { ElMessage } from "element-plus";
import {
  createFrameBuffer,
  renderToFbo,
} from "@/offScreenRender/offScreenRender";
import CoordTransform from "@/cesiumUtils/coordinate/CoordTransform";

/**
 * 复制文本到剪贴板
 * @param {*} context 要复制的文本
 */
export const copyContext = (context) => {
  let inputDom = document.createElement("input"); //创建一个input元素
  inputDom.setAttribute("readonly", "readonly"); //防止手机上弹出软键盘
  inputDom.value = context;
  document.body.appendChild(inputDom);
  inputDom.select(); //选中input元素中的内容
  document.execCommand("Copy"); //执行浏览器复制命令
  inputDom.style.display = "none";
  inputDom.remove();
  ElMessage.success(context);
  ElMessage.success("复制到剪贴板成功");
};

/**
 * 获取相机参数
 * @param {*} viewer
 * @returns
 */
export const getCameraParams = (viewer) => {
  const camera = viewer.scene.camera;
  //获取相机位置
  const lon = Cesium.Math.toDegrees(
    Cesium.Cartographic.fromCartesian(camera.position).longitude
  );
  const lat = Cesium.Math.toDegrees(
    Cesium.Cartographic.fromCartesian(camera.position).latitude
  );
  const height = Cesium.Cartographic.fromCartesian(camera.position).height;
  //获取相机方向
  const heading = Cesium.Math.toDegrees(camera.heading);
  const pitch = Cesium.Math.toDegrees(camera.pitch);
  const roll = Cesium.Math.toDegrees(camera.roll);
  return {
    lon,
    lat,
    height,
    heading,
    pitch,
    roll,
  };
};

/**
 * 从像素坐标获取Cartesian3坐标
 * @param {*} viewer
 * @param {*} px 像素坐标
 * @returns
 */
export const getCartesian3FromPX = (viewer, px) => {
  //1.首次尝试在3DTiles/模型上拾取
  const isOn3dTiles = viewer.scene
    .drillPick(px)
    .some(
      (pick) =>
        pick?.primitive instanceof Cesium.Cesium3DTileFeature ||
        pick?.primitive instanceof Cesium.Cesium3DTileset ||
        pick?.primitive instanceof Cesium.Model
    );

  let cartesian = null;

  if (isOn3dTiles) {
    //使用深度缓冲获取精确坐标
    cartesian = viewer.scene.pickPosition(px);
  }

  //2.如果不在3D Tiles上，尝试地形拾取
  if (!cartesian) {
    //Cesium.EllipsoidTerrainProvider表示的无地形的椭球体（即默认的椭球体地形）
    //而其他地形提供者（如CesiumTerrainProvider）则表示有真实地形
    const isEllipsoidTerrain =
      viewer.terrainProvider instanceof Cesium.EllipsoidTerrainProvider;

    if (!isEllipsoidTerrain) {
      // 真实地形
      //真实地形拾取
      const ray = viewer.scene.camera.getPickRay(px);
      if (ray) {
        //需要使用globe.pick（因为需要市区地形表面）
        cartesian = viewer.scene.globe.pick(ray, viewer.scene);
      }
    } else {
      //3.最后尝试椭球体拾取 （无地形，所以直接拾取椭球体）
      cartesian = viewer.scene.camera.pickEllipsoid(
        px,
        viewer.scene.globe.ellipsoid
      );
    }
  }

  //4.坐标后处理
  if (cartesian) {
    //统一转换到WGS84进行高度修正
    const position = CoordTransform.transformCartesianToWGS84(cartesian);
    if (position.alt < 0) {
      position.alt = 0.1;
    }
    return position;
  }
  return false;
};

/**
 * 获取截图
 * @param {*} viewer
 * @returns
 */
export const getScreenshot = (viewer) => {
  const fbo = createFrameBuffer(viewer.scene.context);
  renderToFbo(fbo, viewer.scene);
  let width = viewer.scene.context.drawingBufferWidth;
  let height = viewer.scene.context.drawingBufferHeight;
  let pixels = viewer.scene.context.readPixels({
    x: 0,
    y: 0,
    width: width,
    height: height,
    framebuffer: fbo,
  });

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  let imageData = new ImageData(new Uint8ClampedArray(pixels), width, height);
  let ctx = canvas.getContext("2d");
  ctx?.putImageData(imageData, 0, 0, 0, 0, width, height);
  // 添加垂直翻转变换
  ctx.translate(0, height);
  ctx.scale(1, -1);
  ctx.drawImage(canvas, 0, 0);
  //使用无损PNG编码
  canvas.toBlob(blob => {
    const link = document.createElement('a');   
    link.href = URL.createObjectURL(blob);
    link.download = `scene_${Date.now()}.png`
    link.click();
    URL.revokeObjectURL(link.href);
  }, 'image/png')
};
