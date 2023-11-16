export async function renderFile(filename, locals) {
    const response = await fetch(`${filename}`)
    const template = await response.text()
    const html = ejs.render(template, locals)
    return html
}
