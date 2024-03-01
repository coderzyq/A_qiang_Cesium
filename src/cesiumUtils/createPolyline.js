/**
 * @description 绘制折线
 * @author A_qiang
 */
import * as Cesium from "cesium"
import { newSessionId, getCartesian3FromPX } from "@/cesiumUtils/plotCommon";
const CreatePolyline = (options) => {
    const viewer = options.viewer
    const handler = viewer.handler
    const id = options.id || newSessionId()
    const color = options.color ? Cesium.Color.fromCssColorString(options.color) : Cesium.Color.BLUE.withAlpha(0.9);
    const onground = options.onground || true
    let resultList = []
    if (viewer.entities.getById(id)) throw new Error("id is an unique value")
    window.toolTip = "左键点击开始绘制";
    let anchorpoints = [];
    let callback = undefined
    let polyline = undefined
    //左键开始点击事件
    handler.setInputAction(event => {
        window.toolTip = "左键添加点，右键撤销，左键双击结束绘制"
        let pixPos = event.position;
        let cartesian = getCartesian3FromPX(viewer, pixPos)
        if (anchorpoints.length === 0) {
            anchorpoints.push(cartesian)
            polyline = viewer.entities.add({
                name: "Polyline",
                id: id,
                polyline: {
                    positions: new Cesium.CallbackProperty(function () {
                        return anchorpoints
                    }, false),
                    width: 25,
                    material: new Cesium.PolylineGlowMaterialProperty({
                        glowPower: 0.1,
                        color: color
                    }),
                    clampToGround: onground
                }
            })
            polyline.GeoType = "Polyline"; //记录对象的类型，用户后续编辑等操作
            polyline.Editable = true; //代表当前对象可编辑，false状态下不可编辑
        }
        anchorpoints.push(cartesian)
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK) 
    //鼠标移动事件
    handler.setInputAction((movement) => {
        console.log("鼠标移动事件检测：------创建折线------");
        let endPos = movement.endPositions
        if (Cesium.defined(polyline)) {
            anchorpoints.pop()
            let cartesian = getCartesian3FromPX(viewer, endPos)
            anchorpoints.push(cartesian)
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
    //左键双击事件
    handler.setInputAction((event) => {
        anchorpoints.pop()
        anchorpoints.pop() //因为是双击结束，所以要pop两次，一次是move的结果，一次是单击结果
        polyline.PottingPoint = Cesium.clone(polyline.polyline.positions.getValue(), true) //记录对象的节点数据，用户后续编辑等操作
        resultList.push(polyline)
        handler.destroy()
        if (callback && typeof callback == "function") callback(polyline)
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)
    //右键按下事件
    handler.setInputAction(() => {
        anchorpoints.pop()
    }, Cesium.ScreenSpaceEventType.RIGHT_DOWN)
}
export default CreatePolyline
