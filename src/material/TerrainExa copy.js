import * as Cesium from "cesium";

class TerrainExcavation {
  constructor(viewer, options) {
    if (!viewer) throw new Error("no viewer object!");
    this.viewer = viewer;
    this.options = options || {};
    this._height = options.height || 0;
    this.bottomImg = options.bottomImg;
    this.wallImg = options.wallImg;
    this.splitNum = Cesium.defaultValue(options.splitNum, 50);
  }
  get show() {
    return this._show
  }
  set show(e) {
    this._show = e;
    this.switchExcavate(e)
  }
  get height() {
    return this._height;
  }
  set height(e) {
    this._height = e;
    this.updateExcavateDepth(e)
  }

  startCreate() {
    const self = this;

  }

  switchExcavate(show) {
    if (show) {
      this.viewer.scene.globe.material = null;
      this.wellWall.show = true;
      this.bottomSurface = true
    } else {
      this.viewer.scene.globe.material = null;
      this.wellWall.show = false;
      this.bottomSurface.show = false
    }
  }

  updateExcavateDepth(height) {
    this.viewer.scene.primitives.remove(this.bottomSurface);
    this.viewer.scene.primitives.remove(this.wellWall)
    console.log(this.wallData, this.excavaMinHeight);
    let lerp_pos = this.wallData.lerp_pos;
    let posList = []
    for (let n = 0; n < lerp_pos.length; n++) {
      posList.push(
        Cesium.Cartesian3.fromRadians(
          lerp_pos[n].longitude,
          lerp_pos[n].latitude,
          this.excavaMinHeight
        )
      )
    }
    this.wallData.bottom_pos = posList
    this.createWall(this.wallData)
  }

  //开始创建底面和侧面
  createWall(wallData) {
    let self = this;
    if (this.viewer.terrainProvider._layer) {
      this.createBottomSurface(wallData.bottom_pos)
      let positions = Cesium.sampleTerrainMostDetailed(
        this.viewer.terrainProvider,
        wallData.lerp_pos
      )
      Cesium.when(positions, function(pos) {
        let positionList = [];
        for (let index = 0; index < pos.length; index++) {
          const element = pos[index];
          let curPos = Cesium.Cartesian3.fromRadians(
            element.longitude,
            element.latitude,
            element.height
          )
          positionList.push(curPos)
        }
        self.createWellWall(wallData.bottom_pos, positionList)
      })
    } else {
      this.createBottomSurface(wallData.bottom_pos)
      this.createWellWall(wallData.bottom_pos.positionList)
    }
  }

  //创建地形开挖的底面对象
  createBottomSurface(points) {
    if (points.length) {
      let minHeight = this.getMinHeight(points);
      let positions = [];
      for (let i = 0; i < points.length; i++) {
        let curPoint = this.ellipsoidToDegree(points[i]);
        positions.push(curPoint.longitude, curPoint.latitude, minHeight)
      }
      let polygon = new Cesium.PolygonGeometry({
        polygonHierarchy: new Cesium.PolygonHierarchy(
          Cesium.Cartesian3.fromDegreesArrayHeights(positions)
        ),
        perPositionHeight: true,
      })
      let material = new Cesium.Material({
        fabric: {
          type: "Image",
          uniforms: {
            image: this.bottomImg,
          },
        },
      })
      let appearance = new Cesium.MaterialAppearance({
        translucent: false,
        flat: true,
        material: material
      })
      this.bottomSurface = new Cesium.Primitive({
        geometryInstances: new Cesium.GeometryInstance({
          geometry: Cesium.PolygonGeometry.createGeometry(polygon)
        }),
        appearance: appearance,
        asynchronous: false
      })
      this.viewer.scene.primitives.add(this.bottomSurface)
    }
  }

  //创建地形开挖的侧面对象
  createWellWall(bottomPos, positionList) {
    
  }
}