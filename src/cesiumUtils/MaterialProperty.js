/*
 * @Description: 
 * @Author: coderqiang
 * @Date: 2023-08-21 22:29:06
 * @LastEditTime: 2023-08-21 23:28:38
 * @LastEditors: coderqiang
 */
// const Cesium = window.Cesium;
import * as Cesium from "cesium";
 
class MaterialProperty {
  constructor(options = {}) {
    this._definitionChanged = new Cesium.Event();
    // this._color = undefined;
    // this._colorSubscription = undefined;
    this._speed = undefined;
    this._speedSubscription = undefined;
    // this.color = options.color || Cesium.Color.fromBytes(0, 255, 255, 255);
    this.speed = options.speed || 1;
  }
 
  get isConstant() {
    return false;
  }
 
  get definitionChanged() {
    console.log( this._definitionChanged);
    // debugger
    return this._definitionChanged;
  }
 
  getType(time) {
    return null;
  }
 
  getValue(time, result) {
    result = Cesium.defaultValue(result, {});
    return result;
  }
 
  equals(other) {
    return this === other;
  }
}
 
export default MaterialProperty;