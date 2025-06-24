<!--
 * @Description:
 * @Author: A_qiang
 * @Date: 2023-06-06 21:17:52
 * @LastEditTime: 2023-01-21 19:14:02
 * @LastEditors: A_qiang
-->
<template>
    <div id="container">
        <div id="cesiumContainer" ref="viewerRef"></div>
        <!-- <div id="cesiumContainer1" ref="viewer1Ref"></div> -->
        <Panel v-model:visible="dialogVisible" @btnClick="btnClick"></Panel>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import Panel from "@/views/Panel.vue";
import * as Cesium from "cesium"
import "cesium/Source/Widgets/widgets.css"
import initCesium from "@/cesiumUtils/initCesium"
import EditB3DM from "@/cesiumUtils/EditB3DM";
import PolylineImageTrailMaterialProperty from "@/cesiumUtils/ImageMaterial"
import ScanRadar from "@/cesiumUtils/scanRadar"
import SyncViewer from "@/cesiumUtils/splitViewer"
import DynamicMaskEllipsoid from "@/material/dynamicMaskEllipsoid"
import ElectricMaterialProperty4Ellipsoid from "@/material/electricMaterialProperty4Ellipsoid.js"
import RainEffect from "@/material/particleRain"
import TerrainExcavation from "@/cesiumUtils/terrainClippe"
import VisibilityAnalysis from "@/cesiumUtils/visibilityAnalysis";
import CreateFrustum from "@/cesiumUtils/createFrustum";
import { visibleCamera } from "@/shadowMap/shadowMap"
let viewer = null;
let viewer1 = null;
let tilesetModel = null
let rainObj = null
onMounted(async () => {
    viewer = await initCesium("cesiumContainer");
    viewer.scene.globe.depthTestAgainstTerrain = true;
    viewer1 = await initCesium("cesiumContainer1");
    tilesetModel = new Cesium.Cesium3DTileset({
        url: "/3dtiles/data/tileset.json"
    });
    viewer.scene.primitives.add(tilesetModel);
})
const dialogVisible = ref(false);
let editB3dm = null
let trailPolyline = undefined
//动态轨迹线（图片）
const imageProperty = async (viewer) => {
    trailPolyline = viewer.entities.add({
        polyline: {
            clampToGround: true,
            //轨迹线的分布位置
            positions: Cesium.Cartesian3.fromDegreesArray([
                137, 36, 138, 36, 138, 37, 137, 37, 137, 38, 138, 38
            ]),
            material: new PolylineImageTrailMaterialProperty({
                //图片的颜色
                color: Cesium.Color.RED,
                //轨迹运行的速率
                speed: 10,
                //随意一张图片
                image: (await import("@/assets/smile.jpg")).default,
                //将轨迹分成一行50个图片
                repeat: { x: 40, y: 1 },
            }),
            width: 20,
        }
    })
    return trailPolyline
}
// 动态遮罩球
const maskMaterialEllipsoid = (viewer) => {
    viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(-107.0, 40.0, 300000.0),
        ellipsoid: {
            radii: new Cesium.Cartesian3(50000.0, 50000.0, 50000.0),
            material: new DynamicMaskEllipsoid({
                color: new Cesium.Color(1, 0, 0, 1),
                speed: 5.0,
            })
        }
    })
    viewer.flyTo(viewer.entities)
}
//电弧球
const electricMaterialProperty4Ellipsoid = (viewer) => {
    const newColor = Cesium.Color.fromRandom()
    let color = newColor.withAlpha(1)
    const electricEntity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(-107.0, 40.0, 300000.0),
        ellipsoid: {
            radii: new Cesium.Cartesian3(100000.0, 100000.0, 100000.0),
            material: new ElectricMaterialProperty4Ellipsoid({
                color: new Cesium.CallbackProperty(() => {
                    return color
                }, false),
                // color: new Cesium.Color(1, 0, 0, 1),
                speed: 5.0,
            })
        }
    })
    viewer.flyTo(electricEntity)
}
//三维雷达
const scanRadar = (viewer) => {
    const radarEntity = new ScanRadar({
        viewer: viewer,
        position: { lng: 117, lat: 37, height: 0 },
        radius: 2000.0,
        colorEllipsoid: { ellipsoid: "#FF1493", alpha: 0.4 },
        colorWall: { wall: "#0000FF", alpha: 1 },
        speed: 1.0,
    })
    viewer.flyTo(radarEntity)
};
//降雨效果
const rainParticle = (viewer) => {
    if (!rainObj) {
        rainObj = new RainEffect(viewer, {
            tiltAngle: -0.0,
            rainSize: 0.6,
            rainSpeed: 350.0
        })
        rainObj.show(true)
    }
}
//地形挖掘
let terrainClipPlanObj = null
let heightPre = ref(-1)
const terrainClip = async (terrainBool, height) => {
    console.log(terrainClipPlanObj)
    if (!terrainClipPlanObj) {
        debugger
        terrainClipPlanObj = new TerrainExcavation(viewer, {
            height: height,
            splitNum: 1000,
            bottomImg: (await import("@/assets/smile.jpg")).default,
            wallImg: (await import("@/assets/gg.png")).default,
        })
    }
    if (terrainBool) {
        console.log(heightPre.value)
        if (heightPre.value >= 0) {
            terrainClipPlanObj.height = height;
        } else {

            terrainClipPlanObj.startCreate()
            heightPre.value = height
        }
    }
}
//分屏联动
let syncViewer = null
let intervalId = null
const viewerRef = ref(null)
const viewer1Ref = ref(null)
const btnClick = (params) => {
    const { id, step } = params;
    console.log(id, step);
    switch (id) {
        case "startSync":
            syncViewer ? syncViewer = syncViewer : syncViewer = new SyncViewer(viewer, viewer1)
            viewerRef.value.style.transition = "width .5s ease-in-out"
            viewerRef.value.style.width = "50vw"
            viewer1Ref.value.style.transition = "width .5s ease-in-out"
            viewer1Ref.value.style.width = "50vw"
            syncViewer.sync(true)
            break
        case "cancelSync":
            viewerRef.value.style.transition = "width .5s ease-in-out"
            viewerRef.value.style.width = "100vw"
            viewer1Ref.value.style.width = "0vw"
            syncViewer.sync(false)
            break
        case "initTiles":
            viewer.flyTo(tilesetModel)
            editB3dm = new EditB3DM(viewer, tilesetModel, 1, 1)
            break;
        case "rotation":
            editB3dm.editRotation()
            break;
        case "transition":
            editB3dm.editTranslation()
            break;
        case "destroyTiles":
            editB3dm.destroy()
            break;
        case "gifBillboard":
            let img = document.createElement("img")
            viewerRef.value.appendChild(img)
            img.src = require("@/assets/gif_billboard.gif")
            img.onload = () => {
                const rub = new SuperGif({
                    gif: img
                })
                rub.load(() => {
                    const entity = viewer.entities.add({
                        position: Cesium.Cartesian3.fromDegrees(117, 30),
                        billboard: {
                            image: new Cesium.CallbackProperty(() => {
                                return rub.get_canvas().toDataURL("image/png");
                            }, false),
                            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                            scaleByDistance: new Cesium.NearFarScalar(500, 1.0, 2000, 0.1)
                        }
                    })
                    viewer.zoomTo(entity);
                })
            }
            break
        case "dynamcTrail":
            trailPolyline = imageProperty(viewer)
            viewer.camera.flyTo({
                destination: Cesium.Rectangle.fromDegrees(135, 35, 139, 40)
            })
            break;
        case "removeTrail":
            viewer.entities.remove(trailPolyline)
            break;
        case "electricMaterialEllipsoid":
            electricMaterialProperty4Ellipsoid(viewer)
            break;
        case "maskMaterialEllipsoid":
            maskMaterialEllipsoid(viewer)
            break;
        case "3dScanRadar":
            scanRadar(viewer);
            break;
        case "dynamicfrustum":
            // 创建视点
            let origin = Cesium.Cartesian3.fromDegrees(120, 30, 300);
            // 视角定位
            viewer.camera.flyTo({
                destination: origin,
            });
            let heading = 0;
            let pitch = 0;
            let roll = 0;
            let hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll)
            let orientation = Cesium.Transforms.headingPitchRollQuaternion(origin, hpr, Cesium.Ellipsoid.WGS84)
            // 创建视锥体
            let createFrustum = new CreateFrustum({
                viewer: viewer,
                position: origin,
                orientation: orientation,
                fov: 30,
                near: 1,
                far: 100,
                aspectRatio: window.innerWidth / window.innerHeight,
            });

            // 动态修改视锥体的姿态
            intervalId = setInterval(() => {
                // 绕Z轴旋转-航向
                // heading += 0.01;
                // 绕X轴旋转-俯仰
                // pitch += 0.01;
                // 绕Y轴旋转-翻滚
                roll += 0.01;

                hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll)
                orientation = Cesium.Transforms.headingPitchRollQuaternion(origin, hpr);
                createFrustum.updateOrientation(origin, orientation);
            }, 200)
            break;
        case "removeEffect":
            viewer.entities.removeAll()
            viewer.scene.primitives.removeAll()
            clearInterval(intervalId)
            break;
        case "rainProcessStage":
            rainParticle(viewer, step)
            break;
        case "polygonExa":
            terrainClip(true, step)
            terrainClipPlanObj.show = true
            break;
        case "breakAnalysis":
            const vaObj = new VisibilityAnalysis(viewer)
            break;
        case "routePoint":
            // var Poly_pointsCollections = [];
            // var scene = viewer.scene;
            // var Poly_coordiantesArray = [
            //     [
            //         72.35433701166211, 52.57522385967319, 300.18442795152974,
            //         44.89719893727921, 72.39011732046649, 300.86453159141635,
            //     ],
            //     [
            //         67.29773654341213, 32.88259716109294, 300.14234015976554,
            //         32.98282610463128, 69.19404079866142, 300.354623867578226,
            //         66.85127436871454, 31.712787322338162, 300.354623867578226
            //     ],
            // ];

            // var Poly_nameArray = "straightLine_";
            // for (var i = 0; i < 2; i++) {
            //     var temp = Poly_coordiantesArray[i];
            //     for (var j = 0; j < temp.length; j = j + 3) {
            //         draw_Zone_Corner_points(
            //             temp[j],
            //             temp[j + 1],
            //             temp[j + 2]
            //         );
            //     }
            // }

            // var directionde = null
            // var cartesianDe = {}
            // var cardir = {}
            // async function draw_Zone_Corner_points(lon, lat, height, name) {
            //     cartesianDe = Cesium.Cartesian3.fromDegrees(lon, lat, height, Cesium.Ellipsoid.WGS84, new Cesium.Cartesian3())
            //     // console.log(cartesianDe, "cartesian")
            //     // // debugger
            //     // cardir = Cesium.Cartesian3.subtract(Cesium.Cartesian3.ZERO, cartesianDe, new Cesium.Cartesian3())
            //     // // debugger
            //     // console.log(cardir, "directionde")
            //     // cardir = Cesium.Cartesian3.normalize(cardir, cardir)
            //     // let ray = new Cesium.Ray(cartesianDe, cardir)
            //     // const intersection = Cesium.IntersectionTests.rayEllipsoid(ray, Cesium.Ellipsoid.WGS84);
            //     // const point = Cesium.Ray.getPoint(ray, intersection.start);
            //     var pointGeometry = viewer.entities.add({
            //         name: "straightLinePoint_",
            //         description: [lon, lat, height],
            //         position: Cesium.Cartesian3.fromDegrees(lon, lat, height),
            //         point: {
            //             color: Cesium.Color.SKYBLUE,
            //             pixelSize: 10,
            //             outlineColor: Cesium.Color.YELLOW,
            //             outlineWidth: 3,
            //             // disableDepthTestDistance: Number.POSITIVE_INFINITY, // we can see points arounds earth
            //             // heightReference: Cesium.HeightReference.RELATIVE_TO_TERRAIN,
            //         },

            //     });
            //     const terrainProvider = await Cesium.createWorldTerrainAsync();
            //     const positions = [
            //         Cesium.Cartographic.fromDegrees(lon, lat),
            //     ];
            //     let updatedPositions = await Cesium.sampleTerrainMostDetailed(terrainProvider, positions);
            //     console.log(updatedPositions[0])
            //     updatedPositions = Cesium.Cartesian3.fromRadians(updatedPositions[0].longitude, updatedPositions[0].latitude, updatedPositions[0].height)
            //     console.log(updatedPositions, "updte")
            //     var polyline = viewer.entities.add({
            //         polyline: {
            //             positions: new Cesium.CallbackProperty(() => {
            //                 return [updatedPositions, cartesianDe]
            //             }, false),

            //             width: 10
            //         }
            //     })
            //     Poly_pointsCollections.push(pointGeometry);
            // }
            // var ZoneMoment = true;
            // var rightEntityPicked = false;
            // var dragging = false;
            // var pickedEntity;
            // var mouseDroped = false;
            // var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
            // handler.setInputAction(function (click) {
            //     if (ZoneMoment) {
            //         console.log("LEFT down ");
            //         var pickedObject = scene.pick(click.position);
            //         if (Cesium.defined(pickedObject) && pickedObject.id) {
            //             var entityName = pickedObject.id._name;
            //             entityName = entityName.split("_");
            //             console.log("entityName ", entityName[0]);
            //             if (entityName[0] === "straightLinePoint") {
            //                 rightEntityPicked = true;
            //             }
            //             if (rightEntityPicked) {
            //                 dragging = true;
            //                 scene.screenSpaceCameraController.enableRotate = false;
            //                 pickedEntity = pickedObject;
            //                 console.log(pickedEntity, "pick")
            //             }
            //         }
            //     }
            // }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
            // handler.setInputAction(function (movement) {
            //     if (ZoneMoment && rightEntityPicked && dragging) {
            //         var cartesian = pickedEntity.id.position.getValue(
            //             Cesium.JulianDate.fromDate(new Date())
            //         );
            //         var cartographic =
            //             scene.globe.ellipsoid.cartesianToCartographic(cartesian);
            //         var surfaceNormal =
            //             scene.globe.ellipsoid.geodeticSurfaceNormal(cartesian);
            //         var planeNormal = Cesium.Cartesian3.subtract(
            //             scene.camera.position,
            //             cartesian,
            //             new Cesium.Cartesian3()
            //         );
            //         planeNormal = Cesium.Cartesian3.normalize(
            //             planeNormal,
            //             planeNormal
            //         );
            //         console.log(movement.endPosition, "movement")
            //         let subtract = {}
            //         let direction = Cesium.Cartesian3.subtract(Cesium.Cartesian3.ZERO, cartesian, subtract)
            //         console.log(subtract, "substract")
            //         direction = Cesium.Cartesian3.normalize(subtract, direction)
            //         console.log(direction, "direction")
            //         let originRay = new Cesium.Ray(Cesium.Cartesian3.ZERO, direction)
            //         console.log(originRay, "originRay")
            //         var ray = viewer.scene.camera.getPickRay(movement.endPosition);
            //         var plane = Cesium.Plane.fromPointNormal(cartesian, planeNormal);
            //         var newCartesian = Cesium.IntersectionTests.rayPlane(ray, plane);
            //         plane.material = Cesium.Color.WHITE.withAlpha(0.05);
            //         plane.outlineColor = Cesium.Color.WHITE;
            //         let interactPoint = Cesium.IntersectionTests.rayEllipsoid(originRay, Cesium.Ellipsoid.WGS84)
            //         const point = Cesium.Ray.getPoint(originRay, interactPoint.start);
            //         console.log(point, "point")
            //         // console.log(interactPoint)
            //         var newCartographic =
            //             viewer.scene.globe.ellipsoid.cartesianToCartographic(
            //                 newCartesian
            //             );
            //         cartographic.longitude = newCartographic.longitude;
            //         cartographic.latitude = newCartographic.latitude;
            //         pickedEntity.id.position.setValue(
            //             scene.globe.ellipsoid.cartographicToCartesian(cartographic)
            //         );
            //         // var pointGeometry = viewer.entities.add({
            //         //     name: "straightLinePoint_",
            //         //     polyline: {
            //         //         positions: new Cesium.CallbackProperty(() => {
            //         //             return [point, cartesian]
            //         //         }, false),
            //         //         width: 1
            //         //     },
            //         // });
            //     }
            //     if (dragging) {
            //         mouseDroped = true;
            //     }
            // }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
            // handler.setInputAction(function () {
            //     if (ZoneMoment && rightEntityPicked && mouseDroped) {
            //         console.log("Left up ");
            //         dragging = false;
            //         mouseDroped = false;
            //         scene.screenSpaceCameraController.enableRotate = true;
            //     }
            // }, Cesium.ScreenSpaceEventType.LEFT_UP);
            break
        case "removeAnalysis":
            if (terrainClipPlanObj && terrainClipPlanObj.clear && typeof terrainClipPlanObj.clear === 'function') {
                terrainClipPlanObj.clear();
                terrainClipPlanObj = null;
                heightPre.value = -1
            }
            break;
        case "getWorldCoordinates":
            getWorldCoordinates(viewer)
            break;
        case "shaderParamsUpdate":
            shaderParamsUpdate(viewer)
            break;
        case "limit-earth":
            limitEarthProcess(viewer)
            break;
        case "limit-radius":
            limitRadiusProcess(viewer)
            break;
        case "limit-rectangle":
            limittRectangleProcess(viewer)
            break;
        case "fogByDistance":
            fogByDistanceProcess(viewer)
            break;
        case "fogByCenter":
            fogByCenterProcess(viewer)
            break;
        case "fogLinear":
            break;
        case "fogExponent":
            break;
        case "snow":
            break;
        case "elevationContour":
            elevationContour(viewer)
            break;
        case "slopeRamp":
            slopeRamp(viewer)
            break;
        case "aspectRamp":
            aspectRamp(viewer)
            break;
        case "elevationRamp":
            elevationRamp(viewer)
            break;
        case "discard":
            discard(viewer)
            break;
        case "globalMaterialRemove":
            viewer.scene.globe.material = undefined
            break;
        case "enableCamera":
            visibleCamera(viewer)
            break;
        case "visibilityAnalysis":
            break
        case "videoShadowMap":
            break
        case "disableShadowMap":
            break

    }
}

