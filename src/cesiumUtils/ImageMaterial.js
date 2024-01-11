/*
 * @Author: Wang jianLei
 * @Date: 2022-10-14 14:27:58
 * @Last Modified by: Wang JianLei
 * @Last Modified time: 2022-10-14 14:28:28
 */
// const Cesium = window.Cesium;
import * as Cesium from "cesium";
import MaterialProperty from "./MaterialProperty";
 
/**
 * 定义Cesium材质对象
 */
Cesium.Material.PolylineImageTrailType = "PolylineImageTrail";
Cesium.Material._materialCache.addMaterial(
  Cesium.Material.PolylineImageTrailType,
  {
    fabric: {
      type: Cesium.Material.PolylineImageTrailType,
      uniforms: {
        // color: new Cesium.Color(1.0, 0.0, 0.0, 0.7),
        image: Cesium.Material.DefaultImageId,
        speed: 1,
        repeat: new Cesium.Cartesian2(1, 1),
      },
      source: `uniform sampler2D image; 
      uniform float speed;
      uniform vec2 repeat;
      czm_material czm_getMaterial(czm_materialInput materialInput){
        czm_material material=czm_getDefaultMaterial(materialInput);
        vec2 st=repeat*materialInput.st;
        float time=fract(czm_frameNumber*speed/1000.);
        vec4 colorImage=texture(image,vec2(fract(st.s-time),st.t));
        material.alpha=colorImage.a;
        material.diffuse=colorImage.rgb;
        return material;
      }`,
    },
    translucent: function () {
      return true;
    },
  }
);
 
class PolylineImageTrailMaterialProperty extends MaterialProperty {
  constructor(options = {}) {
    super(options);
    this._image = undefined;
    this._imageSubscription = undefined;
    this._repeat = undefined;
    this._repeatSubscription = undefined;
    this.image = options.image;
    this.repeat = new Cesium.Cartesian2(
      options.repeat?.x || 1,
      options.repeat?.y || 1
    );
  }
 
  getType() {
    console.log(Cesium.Material.PolylineImageTrailType);
    return Cesium.Material.PolylineImageTrailType;
  }
 
  getValue(time, result) {
    if (!result) {
      result = {};
    }
    // result.color = Cesium.Property.getValueOrUndefined(this._color, time);
    result.image = Cesium.Property.getValueOrUndefined(this._image, time);
    result.repeat = Cesium.Property.getValueOrUndefined(this._repeat, time);
    result.speed = this._speed;
    return result;
  }
 
  equals(other) {
    return (
      this === other ||
      (other instanceof PolylineImageTrailMaterialProperty &&
        // Cesium.Property.equals(this._color, other._color) &&
        Cesium.Property.equals(this._image, other._image) &&
        Cesium.Property.equals(this._repeat, other._repeat) &&
        Cesium.Property.equals(this._speed, other._speed))
    );
  }
}
 
Object.defineProperties(PolylineImageTrailMaterialProperty.prototype, {
  // color: Cesium.createPropertyDescriptor("color"),
  speed: Cesium.createPropertyDescriptor("speed"),
  image: Cesium.createPropertyDescriptor("image"),
  repeat: Cesium.createPropertyDescriptor("repeat"),
});
 
export default PolylineImageTrailMaterialProperty;