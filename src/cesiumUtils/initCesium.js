/*
 * @Description: 
 * @Author: coderqiang
 * @Date: 2023-06-07 22:18:05
 * @LastEditTime: 2023-07-30 21:26:04
 * @LastEditors: coderqiang
 */
import * as Cesium from "cesium";
const initCesium = async (id) => {
    //设置在中国
    Cesium.Camera.DEFAULT_VIEW_RECTANGLE = Cesium.Rectangle.fromDegrees(80, 4, 130, 55)
    Cesium.Ion.defaultAccessToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkNmE3NWNiMi1iNGRmLTRlNWUtYmE5ZS0xMWM3YjEyNzMxNjEiLCJpZCI6OTk5MzUsImlhdCI6MTY1NjkxMzY3MX0.S8rhi8SLw6eHjz9VtbdHqfYhkw_x3v97R-hbLKdhZKw";
    
    
    const baseConfig = {
        geocoder: false,
        homeButton: true,
        sceneModePicker: false,
        baseLayerPicker: false,
        navigationHelpButton: false,
        animation: true,
        timeline: true,
        fullscreenButton: false,
        vrButton: false,
        scene3DOnly: false,
        infoBox: false,
        shouldAnimate: true
    }
    const viewer = new Cesium.Viewer(id, {...baseConfig})
    // const terrainProvider = await Cesium.createWorldTerrainAsync({
    //     requestVertexNormals: true, //请求地形照明数据
    //     requestWaterMsk: true, // 请求水体效果所需要的海岸线数据
    // })
    // viewer.terrainProvider = terrainProvider;
    viewer.scene.globe.depthTestAgainstTerrain = true; // 启用深度测试，让地形后面的东西消失。
    // 去除版权信息
    viewer._cesiumWidget._creditContainer.style.display = "none"; // 隐藏版权
    viewer.scene.globe.show = true;
    viewer.scene.debugShowFramesPerSecond = true;
    // viewer.camera.setView({
    //     // Cesium的坐标是以地心为原点，一向指向南美洲，一向指向亚洲，一向指向北极州
    //     // fromDegrees()方法，将经纬度和高程转换为世界坐标
    //     destination: Cesium.Cartesian3.fromDegrees(...[104, 30, 30000000]),
    //     orientation: {
    //         // 指向
    //         heading: Cesium.Math.toRadians(0, 0),
    //         // 视角
    //         pitch: Cesium.Math.toRadians(-90),
    //         roll: 0.0,
    //     },
    // })

    return viewer
}
export default initCesium
