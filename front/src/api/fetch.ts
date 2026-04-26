export default async function doFetch0(path: string) {
    const response = await fetch(path)
    const result = await response.json()
    return result
}

const urlBase = "http://localhost:8088"
export async function doFetch(path: string, data: any) {
    const response = await fetch(urlBase + path, {
        method: "POST",
        // headers: {
        //     "Content-Type": "application/json"
        // },
        body: JSON.stringify(data)
    })
    const result = await response.json()
    // console.log(result)
    return result
}
