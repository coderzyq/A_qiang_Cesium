import * as Cesium from "cesium";
import CoorTransform from "./coordinate/CoordTransform";

/**
 * gltf模型编辑
 * @param {Viewer} viewer - 三维对象
 * @param {object} gltf - 模型对象
 */
class EditGltf {
  constructor(viewer, gltf, d, r) {
    if (!viewer) throw new Error("viewer is required");
    this._viewer = viewer;
    this._gltf = gltf;
    this._hanlder = undefined;
    this._defaultWidth = 15; //默认指示线的宽度
    this._currentPick = undefined;
    this._dStep = d;
    this._rStep = r;
    this._params = {
      tx: 0, //模型中心X轴坐标
      ty: 0, //模型中心Y轴坐标
      tx: 0, //模型中心Z轴坐标
      heading: 0,
      pitch: 0,
      roll: 0,
      scale: 1,
    };
    this._coordArrows = undefined; //平移指示器
    this._coordCircle = []; //旋转指示器
    this.initEvent();
  }
  get param() {
    return this._params;
  }
  //初始化状态
  initParam(){
    this.removeAllTools();
    let gltf = this._gltf;
    const viewer = this._viewer;
    const length = (gltf.scale * gltf._boundingSphere.radius) / 0.8;
    const originDegree = this.returnGltfCenter(gltf);
    const originRotation = this.returnGltfRotation(gltf);
    this._params.tx = originDegree.lng;
    this._params.ty = originDegree.lat;
    this._params.tz = originDegree.alt;
    this._params.heading = originDegree.heading;
    this._params.pitch = originDegree.pitch;
    this._params.roll = originDegree.roll;
    return {originDegree, length};
  }
  
  returnGltfRotation(gltf) {
    let modelMatrix = gltf.modelMatrix;
    let m1 = Cesium.Transforms.eastNorthUpToFixedFrame(
        Cesium.Matrix4.getTranslation(modelMatrix, new Cesium.Cartesian3()),
        Cesium.Ellipsoid.WGS84,
        new Cesium.Matrix4()
    );
    let m3 = Cesium.Matrix4.multiply(
        Cesium.Matrix4.inverse(m1, new Cesium.Matrix4()),
        modelMatrix,
        new Cesium.Matrix4()
    );
    let mat3 = Cesium.Matrix4.getMatrix3(m3, new Cesium.Matrix3());
    let q = Cesium.Quaternion.fromRotationMatrix(mat3);
    let hpr = Cesium.HeadingPitchRoll.fromQuaternion(q);
    return hpr;
  }
  
  returnGltfCenter(gltf) {
    let gltfMatrix = gltf.modelMatrix;
    let gltfCenter =new Cesium.Cartesian3(gltfMatrix[12], gltfMatrix[13], gltfMatrix[14]);
    return gltfCenter;
  }

  returnGltfCenterDegrees(gltf) {
    let gltfCenter = this.returnGltfCenter(gltf);
    const originDegree = CoorTransform.transformCartesianToWGS84(this._viewer, gltfCenter);
    return originDegree;
  }

