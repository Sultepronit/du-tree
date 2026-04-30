export default async function doFetch0(path: string) {
    const response = await fetch(path)
    const result = await response.json()
    return result
}

const urlBase = "http://localhost:8088"
export async function doFetch(path: string, data = null) {
    const options = data
        ? {
              method: "POST",
              body: JSON.stringify(data)
          }
        : undefined

    const response = await fetch(urlBase + path, options)
    const result = await response.json()
    // console.log(result)
    return result
}
