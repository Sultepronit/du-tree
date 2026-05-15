import { initTree } from "../tree/buildTree"

export const pathInpunt = document.getElementById("path") as HTMLInputElement

// pathInpunt.value = "/"
// pathInpunt.value = "/home/"

// pathInpunt.value = "/home/step/"
// pathInpunt.value = "/home/step/Downloads/"

// pathInpunt.value = "/data/"
// pathInpunt.value = "/data/web-projects/"
// pathInpunt.value = "/data/web-projects/du-tree/test/"
pathInpunt.value = "/data/web-projects/du-tree/"

// pathInpunt.value = "/home/step/work/du-tree/test/"
// pathInpunt.value = "/home/step/work/du-tree/"

// pathInpunt.value = "/home/sultepronit/"
// pathInpunt.value = "/home/sultepronit/server/"

// pathInpunt.value = "/home/sultepronit/work/"

// pathInpunt.value = "/home/sultepronit/work/du-tree/"
initTree(pathInpunt.value)

pathInpunt.addEventListener("change", () => {
    if (!pathInpunt.value.endsWith("/")) pathInpunt.value += "/"
    console.log(pathInpunt.value)
    initTree(pathInpunt.value)
})

pathInpunt.addEventListener("input", e => {
    console.log(e.target.value)
})
