// const Cesium = window.Cesium;
import * as Cesium from "cesium"
class ShuttleLineMaterialProperty {
  constructor(duration, image, color) {
    this._definitionChanged = new Cesium.Event();
    this.duration = duration;
    this.image = image;
    this.color = color;
    this._time = performance.now();
  }
  get isConstant() {
    return false;
  }
  get definitionChanged() {
    return this._definitionChanged;
  }
  getType() {
    return Cesium.Material.ShuttleLineType;
  }
  getValue(time, result) {
    if (!Cesium.defined(result)) {
      result = {};
    }
    result.image = this.image;
    result.color = Cesium.Property.getValueOrClonedDefault(this._color, time, Cesium.Color.WHITE, result.color);
    result.time =
      ((performance.now() - this._time) % this.duration) / this.duration;
    return result;
  }
  equals(other) {
    return (
      this === other ||
      (other instanceof ShuttleLineMaterialProperty &&
        (this.duration === other.duration) &&
        (this._color === other._color))
    );
  }
}
Object.defineProperties(ShuttleLineMaterialProperty.prototype, {
  color: Cesium.createPropertyDescriptor("color"),
  duration: Cesium.createPropertyDescriptor("duration"),
  // image: Cesium.createPropertyDescriptor("image"),
});

Cesium.ShuttleLineMaterialProperty = ShuttleLineMaterialProperty;
Cesium.Material.ShuttleLineType = "ShuttleLine";
Cesium.Material.ShuttleLineSource = `
czm_material czm_getMaterial(czm_materialInput materialInput)
{
czm_material material = czm_getDefaultMaterial(materialInput);
vec2 st = materialInput.st;
// float time=fract(czm_frameNumber/1000.);
vec4 colorImage = texture(image, vec2(fract(st.s-time), st.t));
material.alpha = colorImage.a;
material.diffuse = color.rgb * colorImage.rgb;
return material;
}
`;

Cesium.Material._materialCache.addMaterial(Cesium.Material.ShuttleLineType, {
  fabric: {
    type: Cesium.Material.ShuttleLineType,
    uniforms: {
      color: new Cesium.Color(1, 0, 0, 1.0),
      image: "",
      transparent: true,
      time: 20,
    },
    source: Cesium.Material.ShuttleLineSource,
  },
  translucent: function () {
    return true;
  },
});

export default ShuttleLineMaterialProperty