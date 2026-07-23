const pathInput = document.getElementById("path") as HTMLInputElement
export function getPath() {
    return pathInput.value
}

export function setPath(val: string) {
    pathInput.value = val
}
