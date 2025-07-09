import * as Cesium from "cesium";
const renderTilesetPassState = new Cesium.Cesium3DTilePassState({
  pass: Cesium.Cesium3DTilePass.RENDER,
});
const scratchBackgroundColor = new Cesium.Color();
// 创建帧缓冲区
export const createFrameBuffer = (context) => {
    let width = context.drawingBufferWidth;
    let height = context.drawingBufferHeight;
    let framebuffer = new Cesium.Framebuffer({
        context: context,
        colorTextures: [
            new Cesium.Texture({
                context: context,
                width: width,
                height: height,
                pixelFormat: Cesium.PixelFormat.RGBA,
            })
        ]
    })
    return framebuffer
}

//渲染到FBO（帧缓冲对象）
export const renderToFbo = (fbo, scene) => {
    const frameState = scene._frameState;
    const context = scene.context;
    const us = context.uniformState;

    const view = scene._defaultView;
    scene._view = view;

    scene.updateFrameState();
    frameState.passes.render = true;
    frameState.passes.postProcess = scene.postProcessStages.hasSelected;
    frameState.tilesetPassState = renderTilesetPassState;

    let backgroundColor = Cesium.defaultValue(scene.backgroundColor, Cesium.Color.RED);
    if (scene._hdr) {
        backgroundColor = Cesium.Color.clone(backgroundColor, scratchBackgroundColor)
        backgroundColor.red = Cesium.Math.pow(backgroundColor.red, scene.gamma);
        backgroundColor.green = Cesium.Math.pow(backgroundColor.green, scene.gamma);
        backgroundColor.blue = Cesium.Math.pow(backgroundColor.blue, scene.gamma);
    }
    frameState.backgroundColor = backgroundColor;

    frameState.atmosphere = scene.atmosphere;
    scene.fog.update(frameState)

    us.update(frameState);

    const shadowMap = scene.shadowMap;
    if (Cesium.defined(shadowMap) && shadowMap.enabled) {
        if (!Cesium.defined(scene.light) || scene.light instanceof Cesium.SunLight) {
            Cesium.Cartesian3.negate(us.sunDirectionWC, scene._shadowMapCamera.direction)
        } else {
            Cesium.Cartesian3.clone(scene.light.direction, scene._shadowMapCamera.direction)
        }
        frameState.shadowMaps.push(shadowMap)
    }

    scene._computeCommandList.length = 0
    scene._overlayCommandList.length = 0

    const viewport = view.viewport;
    viewport.x = 0;
    viewport.y = 0;
    viewport.width = context.drawingBufferWidth;
    viewport.height = context.drawingBufferHeight;
    const passState = view.passState;
    passState.framebuffer = fbo;
    passState.blendingEnabled = undefined;
    passState.scissorTest = undefined;
    passState.viewport = Cesium.BoundingRectangle.clone(viewport, passState.viewport)

    if (Cesium.defined(scene.globe)) {
        scene.globe.beginFrame(frameState)
    }

    scene.updateEnvironment()
    scene.updateAndExecuteCommands(passState, backgroundColor);
  scene.resolveFramebuffers(passState);

  passState.framebuffer = undefined;
  //executeOverlayCommands(scene, passState);

  if (Cesium.defined(scene.globe)) {
    scene.globe.endFrame(frameState);
    if (!scene.globe.tilesLoaded) {
      scene._renderRequested = true;
    }
  }

  context.endFrame();
  scene.globe.show = true;
}

//自定义缓冲区对象相机
export const createFboCamera = (scene, position) => {
    //创建一个相机
    let camera = new Cesium.Camera(scene);
    //设置相机的视角
    camera.setView({
        destination: position,
        orientation: {
            heading: Cesium.Math.toRadians(0.0),
            pitch: Cesium.Math.toRadians(-90.0),
            roll: 0.0
        }
    })
    camera.frustum = new Cesium.PerspectiveFrustum({
        fov: Cesium.Math.toRadians(60),
        aspectRatio: 1,
        near: 1,
        far: 5000
    });
    let primitive = new Cesium.DebugCameraPrimitive({
        camera: camera,
        color: Cesium.Color.RED,
        show: true,
        updateOnChange: true
    })
    scene.primitives.add(primitive)
    return camera
}

//渲染到缓冲区对象相机
export const renderToFboCamera = (fbo, scene, fobCamera) => {
    let camera = scene._defaultView.camera;
    scene._defaultView.camera = fobCamera;
    const frameState = scene._frameState;
    const context = scene.context;
    const us = context.uniformState;

    const view = scene._defaultView;
    scene._view = view;

    scene.updateFrameState();
    frameState.passes.render = true;
    frameState.passes.postProcess = scene.postProcessStages.hasSelected;
    frameState.tilesetPassState = renderTilesetPassState;

    let backgroundColor = Cesium.defaultValue(
    scene.backgroundColor,
    Cesium.Color.RED
  );
  if (scene._hdr) {
    backgroundColor = Cesium.Color.clone(
      backgroundColor,
      scratchBackgroundColor
    );
    backgroundColor.red = Cesium.Math.pow(backgroundColor.red, scene.gamma);
    backgroundColor.green = Cesium.Math.pow(backgroundColor.green, scene.gamma);
    backgroundColor.blue = Cesium.Math.pow(backgroundColor.blue, scene.gamma);
  }
  frameState.backgroundColor = backgroundColor; 

  frameState.atmosphere = scene.atmosphere;
  scene.fog.update(frameState);

  us.update(frameState);

  const shadowMap = scene.shadowMap;
  if (Cesium.defined(shadowMap) && shadowMap.enabled) {
    if (!Cesium.defined(scene.light) || scene.light instanceof SunLight) {
      // Negate the sun direction so that it is from the Sun, not to the Sun
      Cesium.Cartesian3.negate(
        us.sunDirectionWC,
        scene._shadowMapCamera.direction
      );
    } else {
      Cesium.Cartesian3.clone(
        scene.light.direction,
        scene._shadowMapCamera.direction
      );
    }
    frameState.shadowMaps.push(shadowMap);
  }

  scene._computeCommandList.length = 0;
  scene._overlayCommandList.length = 0;

  const viewport = view.viewport;
  viewport.x = 0;
  viewport.y = 0;
  viewport.width = context.drawingBufferWidth;
  viewport.height = context.drawingBufferHeight;

  const passState = view.passState;
  passState.framebuffer = fbo;
  passState.blendingEnabled = undefined;
  passState.scissorTest = undefined;
  passState.viewport = Cesium.BoundingRectangle.clone(
    viewport,
    passState.viewport
  );

  if (Cesium.defined(scene.globe)) {
    scene.globe.beginFrame(frameState);
  }

  scene.updateEnvironment();
  scene.updateAndExecuteCommands(passState, backgroundColor);
  scene.resolveFramebuffers(passState);

  passState.framebuffer = undefined;
  //executeOverlayCommands(scene, passState);

  if (Cesium.defined(scene.globe)) {
    scene.globe.endFrame(frameState);
    if (!scene.globe.tilesLoaded) {
      scene._renderRequested = true;
    }
  }

  context.endFrame();
  scene._defaultView.camera = camera;
  scene.globe.show = true;
}