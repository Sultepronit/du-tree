import { doFetch } from "../api/fetch"
import { checkUser, setPath } from "../path/pathInput"
import { renderTree } from "../tree/controls"

export async function checkState() {
    checkUser()
    
    const state = await doFetch("/init")
    console.log(state)
    if (state?.path) {
        setPath(state.path)
        renderTree(state.path)
    }
}