  //初始化鼠标事件（移动、按下、抬起）
  initEvent() {
    const $this = this;
    const viewer = this._viewer;
    $this._hanlder = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    $this._hanlder.setInputAction(function (event) {
      let pick = viewer.scene.pick(event.position); //获取的pick对象
      if (
        pick &&
        pick.primitive &&
        pick.primitive._name &&
        pick.primitive._name.indexOf("model_edit") != -1
      ) {
        viewer.scene.ScreenSpaceCameraController.enableRotate = false; //锁定相机
        //高亮加粗显示
        $this._currentPick = pick.primitive;
        $this._currentPick.width = 25;
        let downPos = viewer.scene.camera.pickEllipsoid(
          event.position,
          viewer.scene.globe.elliposid
        );
        let downMatrix = JSON.parse(JSON.stringify($this._gltf.modelMatrix));
        let _tx = 0,
          _ty = 0,
          _tz = 0; //xyz方向的平移量（经纬度，经纬度，米）
        let _rx = 0,
          _ry = 0,
          _rz = 0; //xyz方向的旋转量（度）
        //防止点击到地球之外报错，加个判断
        if (downPos && Cesium.defined(downPos)) {
          (_tx = 0), (_ty = 0), (_tz = 0), (_rx = 0), (_ry = 0), (_rz = 0);
          const downDegree = CoorTransform.transformCartesianToWGS84(
            viewer,
            downPos
          );
          $this._hanlder.setInputAction(function (movement) {
            let endPos = viewer.scene.camera.pickEllipsoid(
              movement.endPosition,
              viewer.scene.globe.elliposid
            );
            const endDegree = CoorTransform.transformCartesianToWGS84(
              viewer,
              endPos
            );
            const _yPix = movement.endPosition.y - event.position.y;
            const _xPix = movement.endPosition.x - event.position.x;
            switch ($this._currentPick._name) {
              case "model_edit_xArrow":
                _tx = endDegree.lng - downDegree.lng;
                break;
              case "model_edit_yArrow":
                _ty = endDegree.lat - downDegree.lat;
              case "model_edit_zArrow":
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
            $this.updateModel(
              $this._params,
              _tx,
              _ty,
              _tz,
              _rx,
              _ry,
              _rz,
              modelMatrix
            );
          }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        }
        $this._hanlder.setInputAction(function (event) {
          viewer.scene.ScreenSpaceCameraController.enableRotate = true;
          $this._currentPick.width = $this._defaultWidth;
          $this._currentPick = undefined;
          $this._params.tx += _tx;
          $this._params.ty += _ty;
          $this._params.tz += _tz;
          let hpr = $this.returnGltfRotation($this._gltf);
          $this._params.heading += hpr.heading;
          $this._params.pitch += hpr.pitch;
          $this._params.roll += hpr.roll;
          $this._hanlder.removeInputAction(
            Cesium.ScreenSpaceEventType.MOUSE_MOVE
          );
          $this._hanlder.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
        }, Cesium.ScreenSpaceEventType.LEFT_UP);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
  }
  //更新模型位置
  updateModel(params, _tx, _ty, _tz, _rx, _ry, _rz, modelMatrix) {
    if (this._coordArrows) {
      let headingPitchRoll = new Cesium.HeadingPitchRoll(
        params.heading,
        params.pitch,
        params.roll
      );
      let cartesian = new Cesium.Cartesian3.fromDegrees(
        params.tx + _tx,
        params.ty + _tx,
        params,
        tz + _tz
      );
      let m = Cesium.Transforms.headingPitchRollToFixedFrame(
        cartesian,
        headingPitchRoll,
        Cesium.Ellipsoid.WGS84,
        Cesium.Transforms.eastNorthUpToFixedFrame,
        new Cesium.Matrix4()
      );
      this._gltf.modelMatrix = m;
      //如果是平移操作，需要更新平移指示器
      this.updateLineArrow(this._gltf, {
        lng: params.tx + _tx,
        lat: params.ty + _ty,
        alt: params.tz + _tz,
      });
    }
    if (this._coordCircle) {
      let rotationM = undefined;
      if (_rx != 0) {
        rotationM = Cesium.Matrix3.fromRotationX(Cesium.Math.toRadians(_rx));
      } else if (_ry != 0) {
        rotationM = Cesium.Matrix3.fromRotationY(Cesium.Math.toRadians(_ry));
      } else if (_rz != 0) {
        rotationM = Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(_rz));
      }
      this._gltf.modelMatrix = rotationM
        ? Cesium.Matrix4.multiplyByMatrix3(
            downMatrix,
            rotationM,
            new Cesium.Matrix4()
          )
        : this._gltf.modelMatrix; //计算矩阵的变换矩阵（在原变换中，累加变换）
    }
  }
  //绘制箭头
  initLineArrow(originDegree, targetDegree, length) {
    const arrows = new Cesium.PolylineCollection();
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
      "model_edit_xArrows",
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
      "model_edit_yArrows",
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
      "model_edit_zArrows",
      zPos,
      Cesium.Color.RED
    );
    this._coordArrows = this._viewer.scene.primitives.add(arrows);
    this._coordArrows._name = "CoordAxis";
  }
  drawArrow(arrows, name, positions, color) {
    const arrow = arrows.add({
      positions: Cesium.Cartesian3.fromDegreesArrayHeights(positions),
      width: this._defaultWidth,
      material: Cesium.Material.fromType(Cesium.Material.PolylineArrowType, {
        color: color,
      }),
    });
    arrow._name = name;
    return arrow;
  }
  /**
   * 开始旋转编辑
   */
  editRotation() {
    const { originDegree, length } = this.initParam();
    this.createCircle(
      originDegree.lng,
      originDegree.lat,
      originDegree.alt,
      length
    );
  }
  createCircle(lon, lat, height, radius) {
    const positions = [];
    for (let i = 0; i <= 360; i++) {
      const sin = Math.sin(Cesium.Math.toRadians(i));
      const cos = Math.cos(Cesium.Math.toRadians(i));
      const x = radius * cos;
      const y = radius * sin;
      positions.push(new Cesium.Cartesian3(x, y, 0));
    }
    const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
      new Cesium.Cartesian3.fromDegrees(lon, lat, height)
    );

    //绕Z轴
    const axisSphereZ = this.createAxisSphere(
      "model_edit_zCircle",
      positions,
      modelMatrix,
      Cesium.Color.RED
    );
    this._viewer.scene.primitives.add(axisSphereZ);

    //绕Y轴
    const axisSphereY = this.createAxisSphere(
      "model_edit_yCircle",
      positions,
      modelMatrix,
      Cesium.Color.BLUE
    );
    this._viewer.scene.primitives.add(axisSphereY);
    let my = Cesium.Cartesian3.fromRotationY(Cesium.Math.toRadians(90));
    let rotationY = Cesium.Matrix4.fromRotationTranslation(my);
    Cesium.Matrix4.multiply(
      axisSphereY.geometryInstances.modelMatrix,
      rotationY,
      axisSphereY.geometryInstances.modelMatrix
    );

    //绕X轴
    const axisSphereX = this.createAxisSphere(
      "model_edit_xCircle",
      positions,
      modelMatrix,
      Cesium.Color.GREEN
    );
    this._viewer.scene.primitives.add(axisSphereX);
    let mx = Cesium.Cartesian3.fromRotationX(Cesium.Math.toRadians(90));
    let rotationX = Cesium.Matrix4.fromRotationTranslation(mx);
    Cesium.Matrix4.multiply(
      axisSphereX.geometryInstances.modelMatrix,
      rotationX,
      axisSphereX.geometryInstances.modelMatrix
    );
  }
  createAxisSphere(name, positions, modelMatrix, color) {
    let result = new Cesium.Primitive({
      geometryInstances: new Cesium.GeometryInstance({
        id: name,
        geometry: new Cesium.PolygonGeometry({
          position: positions,
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
      modelMatrix: modelMatrix,
    });
    result._name = name;
    this._coordCircle(result);
    return result;
  }
  //修改模型的透明度和可选择性
  onEdit(bool) {
    this._gltf.color = this._gltf.color.withAlpha(bool ? 0.5 : 1);
    this._gltf._allowPicking = !bool;
  }
  /**
   * 开始编辑平移
   */
  editTranslation() {
    const option = this.initParam();
    this.onEdit(true);
    const length = option.length;
    let translateCartesian = new Cesium.Cartesian3(length, length, length);
    let originPos = this.returnGltfCenter(this._gltf);
    let targetDegree = this.getTransPosition(originPos, translateCartesian);
    this.initLineArrow(option.originDegree, targetDegree, length);
  }
  updateLineArrow(gltf, originDegree) {
    this.removeCoordArrows();
    const viewer = this._viewer;
    const length = (gltf.scale * gltf._boundingSphere.radius) / 0.8;
    let translateCartesian = new Cesium.Cartesian3(length, length, length);
    let originPos = this.returnGltfCenter(this._gltf);
    let targetDegree = this.getTransPosition(originPos, translateCartesian);
    this.initLineArrow(originDegree, targetDegree, length);
  }
  /**
   * 根据平移距离获取目标点
   */
  getTransPosition(originPosition, translateCartesian) {
    let transform = Cesium.Transforms.eastNorthUpToFixedFrame(originPosition); //东-北-上参考坐标系
    let m = new Cesium.Matrix4();
    Cesium.Matrix4.setTranslation(
      Cesium.Matrix4.IDENTITY,
      translateCartesian,
      m
    );
    //构造平移矩阵
    let modelMatrix = Cesium.Matrix4.multiply(transform, m, transform); //将当前位置矩阵乘以平移矩阵得到平移之后的位置矩阵
    Cesium.Matrix4.getTranslation(modelMatrix, originPosition); //从位置矩阵中取出坐标信息
    const result = CoorTransform.transformCartesianToWGS84(
      this._viewer,
      originPosition
    );
    return result;
  }
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
   * 关闭/销毁
   */
  destory() {
    this._gltf.currentPosition = [
      this._params.tx,
      this._params.ty,
      this._params.tz,
    ];
    this.removeAllTools();
    this._hanlder.destroy();
    this.onEdit(false);
  }
}

export default EditGltf