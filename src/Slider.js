import { Control } from './Control.js'

class Slider extends Control {
    constructor(element) {
        super(element)
        this.labelElement = this.element.querySelector('label')
        this.slider = this.element.querySelector('input')
    }
    get label() {
        return this.labelElement.innerText
    }
    set label(value) {
        this.labelElement.innerText = value
    }
    get value() {
        return this.slider.value
    }
    set value(val) {
        this.slider.value = val
    }
}

export { Slider }