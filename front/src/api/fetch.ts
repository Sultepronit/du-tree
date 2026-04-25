export default async function doFetch(path: string) {
    const response = await fetch(path);
    const result = await response.json();
    return result;
}