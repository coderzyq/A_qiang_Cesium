/**
 * @description 编辑通用方法
 * @author A_qiang
 */
import * as Cesium from "cesium"
/**
 * @description 创建随机ID
 * @param num
 * @returns string id
 */
const newSessionId = (num) => {
    let length = num || 32;
    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghigklmnopqrstuvwxyz0123456789";
    let maxPos = chars.length;
    let pwd = ""
    for (let i = 0; i < length; i++) {
        pwd += chars.charAt(Math.floor(Math.random() * maxPos))
    }
    return pwd
}

/**
 * @description 获取屏幕点击的笛卡尔坐标
 * @param viewer 三维场景viewer
 * @param px 屏幕像素点
 * @returns {Object} Cartesian3 | false | null
 */
const getCartesian3FromPX = (viewer, px) => {
  let picks = viewer.scene.drillPick(px);
  let cartesian = null;
  let isOn3dtiles = false,
    isOnTerrain = false;
  // drillPick
  for (let i in picks) {
    let pick = picks[i];
    if (
      (pick && pick.primitive instanceof Cesium.Cesium3DTileFeature) ||
      (pick && pick.primitive instanceof Cesium.Cesium3DTileset) ||
      (pick && pick.primitive instanceof Cesium.Model)
    ) {
      //模型上拾取
      isOn3dtiles = true;
    }
    // 3dtilset
    if (isOn3dtiles) {
      viewer.scene.pick(px);
      cartesian = viewer.scene.pickPosition(px);
      if (cartesian) {
        let cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        if (cartographic.height < 0) cartographic.height = 0;
        let x = Cesium.Math.toDegrees(cartographic.longitude),
          y = Cesium.Math.toDegrees(cartographic.latitude),
          z = cartographic.height;
        cartesian = transformWGS84ToCartesian({ x, y, z });
      }
    }
  }
  // 地形
  let boolTerrain =
    viewer.terrainProvider instanceof Cesium.EllipsoidTerrainProvider;
  // Terrain
  if (!isOn3dtiles && !boolTerrain) {
    let ray = viewer.scene.camera.getPickRay(px);
    if (!ray) return null;
    cartesian = viewer.scene.globe.pick(ray, viewer.scene);
    isOnTerrain = true;
  }
  // 地球
  if (!isOn3dtiles && !isOnTerrain && boolTerrain) {
    cartesian = viewer.scene.camera.pickEllipsoid(
      px,
      viewer.scene.globe.ellipsoid
    );
  }
  if (cartesian) {
    let position = transformCartesianToWGS84(cartesian);
    if (position.z < 0) {
      position.z = 0.1;
      cartesian = transformWGS84ToCartesian(position);
    }
    return cartesian;
  }
  return false;
};
/**
 * 笛卡尔坐标转经纬度
 * @param cartesian Cartesian3
 * @returns {Object} { x, y, z }
 */
const transformCartesianToWGS84 = (cartesian) => {
  let ellipsoid = Cesium.Ellipsoid.WGS84;
  let cartographic = ellipsoid.cartesianToCartographic(cartesian);
  const x = Cesium.Math.toDegrees(cartographic.longitude);
  const y = Cesium.Math.toDegrees(cartographic.latitude);
  const z = cartographic.height;
  return { x, y, z };
};
/**
 * 经纬度转笛卡尔坐标
 * @param position - { x, y, z }
 * @returns {Object} Cartesian3
 */
const transformWGS84ToCartesian = (position) => {
  position.z = position.z || 0;
  return position
    ? Cesium.Cartesian3.fromDegrees(
        position.x,
        position.y,
        position.z,
        Cesium.Ellipsoid.WGS84
      )
    : Cesium.Cartesian3.ZERO;
};
/**
 * 锁定视图
 * @param viewer - 三维场景
 * @param bool - 是否锁定
 */
