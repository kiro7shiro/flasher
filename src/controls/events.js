/**
 * Adds events for the "AddNode" menu to the html
 * @param {HTMLElement} container that holds the html to add the events to
 * @param {String} identifier selects to which controls the events are added
 */
export function addEvents(container, identifier) {
    const closeButton = container.querySelector('.closeButton')
    closeButton.addEventListener('click', function () {
        container.remove()
    })
    const events = addNodeMenuEvents[identifier]
    if (!events) throw new Error(`${identifier} not defined.`)
    events(container)
    const addButton = container.querySelector('footer button')
    addButton.addEventListener('click', function () {
        container.dispatchEvent(new CustomEvent('add', { detail: container.dataset }))
        container.remove()
    })
}

/**
 * Holds events for the "AddNode" menus different nodes
 */
const addNodeMenuEvents = {
    BiquadFilterNode: function (container) {
        const typeDropDown = container.querySelector('.w3-dropdown-hover')
        const typeButton = typeDropDown.querySelector('.w3-button')
        typeDropDown.addEventListener('click', function (event) {
            container.dataset.type = event.target.innerText
            typeButton.innerText = event.target.innerText
        })
        typeButton.innerText = 'lowpass'
        container.dataset.type = 'lowpass'
        const frequency = container.querySelector('#frequency')
        frequency.addEventListener('change', function (event) {
            container.dataset.frequency = event.target.value
        })
        frequency.value = 350
        container.dataset.frequency = '350'
        const detune = container.querySelector('#detune')
        detune.addEventListener('change', function (event) {
            container.dataset.detune = event.target.value
        })
        detune.value = 0
        container.dataset.detune = '0'
        const Q = container.querySelector('#Q')
        Q.addEventListener('change', function (event) {
            container.dataset.Q = event.target.value
        })
        Q.value = 0
        container.dataset.Q = '0'
        const gain = container.querySelector('#gain')
        gain.addEventListener('change', function (event) {
            container.dataset.gain = event.target.value
        })
        gain.value = 0
        container.dataset.gain = '0'
    },
    DelayNode: function (container) {
        const delay = container.querySelector('#delay')
        delay.addEventListener('change', function (event) {
            container.dataset.delayTime = event.target.value
        })
        delay.value = 0
        container.dataset.delayTime = '0'
    },
    GainNode: function (container) {
        const gain = container.querySelector('#gain')
        gain.addEventListener('change', function (event) {
            container.dataset.gain = event.target.value
        })
        gain.value = 1
        container.dataset.gain = '1'
    }
}
