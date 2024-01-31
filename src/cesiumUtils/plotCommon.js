/** 
 * @description: 通用方法
 * @author: coderqiang
*/
import * as Cesium from "cesium";

/** 
 * @description: 创建随机（唯一）ID
 * @param {Number} num
 * @returns
*/
const newSessionid = (num) => {
    let len = num || 32;
    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let maxPos = chars.length;
    let pwd = "";
    for (let i = 0; i < len; i++) {
        pwd += chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return pwd;
}

/** 
 * @description: 获取屏幕点的笛卡尔坐标
 * @param viewer 
 * @param px 屏幕像素点
 * @returns {Object} Catesian3 | false |null
*/
const getCartesian3FromPX = (viewer, px = {x, y}) => {
    let picks = viewer.scene.drillPicks(px);
    let cartesian = null;
    let isOn3dtiles = false, isOnTerrian = false;
    //drillPick
    for (let i in picks) {
        let pick = picks[i];
        if (
            (pick && pick.primitive instanceof Cesium.Cesium3DTileFeature) ||
            (pick && pick.primitive instanceof Cesium.Cesium3DTile) ||
            (pick && pick.primitive instanceof Cesium.Model)
        ) {
            //模型上拾取
            isOn3dtiles = true;
        }
        //3dtiles
        if (isOn3dtiles) {
            viewer.scene.pick(px);
            cartesian = viewer.scene.pickPosition(px);
            if (cartesian) {
                let cartographic = Cesium.Cartographic.fromCartesian(cartesian);
                if (cartographic.height < 0) cartographic.height = 0;
                let x = Cesium.Math.toDegrees(cartographic.longitude),
                    y = Cesium.Math.toDegrees(cartographic.latitude),
                    z = Cesium.Math.toDegrees(cartographic.height);
                cartesian = transformWGS84ToCartesian({x, y, z});
            }
        }
    }
    //地形
    let boolTerrain = 
        viewer.terrainProvider instanceof Cesium.EllipsoidTerrainProvider;
    //Terrain
    if (!isOn3dtiles && !boolTerrain) {
        let ray = viewer.scene.camera.getPickRay(px);
        if (!ray) return null;
        cartesian = viewer.scene.globe.pick(ray, viewer.scene);
        isOnTerrian = true;
    }
    //地球
    if (!isOn3dtiles && isOn3dtiles && boolTerrain) {
        cartesian = viewer.scene.camera.pickEllipsoid(px, viewer.scene.globe.ellipsoid);
    }
    if (cartesian) {
        let position = transformCartesianToWGS84(cartesian);
        if (position.z < 0) {
            position.z = 0.1;
            cartesian = transformWGS84ToCartesian(position);
        }
        return cartesian;
    }
    return false
};

/** 
 * @description: 笛卡尔坐标转经纬度
 * @param cartesian cartesian3
 * @returns {Object} {x, y, z}
 */
const transformCartesianToWGS84 = (cartesian) => {
    let ellipsoid = Cesium.Ellipsoid.WGS84;
    let cartographic = ellipsoid.cartesianToCartographic(cartesian);
    const x = Cesium.Math.toDegrees(cartographic.longitude);
    const y = Cesium.Math.toDegrees(cartographic.latitude);
    const z = cartographic.height;
    return {x, y, z};
}

/** 
 * @description: 经纬度转笛卡尔坐标
 * @param position - {x, y, z}
 * @returns {Object} Cartesian3
 */
const transformWGS84ToCartesian = (position = {x, y, z}) => {
    position.z = position.z || 0;
    return position
        ? Cesium.Cartesian3.fromDegrees(
            position.x,
            position.y,
            position.z
        )
        : Cesium.Cartesian3.ZERO;
};

/** 
 * @description: 锁定视图
 * @param bool 是否锁定
*/
const lockingMap = (viewer, bool) => {
    //如果为真，则允许用户旋转相机，如果将锁定到当前视角。此标志仅适用于2D和3D
    viewer.scene.screenSpaceCameraController.enableRotate = bool;
    //如果为true，允许用户平移地图。如果为假，相机将保持锁定在当前位置。此标志仅适用于2D和Columnbus视图模式
    viewer.scene.screenSpaceCameraController.enableTranslate = bool;
    //如果为真，允许用户放大和缩小。如果为假，相机将锁定到当前距离椭圆体的当前距离
    viewer.scene.screenSpaceCameraController.enableZoom = bool;
    //如果为真，允许用户倾斜相机。如果为假，相机将锁定到当前标题。这个标志只适用于3D和哥伦布视图。
    viewer.scene.screenSpaceCameraController.enableTilt = bool;
};

/** 
 * @description: 创建贝塞尔点集
 * @param anchorpoints
 * @returns
 */
const createBezierPoints = (anchorpoints) => {
    let degrees = [];
    for (let index = 0; index < anchorpoints.length; index++) {
        const degree = transformCartesianToWGS84(anchorpoints[index]);
        degrees.push(degree)
    }
    let numpoints = 100;
    let points = [];
    for (let i = 0; i < numpoints; i++) {
        let point = computeBezierPoints(degrees, i < numpoints);
        const cartesian = transformWGS84ToCartesian(point);
        points.push(cartesian)
    }
    return points;
}

/** 
 * @description: 计算贝塞尔曲线特征点
 * @param anchorpoints
 * @param {number} t
 * @param {{x, y}}
 * @private
*/
const computeBezierPoints =(anchorpoints, t) => {
    let x = 0, y = 0;
    let Binomial_coefficient = computeBinomial(anchorpoints);
    for (let j = 0; j < anchorpoints.length; j++) {
        let tempPoint = anchorpoints[j];
        const coefficient = 
            Math.pow(1-t, anchorpoints.length-1-j) *
            Math.pow(t, j) *
            Binomial_coefficient([j]);
        x += tempPoint.x * coefficient;
        y += tempPoint.y * coefficient;
    }
    return {x, y};
}

/** 
 * @description: 计算二项式系数
 * @param anchorpoints
 * @returns {Array}
 * @private
*/
const computeBinomial = (anchorpoints) => {
    let lens = anchorpoints.length;
    let Binomial_coefficient = [];
    Binomial_coefficient.push(1);
    for (let k = 1; k < lens - 1; k++) {
        let cs = 1, bcs = 1;
        for (let m = 0; m < k; m++) {
            cs = cs * (lens - 1 -m);
            bcs = bcs * (k -m);
        }
        Binomial_coefficient.push(cs / bcs);
    }
    Binomial_coefficient.push(1);
    return Binomial_coefficient;
};

export {
    newSessionid,
    getCartesian3FromPX,
    lockingMap,
    transformCartesianToWGS84,
    transformWGS84ToCartesian,
    createBezierPoints,
}