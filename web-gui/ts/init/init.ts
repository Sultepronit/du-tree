import { doFetch } from "../api/fetch"
import { checkUser, setPath } from "../core/pathInput"
import { initTree, setOptions } from "../core/controls"

export async function checkState() {
    checkUser()

    const state = await doFetch("/init")
    console.log(state)
    if (state?.path) {
        setOptions(state.options)
        setPath(state.path)
        // renderTree(state.path)
        initTree(state.path, false)
    }
}
