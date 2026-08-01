const urlBase = ""
export async function doFetch(path: string, data = null) {
    const options = data
        ? {
              method: "POST",
              body: JSON.stringify(data)
          }
        : undefined

    try {
        const response = await fetch(urlBase + path, options)
        const result = await response.json()
        return result
    } catch (error) {
        if (error.message === "Failed to fetch") {
            await new Promise(res => setTimeout(res, 1000))
            return await doFetch(path, data)
        } else {
            console.warn(error)
            return null
        }
    }
}
