import * as Cesium from "cesium"
class CreateFrustum {
    constructor(options) {
        this.viewer = options.viewer
        this.orientation = options.orientation;
        this.fov = options.fov || 30;
        this.near = options.near || 10;
        this.far = options.far || 100;
        this.aspectRatio = options.aspectRatio;
        this.position = options.position
        this.add();
    }

    // 创建视锥体和轮廓线
    add() {
        this.clear()
        this.addFrustum()
        this.addOutline()
    }

    // 清除视锥体和轮廓线
    clear(){
        this.clearFrustum();
        this.clearOutline();
    }

    //更新视锥体的姿态
    updateOrientation(position, orientation) {
        this.position = position
        this.orientation = orientation
        this.add()
    }

    //清除视锥体
    clearFrustum() {
        if (this.frustumPrimitive) {
            this.viewer.scene.primitives.remove(this.frustumPrimitive)
            this.frustumPrimitive = null
        }
    }

    // 清除轮廓线
    clearOutline() {
        if (this.outlinePrimitive) {
            this.viewer.scene.primitives.remove(this.outlinePrimitive)
            this.outlinePrimitive = null
        }
    }

    //创建视锥体
    addFrustum() {
        let frustum = new Cesium.PerspectiveFrustum({
            //视场角
            fov: Cesium.Math.toRadians(this.fov),
            //近裁剪面
            near: this.near,
            //远裁剪面
            far: this.far,
            //视锥体的宽高比
            aspectRatio: this.aspectRatio
        })
        let geometry = new Cesium.FrustumGeometry({
            frustum: frustum,
            origin: this.position,
            orientation: this.orientation,
            vertexFormat: Cesium.VertexFormat.POSITION_ONLY
        })
        let instance = new Cesium.GeometryInstance({
            geometry: geometry,
            attributes: {
                color: Cesium.ColorGeometryInstanceAttribute.fromColor(new Cesium.Color(0.0, 1.0, 0.0, 0.5))
            }
        })
        let primitive = new Cesium.Primitive({
            geometryInstances: instance,
            appearance: new Cesium.PerInstanceColorAppearance({
                closed: true,
                flat: true
            }),
            asynchronous: false
        })
        this.frustumPrimitive = this.viewer.scene.primitives.add(primitive)
    }
    
    //创建轮廓线
    addOutline() {
        let frustum = new Cesium.PerspectiveFrustum({
            fov: Cesium.Math.toRadians(this.fov),
            aspectRatio: this.aspectRatio,
            near: this.near,
            far: this.far
        })
        let geometry = new Cesium.FrustumOutlineGeometry({
            frustum: frustum,
            origin: this.position,
            orientation: this.orientation,
            vertexFormat: Cesium.VertexFormat.POSITION_ONLY
        })
        let instance = new Cesium.GeometryInstance({
            geometry: geometry,
            attributes: {
                color: new Cesium.ColorGeometryInstanceAttribute.fromColor(new Cesium.Color(1.0, 1.0, 0.0, 1.0))
            }
        })
        let primitive = new Cesium.Primitive({
            geometryInstances: instance,
            appearance: new Cesium.PerInstanceColorAppearance({
                closed: true,
                flat: true
            }),
            asynchronous: false
        })
        this.outlinePrimitive = this.viewer.scene.primitives.add(primitive)
    }
}

export default CreateFrustum;

