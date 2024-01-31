
/**
 * @description: 扩撒圆效果
 * @author: coderqiang
 */
import * as Cesium from "cesium";
/*
* @Description: 扩散圆效果（参考开源代码）
* @Version: 1.0
* @Author: Julian
* @Date: 2022-03-03 21:51:28
 * @LastEditors: coderqiang
 * @LastEditTime: 2023-07-06 20:36:47
*/
class CircleDiffuseMaterialProperty {
   constructor(options) {
       this._definitionChanged = new Cesium.Event();
       this._color = undefined;
       this._speed = undefined;
       this.color = options.color;
       this.speed = options.speed;
       this.percent = options.percent;
       this.gradient = options.gradient;
   };

   get isConstant() {
       return false;
   }

   get definitionChanged() {
       return this._definitionChanged;
   }

   getType(time) {
       return Cesium.Material.CircleDiffuseMaterialType;
   }

   getValue(time, result) {
       if (!Cesium.defined(result)) {
           result = {};
       }

       result.color = Cesium.Property.getValueOrDefault(this._color, time, Cesium.Color.RED, result.color);
       result.speed = Cesium.Property.getValueOrDefault(this._speed, time, 10, result.speed);
       //result.percent = Cesium.Property.getValueOrDefault(this._percent, time, 0.01, result.speed);
       return result
   }

   equals(other) {
       return (this === other ||
           (other instanceof CircleDiffuseMaterialProperty &&
               Cesium.Property.equals(this._color, other._color) &&
               Cesium.Property.equals(this._speed, other._speed))
               //Cesium.Property.equals(this._speed, other._percent))
       )
   }
}

Object.defineProperties(CircleDiffuseMaterialProperty.prototype, {
   color: Cesium.createPropertyDescriptor('color'),
   speed: Cesium.createPropertyDescriptor('speed'),
   percent: Cesium.createPropertyDescriptor('percent'),
   gradient: Cesium.createPropertyDescriptor("gradient"),
})

Cesium.CircleDiffuseMaterialProperty = CircleDiffuseMaterialProperty;
Cesium.Material.CircleDiffuseMaterialProperty = 'CircleDiffuseMaterialProperty';
Cesium.Material.CircleDiffuseMaterialType = 'CircleDiffuseMaterialType';
Cesium.Material.CircleDiffuseMaterialSource = `
                                           uniform vec4 color;
                                           uniform float gradient;
                                           uniform float percent;
                                           uniform float speed;

                                           czm_material czm_getMaterial(czm_materialInput materialInput){
                                           czm_material material = czm_getDefaultMaterial(materialInput);
                                           vec2 st = materialInput.st ;
                                           float t = fract(czm_frameNumber * speed / 1000.0);
                                           t *= (1.0 + percent);
                                           float alpha = smoothstep(t-percent, t, st.s) * step(-t, -st.s);
                                           alpha += gradient;
                                           material.alpha = alpha;
                                           material.diffuse = color.rgb;
                                           return material;
                                           }
                                           `

Cesium.Material._materialCache.addMaterial(Cesium.Material.CircleDiffuseMaterialType, {
   fabric: {
       type: Cesium.Material.CircleDiffuseMaterialType,
       uniforms: {
           color: new Cesium.Color(1.0, 0.0, 0.0, 1.0),
           speed: 10.0,
           percent: 0.1,
           gradient: 0.01 
       },
       source: Cesium.Material.CircleDiffuseMaterialSource
   },
   translucent: function(material) {
       return true;
   }
})
