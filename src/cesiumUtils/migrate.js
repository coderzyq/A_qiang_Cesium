/*
 * @Description: '迁徙图'
 * @Author: coderqiang
 * @Date: 2023-06-07 23:51:50
 * @LastEditTime: 2023-06-13 17:41:20
 * @LastEditors: coderqiang
 */
/*
 * ......................................&&.........................
 * ....................................&&&..........................
 * .................................&&&&............................
 * ...............................&&&&..............................
 * .............................&&&&&&..............................
 * ...........................&&&&&&....&&&..&&&&&&&&&&&&&&&........
 * ..................&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&..............
 * ................&...&&&&&&&&&&&&&&&&&&&&&&&&&&&&.................
 * .......................&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&.........
 * ...................&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&...............
 * ..................&&&   &&&&&&&&&&&&&&&&&&&&&&&&&&&&&............
 * ...............&&&&&@  &&&&&&&&&&..&&&&&&&&&&&&&&&&&&&...........
 * ..............&&&&&&&&&&&&&&&.&&....&&&&&&&&&&&&&..&&&&&.........
 * ..........&&&&&&&&&&&&&&&&&&...&.....&&&&&&&&&&&&&...&&&&........
 * ........&&&&&&&&&&&&&&&&&&&.........&&&&&&&&&&&&&&&....&&&.......
 * .......&&&&&&&&.....................&&&&&&&&&&&&&&&&.....&&......
 * ........&&&&&.....................&&&&&&&&&&&&&&&&&&.............
 * ..........&...................&&&&&&&&&&&&&&&&&&&&&&&............
 * ................&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&............
 * ..................&&&&&&&&&&&&&&&&&&&&&&&&&&&&..&&&&&............
 * ..............&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&....&&&&&............
 * ...........&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&......&&&&............
 * .........&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&.........&&&&............
 * .......&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&...........&&&&............
 * ......&&&&&&&&&&&&&&&&&&&...&&&&&&...............&&&.............
 * .....&&&&&&&&&&&&&&&&............................&&..............
 * ....&&&&&&&&&&&&&&&.................&&...........................
 * ...&&&&&&&&&&&&&&&.....................&&&&......................
 * ...&&&&&&&&&&.&&&........................&&&&&...................
 * ..&&&&&&&&&&&..&&..........................&&&&&&&...............
 * ..&&&&&&&&&&&&...&............&&&.....&&&&...&&&&&&&.............
 * ..&&&&&&&&&&&&&.................&&&.....&&&&&&&&&&&&&&...........
 * ..&&&&&&&&&&&&&&&&..............&&&&&&&&&&&&&&&&&&&&&&&&.........
 * ..&&.&&&&&&&&&&&&&&&&&.........&&&&&&&&&&&&&&&&&&&&&&&&&&&.......
 * ...&&..&&&&&&&&&&&&.........&&&&&&&&&&&&&&&&...&&&&&&&&&&&&......
 * ....&..&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&...........&&&&&&&&.....
 * .......&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&..............&&&&&&&....
 * .......&&&&&.&&&&&&&&&&&&&&&&&&..&&&&&&&&...&..........&&&&&&....
 * ........&&&.....&&&&&&&&&&&&&.....&&&&&&&&&&...........&..&&&&...
 * .......&&&........&&&.&&&&&&&&&.....&&&&&.................&&&&...
 * .......&&&...............&&&&&&&.......&&&&&&&&............&&&...
 * ........&&...................&&&&&&.........................&&&..
 * .........&.....................&&&&........................&&....
 * ...............................&&&.......................&&......
 * ................................&&......................&&.......
 * .................................&&..............................
 * ..................................&..............................
 */

import * as echarts from "echarts";
import "echarts-gl";
import * as Cesium from "cesium";

// const mockClickChart = function (event, chart) {
//   const evmousedown = document.createEvent("HTMLEvents");
//   evmousedown.initEvent("mousedown", false, true);
//   const evmouseup = document.createEvent("HTMLEvents");
//   evmouseup.initEvent("mouseup", false, true);
//   const evmouseclick = document.createEvent("HTMLEvents");
//   evmouseclick.initEvent("click", false, true);

