import {} from "@turf/turf";
import * as Cesium from "cesium";
export default class MeasureTool {
  constructor(viewer) {
    this.viewer = viewer;
    this.measureIds = [];
  }

  /**
   * 线效果
   */

  /**
   * 空间两点距离计算函数
   * @param {*} positions
   */
  getSpaceDistance(positions) {
    let distance_ = 0;
    if (positions.length > 2) {
      let point1Cartographic = Cesium.Cartographic.fromCartesian(
        positions[positions.length - 3]
      );
      let point2Cartographic = Cesium.Cartographic.fromCartesian(
        positions[positions.length - 2]
      );
      //根据经纬度计算出距离
      let geodesic = new Cesium.EllipsoidGeodesic();
      geodesic.setEndPoints(point1Cartographic, point2Cartographic);
      let s = geodesic.surfaceDistance;
      s = Math.sqrt(
        Math.pow(s, 2) +
          Math.pow(point2Cartographic.height - point1Cartographic.height, 2)
      );
      distance_ = distance_ + s;
    }
    return distance_.toFixed(2);
  }

  /**
   * 空间距离
   */
  measureLineSpace() {
    this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    let positions = [];
    let poly = null;
    let distancce = 0;
    let cartesian = null;
    let floatingPoint;
    //监听移动事件
    this.handler.setInputAction((movement) => {
      //移动结束位置
      cartesian = this.viewer.scene.pickPosition(movement.endPosition);
      if (!Cesium.defined(cartesian)) {
        let ray = this.viewer.camera.getPickRay(movement.endPosition);
        cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
      }
      //判断点是否在画布上
      if (Cesium.defined(cartesian)) {
        if (positions.length >= 2) {
          if (!Cesium.defined(poly)) {
            //画线
            poly = new PolyLinePrimitive(
              this.viewer,
              positions,
              this.measureIds
            );
          } else {
            positions.pop();
            positions.push(cartesian);
          }
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    //监听单击事件
    this.handler.setInputAction((movement) => {
      cartesian = this.viewer.scene.pickPosition(movement.position);
      if (!Cesium.defined(cartesian)) {
        let ray = this.viewer.camera.getPickRay(movement.position);
        cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
      }

      if (Cesium.defined(cartesian)) {
        if (positions.length === 0) {
          positions.push(cartesian.clone());
          debugger
        }
        positions.push(cartesian);
        console.log(positions.length);
        debugger
        // positions.pop()

        let distance_add = parseFloat(this.getSpaceDistance(positions));
        distancce += distance_add;
        //在三维场景中添加label
        let textDistance =
          (distancce > 1000
            ? (distancce / 1000).toFixed(2) + "千米"
            : distancce.toFixed(2) + "米") +
          "\n(+" +
          (distance_add > 1000
            ? (distance_add / 1000).toFixed(3) + "千米"
            : distance_add + "米") +
          ")";
        floatingPoint = this.viewer.entities.add({
          name: "空间直线距离",
          position: positions[positions.length - 2],
          point: {
            pixelSize: 5,
            color: Cesium.Color.RED,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
            heightReference: Cesium.HeightReference.NONE,
          },
          label: {
            text: textDistance,
            font: "18px sans-serif",
            fillColor: Cesium.Color.CHARTREUSE,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineWidth: 2,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(20, -20),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            heightReference: Cesium.HeightReference.NONE,
          },
        });
        this.measureIds.push(floatingPoint.id);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    //监听双击事件
    this.handler.setInputAction((movement) => {
      this.handler.destroy(); //关闭事件句柄
      positions.pop(); //最后一个点无效
      this.bMeasuring = false;
      this.viewer._container.style.cursor = "";
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

    const PolyLinePrimitive = (function () {
      function _(viewer, positions, measureIds) {
        this.options = {
          name: "直线",
          polyline: {
            show: true,
            positions: [],
            material: Cesium.Color.CHARTREUSE,
            arcType: Cesium.ArcType.NONE,
            width: 2,
          },
        };
        this.positions = positions;
        this.viewer = viewer;
        this.measureIds = measureIds;
        this._init();
      }

      _.prototype._init = function () {
        let _self = this;
        let _update = function () {
          return _self.positions;
        };

        //实时更新polyline.positions
        this.options.polyline.positions = new Cesium.CallbackProperty(
          _update,
          false
        );
        const entity = this.viewer.entities.add(this.options);
        this.measureIds.push(entity.id);
      };

      return _;
    })();
  }
  /**
   * 地表距离
   */

  /**
   * 地表面积
   */

  /**
   * 三角测量
   */

  /**
   * 高度差
   */

  /**
   * 三角测量
   */

  /**
   * 清除结果
   */
}
