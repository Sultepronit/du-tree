export default function toggleCSS(url: string, id: string, add: boolean) {
    if (add) {
        if (document.getElementById(id)) {
            console.log("The CSS is already added!")
            return
        }

        const linkElement = document.createElement("link")
        linkElement.id = id
        linkElement.rel = "stylesheet"
        linkElement.type = "text/css"
        linkElement.href = url

        document.head.appendChild(linkElement)
    } else {
        const linkElement = document.getElementById(id)
        if (linkElement) linkElement.remove()
    }
}
