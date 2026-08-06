import { doFetch } from "../api/fetch"
import { setPath, setSystemContext } from "../core/pathInput"
import { initTree, setOptions } from "../core/controls"

export async function checkState() {
    // checkUser()

    const state = await doFetch("/init")
    console.log(state)

    if (state?.context) setSystemContext(state.context)

    if (state?.scan?.path) {
        setOptions(state.scan.options)
        setPath(state.scan.path)
        initTree(state.scan.path, false)
    }
}
