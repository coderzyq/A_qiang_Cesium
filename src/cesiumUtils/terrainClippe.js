import * as Cesium from "cesium"
import CreatePolygonOnGround from "./createPolygpmOnGround"
/**
 * @description 地形裁剪
 */
class TerrainExcavation {
    constructor(viewer, options) {
      if (!viewer) throw new Error("no viewer object!");
      this.viewer = viewer;
      this.options = options || {};
      this._height = this.options.height || 0;
      this.bottomImg = options.bottomImg;
      this.wallImg = options.wallImg;
      this.splitNum = Cesium.defaultValue(options.splitNum, 50);
      this.init();
    }
    init() {
      Object.defineProperties(TerrainExcavation.prototype, {
        show: {
          get: function () {
            return this._show;
          },
          set: function (e) {
            this._show = e;
            this.switchExcavate(e);
          },
        },
        height: {
          get: function () {
            return this._height;
          },
          set: function (e) {
            this._height = e;
            this.updateExcavateDepth(e);
          },
        },
      });
    }
    startCreate() {
      const $this = this;
      CreatePolygonOnGround(
        $this.viewer,
        [],
        {
          color: Cesium.Color.RED.withAlpha(0.1),
          outlineColor: Cesium.Color.YELLOW,
          outlineWidth: 2,
        },
        function (polygon) {
          console.log(polygon);
          const points = polygon.pottingPoint;
          $this.viewer.entities.remove(polygon);
          $this.updateData(points);
        }
      );
      return;
    }
    updateData(activePoints) {
      let viewer = this.viewer;
      this.clear();
      let clippingPlanesList = [];
      let car3Difference = Cesium.Cartesian3.subtract(
        activePoints[0],
        activePoints[1],
        new Cesium.Cartesian3()
      ); //计算两个笛卡尔函数的分量差异
      let boolDiff = car3Difference.x > 0;
      this.excavateMinHeight = 9999;
      for (let index = 0; index < activePoints.length; ++index) {
        let s = (index + 1) % activePoints.length;
        let curMidPoint = Cesium.Cartesian3.midpoint(
          activePoints[index],
          activePoints[s],
          new Cesium.Cartesian3()
        );
        let cartographic = Cesium.Cartographic.fromCartesian(activePoints[index]);
        let curHeight =
          viewer.scene.globe.getHeight(cartographic) || cartographic.height;
        console.log(curHeight);
        if (curHeight < this.excavateMinHeight) {
          this.excavateMinHeight = curHeight;
        }
        let curMidPointNormal = Cesium.Cartesian3.normalize(
          curMidPoint,
          new Cesium.Cartesian3()
        );
        let curMidPointDifference = boolDiff
          ? Cesium.Cartesian3.subtract(
              activePoints[index],
              curMidPoint,
              new Cesium.Cartesian3()
            )
          : Cesium.Cartesian3.subtract(
              activePoints[s],
              curMidPoint,
              new Cesium.Cartesian3()
            );
        curMidPointDifference = Cesium.Cartesian3.normalize(
          curMidPointDifference,
          curMidPointDifference
        );
        let curMidPointCross = Cesium.Cartesian3.cross(
          curMidPointDifference,
          curMidPointNormal,
          new Cesium.Cartesian3()
        );
        curMidPointCross = Cesium.Cartesian3.normalize(
          curMidPointCross,
          curMidPointCross
        );
        let plane = new Cesium.Plane(curMidPointCross, 0);
        let distance = Cesium.Plane.getPointDistance(plane, curMidPoint);
        clippingPlanesList.push(
          new Cesium.ClippingPlane(curMidPointCross, distance)
        );
      }
      this.viewer.scene.globe.clippingPlanes = new Cesium.ClippingPlaneCollection(
        {
          planes: clippingPlanesList,
          edgeWidth: 1,
          edgeColor: Cesium.Color.WHITE,
          enabled: true,
        }
      );
      this.prepareWell(activePoints);
      this.createWell(this.wellData);
      this.viewer.entities.remove(this.drawGeomtry);
    }
   
