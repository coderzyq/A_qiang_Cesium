import * as Cesium from "cesium"
// 雨效果
class RainEffect {
  constructor(viewer, options) {
    if (!viewer) throw new Error("no viewer object!");
    options = options || {};

    this.tiltAngle = Cesium.defaultValue(options.tiltAngle, -0.6); //倾斜角度，负数向右，正数向左
    this.rainSize = Cesium.defaultValue(options.rainSize, 0.1); //雨大小
    this.rainSpeed = Cesium.defaultValue(options.rainSpeed, 1000.0); //雨速
    this.viewer = viewer;
    this.init();
  }

  init() {
    //采用后处理的方式
    this.rainStage = new Cesium.PostProcessStage({
      name: "czml_rain",
      fragmentShader: this.rain(),
      uniforms: {
        tiltAngle: () => {
          return this.tiltAngle;
        },
        rainSize: () => {
          return this.rainSize;
        },
        rainSpeed: () => {
          return this.rainSpeed;
        },
      },
    });
    this.viewer.scene.postProcessStages.add(this.rainStage);
  }
  //销毁对象
  destroy() {
    if (!this.viewer || !this.rainStage) return;
    this.viewer.scene.postProcessStages.remove(this.rainStage);
    delete this.tiltAngle;
    delete this.rainSize;
    delete this.rainSpeed;
  }
  //控制显示
  show(visible) {
    this.rainStage.enabled = visible;
  }
  //CLML对象，方便导出使用
  rain() {
    return `uniform sampler2D colorTexture;
                in vec2 v_textureCoordinates;
                uniform float tiltAngle;
                uniform float rainSize;
                uniform float rainSpeed;
                out vec4 fragColor;
                float hash(float x) {
                    return fract(sin(x * 133.3) * 13.13);
                }
                void main(void) {
                    float time = czm_frameNumber / rainSpeed;
                    vec2 resolution = czm_viewport.zw;
                    vec2 uv = (gl_FragCoord.xy * 2. - resolution.xy) / min(resolution.x, resolution.y);
                    vec3 c = vec3(.6, .7, .8);
                    float a = tiltAngle;
                    float si = sin(a), co = cos(a);
                    uv *= mat2(co, -si, si, co);
                    uv *= length(uv + vec2(0, 4.9)) * rainSize + 1.;
                    float v = 1. - sin(hash(floor(uv.x * 100.)) * 2.);
                    float b = clamp(abs(sin(20. * time * v + uv.y * (5. / (2. + v)))) - .95, 0., 1.) * 20.;
                    c *= v * b;
                    fragColor = mix(texture(colorTexture, v_textureCoordinates), vec4(c, 1), .5);
                }
                `;
  }
}
export default RainEffect;