const lockingMap = (viewer, bool) => {
  // 如果为真，则允许用户旋转相机。如果为假，相机将锁定到当前标题。此标志仅适用于2D和3D。
  viewer.scene.screenSpaceCameraController.enableRotate = bool;
  // 如果为true，则允许用户平移地图。如果为假，相机将保持锁定在当前位置。此标志仅适用于2D和Columbus视图模式。
  viewer.scene.screenSpaceCameraController.enableTranslate = bool;
  // 如果为真，允许用户放大和缩小。如果为假，相机将锁定到距离椭圆体的当前距离
  viewer.scene.screenSpaceCameraController.enableZoom = bool;
  // 如果为真，则允许用户倾斜相机。如果为假，相机将锁定到当前标题。这个标志只适用于3D和哥伦布视图。
  viewer.scene.screenSpaceCameraController.enableTilt = bool;
};
/**
 * 创建贝塞尔点集
 * @param anchorpoints
 * @returns
 */
const createBezierPoints = (anchorpoints) => {
  let degrees;
  for (let index = 0; index < anchorpoints.length; index++) {
    const degree = transformCartesianToWGS84(anchorpoints[index]);
    degrees.push(degree);
  }
  let numpoints = 100;
  let points;
  for (let i = 0; i <= numpoints; i++) {
    let point = computeBezierPoints(degrees, i / numpoints);
    const cartesian = transformWGS84ToCartesian(point);
    points.push(cartesian);
  }
  return points;
};
/**
 * 创建正多边形节点
 * @param centerPoint
 * @param endCartesian
 * @param num
 * @returns
 */
const getRegularPoints = (centerPoint, endCartesian, num) => {
  const centerP = transformCartesianToWGS84(centerPoint);
  let distance = 1;
  if (endCartesian) {
    const endDegree = transformCartesianToWGS84(endCartesian);
    distance = Cesium.Cartesian3.distance(
      new Cesium.Cartesian3.fromDegrees(centerP.x, centerP.y, 0),
      new Cesium.Cartesian3.fromDegrees(endDegree.x, endDegree.y, 0)
    );
  }
  let ellipse = new Cesium.EllipseOutlineGeometry({
    center: centerPoint,
    semiMajorAxis: distance,
    semiMinorAxis: distance,
    granularity: 0.0001, //0~1 圆的弧度角,该值非常重要,默认值0.02,如果绘制性能下降，适当调高该值可以提高性能
  });
  let geometry = new Cesium.EllipseOutlineGeometry.createGeometry(ellipse);
  let circlePoints;
  let values = geometry.attributes.position.values;
  if (!values) return;
  let posNum = values.length / 3; //数组中以笛卡尔坐标进行存储(每3个值一个坐标)
  for (let i = 0; i < posNum; i++) {
    let curPos = new Cesium.Cartesian3(
      values[i * 3],
      values[i * 3 + 1],
      values[i * 3 + 2]
    );
    circlePoints.push(curPos);
  }
  let resultPoints;
  let pointsapart = Math.floor(circlePoints.length / num);
  for (let j = 0; j < num; j++) {
    resultPoints.push(circlePoints[j * pointsapart]);
  }
  return resultPoints;
};
/**
 * 计算贝塞尔曲线特征点
 * @param anchorpoints
 * @param t
 * @returns -  {{x: number, y: number}}
 * @private
 */
const computeBezierPoints = (anchorpoints, t) => {
  let x = 0,
    y = 0;
  let Binomial_coefficient = computeBinomial(anchorpoints);
  for (let j = 0; j < anchorpoints.length; j++) {
    let tempPoint = anchorpoints[j];
    const coefficient =
      Math.pow(1 - t, anchorpoints.length - 1 - j) *
      Math.pow(t, j) *
      Binomial_coefficient[j];
    x += tempPoint.x * coefficient;
    y += tempPoint.y * coefficient;
  }
  return { x, y };
};
/**
 * 计算二项式系数
 * @param anchorpoints
 * @returns - {Array}
 * @private
 */
const computeBinomial = (anchorpoints) => {
  let lens = anchorpoints.length;
  let Binomial_coefficient = [];
  Binomial_coefficient.push(1);
  for (let k = 1; k < lens - 1; k++) {
    let cs = 1,
      bcs = 1;
    for (let m = 0; m < k; m++) {
      cs = cs * (lens - 1 - m);
      bcs = bcs * (k - m);
    }
    Binomial_coefficient.push(cs / bcs);
  }
  Binomial_coefficient.push(1);
  return Binomial_coefficient;
};
export {
  newSessionId,
  getCartesian3FromPX,
  lockingMap,
  transformCartesianToWGS84,
  transformWGS84ToCartesian,
  createBezierPoints,
  getRegularPoints,
};