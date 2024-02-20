import { Control } from './Control.js'

class AddFilterMenu extends Control {
    constructor(source) {
        super(source)
        const { element } = this
        const typeDropDown = element.querySelector('.w3-dropdown-click')
        const typeButton = typeDropDown.querySelector('.w3-button')
        const typeContent = typeDropDown.querySelector('.w3-dropdown-content')
        typeDropDown.addEventListener('click', function (event) {
            if (typeContent.classList.contains('w3-show')) {
                element.dataset.type = event.target.innerText
                typeButton.innerText = event.target.innerText
                typeContent.classList.remove('w3-show')
            } else {
                typeContent.classList.add('w3-show')
            }
            
        })
        typeButton.innerText = 'lowpass'
        element.dataset.type = 'lowpass'
        const frequency = element.querySelector('#frequency')
        frequency.addEventListener('change', function (event) {
            element.dataset.frequency = event.target.value
        })
        frequency.value = 350
        element.dataset.frequency = '350'
        const detune = element.querySelector('#detune')
        detune.addEventListener('change', function (event) {
            element.dataset.detune = event.target.value
        })
        detune.value = 0
        element.dataset.detune = '0'
        const Q = element.querySelector('#Q')
        Q.addEventListener('change', function (event) {
            element.dataset.Q = event.target.value
        })
        Q.value = 0
        element.dataset.Q = '0'
        const gain = element.querySelector('#gain')
        gain.addEventListener('change', function (event) {
            element.dataset.gain = event.target.value
        })
        gain.value = 0
        element.dataset.gain = '0'
    }
}

export { AddFilterMenu }
