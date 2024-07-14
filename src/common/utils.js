import * as Cesium from "cesium"
/**
 * @description 获取相机位置
 * @author A_qiang
 * @param {*} viewer
 * @returns {*}
 */
export const getViewerCamera = (viewer) => {
    viewer = viewer || window.viewer
    if ( !viewer) {
        console.error("viewer is necessary");
        return
    }
    const camera = viewer.camera
    const position = camera.position
    const heading = camera.heading
    const pitch = camera.pitch
    const roll = camera.roll
    const lngLat = Cesium.Cartographic.fromCartesian(position)
    const cameraPosition = {
        x: Cesium.Math.toDegrees(lngLat.longitude),
        y: Cesium.Math.toDegrees(lngLat.latitude),
        z: lngLat.height,
        heading: Cesium.Math.toDegrees(heading),
        pitch: Cesium.Math.toDegrees(pitch),
        roll: Cesium.Math.toDegrees(roll)
    }
    return cameraPosition
}

