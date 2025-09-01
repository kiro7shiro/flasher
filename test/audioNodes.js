const container = document.querySelector('.audio-nodes')

container.addEventListener('wheel', (event) => {
    if (event.deltaY !== 0) {
        event.preventDefault()
        const scrollAmount = event.deltaY
        const currentScrollLeft = container.scrollLeft
        const newScrollLeft = currentScrollLeft + scrollAmount
        container.scrollTo({
            left: newScrollLeft,
            behavior: 'smooth'
        })
    }
})

const headers = container.querySelectorAll('.node-header')

for (let hCnt = 0; hCnt < headers.length; hCnt++) {
    const header = headers[hCnt];
    header.addEventListener('click', (event) => {
        header.parentElement.classList.toggle('collapsed')
    })
}