//求取世界坐标
const getWorldCoordinates = (viewer) => {
    const fragmentShaderSource = `
        uniform sampler2D colorTexture;
        uniform sampler2D depthTexture;
        in vec2 v_textureCoordinates;
        void main(void)
        {
            out_FragColor = texture(colorTexture, v_textureCoordinates);
            float depth = czm_unpackDepth(texture(depthTexture, v_textureCoordinates));

            vec4 eyeCoordinate4 = czm_windowToEyeCoordinates(gl_FragCoord.xy, depth);
            vec3 eyeCoordinate3 = eyeCoordinate4.xyz / eyeCoordinate4.w;
            vec4 worldCoordinate4 = czm_inverseView * vec4(eyeCoordinate3, 1.0);
            vec3 worldCoordinate = worldCoordinate4.xyz / worldCoordinate4.w;
            out_FragColor.r = 1. - step(0.0, worldCoordinate.z);
            out_FragColor.g = step(0.0, worldCoordinate.z);
            // if (worldCoordinate.z < 0.0) {
            //     out_FragColor.r = 1.;
            // } else {
            //     out_FragColor.g = 1.0;
            //  }
        }
    `
    const postProcessStage = viewer.scene.postProcessStages.add(
        new Cesium.PostProcessStage({
            fragmentShader: fragmentShaderSource
        })
    )
    let position = Cesium.Cartesian3.fromDegrees(110, 0, 0)//赤道上的点
    viewer.entities.add({
        position: position,
        point: {
            pixelSize: 20,
            color: Cesium.Color.BLUE
        }
    })
}
//着色器参数更新（更新颜色）
// const shaderParamsUpdate = (viewer, color) => {
//     const fragmentShaderSource = `
//         uniform sampler2D colorTexture;
//         uniform sampler2D depthTexture;
//         uniform vec4 u_color;
//         in vec2 v_textureCoordinates;
//         void main(void)
//         {
//             out_FragColor = texture(colorTexture, v_textureCoordinates);
//             float depth = czm_unpackDepth(texture(depthTexture, v_textureCoordinates));