//   for (const key in event) {
//     try {
//       evmouseclick[key] = event[key];
//       evmousedown[key] = event[key];
//       evmouseup[key] = event[key];
//     } catch (err) {
//       /* event 对象中部分属性是只读，忽略即可 */
//     }
//   }
//   // 事件触发的容器，即不是 #app 也不是 canvas，而是中间这个 div
//   const container = chart._dom.firstElementChild;
//   container.dispatchEvent(evmousedown);
//   container.dispatchEvent(evmouseup);
//   container.dispatchEvent(evmouseclick);
// };
class RegisterCoordinateSystem {
  static dimensions = ["lng", "lat"];
  constructor(glMap) {
    this._GLMap = glMap;
    this._mapOffset = [0, 0];
    this.dimensions = ["lng", "lat"];
  }
  setMapOffset(mapOffset) {
    this._mapOffset = mapOffset;
  }
  getBMap() {
    return this._GLMap;
  }
  fixLat(lat) {
    return lat >= 90
      ? 89.99999999999999
      : lat <= -90
      ? -89.99999999999999
      : lat;
  }
  dataToPoint(coords) {
    let lonlat = [99999, 99999];
    coords[1] = this.fixLat(coords[1]);
    let position = Cesium.Cartesian3.fromDegrees(coords[0], coords[1]);
    if (!position) return lonlat;
    let coordinates = this._GLMap.cartesianToCanvasCoordinates(position);
    if (!coordinates) return lonlat;
    if (this._GLMap.mode === Cesium.SceneMode.SCENE3D) {
      if (
        Cesium.Cartesian3.angleBetween(this._GLMap.camera.position, position) >
        Cesium.Math.toRadians(75)
      )
        return !1;
    }
    return [
      coordinates.x - this._mapOffset[0],
      coordinates.y - this._mapOffset[1],
    ];
  }
  pointToData(pt) {
    var mapOffset = this._mapOffset;
    pt = this._bmap.project([pt[0] + mapOffset[0], pt[1] + mapOffset[1]]);
    return [pt.lng, pt.lat];
  }
  getViewRect() {
    let api = this._api;
    return new echarts.graphic.BoundingRect(
      0,
      0,
      api.getWidth(),
      api.getHeight()
    );
  }
  getRoamTransform() {
    return echarts.matrix.create();
  }
  static create(echartModel, api) {
    this._api = api;
    let registerCoordinateSystem;
    echartModel.eachComponent("GLMap", function (seriesModel) {
      let painter = api.getZr().painter;
      if (painter) {
        // let glMap = api.getViewportRoot()
        let glMap = echarts.glMap;
        registerCoordinateSystem = new RegisterCoordinateSystem(glMap, api);
        registerCoordinateSystem.setMapOffset(
          seriesModel.__mapOffset || [0, 0]
        );
        seriesModel.coordinateSystem = registerCoordinateSystem;
      }
    });
    echartModel.eachSeries(function (series) {
      "GLMap" === series.get("coordinateSystem") &&
        (series.coordinateSystem = registerCoordinateSystem);
    });
  }
}
const EchartsLayer = function (map, options) {
  this._map = map;
  console.log(this._map.container);
  this._overlay = this._createChartOverlay(this._map);
  if (options) {
    this._registerMap();
  }
  this._overlay.setOption(options || {});
};

/**
 * des: 注册可用的地图，只在 geo 组件或者 map 图表类型中使用
 */
EchartsLayer.prototype._registerMap = function () {
  if (!this._isRegistered) {
    echarts.registerCoordinateSystem("GLMap", RegisterCoordinateSystem),
      echarts.registerAction(
        { type: "GLMapRoam", event: "GLMapRoam", update: "updateLayout" },
        function () {}
      );
    echarts.extendComponentModel({
      type: "GLMap",
      getBMap() {
        return this.__GLMap;
      },
      defaultOption: { roam: !1 },
    }),
      echarts.extendComponentView({
        type: "GLMap",
        init(t, e) {
          this.api = e;
          echarts.glMap.postRender.addEventListener(this.moveHandler, this);
        },
        moveHandler() {
          this.api.dispatchAction({ type: "GLMapRoam" });
        },
        render() {},
        dispose() {
          echarts.glMap.postRender.removeEventListener(this.moveHandler, this);
        },
      });
    this._isRegistered = true;
  }
};

/**
 * des: 创建div容器
 * @returns
 */
EchartsLayer.prototype._createChartOverlay = function (map) {
  const scene = map.scene;
  scene.canvas.setAttribute("tabIndex", 0);
  const ele = document.createElement("div");
  ele.style.position = "absolute";
  ele.style.top = "0px";
  ele.style.left = "0px";
  ele.style.width = scene.canvas.width + "px";
  ele.style.height = scene.canvas.height + "px";
  ele.style.pointerEvents = "none";
  ele.setAttribute("id", "echarts");
  ele.setAttribute("class", "echartMap");
  map.container.appendChild(ele);
  this._echartsContainer = ele;
  echarts.glMap = scene;
  //创建一个 ECharts 实例，返回 echartsInstance，不能在单个容器上初始化多个 ECharts 实例。
  this._chart = echarts.init(ele);
  //   this.resize();
  //   const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
  //   handler.setInputAction(
  //     // () => mockClickChart(event, this._chart),
  //     Cesium.ScreenSpaceEventType.LEFT_CLICK
  //   );

  return this._chart;
};

EchartsLayer.prototype.dispose = function () {
  this._echartsContainer &&
    (this._map.container.removeChild(this._echartsContainer),
    (this._echartsContainer = null)),
    this._overlay && (this._overlay.dispose(), (this._overlay = null));
};

EchartsLayer.prototype.updateOverlay = function (t) {
  this._overlay && this._overlay.setOption(t);
};

EchartsLayer.prototype.getMap = function () {
  return this._map;
};

EchartsLayer.prototype.getOverlay = function () {
  return this._overlay;
};

EchartsLayer.prototype.show = function () {
  this._echartsContainer &&
    (this._echartsContainer.style.visibility = "visible");
};

EchartsLayer.prototype.hide = function () {
  this._echartsContainer &&
    (this._echartsContainer.style.visibility = "hidden");
};

EchartsLayer.prototype.remove = function () {
  this._chart.clear();
  if (this._echartsContainer.parentNode)
    this._echartsContainer.parentNode.removeChild(this._echartsContainer);
  this._map = undefined;
};

EchartsLayer.prototype.resize = function () {
  const self = this;
  window.onresize = function () {
    const scene = self._map.scene;
    self._echartsContainer.style.width = scene.canvas.style.width;
    self._echartsContainer.style.height = scene.canvas.style.height;
    self._chart.resize();
  };
};

export default EchartsLayer;
