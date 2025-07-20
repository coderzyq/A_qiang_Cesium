/**
 * 1. 创建一个Picking类，设置picking的相关信息
 * 2. 使用picking进行离屏渲染
 * 3. 从离屏渲染结果中获取结果
 */

import * as Cesium from "cesium";
const pickTilesetPassState = new Cesium.Cesium3DTilePassState({
  pass: Cesium.Cesium3DTilePass.PICK,
});
const scratchRectangle = new Cesium.BoundingRectangle(0, 0, 3, 3);
const packedDepthScale = new Cesium.Cartesian4(
  1.0,
  1.0 / 255.0,
  1.0 / 65025.0,
  1.0 / 16581375.0
);
export const getDepth1 = (viewer) => {
  //创建深度图解析范围
  const positions = Cesium.Cartesian3.fromDegreesArrayHeights(
    [].concat.apply(
      [],
      [
        [110.91995822563997, 30.018123228872216, 966.0229851512511],
        [110.88602280929696, 30.02746264223286, 992.25539021267],
        [110.87475288470748, 30.00061781074165, 673.7384986001304],
        [110.88525405115537, 29.97371359878412, 260.02837273046464],
        [110.89486388986987, 29.962314482553314, 639.5892410593838],
        [110.91982562243348, 29.973771216309125, 722.7884451776592],
        [110.92939046684434, 30.003520348332533, 1077.5538168551436],
      ]
    )
  );
  const entity = new Cesium.Entity({
    polygon: {
      hierarchy: new Cesium.PolygonHierarchy(positions),
      material: Cesium.Color.BLUE.withAlpha(0.5),
    },
  });
  viewer.entities.add(entity);
  viewer.zoomTo(entity);

  
    //创建Picking类的离屏渲染相机
  //计算这个范围的四至，形成一个盒子，这个盒子即是我们的视角
  const boundingRectangles = Cesium.BoundingRectangle.fromRectangle(
    Cesium.Rectangle.fromCartesianArray(positions)
  );
  const range = Math.max(boundingRectangles.width, boundingRectangles.height); //宽高的最大值

  const offscreenCamera = createOffscreenCamera(positions, viewer, range);

  // const picking = createPicking(viewer, offscreenCamera);
  const picking = new Cesium.Picking(viewer.scene);
  const view = picking._pickOffscreenView;
  const boundingRectangle = new Cesium.BoundingRectangle(0, 0, 1024, 1024);
  view.viewport = boundingRectangle;
  view.passState.viewport = boundingRectangle;
  view.camera = offscreenCamera;
  console.log(picking);
  // viewer.camera = offscreenCamera;
setTimeout(() => {
  const positionsDepth = offscreenRender(
    viewer,
    offscreenCamera,
    picking,
    range
  );
  // pointIsInPolygon(positionsDepth, )
  //将结果positions渲染出来
  const pointPrimitives = viewer.scene.primitives.add(
    new Cesium.PointPrimitiveCollection()
  );
  console.log(positionsDepth);
  positionsDepth.forEach((position) => {
    pointPrimitives.add({
      pixelSize: 5,
      color: Cesium.Color.GREEN,
      position,
    });
  });
  },2000)
};

//一般使用正交相机，将相机置于盒子的上空
const createOffscreenCamera = (positions, viewer, range) => {
  //创建相机（正交投影）
  const offscreenCamera = new Cesium.Camera(viewer.scene);
  const n = positions.length;
  let centerPosition = new Cesium.Cartesian3();
  positions.forEach((p) => {
    centerPosition = Cesium.Cartesian3.add(centerPosition, p, centerPosition);
  });
  centerPosition = Cesium.Cartesian3.multiplyByScalar(
    centerPosition,
    1 / n,
    centerPosition
  ); //中心点
  //获取中心点的法线
  const normal = Cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(centerPosition);
  //中心点向上平移5000米
  centerPosition = Cesium.Cartesian3.add(
    centerPosition,
    Cesium.Cartesian3.multiplyByScalar(normal, 5000, new Cesium.Cartesian3()),
    centerPosition
  );
  offscreenCamera.position = centerPosition;
  //相机方向 从上往下看
  offscreenCamera.direction = Cesium.Cartesian3.negate(normal, normal);
  //设置相机上方
  const d = Cesium.Cartographic.fromCartesian(centerPosition);
  let up = Cesium.Cartesian3.subtract(
    Cesium.Cartesian3.fromRadians(d.longitude, d.latitude + 0.005, d.height),
    centerPosition,
    new Cesium.Cartesian3()
  );
  up = Cesium.Cartesian3.normalize(up, up);
  offscreenCamera.up = up;
  offscreenCamera.frustum = new Cesium.OrthographicFrustum({
    width: range,
    aspectRatio: 1,
    near: 1,
    far: 10000,
  });
  //可视化相机
  // viewer.scene.primitives.add(
  //   new Cesium.DebugCameraPrimitive({
  //     camera: offscreenCamera,
  //     color: Cesium.Color.BLUE,
  //     updateOnChange: false, //不更新
  //     // show: true,
  //   })
  // );

  return offscreenCamera;
};

//创建Picking对象
const createPicking = (viewer, offscreenCamera) => {
  // offscreenCamera = createOffscreenCamera(positions, viewer, range);
  const picking = new Cesium.Picking(viewer.scene);
  const view = picking._pickOffscreenView;
  const boundingRectangle = new Cesium.BoundingRectangle(0, 0, 1024, 1024);
  view.viewport = boundingRectangle;
  view.passState.viewport = boundingRectangle;
  view.camera = offscreenCamera;
  return picking;
};

