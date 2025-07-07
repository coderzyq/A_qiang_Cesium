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