const urlBase = ""
export async function doFetch(path: string, data = null, signal?: AbortSignal) {
    let options = data
        ? {
              method: "POST",
              body: JSON.stringify(data),
              ...(signal && { signal })
          }
        : signal
          ? { signal }
          : undefined

    try {
        const response = await fetch(urlBase + path, options)
        const result = await response.json()
        return result
    } catch (error) {
        if (error.message === "Failed to fetch") {
            await new Promise(res => setTimeout(res, 1000))
            return await doFetch(path, data, signal)
        } else {
            console.warn(error)
            return null
        }
    }
}

export function doFetchWithControl(path: string, data = null) {
    const controller = new AbortController()
    const { signal } = controller
    return { result: doFetch(path, data, signal), controller: controller }
}

let pathController: AbortController
export function checkPath(path: string) {
    // await doFetch("/path", { path })
    pathController?.abort("Is stale")
    const { result, controller } = doFetchWithControl("/path", { path })
    pathController = controller
    return result
}