//离屏渲染
const offscreenRender = (viewer, camera, picking, range) => {
  //更新拾取相机对应的帧缓存
  const { scene } = viewer;
  const { context, frameState } = scene;
  const view = picking._pickOffscreenView;
  const sceneView = scene.view;
  scene.view = view;
  Cesium.BoundingRectangle.clone(view.viewport, scratchRectangle);
  const passState = view.pickFramebuffer.begin(scratchRectangle, view.viewport);
  scene.jobScheduler.disableThisFrame();
  scene.updateFrameState();
  frameState.invertClassification = false;
  frameState.passes.pick = true;
  frameState.passes.offscreen = true;
  frameState.tilesetPassState = pickTilesetPassState;
  context.uniformState.update(frameState);
  scene.updateEnvironment();
  scene.updateAndExecuteCommands(passState, Cesium.Color.TRANSPARENT);
  scene.resolveFramebuffers(passState);
  const ray = new Cesium.Ray(camera.position, camera.direction);
  const positions = pickPositions(ray, picking, scene, range, range, 1024);
  scene.view = sceneView;
  context.endFrame();

  return positions;
};

//读取结果
const pickPositions = (ray, picking, scene, width, height, depthMapSize) => {
  const res = [];
  const { context } = scene;
  if (!context.depthTexture) {
    return res;
  }
  const view = picking._pickOffscreenView;
  const { camera } = view;
  const numFrustums = view.frustumCommandsList.length;
  const offset = new Cesium.Cartesian3();
  for (let i = 0; i < numFrustums; i++) {
    //获取每个视锥体的深度缓存
    const pickDepth = picking.getPickDepth(scene, i);
    const depths = getDepth(
      context,
      0,
      0,
      depthMapSize,
      depthMapSize,
      pickDepth.framebuffer
    );

    for (let j = 0, len = depths.length; j < len; j++) {
      const depth = depths[j];
      if (Cesium.defined(depth) && depth > 0.0 && depth < 1.0) {
        //根据视锥体远近截面计算出相机到物体表面的距离
        const renderedFrustum = view.frustumCommandsList[i];
        const near =
          renderedFrustum.near *
          (j !== 0 ? scene.opaqueFrustumNearOffset : 1.0);
        const distance = near + depth * (renderedFrustum.far - near);

        //将深度图像素点位置映射到世界坐标（以中心点相机位置为起点进行偏移映射）
        const column = Math.floor(j / depthMapSize);
        const row = j % depthMapSize;
        const columnScalar =
          ((column - depthMapSize / 2) * height) / depthMapSize;
        const rowScalar = ((row - depthMapSize / 2) * width) / depthMapSize;
        const point = new Cesium.Cartesian3();
        Cesium.Cartesian3.multiplyByScalar(camera.up, columnScalar, offset);
        Cesium.Cartesian3.add(offset, camera.position, point);
        Cesium.Cartesian3.multiplyByScalar(camera.right, rowScalar, offset);
        Cesium.Cartesian3.add(offset, point, point);

        //利用射线获取坐标高程
        const clonedRay = Cesium.Ray.clone(ray);
        clonedRay.origin = point;
        const position = Cesium.Ray.getPoint(clonedRay, distance);

        if (!res[j]) {
          res[j] = position;
        }
      }
    }
  }
  return res;
};

const getDepth = (context, x, y, width, height, framebuffer) => {
  //获取颜色深度缓存中的所有像素值
  const pixels = context.readPixels({
    x: x,
    y: y,
    width: width,
    height: height,
    framebuffer: framebuffer,
  });
  const packedDepthArray = Cesium.Cartesian4.unpackArray(pixels);

  //像素值转深度值
  return packedDepthArray.map((t) => {
    Cesium.Cartesian4.divideByScalar(t, 255.0, t);
    return Cesium.Cartesian4.dot(t, packedDepthScale);
  });
};

const pointIsInPolygon = (points, point) => {
  const position = Cesium.Cartesian3.fromDegrees(point[0], point[1], point[2]);
  const transform = Cesium.Transforms.eastNorthUpToFixedFrame(position);
  const inverse = Cesium.Matrix4.inverse(transform, new Cesium.Matrix4()); //转到局部坐标系
  const localPositions = [];
  points.forEach((p) => {
    localPositions.push(
      Cesium.Matrix4.multiplyByPoint(inverse, p, new Cesium.Cartesian3())
    );
  }); //外包矩形
  let rect = Cesium.BoundingRectangle.fromPoints(
    localPositions,
    new Cesium.BoundingRectangle()
  );
  rect = new Cesium.Cartesian4(
    rect.x,
    rect.y,
    rect.x + rect.width,
    rect.y + rect.height
  ); //判断是否在矩形内
  const p = new Cesium.Cartesian3(0, 0, 0);
  if (p.x >= rect.x && p.x <= rect.z && p.y >= rect.y && p.y <= rect.w) {
    points = localPositions;
    const nCount = points.length;
    let nCross = 0;
    for (let i = 0; i < nCount; i++) {
      const p1 = points[i];
      let p2;
      if (i < nCount - 1) {
        p2 = points[i + 1];
      } else {
        p2 = points[0];
      }
      if (p1.y == p2.y) continue;
      if (p.y < Math.min(p1.y, p2.y)) continue;
      if (p.y >= Math.max(p1.y, p2.y)) continue;
      const x = ((p.y - p1.y) * (p2.x - p1.x)) / (p2.y - p1.y) + p1.x;
      if (x > p.x) nCross++;
    }
    if (nCross % 2 == 1) {
      returntrue;
    }
  }
  return false;
};
