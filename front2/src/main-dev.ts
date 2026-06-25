import { checkUser, updateAccessWidget } from "./path/pathInput"
console.log("dev version!")
// checkUser()
updateAccessWidget()

// /usr/share/doc
// /var/log

const eventSource = new EventSource("/sse-css")
eventSource.addEventListener("css-update", event => {
    console.log("Style update:", event.data)
    // if (event.data === "css") refreshCss()
    const name = event.data
    const link = document.querySelector(
        `link[rel="stylesheet"][href*="${name}"]`
    ) as HTMLLinkElement
    if (link) {
        const url = new URL(link.href)
        url.searchParams.set("v", Date.now().toString())

        link.href = url.href
        // console.log("🎨 CSS оновлено без перезавантаження сторінки!")
    }
})
eventSource.onerror = err => {
    console.error(err)
}