    clear() {
      if (this.viewer.scene.globe.clippingPlanes) {
        this.viewer.scene.globe.clippingPlanes.removeAll();
        this.viewer.scene.primitives.remove(this.bottomSurface);
        this.viewer.scene.primitives.remove(this.wellWall);
        this.viewer.scene.render();
      }
    }
    //计算并更新wellData
    prepareWell(activePoints) {
      let pointLength = activePoints.length;
      let heightDiff = this.excavateMinHeight - this.height;
      let no_height_top = [],
        bottom_pos = [],
        lerp_pos = [];
      for (let l = 0; l < pointLength; l++) {
        let u = l == pointLength - 1 ? 0 : l + 1;
        let point0 = [
          Cesium.Cartographic.fromCartesian(activePoints[l]).longitude,
          Cesium.Cartographic.fromCartesian(activePoints[l]).latitude,
        ];
        let point1 = [
          Cesium.Cartographic.fromCartesian(activePoints[u]).longitude,
          Cesium.Cartographic.fromCartesian(activePoints[u]).latitude,
        ];
        if (0 == l) {
          lerp_pos.push(new Cesium.Cartographic(point0[0], point0[1]));
          bottom_pos.push(
            Cesium.Cartesian3.fromRadians(point0[0], point0[1], heightDiff)
          );
          no_height_top.push(
            Cesium.Cartesian3.fromRadians(point0[0], point0[1], 0)
          );
        }
        for (let p = 1; p <= this.splitNum; p++) {
          let m = Cesium.Math.lerp(point0[0], point1[0], p / this.splitNum);
          let g = Cesium.Math.lerp(point0[1], point1[1], p / this.splitNum);
          (l == pointLength - 1 && p == this.splitNum) ||
            (lerp_pos.push(new Cesium.Cartographic(m, g)),
            bottom_pos.push(Cesium.Cartesian3.fromRadians(m, g, heightDiff)),
            no_height_top.push(Cesium.Cartesian3.fromRadians(m, g, 0)));
        }
      }
      this.wellData = {
        lerp_pos: lerp_pos,
        bottom_pos: bottom_pos,
        no_height_top: no_height_top,
      };
    }
    //开始创建底面和侧面
    async createWell(wallData) {
      let $this = this;
      if (this.viewer.terrainProvider._layers) {
        this.createBottomSurface(wallData.bottom_pos);
        let positions = await Cesium.sampleTerrainMostDetailed(
          this.viewer.terrainProvider,
          wallData.lerp_pos
        );
          let positionList = [];
          for (let index = 0; index < positions.length; index++) {
            const element = positions[index];
            let curPos = Cesium.Cartesian3.fromRadians(
              element.longitude,
              element.latitude,
              element.height
            );
            positionList.push(curPos);
          }
          $this.createWellWall(wallData.bottom_pos, positionList);
      } else {
        this.createBottomSurface(wallData.bottom_pos);
        this.createWellWall(wallData.bottom_pos, wallData.no_height_top);
      }
    }
    //坐标转换，转出经纬度格式
    ellipsoidToDegree(pos) {
      let cartesian3 = new Cesium.Cartesian3(pos.x, pos.y, pos.z);
      let cartographic =
        this.viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian3);
      return {
        longitude: Cesium.Math.toDegrees(cartographic.longitude),
        latitude: Cesium.Math.toDegrees(cartographic.latitude),
        altitude: cartographic.height,
      };
    }
    //创建地形开挖的底面对象
    createBottomSurface(points) {
      if (points.length) {
        let minHeight = this.getMinHeight(points);
        let positions = [];
        for (let i = 0; i < points.length; i++) {
          let curPoint = this.ellipsoidToDegree(points[i]);
          positions.push(curPoint.longitude, curPoint.latitude, minHeight);
        }
        let polygon = new Cesium.PolygonGeometry({
          polygonHierarchy: new Cesium.PolygonHierarchy(
            Cesium.Cartesian3.fromDegreesArrayHeights(positions)
          ),
          perPositionHeight: true,
        });
   
        let material = new Cesium.Material({
          fabric: {
            type: "Image",
            uniforms: {
              image: this.bottomImg,
            },
          },
        });
        let appearance = new Cesium.MaterialAppearance({
          translucent: false,
          flat: true,
          material: material,
        });
        this.bottomSurface = new Cesium.Primitive({
          geometryInstances: new Cesium.GeometryInstance({
            geometry: Cesium.PolygonGeometry.createGeometry(polygon),
          }),
          appearance: appearance,
          asynchronous: false,
        });
        this.viewer.scene.primitives.add(this.bottomSurface);
      }
    }
    // 创建地形开挖的侧面墙对象
    createWellWall(bottomPos, positionList) {
      let minHeight = this.getMinHeight(bottomPos);
      let maxHeights = [],
        minHeights = [];
      for (let i = 0; i < positionList.length; i++) {
        maxHeights.push(this.ellipsoidToDegree(positionList[i]).altitude);
        minHeights.push(minHeight);
      }
      let wall = new Cesium.WallGeometry({
        positions: positionList,
        maximumHeights: maxHeights,
        minimumHeights: minHeights,
      });
      let geometry = Cesium.WallGeometry.createGeometry(wall);
      let material = new Cesium.Material({
        fabric: {
          type: "Image",
          uniforms: {
            image: this.wallImg,
            repeat: new Cesium.Cartesian2(2, 1)
          },
        },
      });
      let appearance = new Cesium.MaterialAppearance({
        translucent: false,
        flat: true,
        material: material,
      });
      this.wellWall = new Cesium.Primitive({
        geometryInstances: new Cesium.GeometryInstance({
          geometry: geometry,
          attributes: {
            color: Cesium.ColorGeometryInstanceAttribute.fromColor(
              Cesium.Color.GREY
            ),
          },
          id: "PitWall",
        }),
        appearance: appearance,
        asynchronous: false,
      });
      this.viewer.scene.primitives.add(this.wellWall);
    }
    //获取地形开挖最低点高程值
    getMinHeight(points) {
      let minHeight = 5000000;
      let minPoint = null;
      for (let i = 0; i < points.length; i++) {
        let height = points[i]["z"];
        if (height < minHeight) {
          minHeight = height;
          minPoint = this.ellipsoidToDegree(points[i]);
        }
      }
      return minPoint.altitude;
    }
    switchExcavate(show) {
      if (show) {
        this.viewer.scene.globe.material = null;
        this.wellWall.show = true;
        this.bottomSurface.show = true;
      } else {
        this.viewer.scene.globe.material = null;
        this.wellWall.show = false;
        this.bottomSurface.show = false;
      }
    }
   
    updateExcavateDepth(height) {
      this.viewer.scene.primitives.remove(this.bottomSurface);
      this.viewer.scene.primitives.remove(this.wellWall);
      console.log(this.wellData, this.excavateMinHeight);
      let lerp_pos = this.wellData.lerp_pos;
      let posList = [];
      for (let n = 0; n < lerp_pos.length; n++) {
        posList.push(
          Cesium.Cartesian3.fromRadians(
            lerp_pos[n].longitude,
            lerp_pos[n].latitude,
            this.excavateMinHeight - height
          )
        );
      }
      this.wellData.bottom_pos = posList;
      this.createWell(this.wellData);
    }
  }
  export default TerrainExcavation;