//             vec4 eyeCoordinate4 = czm_windowToEyeCoordinates(gl_FragCoord.xy, depth);
//             vec3 eyeCoordinate3 = eyeCoordinate4.xyz / eyeCoordinate4.w;
//             vec4 worldCoordinate4 = czm_inverseView * vec4(eyeCoordinate3, 1.0);
//             vec3 worldCoordinate = worldCoordinate4.xyz / worldCoordinate4.w;
//             if (worldCoordinate.z > 0.0) {
//                 out_FragColor.r = u_color.r;
//             out_FragColor.g = u_color.g;
//             out_FragColor.b = u_color.b;
//             out_FragColor.a = u_color.a;
//             }


//         }
//     `
//     const postProcessStage = viewer.scene.postProcessStages.add(
//         new Cesium.PostProcessStage({
//             fragmentShader: fragmentShaderSource,
//             uniforms: {
//                 u_color: Cesium.Color.fromCssColorString('#ff0000')
//             }
//         })
//     )
//     let position = Cesium.Cartesian3.fromDegrees(110, 0, 0)//赤道上的点
//     viewer.entities.add({
//         position: position,
//         point: {
//             pixelSize: 20,
//             color: Cesium.Color.BLUE
//         }
//     })
// }
//范围限制-地球
const limitEarthProcess = (viewer) => {
    const fragmentShaderSource = `
        uniform sampler2D colorTexture;
        uniform sampler2D depthTexture;
        in vec2 v_textureCoordinates;
        void main(void)
        {
            out_FragColor = texture(colorTexture, v_textureCoordinates);
            float depth = czm_unpackDepth(texture(depthTexture, v_textureCoordinates));
            if (depth >= 1.0) {
                return;
            }
            out_FragColor.r = 1.;
        }
    `
    const postProcessStage = viewer.scene.postProcessStages.add(
        new Cesium.PostProcessStage({
            fragmentShader: fragmentShaderSource
        })
    )
    let position = Cesium.Cartesian3.fromDegrees(110, 0, 0)//赤道上的点
    viewer.entities.add({
        position: position,
        point: {
            pixelSize: 20,
            color: Cesium.Color.BLUE
        }
    })
}
//范围限制-半径
const limitRadiusProcess = (viewer) => {
    const fragmentShaderSource = `
        uniform sampler2D colorTexture;
        uniform sampler2D depthTexture;
        in vec2 v_textureCoordinates;
        uniform vec3 center;
        uniform float radius;
        void main(void)
        {
            out_FragColor = texture(colorTexture, v_textureCoordinates);
            float depth = czm_unpackDepth(texture(depthTexture, v_textureCoordinates));

            vec4 eyeCoordinate4 = czm_windowToEyeCoordinates(gl_FragCoord.xy, depth);
            vec3 eyeCoordinate3 = eyeCoordinate4.xyz / eyeCoordinate4.w;
            vec4 worldCoordinate4 = czm_inverseView * vec4(eyeCoordinate3, 1.0);
            vec3 worldCoordinate = worldCoordinate4.xyz / worldCoordinate4.w;
            if (distance(center, worldCoordinate) < radius) {
                out_FragColor.r = 1.;
            }
        }
    `
    let position = Cesium.Cartesian3.fromDegrees(110, 0, 0)//赤道上的点
    const postProcessStage = viewer.scene.postProcessStages.add(
        new Cesium.PostProcessStage({
            fragmentShader: fragmentShaderSource,
            uniforms: {
                center: position,
                radius: 10000
            }
        })
    )
    // viewer.entities.add({
    //     position: position,
    //     point: {
    //         pixelSize: 20,
    //         color: Cesium.Color.BLUE
    //     }
    // })
    viewer.camera.flyTo({
        destination: position
    })
}
//范围限制-矩形
const limittRectangleProcess = (viewer) => {
    let positions = [120, 30, 121, 30, 121, 31, 120, 31]
    positions = Cesium.Cartesian3.fromDegreesArray(positions)
    //建立局部坐标系，将所有点转到该坐标系下
    let m = Cesium.Transforms.eastNorthUpToFixedFrame(positions[0])
    let inverse = Cesium.Matrix4.inverse(m, new Cesium.Matrix4())
    let localPositions = []
    positions.forEach(position => {
        localPositions.push(
            Cesium.Matrix4.multiplyByPoint(
                inverse,
                position,
                new Cesium.Cartesian3()
            )
        )
    })
    //计算局部坐标的矩形范围
    let rect = Cesium.BoundingRectangle.fromPoints(localPositions, new Cesium.BoundingRectangle())
    rect = new Cesium.Cartesian4(rect.x, rect.y, rect.x + rect.width, rect.y + rect.height)
    const fragmentShaderSource = `
        uniform sampler2D colorTexture;
        uniform sampler2D depthTexture;
        in vec2 v_textureCoordinates;
        uniform vec4 rect;
        uniform mat4 inverse;
        void main(void)
        {
            out_FragColor = texture(colorTexture, v_textureCoordinates);
            float depth = czm_unpackDepth(texture(depthTexture, v_textureCoordinates));
            if (depth >= 1.0) return;
            vec4 eyeCoordinate4 = czm_windowToEyeCoordinates(gl_FragCoord.xy, depth);
            vec3 eyeCoordinate3 = eyeCoordinate4.xyz / eyeCoordinate4.w;
            vec4 worldCoordinate4 = czm_inverseView * vec4(eyeCoordinate3, 1.0);
            vec3 worldCoordinate3 = worldCoordinate4.xyz / worldCoordinate4.w;
            vec4 local = inverse * vec4(worldCoordinate3, 1.0);
            local.z = 1.0;
            //判断是否在rect中
            if (local.x > rect.x && local.x < rect.z && local.y < rect.w && local.y > rect.y) {
                out_FragColor.r = 1.;
            }
        }
    `
    const postProcessStage = new Cesium.PostProcessStage({
        fragmentShader: fragmentShaderSource,
        uniforms: {
            inverse: inverse,
            rect: rect
        }
    })
    viewer.scene.postProcessStages.add(postProcessStage)
    viewer.camera.flyTo({
        destination: positions[0]
    })
}
//根据相机距离雾化
const fogByDistanceProcess = (viewer) => {
    const fragmentShaderSource = `
        float getDistance(sampler2D depthTexture, vec2 texCoords)
        {
            float depth = czm_unpackDepth(texture(depthTexture, texCoords));
            if (depth == 0.0) {
                return czm_infinity;
            }
            vec4 eyeCoordinate = czm_windowToEyeCoordinates(gl_FragCoord.xy, depth);
            return -eyeCoordinate.z / eyeCoordinate.w;
        }
        float interpolateByDistance(vec4 nearFarScalar, float distance)
        {
            float startDistance = nearFarScalar.x;
            float startValue = nearFarScalar.y;
            float endDistance = nearFarScalar.z;
            float endValue = nearFarScalar.w;
            float t = clamp((distance - startDistance) / (endDistance - startDistance), 0.0, 1.0);
            return mix(startValue, endValue, t);
        }
        vec4 alphaBlend(vec4 sourceColor, vec4 destinationColor)
        {
            return sourceColor * vec4(sourceColor.aaa, 1.0) + destinationColor * vec4(1.0 - sourceColor.a);
        }
        uniform sampler2D colorTexture;
        uniform sampler2D depthTexture;
        uniform vec4 fogByDistance;
        uniform vec4 fogColor;
        in vec2 v_textureCoordinates;
        void main(void)
        {
            float distance = getDistance(depthTexture, v_textureCoordinates); //获取当前像素到相机的距离
            vec4 sceneColor = texture(colorTexture, v_textureCoordinates); //场景原有的颜色
            float blendAmout = interpolateByDistance(fogByDistance, distance); //根据距离计算雾化
            vec4 finnalFogColor = vec4(fogColor.rgb, fogColor.a * blendAmout); //计算颜色
            out_FragColor = alphaBlend(finnalFogColor, sceneColor); //混合场景原有的颜色和雾化颜色
        }
    `
    const postProcessStage = new Cesium.PostProcessStage({
        fragmentShader: fragmentShaderSource,
        uniforms: {
            fogByDistance: new Cesium.Cartesian4(100, 0.0, 10000, 1.0), //雾化参数10米的时候为0， 200米的时候完全雾化
            fogColor: Cesium.Color.BLACK, //雾化的颜色，设置为黑色
        }
    })
    viewer.scene.postProcessStages.add(postProcessStage)
}

