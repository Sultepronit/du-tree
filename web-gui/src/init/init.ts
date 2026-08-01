import { doFetch } from "../api/fetch"
import { checkUser, setPath } from "../path/pathInput"
import { renderTree, setOptions } from "../tree/controls"

export async function checkState() {
    checkUser()
    
    const state = await doFetch("/init")
    console.log(state)
    if (state?.path) {
        setOptions(state.options)
        setPath(state.path)
        renderTree(state.path)
    }
}
