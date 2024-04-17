/**
 * @description 绘制贴地多边形
 * @author A_qiang
 * @param {Object} viewer
 * @param {Array} resultList
 * @param {{id: String, color: object, outlineColor: object, outlineWidth: number}} options {id, 填充颜色，轮廓颜色， 轮廓线宽}
 * @param {Function} callback 携带创建的多边形对象
 */
import * as Cesium from "cesium"
const CreatePolygonOnGround = function (viewer, resultList, options, callback) {
    if (!viewer) throw new Error("no viewer object!")
    options = options || {}
    let id = options.id || setSessionId()
    if (viewer.entities.getById(id)) throw new Error("the id parameter is an unique value")
    let color = options.color || Cesium.Color.RED;
    let outlineColor = options.outlineColor || color.withAlpha(1)
    let outlineWidth = options.outlineWidth || 2
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas)
    let anchorpoints = []
    let polygon = undefined
    let drawStatus = true
    handler.setInputAction(function (event) {
        let pixPos = event.position
        let cartesian = getCartesian3FromPx(viewer, pixPos)
        if (anchorpoints.length == 0) {
            anchorpoints.push(cartesian)
            let linePoints = new Cesium.CallbackProperty(function () {
                let verPoints = anchorpoints.concat([anchorpoints[0]])
                return verPoints
            }, false)
            let dynamicPositions = new Cesium.CallbackProperty(function () {
                return new Cesium.PolygonHierarchy(anchorpoints)
            }, false)
            polygon = viewer.entities.add({
                name: "挖掘多边形",
                id: id,
                polyline: {
                    positions: linePoints,
                    width: outlineWidth,
                    material: outlineColor,
                    clamToGround: true
                },
                polygon: {
                    heightReference: Cesium.HeightReference.NONE,
                    hierarchy: dynamicPositions,
                    material: color
                }
            })
            polygon.GeoType = "Polygon"
        }
        anchorpoints.push(cartesian)
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
    handler.setInputAction(function (movement) {
        let endPos = movement.endPosition
        if (Cesium.defined(polygon)) {
            anchorpoints.pop()
            let cartesian = getCartesian3FromPX(viewer, endPos)
            anchorpoints.push(cartesian)
        }
        if (anchorpoints.length === 3) {
            polygon.polygon.heightReference = Cesium.HeightReference.CLAMP_TO_GROUND
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
    handler.setInputAction(function (event) {
        anchorpoints.pop()
        polygon.pottingPoint = anchorpoints
        resultList.push(polygon)
        handler.destroy()
        drawStatus = false
        if (typeof callback == "function") callback(polygon)
    }, Cesium.ScreenSpaceEventType.RIGHT_DOWN)
    //实现Ctrl+Z回退
    document.onkeydown = function (event) {
        if (event.ctrlKey && window.event.keyCode == 90) {
            if (!drawStatus) return false
        }
        anchorpoints.pop()
    }
}

const getCartesian3FromPX = (viewer, px) => {
    let picks = viewer.scene.drillPick(px)
    let cartesian = null
    let isOnTiles = false, isOnTerrain = false
    for (let i in picks) {
        let pick = picks[i]
        if (
            (pick && pick.primitive instanceof Cesium.Cesium3DTileFeature) ||
            (pick && pick.primitive instanceof Cesium.Cesium3DTileset) ||
            (pick && pick.primitive instanceof Cesium.Model)
        ) {
            //在模型上拾取
            isOnTiles = true
        }
        if (isOnTiles) {
            viewer.scene.pick(px)
            cartesian = viewer.scene.pickPosition(px)
            if (cartesian) {
                let cartographic = Cesium.Cartographic.fromCartesian(cartesian)
                if (cartographic.height < 0) cartographic.height = 0
                let lon = Cesium.Math.toDegrees(cartographic.longitude),
                    lat = Cesium.Math.toDegrees(cartographic.latitude),
                    height = cartographic.height;
                cartesian = transformWGS84ToCartesian(viewer, { lon, lat, alt: height })
            }
        }
    }

    //在地形上拾取
    let boolTerrain = viewer.terrainProvider instanceof Cesium.EllipsoidTerrainProvider
    if (!isOnTiles && !boolTerrain) {
        let ray = viewer.scene.camera.getPickRay(px)
        if (!ray) return null
        cartesian = viewer.scene.globe.pick(ray, viewer.scene)
        isOnTerrain = true
    }

    //在地球上拾取
    if (!isOnTiles && !isOnTerrain && boolTerrain) {
        cartesian = viewer.scene.camera.pickEllipsoid(px, viewer.scene.globe.ellipsoid)
    }
    if (cartesian) {
        let position = transformWGS84ToCartesian(viewer, cartesian)
        if (position.alt < 0) {
            cartesian = transformWGS84ToCartesian(viewer, position, 0.1)
        }
        return cartesian
    }
    return false
}

/**
 * @description 坐标转换 84转Cartesian
 * @param {Object} {lng, lat, alt} 地理坐标
 * @returns {Object} Cartesian3
 */
const transformWGS84ToCartesian = (viewer, position, alt) => {
    return position ? 
        Cesium.Cartesian3.fromDegrees(position.lng, position.lat, position.alt, Cesium.Ellipsoid.WGS84) : Cesium.Cartesian3.WGS84
}

/**
 * @description 坐标转换 Cartesian转84
 * @returns {Object} {lng, lat, alt} 地理坐标
 */
const transformCartesianToWGS84 = (viewer, cartesian) => {
    let ellipsoid = Cesium.Ellipsoid.WGS84
    let cartographic = ellipsoid.cartesianToCartographic(cartesian)
    return {
        lng: Cesium.Math.toDegrees(cartographic.longitude),
        lat: Cesium.Math.toDegrees(cartographic.latitude),
        alt: cartographic.height
    }
}

/**
 * @description 获取随机id
 */
const setSessionId = (num) => {
    let length = num || 32
    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZzbcdefghijklmnopqrstuvwxyz1234567890"
    let maxPos = chars.length
    let pwd = ""
    for (let i = 0; i < length; i++) {
        pwd += chars.charAt(Math.floor(Math.random() * maxPos))
    }
    return pwd
}

export default CreatePolygonOnGround

