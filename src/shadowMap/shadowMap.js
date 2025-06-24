import * as Cesium from "cesium";
export const visibleCamera = (viewer) => { 
    let p = [121.11124, 31.14121, 100.49794];
    p = Cesium.Cartesian3.fromDegrees(p[0], p[1], p[2]);
    let camera = new Cesium.Camera(viewer.scene);
    //设置相机的位置和视角（方向）
    camera.setView({
      destination: p,
      orientation: {
        heading: Cesium.Math.toRadians(0.0),
        pitch: Cesium.Math.toRadians(-50.0),
        roll: 0.0,
      },
    });
    //设置相机的锥体
    camera.frustum = new Cesium.PerspectiveFrustum({
        fov: Cesium.Math.toRadians(50.0),
        aspectRatio: 1,
        near: 1.0,
        far: 200
    })
    let cameraPrimitive = new Cesium.DebugCameraPrimitive({
        camera: camera,
        color: Cesium.Color.RED,
        show: true,
    })
    viewer.scene.primitives.add(cameraPrimitive);
    viewer.entities.add({
        position: p,
        point: {
            color: Cesium.Color.BLUE,
            pixelSize: 5,
        },
    });
    viewer.camera.flyTo({
        destination: p,
        orientation: {
            heading: Cesium.Math.toRadians(0.0),
            pitch: Cesium.Math.toRadians(-50.0),
            roll: 0.0,
        },
    })
};