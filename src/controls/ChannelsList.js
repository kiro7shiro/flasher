class ChannelsList {
    constructor(element) {
        this.element = element
        this.channelsData = []
        if (element.hasAttribute('data-channels')) {
            this.channelsData = JSON.parse(element.dataset.channels)
        }
        const self = this
        self.element.addEventListener('click', function (event) {
            const { target } = event
            const { channelsData } = self
            let selectedChannel = null
            if (channelsData.length) {
                // find newly selected channel
                ;[selectedChannel] = channelsData.filter(function (channel) {
                    return channel.displayName === target.innerText
                })
            }
            self.element.dispatchEvent(new CustomEvent(`select`, { detail: selectedChannel }))
        })
    }
    get selectedChannel() {
        if (this.element && this.element.hasAttribute('data-selected-channel')) {
            return this.element.dataset.selectedChannel
        }
    }
    set selectedChannel(value) {
        if (this.element) this.element.dataset.selectedChannel = value
    }
    on(event, handler) {
        if (!this.element) return
        this.element.addEventListener(event, handler)
    }
    off(event, handler) {
        if (!this.element) return
        this.element.removeEventListener(event, handler)
    }
}

export { ChannelsList }
