<template>
    <div>
      <div id="cesiumContainer">
        
        <el-button
          type="primary"
          size='mini'
          @click="drawLineRoad"
        >绘制路线</el-button>
        <el-button
          type="primary"
          size='mini'
          @click="startFly"
        >开始飞行</el-button>
        <el-button
          type="primary"
          size='mini'
          @click="stopFly"
        >暂停飞行</el-button>
        <el-button
          type="primary"
          size='mini'
          @click="continueFly"
        >继续飞行</el-button>
        <el-button
          type="primary"
          size='mini'
          @click="exitFly"
        >退出飞行</el-button>
      </div>
      <div id="cesiumContainer">
      </div>
    </div>
  </template>
  <script>
 import * as Cesium from "cesium"
import "cesium/Source/Widgets/widgets.css"
  export default {
    name: "CesiumViewer",
    data() {
      return {
        TerrionUrl: '/3D-stk_terrain/rest/realspace/datas/info/data/path',
        viewer: {},
        marks: [
          { lng: 108.9423344082, lat: 34.2609052589, height: 6000, flytime: 4 },
          { lng: 116.812948, lat: 36.550064, height: 1000, flytime: 4 },
          // height:相机高度(单位米) flytime:相机两个标注点飞行时间(单位秒)
          { lng: 116.812948, lat: 36.560064, height: 1000, flytime: 2 },
          { lng: 117.802948, lat: 36.560064, height: 900, flytime: 3 },
          { lng: 118.802948, lat: 36.550064, height: 800, flytime: 3 },
          { lng: 119.802948, lat: 36.550064, height: 700, flytime: 3 },
          { lng: 120.802948, lat: 36.550064, height: 600, flytime: 3 },
          { lng: 121.802948, lat: 36.550064, height: 500, flytime: 3 },
          { lng: 122.802948, lat: 36.550064, height: 400, flytime: 3 },
          { lng: 123.802948, lat: 36.550064, height: 300, flytime: 3 },
          { lng: 124.802948, lat: 36.550064, height: 400, flytime: 1 },
          { lng: 125.802948, lat: 36.550064, height: 500, flytime: 1 },
          { lng: 126.802948, lat: 36.550064, height: 1000, flytime: 1 },
        ],
        marksIndex: 1,
        pitchValue: -20,
        changeCameraTime: 5,
        flytime: 5,
        Exection: {},
        handler: {},
        activeShapePoints: [],
        floatingPoint: undefined,
        activeShape: undefined,
        drawingMode: 'line',
        Exection: {},
      }
    },
    mounted() {
      //保证模型初始化
      Cesium.Ion.defaultAccessToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkNmE3NWNiMi1iNGRmLTRlNWUtYmE5ZS0xMWM3YjEyNzMxNjEiLCJpZCI6OTk5MzUsImlhdCI6MTY1NjkxMzY3MX0.S8rhi8SLw6eHjz9VtbdHqfYhkw_x3v97R-hbLKdhZKw";
    // const vtxfTerrainProvider = new Cesium.CesiumTerrainProvider({
      //   url: this.TerrionUrl,
      //   requestVertexNormals: true
      // });
      this.viewer = new Cesium.Viewer('cesiumContainer', {
        // scene3DOnly: true,
        // selectionIndicator: false,
        // baseLayerPicker: false,
        // geocoder: false,
        // homeButton: false,
        // sceneModePicker: false,
        // navigationHelpButton: false,
        animation: true,
        timeline: false,
        // fullscreenButton: false,
        // terrainProvider: vtxfTerrainProvider,
        selectionIndicator: false,
        infoBox: false,
        terrainProvider: Cesium.createWorldTerrain()
      });
      //双击鼠标左键清除默认事件
      this.viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
      // this.viewer.imageryLayers.addImageryProvider(new Cesium.UrlTemplateImageryProvider({
      //   url: "/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scale=1&style=8",
      // }));
      this.initFly();
    },
  
    methods: {
      goHome() {
        this.$router.push('/');
      },
      initFly() {
        const { viewer, marks } = this
        // eslint-disable-next-line no-unused-vars
        const self = this;
        viewer.scene.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(marks[0].lng, marks[0].lat, marks[0].height),  //定位坐标点，建议使用谷歌地球坐标位置无偏差
          duration: 1   //定位的时间间隔
        });
        this.handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
      },
      flyExtent() {
        const { viewer, marks, pitchValue } = this
        console.log(this);
        // const self = this;
        // 相机看点的角度，如果大于0那么则是从地底往上看，所以要为负值
        const pitch = Cesium.Math.toRadians(pitchValue);
        // 时间间隔2秒钟
        this.setExtentTime(marks[this.marksIndex].flytime);
        this.Exection = function TimeExecution() {
          let preIndex = self.marksIndex - 1;
          if (self.marksIndex == 0) {
            preIndex = marks.length - 1;
          }
          //计算俯仰角
          let heading = self.bearing(marks[preIndex].lat, marks[preIndex].lng, marks[self.marksIndex].lat, marks[self.marksIndex].lng);
          heading = Cesium.Math.toRadians(heading);
          // 当前已经过去的时间，单位s
          const delTime = Cesium.JulianDate.secondsDifference(viewer.clock.currentTime, viewer.clock.startTime);
          const originLat = self.marksIndex == 0 ? marks[marks.length - 1].lat : marks[self.marksIndex - 1].lat;
          const originLng = self.marksIndex == 0 ? marks[marks.length - 1].lng : marks[self.marksIndex - 1].lng;
          const endPosition = Cesium.Cartesian3.fromDegrees(
            (originLng + (marks[self.marksIndex].lng - originLng) / marks[self.marksIndex].flytime * delTime),
            (originLat + (marks[self.marksIndex].lat - originLat) / marks[self.marksIndex].flytime * delTime),
            marks[self.marksIndex].height
          );
          viewer.scene.camera.setView({
            destination: endPosition,
            orientation: {
              heading: heading,
              pitch: pitch,
            }
          });
          if (Cesium.JulianDate.compare(viewer.clock.currentTime, viewer.clock.stopTime) >= 0) {
            console.log(self);
            viewer.clock.onTick.removeEventListener(this.Exection);
            //有个转向的功能
            self.changeCameraHeading();
          }
        };
        viewer.clock.onTick.addEventListener(self.Exection);
      },
      // 相机原地定点转向
      changeCameraHeading() {
        const { viewer, marks, pitchValue, changeCameraTime } = this
        const self = this;
        let { marksIndex } = this
  
        let nextIndex = this.marksIndex + 1;
        if (marksIndex == marks.length - 1) {
          nextIndex = 0;
        }
        // 计算两点之间的方向
        const heading = this.bearing(marks[marksIndex].lat, marks[marksIndex].lng, marks[nextIndex].lat, marks[nextIndex].lng);
        // 相机看点的角度，如果大于0那么则是从地底往上看，所以要为负值
        const pitch = Cesium.Math.toRadians(pitchValue);
        // 给定飞行一周所需时间，比如10s, 那么每秒转动度数
        const angle = (heading - Cesium.Math.toDegrees(viewer.camera.heading)) / changeCameraTime;
        // 时间间隔2秒钟
        this.setExtentTime(changeCameraTime);
        // 相机的当前heading
        const initialHeading = viewer.camera.heading;
        this.Exection = function TimeExecution() {
          // 当前已经过去的时间，单位s
          const delTime = Cesium.JulianDate.secondsDifference(viewer.clock.currentTime, viewer.clock.startTime);
          const heading = Cesium.Math.toRadians(delTime * angle) + initialHeading;
          viewer.scene.camera.setView({
            orientation: {
              heading: heading,
              pitch: pitch,
            }
          });
          if (Cesium.JulianDate.compare(viewer.clock.currentTime, viewer.clock.stopTime) >= 0) {
            viewer.clock.onTick.removeEventListener(self.Exection);
            self.marksIndex = ++self.marksIndex >= marks.length ? 0 : self.marksIndex;
            if (self.marksIndex != 0) {
              self.flyExtent();
            }
          }
        };
        viewer.clock.onTick.addEventListener(self.Exection);
      },
      // 设置飞行的时间到viewer的时钟里
      setExtentTime(time) {
        const { viewer } = this;
        const startTime = Cesium.JulianDate.fromDate(new Date());
        const stopTime = Cesium.JulianDate.addSeconds(startTime, time, new Cesium.JulianDate());
        viewer.clock.startTime = startTime.clone();  // 开始时间
        viewer.clock.stopTime = stopTime.clone();     // 结速时间
        viewer.clock.currentTime = startTime.clone(); // 当前时间
        viewer.clock.clockRange = Cesium.ClockRange.CLAMPED; // 行为方式-达到终止时间后停止
        viewer.clock.clockStep = Cesium.ClockStep.SYSTEM_CLOCK; // 时钟设置为当前系统时间; 忽略所有其他设置。
      },
      /** 相机视角飞行 结束 **/
      /** 飞行时 camera的方向调整(heading) 开始 **/
      // 角度转弧度
      toRadians(degrees) {
        return degrees * Math.PI / 180;
      },
      // 弧度转角度
      toDegrees(radians) {
        return radians * 180 / Math.PI;
      },
      //计算俯仰角
      bearing(startLat, startLng, destLat, destLng) {
        startLat = this.toRadians(startLat);
        startLng = this.toRadians(startLng);
        destLat = this.toRadians(destLat);
        destLng = this.toRadians(destLng);
  
        let y = Math.sin(destLng - startLng) * Math.cos(destLat);
        let x = Math.cos(startLat) * Math.sin(destLat) - Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng);
        let brng = Math.atan2(y, x);
        let brngDgr = this.toDegrees(brng);
  
        return (brngDgr + 360) % 360;
      },
      /** 飞行时 camera的方向调整(heading) 结束 **/
      
      //开始飞行
      startFly() {
       const { Exection } = this;
        if (Object.keys(Exection).length > 0) {
          this.exitFly();
        }
        this.flyExtent();
      },
      //停止飞行
      stopFly() {
        this.viewer.clock.shouldAnimate = false;
      },
      //继续飞行
      continueFly() {
        this.viewer.clock.shouldAnimate = true;
      },
      //退出飞行
      exitFly() {
        const { Exection, viewer, marks, pitchValue } = this
        viewer.clock.onTick.removeEventListener(Exection);
        // 相机看点的角度，如果大于0那么则是从地底往上看，所以要为负值
        const pitch = Cesium.Math.toRadians(pitchValue);
        const marksIndex = 1;
        let preIndex = marksIndex - 1;
        //计算俯仰角
        let heading = this.bearing(marks[preIndex].lat, marks[preIndex].lng, marks[marksIndex].lat, marks[marksIndex].lng);
        heading = Cesium.Math.toRadians(heading);
        const endPosition = Cesium.Cartesian3.fromDegrees(
          marks[0].lng,
          marks[0].lat,
          marks[0].height
        );
        viewer.scene.camera.setView({
          destination: endPosition,
          orientation: {
            heading: heading,
            pitch: pitch,
          }
        });
      }
  
    },
    created() {
  
    }
  }
  </script>
  <style scoped >
  #cesiumContainer {
    width: 100vw;
    height: 100vh;
    margin: 0;
    padding: 0;
    overflow: hidden;
    position: relative;

}
  </style>
  