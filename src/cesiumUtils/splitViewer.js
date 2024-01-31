/**
 * @description 分屏联动
 */
class SyncViewer {
    constructor (i, t) {
        this.viewer1 = i
        this.viewer2 = t
        this.focusIndex = 0
    }

    sync(e) {
        this.isSync = e;
        e ? this.startSync() : this.cancelSync()
    }

    startSync() {
        this.viewer1.scene.postRender.addEventListener(this.syncEventHandler, this)
        const e = this
        this.viewer1.container.onmouseenter = function () {
            e.focusIndex = 0
        }
        e.viewer2.container.onmouseenter = function () {
            e.focusIndex = 1
        }
    }

    cancelSync() {
        this.viewer1.container.onmouseenter = undefined
        this.viewer2.container.onmouseenter = undefined
        this.viewer1.scene.postRender.removeEventListener(this.syncEventHandler, this)
    }

    syncEventHandler() {
        this.isSync && (this.focusIndex === 0 ? this.syncV2ToV1() : this.syncV1ToV2())
    }

    syncV2ToV1() {
        this.viewer2.camera.setView({
            destination: this.viewer1.camera.position,
            orientation: {
                direction: this.viewer1.camera._direction,
                up: this.viewer1.camera.up,
                heading: this.viewer1.camera.heading,
                pitch: this.viewer1.camera.pitch,
                roll: this.viewer1.camera.roll
            }
        })
    }

    syncV1ToV2() {
        this.viewer1.camera.setView({
            destination: this.viewer2.camera.position,
            orientation: {
                direction: this.viewer2.camera._direction,
                up: this.viewer2.camera.up,
                heading: this.viewer2.camera.heading,
                pitch: this.viewer2.camera.pitch,
                roll: this.viewer2.camera.roll
            }
        })
    }
}

export default SyncViewer