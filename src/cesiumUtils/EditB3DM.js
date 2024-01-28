/*
 * @Description: 编辑3Dtiles类
 * @Author: A_qiang
 * @Date: 2023-07-24 20:27:26
 * @LastEditTime: 2023-07-31 19:31:18
 * @LastEditors: coderqiang
 */
/** 
 * @description: 编辑 3Dtiles
*/
import * as Cesium from "cesium";
import CoordTransform from "@/cesiumUtils/coordinate/CoordTransform"

class EditB3DM {
  /**
   * 3dtiles模型编辑
   * @param {Viewer} viewer
   * @param {Cesium.Cesium3DTile} b3dm 3dtiles
   * @param {number} d 高度移动单位长度
   * @param {number} d 移动单位角度
   */
  constructor(viewer, b3dm, d, r) {
    if (!viewer) throw new Error("viewer is required!");
    this._viewer = viewer;
    this._b3dm = b3dm;
    this._handler = undefined;
    this._defaultWidth = 15; //默认指示线的宽度
    this._currentPick = undefined;
    this._dStep = d;
    this._rStep = r;
    this._params = {
      tx: 0, //模型中心X轴坐标（经度，单位：十进制度）
      ty: 0, //模型中心Y轴坐标（纬度，单位：十进制度）
      tz: 0, //模型中心Z轴坐标（高程，单位：米）
      rx: 0, //X轴（经度）方向旋转角度（单位：度）
      ry: 0, //Y轴（纬度）方向旋转角度（单位：度）
      rz: 0, //Z轴（高程）方向旋转角度（单位：度）
    };
    this._coordArrows = undefined; //平移指示器
    this._coordCircle = []; //旋转指示器
    this.initEvent();
  }
  get params() {
    return this._params;
  }
  /**
   * @description 初始化3dtiles参数
   * @returns originDegree 原点位置, length 长度
   */
  initParam() {
    //移除所有指示器
    this.removeAllTools();
    let b3dm = this._b3dm;
    const viewer = this._viewer;
    const length = b3dm.boundingSphere.radius / 3;
    const originDegree = CoordTransform.transformCartesianToWGS84(
      b3dm.boundingSphere.center
    );
    this._params.tx = originDegree.lng;
    this._params.ty = originDegree.lat;
    this._params.tz = originDegree.alt;
    return { originDegree, length };
  }
  /**
   * 开始旋转编辑
   */
  editRotation() {
    const option = this.initParam();
    //绘制旋转指示器
    this.createCircle(
      option.originDegree.lng,
      option.originDegree.lat,
      option.originDegree.alt,
      option.length
    );
  }
  /**
   * @description 绘制旋转指示器
   * @param {number} lng 经度 单位：度
   * @param {number} lat 纬度 单位：度
   * @param {number} height 高度 单位：米
   * @param {number} radius 半径 单位：米
   */
  createCircle(lng, lat, height, radius) {
    const position = [];
    for (let i = 0; i <= 360; i += 3) {
      const sin = Math.sin(Cesium.Math.toRadians(i));
      const cos = Math.cos(Cesium.Math.toRadians(i));
      const x = radius * cos;
      const y = radius * sin;
      position.push(new Cesium.Cartesian3(x, y, 0));
    }
    const matrix = Cesium.Transforms.eastNorthUpToFixedFrame(
      new Cesium.Cartesian3.fromDegrees(lng, lat, height)
    );
    //绕Z轴
    const axisSphereZ = this.createAxisSphere(
      "model_edit_zCircle",
      position,
      matrix,
      Cesium.Color.RED
    );
    this._viewer.scene.primitives.add(axisSphereZ);

    //绕Y轴
    const axisSphereY = this.createAxisSphere(
      "model_edit_yCircle",
      position,
      matrix,
      Cesium.Color.GREEN
    );
    this._viewer.scene.primitives.add(axisSphereY);
    let my = Cesium.Matrix3.fromRotationY(Cesium.Math.toRadians(90));
    let rotationY = Cesium.Matrix4.fromRotationTranslation(my);
    Cesium.Matrix4.multiply(
      axisSphereY.geometryInstances.modelMatrix,
      rotationY,
      axisSphereY.geometryInstances.modelMatrix
    );

    //绕X轴
    const axisSphereX = this.createAxisSphere(
      "model_edit_xCircle",
      position,
      matrix,
      Cesium.Color.BLUE
    );
    this._viewer.scene.primitives.add(axisSphereX);
    let mx = Cesium.Matrix3.fromRotationX(Cesium.Math.toRadians(90));
    let rotationX = Cesium.Matrix4.fromRotationTranslation(mx);
    Cesium.Matrix4.multiply(
      axisSphereX.geometryInstances.modelMatrix,
      rotationX,
      axisSphereX.geometryInstances.modelMatrix
    );
  }
  /**
   * @description 绘制旋转转轴
   * @param {string} name 转轴的名字
   * @param {Array} position 转轴的位置
   * @param {Cesium.Matrix4} matrix 东北坐标系矩阵
   * @param {Cesium.Color} color 转轴颜色
   * @returns
   */
  createAxisSphere(name, position, matrix, color) {
    let result = new Cesium.Primitive({
      geometryInstances: new Cesium.GeometryInstance({
        id: name,
        geometry: new Cesium.PolylineGeometry({
          positions: position,
          width: 5,
        }),
        attributes: {
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(color),
        },
      }),
      releaseGeometryInstances: false,
      appearance: new Cesium.PolylineColorAppearance({
        translucent: false,
      }),
      modelMatrix: matrix,
    });
    result._name = name;
    this._coordCircle.push(result);
    return result;
  }
  /**
   * 开始编辑平移
   */
  editTranslation() {
    const option = this.initParam();
    const length = option.length;
    let translateCartesian = new Cesium.Cartesian3(length, length, length); //单位为米
    let originPos = JSON.parse(
      JSON.stringify(this._b3dm.boundingSphere.center)
    );
    let targetDegree = this.getTransPostion(originPos, translateCartesian);
    //绘制箭头
    this.initLineArrow(option.originDegree, targetDegree, length);
  }
  /**
   * @description 更新箭头位置
   * @param {Cesium3DTile} b3dm 3dtiles
   */
  updateLineArrow(b3dm) {
    //要删除上一步的箭头
    this.removeCoordArrows();
    const viewer = this._viewer;
    const length = b3dm.boundingSphere.radius / 3;
    const originDegree = CoordTransform.transformCartesianToWGS84(
      b3dm.boundingSphere.center
    );
    let translateCartesian = new Cesium.Cartesian3(length, length, length); //单位为米
    let originPos = JSON.parse(JSON.stringify(b3dm.boundingSphere.center));
    let targetDegree = this.getTransPostion(originPos, translateCartesian);
    this.initLineArrow(originDegree, targetDegree, length);
  }
  //初始化鼠标事件（移动，按下，抬起）
  initEvent() {
    const $this = this;
    const viewer = this._viewer;
    $this._handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    //左键按下
    $this._handler.setInputAction(function (event) {
      let pick = viewer.scene.pick(event.position); //获取的pick对象
      if (
        pick &&
        pick.primitive &&
        pick.primitive._name &&
        pick.primitive._name.indexOf("model_edit") != -1
      ) {
        viewer.scene.screenSpaceCameraController.enableRotate = false; //锁定相机
        //高亮加粗显示
        $this._currentPick = pick.primitive;
        $this._currentPick.width = 25;
        let downPos = viewer.scene.camera.pickEllipsoid(
          event.position,
          viewer.scene.globe.ellipsoid
        );
        let _tx = 0,
          _ty = 0,
          _tz = 0; //xyz方向的平移量（经纬度，经纬度，米）
        let _rx = 0,
          _ry = 0,
          _rz = 0; //xyz方向的旋转量（度）
        // 防止点击到地球之外报错，加个判断
        if (downPos && Cesium.defined(downPos)) {
          _tx = 0;
          _ty = 0;
          _tz = 0;
          _rx = 0;
          _ry = 0;
          _rz = 0;
          const downDegree = CoordTransform.transformCartesianToWGS84(downPos);
          //鼠标移动
          $this._handler.setInputAction(function (movement) {
            let endPos = viewer.scene.camera.pickEllipsoid(
              movement.endPosition,
              viewer.scene.globe.ellipsoid
            );
            const endDegree = CoordTransform.transformCartesianToWGS84(endPos);
            const _yPix = movement.endPosition.y - event.position.y;
            const _xPix = movement.endPosition.x - event.position.x;
            switch ($this._currentPick._name) {
              case "model_edit_xArrow":
                //移动停止后的经度 - 按下时的经度
                _tx = endDegree.lng - downDegree.lng;
                break;
              case "model_edit_yArrow":
                //移动停止后的纬度 - 按下时的纬度
                _ty = endDegree.lat - downDegree.lat;
                break;
              case "model_edit_zArrow":
                //因为cesium，鼠标移动没有高度信息，所以通过移动位置代替（以下同理）
                _tz = -$this._dStep * _yPix;
                break;
              case "model_edit_xCircle":
                _rx = $this._rStep * _yPix;
                break;
              case "model_edit_yCircle":
                _ry = $this._rStep * _xPix;
                break;
              case "model_edit_zCircle":
                _rz = $this._rStep * _xPix;
                break;
            }
            //更新模型位置
            $this.updateModel($this._params, _tx, _ty, _tz, _rx, _ry, _rz);
          }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        }

        //鼠标释放左键
        $this._handler.setInputAction(function (event) {
          viewer.scene.screenSpaceCameraController.enableRotate = true; // 取消相机锁定
          $this._currentPick.width = $this._defaultWidth;
          $this._currentPick = undefined;
          //更新编辑之后的模型位置参数
          $this._params.tx += _tx;
          $this._params.ty += _ty;
          $this._params.tz += _tz;
          $this._params.rx += _rx;
          $this._params.ry += _ry;
          $this._params.rz += _rz;
          //为viewer绑定LEFT_UP事件监听器（执行函数，监听的事件）
          $this._handler.removeInputAction(
            Cesium.ScreenSpaceEventType.MOUSE_MOVE
          ); // 解除viewer的LEFT_UP事件监听器
          $this._handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP); // 解除viewer的LEFT_UP事件监听器
        }, Cesium.ScreenSpaceEventType.LEFT_UP);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
  }
  //更新模型位置
  updateModel(params, _tx, _ty, _tz, _rx, _ry, _rz) {
    let mx = Cesium.Matrix3.fromRotationX(
      Cesium.Math.toRadians(params.rx + _rx)
    );
    let my = Cesium.Matrix3.fromRotationY(
      Cesium.Math.toRadians(params.ry + _ry)
    );
    let mz = Cesium.Matrix3.fromRotationZ(
      Cesium.Math.toRadians(params.rz + _rz)
    );
    let rotationX = Cesium.Matrix4.fromRotationTranslation(mx);
    let rotationY = Cesium.Matrix4.fromRotationTranslation(my);
    let rotationZ = Cesium.Matrix4.fromRotationTranslation(mz);
    //平移
    let position = Cesium.Cartesian3.fromDegrees(
      params.tx + _tx,
      params.ty + _ty,
      params.tz + _tz
    );
    let m = Cesium.Transforms.eastNorthUpToFixedFrame(position);
    //旋转、平移矩阵相乘
    Cesium.Matrix4.multiply(m, rotationX, m);
    Cesium.Matrix4.multiply(m, rotationY, m);
    Cesium.Matrix4.multiply(m, rotationZ, m);
    //赋值给tileset
    this._b3dm._root.transform = m;

    this._coordArrows && this.updateLineArrow(this._b3dm); //如果是平移操作，需要更新平移指示器
  }
  //绘制箭头
  /**
   * @description 绘制箭头
   * @param {object} originDegree 初始点坐标点
   * @param {object} targetDegree 目标点坐标点
   */
  initLineArrow(originDegree, targetDegree, length) {
    const arrows = new Cesium.PolylineCollection();
    //坐标系方向存放原始坐标和目的点坐标
    const xPos = [
      originDegree.lng,
      originDegree.lat,
      originDegree.alt,
      targetDegree.lng,
      originDegree.lat,
      originDegree.alt,
    ];
    const xArrow = this.drawArrow(
      arrows,
      "model_edit_xArrow",
      xPos,
      Cesium.Color.GREEN
    );
    const yPos = [
      originDegree.lng,
      originDegree.lat,
      originDegree.alt,
      originDegree.lng,
      targetDegree.lat,
      originDegree.alt,
    ];
    const yArrow = this.drawArrow(
      arrows,
      "model_edit_yArrow",
      yPos,
      Cesium.Color.BLUE
    );
    const zPos = [
      originDegree.lng,
      originDegree.lat,
      originDegree.alt,
      originDegree.lng,
      originDegree.lat,
      targetDegree.alt,
    ];
    const zArrow = this.drawArrow(
      arrows,
      "model_edit_zArrow",
      zPos,
      Cesium.Color.RED
    );
    this._coordArrows = this._viewer.scene.primitives.add(arrows);
    this._coordArrows._name = "CoordAxis";
  }
  /**
   * @description 绘制空间坐标轴（移动指示器）
   * @param {Cesium.Collection} arrows 坐标轴集合
   * @param {string} name xyz轴名称
   * @param {Array} positions 坐标系位置
   * @param {Cesium.Color} color 坐标系颜色
   */
  drawArrow(arrows, name, positions, color) {
    const arrow = arrows.add({
      positions: Cesium.Cartesian3.fromDegreesArrayHeights(positions),
      width: this._defaultWidth,
      material: Cesium.Material.fromType(Cesium.Material.PolylineArrowType, {
        color: color,
      }),
    });
    arrow._name = name;
  }
  //根据平移距离获取目标点
  getTransPostion(originPosition, translateCartesian) {
    let transform = Cesium.Transforms.eastNorthUpToFixedFrame(originPosition); //东-北-上参考系构造出4*4的矩阵
    let m = new Cesium.Matrix4();
    Cesium.Matrix4.setTranslation(
      Cesium.Matrix4.IDENTITY,
      translateCartesian,
      m
    ); //构造平移矩阵
    let modelMatrix = Cesium.Matrix4.multiply(transform, m, transform); //将当前位置矩阵乘以平移矩阵得到平移之后的位置矩阵
    Cesium.Matrix4.getTranslation(modelMatrix, originPosition); //从位置矩阵中取出坐标信息
    const result = CoordTransform.transformCartesianToWGS84(originPosition);
    return result;
  }
  //删除箭头集合
  removeCoordArrows() {
    if (this._coordArrows) {
      this._viewer.scene.primitives.remove(this._coordArrows);
      this._coordArrows = undefined;
    }
  }
  removeCoordCircle() {
    this._coordCircle.forEach((element) => {
      this._viewer.scene.primitives.remove(element);
    });
    this._coordCircle = [];
  }
  removeAllTools() {
    this.removeCoordArrows();
    this.removeCoordCircle();
  }
  /**
   * 关闭/注销
   */
  destroy() {
    this.removeAllTools();
    this._handler.destroy();
  }
}
export default EditB3DM