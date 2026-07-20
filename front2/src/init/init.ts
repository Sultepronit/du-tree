import { doFetch } from "../api/fetch"
import { setPath } from "../controls/controls"
import { renderTree } from "../tree/controls"

export async function checkState() {
    const state = await doFetch("/init")
    console.log(state)
    if (state?.path) {
        setPath(state.path)
        renderTree(state.path)
    }
}
