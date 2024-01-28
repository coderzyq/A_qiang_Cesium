/**
 * @description: 动态遮罩层（球）材质
 */
import * as Cesium from "cesium";

class DynamicMaskEllipsoid {
  constructor(options) {
    this._definitionChanged = new Cesium.Event();
    this.color = options.color;
    this.speed = options.speed;
  }

  get isConstant() {
    return false;
  }
  get definitionChanged() {
    return this._definitionChanged;
  }
  getType() {
    return Cesium.Material.EllipsoidTrailMaterialType;
  }
  getValue(time, result) {
    if (!Cesium.defined(result)) {
      result = {};
    }
    result.color = Cesium.Property.getValueOrDefault(
      this.color,
      time,
      Cesium.Color.RED,
      result.color
    );
    result.speed = Cesium.Property.getValueOrDefault(
      this.speed,
      time,
      10,
      result.speed
    );
    return result;
  }
  equals(other) {
    return (
      this === other ||
      (other instanceof DynamicMaskEllipsoid &&
        Cesium.Property.equals(this.color, other.color) &&
        Cesium.Property.equals(this.speed, other.speed))
    );
  }
}
Object.defineProperties(DynamicMaskEllipsoid.prototype, {
  color: Cesium.createPropertyDescriptor("color"),
  speed: Cesium.createPropertyDescriptor("speed"),
});

Cesium.DynamicMaskEllipsoid = DynamicMaskEllipsoid;
Cesium.Material.EllipsoidTrailMaterialType = "EllipsoidTrailMaterialType";
Cesium.Material.EllipsoidTrailMaterialSource = `
    uniform vec4 color;
    uniform float speed;
    czm_material czm_getMaterial(czm_materialInput materialInput) {
        czm_material material = czm_getDefaultMaterial(materialInput);
        vec2 st = materialInput.st;
        float time = fract(czm_frameNumber * speed / 1000.0);
        // if(0.0<st.t && st.t< 0.5) {
        //     discard;
        // }
        float alpha = abs(smoothstep(0.5, 1., fract(-st.t - time)));
        alpha += .1;
        material.alpha = alpha;
        material.diffuse = color.rgb;
        return material;
    }
`;

Cesium.Material._materialCache.addMaterial(
    Cesium.Material.EllipsoidTrailMaterialType, 
    {
        fabric: {
            type: Cesium.Material.EllipsoidTrailMaterialType,
            uniforms: {
                color: new Cesium.Color(1.0, 0.0, 0.0, 1.0),
                speed: 10.0,
            },
            source: Cesium.Material.EllipsoidTrailMaterialSource
        },
        translucent: function() {
            return true;
        }
    }
)

export default DynamicMaskEllipsoid;