/**
 * Globe类
 * */
//等高线（局部）
const elevationContour = (viewer) => {
    let positions = [
        114.48165315948947, 26.88537765441287,
        114.49059645844312, 26.886623091932666,
        114.49046426464001, 26.894158820558456,
        114.48015054916547, 26.89228862770083,
    ];
    positions = Cesium.Cartesian3.fromDegreesArray([].concat.apply([], positions));
    //建立局部坐标系，将所有点转到该坐标系下
    let m = Cesium.Transforms.eastNorthUpToFixedFrame(positions[0])
    let inverse = Cesium.Matrix4.inverse(m, new Cesium.Matrix4())
    let localPositions = []
    positions.forEach(position => {
        localPositions.push(
            Cesium.Matrix4.multiplyByPoint(
                inverse,
                position,
                new Cesium.Cartesian3()
            )
        )
    })
    //计算矩形范围
    let rect = Cesium.BoundingRectangle.fromPoints(localPositions, new Cesium.BoundingRectangle())
    rect = new Cesium.Cartesian4(rect.x, rect.y, rect.x + rect.width, rect.y + rect.height)
    Cesium.Material._materialCache._materials.ElevationContour.fabric.source = `
        uniform vec4 color;
        uniform float spacing;
        uniform float width;
        uniform vec4 rect;
        uniform vec4 m_0;
        uniform vec4 m_1;
        uniform vec4 m_2;
        uniform vec4 m_3;

        czm_material czm_getMaterial(czm_materialInput materialInput) {
            czm_material material = czm_getDefaultMaterial(materialInput);

            float distanceToContour = mod(materialInput.height, spacing);

            #if (__VERSION__ == 300 || defined(GL_OES_standard_derivatives))
                float dxc = abs(dFdx(materialInput.height));
                float dyc = abs(dFdy(materialInput.height));
                float dF = max(dxc, dyc) * czm_pixelRatio * width;
                float alpha = (distanceToContour < dF) ? 1.0 : 0.0;
            #else
                //If no derivatives are available (IE 10?), use pixel ratio
                float alpha = (distanceToContour < (width * czm_pixelRatio)) ? 1.0 : 0.0;
            #endif

            vec4 outColor = czm_gammaCorrect(vec4(color.rgb, alpha * color.a));
            material.diffuse = outColor.rgb;

            mat4 m = mat4(m_0[0], m_0[1], m_0[2], m_0[3],
                          m_1[0], m_1[1], m_1[2], m_1[3],
                          m_2[0], m_2[1], m_2[2], m_2[3],
                          m_3[0], m_3[1], m_3[2], m_3[3]);
            vec4 eyeCoordinate4 = vec4(-materialInput.positionToEyeEC, 1.0);
            vec4 worldCoordinate4 = czm_inverseView * eyeCoordinate4;
            vec3 worldCoordinate = worldCoordinate4.xyz / worldCoordinate4.w;
            vec4 local = m * vec4(worldCoordinate, 1.0);
            material.alpha = 0.;
            if(local.x>rect.x&&local.x<rect.z&&local.y<rect.w&&local.y>rect.y){
                material.alpha = outColor.a;
            }
            return material;
        }
    `
    let material = new Cesium.Material({
        fabric: {
            type: "ElevationContour",
            uniforms: {
                width: 1,
                spacing: 20,
                color: Cesium.Color.YELLOW,
                rect: rect,
                m_0: new Cesium.Cartesian4(inverse[0], inverse[1], inverse[2], inverse[3]),
                m_1: new Cesium.Cartesian4(inverse[4], inverse[5], inverse[6], inverse[7]),
                m_2: new Cesium.Cartesian4(inverse[8], inverse[9], inverse[10], inverse[11]),
                m_3: new Cesium.Cartesian4(inverse[12], inverse[13], inverse[14], inverse[15]),
            }
        }
    })
    viewer.scene.globe.material = material;
    viewer.camera.flyTo({
        destination: positions[3]
    })
}
//坡度（局部）
const slopeRamp = (viewer) => {
    let positions = [
        114.48165315948947, 26.88537765441287,
        114.49059645844312, 26.886623091932666,
        114.49046426464001, 26.894158820558456,
        114.48015054916547, 26.89228862770083,
    ];
    positions = Cesium.Cartesian3.fromDegreesArray([].concat.apply([], positions));
    //建立局部坐标系，将所有点转到该坐标系下
    let m = Cesium.Transforms.eastNorthUpToFixedFrame(positions[0])
    let inverse = Cesium.Matrix4.inverse(m, new Cesium.Matrix4())
    let localPositions = []
    positions.forEach(position => {
        localPositions.push(
            Cesium.Matrix4.multiplyByPoint(
                inverse,
                position,
                new Cesium.Cartesian3()
            )
        )
    })
    //计算矩形范围
    let rect = Cesium.BoundingRectangle.fromPoints(localPositions, new Cesium.BoundingRectangle())
    rect = new Cesium.Cartesian4(rect.x, rect.y, rect.x + rect.width, rect.y + rect.height)
    Cesium.Material._materialCache._materials.SlopeRamp.fabric.source = `
        uniform sampler2D image;
        uniform vec4 rect;
        uniform vec4 m_0;
        uniform vec4 m_1;
        uniform vec4 m_2;
        uniform vec4 m_3;

        czm_material czm_getMaterial(czm_materialInput materialInput) {
            czm_material material = czm_getDefaultMaterial(materialInput);

            vec4 rampColor = texture(image, vec2(materialInput.slope / (czm_pi / 2.0), 0.5));
            rampColor = czm_gammaCorrect(rampColor);
            mat4 m = mat4(m_0[0], m_0[1], m_0[2], m_0[3],
                          m_1[0], m_1[1], m_1[2], m_1[3],
                          m_2[0], m_2[1], m_2[2], m_2[3],
                          m_3[0], m_3[1], m_3[2], m_3[3]);
            vec4 eyeCoordinate4 = vec4(-materialInput.positionToEyeEC, 1.0);
            vec4 worldCoordinate4 = czm_inverseView * eyeCoordinate4;
            vec3 worldCoordinate = worldCoordinate4.xyz / worldCoordinate4.w;
            vec4 local = m * vec4(worldCoordinate, 1.0);
            material.alpha = 0.;
            material.diffuse = rampColor.rgb;
            if(local.x>rect.x&&local.x<rect.z&&local.y<rect.w&&local.y>rect.y){
                material.alpha = rampColor.a;
            }
            return material;
        }
    `
    let material = new Cesium.Material({
        fabric: {
            type: "SlopeRamp",
            uniforms: {
                image: getColorRamp(),
                rect: rect,
                m_0: new Cesium.Cartesian4(inverse[0], inverse[1], inverse[2], inverse[3]),
                m_1: new Cesium.Cartesian4(inverse[4], inverse[5], inverse[6], inverse[7]),
                m_2: new Cesium.Cartesian4(inverse[8], inverse[9], inverse[10], inverse[11]),
                m_3: new Cesium.Cartesian4(inverse[12], inverse[13], inverse[14], inverse[15]),
            }
        }
    })
    viewer.scene.globe.material = material;
    viewer.camera.flyTo({
        destination: positions[3]
    })
}
//颜色带
const getColorRamp = () => {

    const ramp = document.createElement("canvas");
    ramp.width = 100;
    ramp.height = 1;
    const ctx = ramp.getContext("2d");
    let values = [0.0, 0.29, 0.5, Math.sqrt(2) / 2, 0.87, 0.91, 1.0];
    const grd = ctx.createLinearGradient(0, 0, 100, 0);
    grd.addColorStop(values[0], "#000000"); //black
    grd.addColorStop(values[1], "#2747E0"); //blue
    grd.addColorStop(values[2], "#D33B7D"); //pink
    grd.addColorStop(values[3], "#D33038"); //red
    grd.addColorStop(values[4], "#FF9742"); //orange
    grd.addColorStop(values[5], "#ffd700"); //yellow
    grd.addColorStop(values[6], "#ffffff"); //white
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 100, 1);
    return ramp;
}
//坡向（局部）
const aspectRamp = (viewer) => {
    let positions = [
        114.48165315948947, 26.88537765441287,
        114.49059645844312, 26.886623091932666,
        114.49046426464001, 26.894158820558456,
        114.48015054916547, 26.89228862770083,
    ];
    positions = Cesium.Cartesian3.fromDegreesArray([].concat.apply([], positions));
    //建立局部坐标系，将所有点转到该坐标系下
    let m = Cesium.Transforms.eastNorthUpToFixedFrame(positions[0])
    let inverse = Cesium.Matrix4.inverse(m, new Cesium.Matrix4())
    let localPositions = []
    positions.forEach(position => {
        localPositions.push(
            Cesium.Matrix4.multiplyByPoint(
                inverse,
                position,
                new Cesium.Cartesian3()
            )
        )
    })
    //计算矩形范围
    let rect = Cesium.BoundingRectangle.fromPoints(localPositions, new Cesium.BoundingRectangle())
    rect = new Cesium.Cartesian4(rect.x, rect.y, rect.x + rect.width, rect.y + rect.height)
    Cesium.Material._materialCache._materials.AspectRamp.fabric.source = `
        uniform sampler2D image;
        uniform vec4 rect;
        uniform vec4 m_0;
        uniform vec4 m_1;
        uniform vec4 m_2;
        uniform vec4 m_3;

        czm_material czm_getMaterial(czm_materialInput materialInput) {
            czm_material material = czm_getDefaultMaterial(materialInput);

            vec4 rampColor = texture(image, vec2(materialInput.aspect / (czm_pi * 2.0), 0.5));
            rampColor = czm_gammaCorrect(rampColor);
            mat4 m = mat4(m_0[0], m_0[1], m_0[2], m_0[3],
                          m_1[0], m_1[1], m_1[2], m_1[3],
                          m_2[0], m_2[1], m_2[2], m_2[3],
                          m_3[0], m_3[1], m_3[2], m_3[3]);
            vec4 eyeCoordinate4 = vec4(-materialInput.positionToEyeEC, 1.0);
            vec4 worldCoordinate4 = czm_inverseView * eyeCoordinate4;
            vec3 worldCoordinate = worldCoordinate4.xyz / worldCoordinate4.w;
            vec4 local = m * vec4(worldCoordinate, 1.0);
            material.alpha = 0.;
            material.diffuse = rampColor.rgb;
            if(local.x>rect.x&&local.x<rect.z&&local.y<rect.w&&local.y>rect.y){
                material.alpha = rampColor.a;
            }
            return material;
        }
    `
    let material = new Cesium.Material({
        fabric: {
            type: "AspectRamp",
            uniforms: {
                image: getColorRamp(),
                rect: rect,
                m_0: new Cesium.Cartesian4(inverse[0], inverse[1], inverse[2], inverse[3]),
                m_1: new Cesium.Cartesian4(inverse[4], inverse[5], inverse[6], inverse[7]),
                m_2: new Cesium.Cartesian4(inverse[8], inverse[9], inverse[10], inverse[11]),
                m_3: new Cesium.Cartesian4(inverse[12], inverse[13], inverse[14], inverse[15]),
            }
        }
    })
    viewer.scene.globe.material = material;
    viewer.camera.flyTo({
        destination: positions[3]
    })
}
//高程（局部）
const elevationRamp = (viewer) => {
    let positions = [
        114.48165315948947, 26.88537765441287,
        114.49059645844312, 26.886623091932666,
        114.49046426464001, 26.894158820558456,
        114.48015054916547, 26.89228862770083,
    ];
    positions = Cesium.Cartesian3.fromDegreesArray([].concat.apply([], positions));
    //建立局部坐标系，将所有点转到该坐标系下
    let m = Cesium.Transforms.eastNorthUpToFixedFrame(positions[0])
    let inverse = Cesium.Matrix4.inverse(m, new Cesium.Matrix4())
    let localPositions = []
    positions.forEach(position => {
        localPositions.push(
            Cesium.Matrix4.multiplyByPoint(
                inverse,
                position,
                new Cesium.Cartesian3()
            )
        )
    })
    //计算矩形范围
    let rect = Cesium.BoundingRectangle.fromPoints(localPositions, new Cesium.BoundingRectangle())
    rect = new Cesium.Cartesian4(rect.x, rect.y, rect.x + rect.width, rect.y + rect.height)
    Cesium.Material._materialCache._materials.ElevationRamp.fabric.source = `
        uniform sampler2D image;
        uniform vec4 rect;
        uniform float minimumHeight;
        uniform float maximumHeight;
        uniform vec4 m_0;
        uniform vec4 m_1;
        uniform vec4 m_2;
        uniform vec4 m_3;

        czm_material czm_getMaterial(czm_materialInput materialInput) {
            czm_material material = czm_getDefaultMaterial(materialInput);
            float scaleHeight = clamp((materialInput.height - minimumHeight) / (maximumHeight - minimumHeight), 0.0, 1.0);
            vec4 rampColor = texture(image, vec2(scaleHeight, 0.5));
            rampColor = czm_gammaCorrect(rampColor);
            mat4 m = mat4(m_0[0], m_0[1], m_0[2], m_0[3],
                          m_1[0], m_1[1], m_1[2], m_1[3],
                          m_2[0], m_2[1], m_2[2], m_2[3],
                          m_3[0], m_3[1], m_3[2], m_3[3]);
            vec4 eyeCoordinate4 = vec4(-materialInput.positionToEyeEC, 1.0);
            vec4 worldCoordinate4 = czm_inverseView * eyeCoordinate4;
            vec3 worldCoordinate = worldCoordinate4.xyz / worldCoordinate4.w;
            vec4 local = m * vec4(worldCoordinate, 1.0);
            material.alpha = 0.;
            material.diffuse = rampColor.rgb;
            if(local.x>rect.x&&local.x<rect.z&&local.y<rect.w&&local.y>rect.y){
                material.alpha = rampColor.a;
            }
            return material;
        }
    `
    let material = new Cesium.Material({
        fabric: {
            type: 'ElevationRamp',
            uniforms: {
                maximumHeight: 1000,
                minimumHeight: 10,
                image: getColorRamp(),
                rect: rect,
                m_0: new Cesium.Cartesian4(
                    inverse[0],
                    inverse[1],
                    inverse[2],
                    inverse[3]
                ),
                m_1: new Cesium.Cartesian4(
                    inverse[4],
                    inverse[5],
                    inverse[6],
                    inverse[7]
                ),
                m_2: new Cesium.Cartesian4(
                    inverse[8],
                    inverse[9],
                    inverse[10],
                    inverse[11]
                ),
                m_3: new Cesium.Cartesian4(
                    inverse[12],
                    inverse[13],
                    inverse[14],
                    inverse[15]
                )
            }
        }
    })
    viewer.scene.globe.material = material
    viewer.camera.flyTo({
        destination: positions[3]
    })
}
//裁剪（暂时只能是举行裁剪）
const discard = (viewer) => {
    let positions = [
        114.48165315948947, 26.88537765441287,
        114.49059645844312, 26.886623091932666,
        114.49046426464001, 26.894158820558456,
        114.48015054916547, 26.89228862770083,
    ];
    positions = Cesium.Cartesian3.fromDegreesArray([].concat.apply([], positions));
    //建立局部坐标系，将所有点转到该坐标系下
    let m = Cesium.Transforms.eastNorthUpToFixedFrame(positions[0])
    let inverse = Cesium.Matrix4.inverse(m, new Cesium.Matrix4())
    let localPositions = []
    positions.forEach(position => {
        localPositions.push(
            Cesium.Matrix4.multiplyByPoint(
                inverse,
                position,
                new Cesium.Cartesian3()
            )
        )
    })
    //计算矩形范围
    let rect = Cesium.BoundingRectangle.fromPoints(localPositions, new Cesium.BoundingRectangle())
    rect = new Cesium.Cartesian4(rect.x, rect.y, rect.x + rect.width, rect.y + rect.height)
    Cesium.Material._materialCache._materials.ElevationRamp.fabric.source = `
        uniform sampler2D image;
        uniform vec4 rect;
        uniform float minimumHeight;
        uniform float maximumHeight;
        uniform vec4 m_0;
        uniform vec4 m_1;
        uniform vec4 m_2;
        uniform vec4 m_3;

        czm_material czm_getMaterial(czm_materialInput materialInput) {
            czm_material material = czm_getDefaultMaterial(materialInput);
            float scaleHeight = clamp((materialInput.height - minimumHeight) / (maximumHeight - minimumHeight), 0.0, 1.0);
            vec4 rampColor = texture(image, vec2(scaleHeight, 0.5));
            rampColor = czm_gammaCorrect(rampColor);
            mat4 m = mat4(m_0[0], m_0[1], m_0[2], m_0[3],
                          m_1[0], m_1[1], m_1[2], m_1[3],
                          m_2[0], m_2[1], m_2[2], m_2[3],
                          m_3[0], m_3[1], m_3[2], m_3[3]);
            vec4 eyeCoordinate4 = vec4(-materialInput.positionToEyeEC, 1.0);
            vec4 worldCoordinate4 = czm_inverseView * eyeCoordinate4;
            vec3 worldCoordinate = worldCoordinate4.xyz / worldCoordinate4.w;
            vec4 local = m * vec4(worldCoordinate, 1.0);
            material.alpha = 0.;
            material.diffuse = rampColor.rgb;
            if(local.x>rect.x&&local.x<rect.z&&local.y<rect.w&&local.y>rect.y){
                discard; //如果在矩形范围内则不渲染
            }
            return material;
        }
    `
    let material = new Cesium.Material({
        fabric: {
            type: 'ElevationRamp',
            uniforms: {
                maximumHeight: 1000,
                minimumHeight: 10,
                image: getColorRamp(),
                rect: rect,
                m_0: new Cesium.Cartesian4(
                    inverse[0],
                    inverse[1],
                    inverse[2],
                    inverse[3]
                ),
                m_1: new Cesium.Cartesian4(
                    inverse[4],
                    inverse[5],
                    inverse[6],
                    inverse[7]
                ),
                m_2: new Cesium.Cartesian4(
                    inverse[8],
                    inverse[9],
                    inverse[10],
                    inverse[11]
                ),
                m_3: new Cesium.Cartesian4(
                    inverse[12],
                    inverse[13],
                    inverse[14],
                    inverse[15]
                )
            }
        }
    })
    viewer.scene.globe.material = material
    viewer.camera.flyTo({
        destination: positions[3]
    })
}
</script>
<style lang="less">
#container {
    width: 100vw;
    height: 100vh;
    display: flex;
    position: relative;

    #cesiumContainer {
        width: 100vw;
        height: 100vh;
        overflow: hidden;
        display: inline-block;
    }

    #cesiumContainer1 {
        width: 0vw;
        height: 100vh;
        display: inline-block;
    }
}
</style>