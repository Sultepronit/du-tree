import { checkState } from "./init/init"

console.log("dev version!")

checkState()

// /usr/share/doc
// /var/log

function modUrl(link: HTMLLinkElement) {
    const url = new URL(link.href)
    url.searchParams.set("v", Date.now().toString())
    link.href = url.href
}

function modAllCss() {
    const links = document.querySelectorAll(
        'link[rel="stylesheet"][href*="css"]'
    ) as NodeListOf<HTMLLinkElement>
    links.forEach(link => modUrl(link))
}

modAllCss()

const eventSource = new EventSource("/sse-css")
eventSource.addEventListener("css-update", event => {
    console.log("Style update:", event.data)
    // if (event.data === "css") refreshCss()
    const name = event.data
    const link = document.querySelector(
        `link[rel="stylesheet"][href*="${name}"]`
    ) as HTMLLinkElement

    if (link) modUrl(link)
})

eventSource.onerror = err => {
    console.error(err)
}
