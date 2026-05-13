import { doFetch } from "./api/fetch"
import { pathInpunt } from "./global/pathInput"
import "./style/main.css"
import "./style/tree-design2.css"
import { initTree } from "./view/buildTree"
import execute from "./view/buildTree0"

// execute()

// doFetch("/dir", { path: "/" })

// initTree("/")

// pathInpunt.value = "/"
// pathInpunt.value = "/home/"

// pathInpunt.value = "/home/step/"
// pathInpunt.value = "/home/step/Downloads/"

// pathInpunt.value = "/data/"
// pathInpunt.value = "/data/web-projects/"
// pathInpunt.value = "/data/web-projects/du-tree/test/"
// pathInpunt.value = "/data/web-projects/du-tree/"

// pathInpunt.value = "/home/step/work/du-tree/test/"
pathInpunt.value = "/home/step/work/du-tree/"

// pathInpunt.value = "/home/sultepronit/"
// pathInpunt.value = "/home/sultepronit/server/"

// pathInpunt.value = "/home/sultepronit/work/"
//   24 11 24 18 2.3 1.3
//5: 18 21 13 1.5

// pathInpunt.value = "/home/sultepronit/work/du-tree/"
initTree()
