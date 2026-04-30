import { doFetch } from "./api/fetch"
import { pathInpunt } from "./global/pathInput"
import "./style/main.css"
import { initTree } from "./view/buildTree"
import execute from "./view/buildTree0"

// execute()

// doFetch("/dir", { path: "/" })

// initTree("/")

// pathInpunt.value = "/home/step/"
// pathInpunt.value = "/data/web-projects/"
// pathInpunt.value = "/data/web-projects/du-tree/test/"
// pathInpunt.value = "/home/step/work/du-tree/test/"
pathInpunt.value = "/home/step/work/du-tree/"
initTree()
