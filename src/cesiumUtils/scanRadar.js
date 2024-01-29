

import * as Cesium from "cesium";
/**
 * @author A_qiang
 * @description 三维雷达扫描效果
 * @param {object} options.viewer 三维地球
 * @param {object} options.position {lng, lat, height} 中心点位置
 * @param {number} options.radius 扫描半径
 * @param {object} options.colorEllipsoid {ellipsoid?, alpha?} 球体颜色透明度 采用hex格式
 * @param {object} options.colorWall {ellipsoid?, alpha?} 扫描墙体颜色透明度 采用hex格式
 * @param {number} options.speed 扫描速度
 */
function ScanRadar(options) {
  let radius = options.radius || 1000.0;
  let position = options.position;
  let centerLng = Number(position.lng) ?? 117;
  let centerLat = Number(position.lat) ?? 37;
  let height = Number(position.height) ?? 0;
  let viewer = options.viewer;
  let heading = 0;
  //计算平面
  let arr = calculatePane(position, radius, heading);
  //每一帧刷新时调用
  viewer.clock.onTick.addEventListener(() => {
    heading += options.speed;
    arr = calculatePane(options.position, radius, heading);
  });
  let radar = viewer.entities.add({
    position: new Cesium.Cartesian3.fromDegrees(centerLng, centerLat, height),
    name: "立体雷达扫描",
    ellipsoid: {
      radii: new Cesium.Cartesian3(radius, radius, radius),
      material: Cesium.Color.fromCssColorString(
        options.colorEllipsoid.ellipsoid ?? "#0000FF"
      ).withAlpha(options.colorEllipsoid.alpha || 0.4),
      outline: true,
      outlineColor: Cesium.Color.fromCssColorString(
        options.colorEllipsoid.ellipsoid ?? "#0000FF"
      ).withAlpha(options.colorEllipsoid.alpha || 0.4),
      outerWidth: 1,
      maximumCone: Cesium.Math.toRadians(90),
    },
    wall: {
      positions: new Cesium.CallbackProperty(() => {
        return Cesium.Cartesian3.fromDegreesArrayHeights(arr.positionArr);
      }, false),
      material: Cesium.Color.fromCssColorString(
        options.colorWall.wall ?? "#228B22"
      ).withAlpha(options.colorWall.alpha ?? 0.7),
      minimumHeights: arr.bottomArr,
    },
  });
  return radar;
  //计算平面扫描
  function calculatePane(position, radius, heading) {
    let x1 = position.lng,
      y1 = position.lat,
      height = position.height;
    let m = Cesium.Transforms.eastNorthUpToFixedFrame(
      Cesium.Cartesian3.fromDegrees(x1, y1, height)
    );
    let rx = radius * Math.cos((heading * Math.PI) / 180.0);
    let ry = radius * Math.sin((heading * Math.PI) / 180.0);
    let translation = Cesium.Cartesian3.fromElements(rx, ry, height);
    let d = Cesium.Matrix4.multiplyByPoint(
      m,
      translation,
      new Cesium.Cartesian3()
    );
    let c = Cesium.Cartographic.fromCartesian(d);
    let x2 = Cesium.Math.toDegrees(c.longitude);
    let y2 = Cesium.Math.toDegrees(c.latitude);
    return calculateSector(x1, y1, x2, y2, height);
  }

  //计算竖直扇形
  function calculateSector(x1, y1, x2, y2, height) {
    let positionArr = [];
    let bottomArr = [];
    positionArr.push(x1, y1, height);
    bottomArr.push(height);
    let radius = Cesium.Cartesian3.distance(
      Cesium.Cartesian3.fromDegrees(x1, y1),
      Cesium.Cartesian3.fromDegrees(x2, y2)
    );
    //角度设置为0-90，也就是1/4圆
    for (let i = 0; i <= 90; i++) {
      let h = radius * Math.sin((i * Math.PI) / 180.0);
      let r = Math.cos((i * Math.PI) / 180.0);
      let x = (x2 - x1) * r + x1;
      let y = (y2 - y1) * r + y1;
      positionArr.push(x, y, h + height);
      bottomArr.push(height);
    }
    return { positionArr, bottomArr };
  }
}

export default ScanRadar;
