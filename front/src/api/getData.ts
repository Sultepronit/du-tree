import timePromise from "../helpers/timePromise"
import doFetch0 from "./fetch"

async function getPartWithDelay(delay: number) {
    await timePromise(delay)
    // return 'first part!';
    return await doFetch0("http://localhost:8088/get-part")
}

export async function getWholeData() {
    // const data = await doFetch('http://localhost:8088/du-exec?path=/data/web-projects/du-tree/test/');
    // const data = await doFetch('http://localhost:8088/du-exec?path=/data/web-projects/du-tree/back/');
    // const data = await doFetch('http://localhost:8088/du-exec?path=/data/web-projects/du-tree/');
    // const data = await doFetch('http://localhost:8088/du-exec?path=/data/web-projects/');
    // const data = await doFetch('http://localhost:8088/du-exec?path=/data/');
    // const data = await doFetch('http://localhost:8088/du-exec?path=/');
    // const data = await doFetch('http://localhost:8088/du-exec?path=/snap/');
    const url = "http://localhost:8088/du-exec?path=/data/web-projects/du-tree/test/"
    const wholePromise = doFetch0(url)
    const part = getPartWithDelay(1500)

    let result = await Promise.race([wholePromise, part])
    console.log(result)
    if (result.size < 0) {
        // while (result.size < 0) {
        //     result = await waitForPart(200)
        //     console.log(result)
        // }
        // document.dispatchEvent(new CustomEvent)
    } else {
    }

    // console.log(data);
    // max = data.content[0].size;
    // rootSize.textContent = handleBytes(data.size);
    // listBlock.innerHTML = addList(data.content);
}

export default async function getData() {
    // const data = await doFetch('http://localhost:8088/du-exec?path=/data/web-projects/du-tree/test/');
    // const data = await doFetch('http://localhost:8088/du-exec?path=/data/web-projects/du-tree/back/');
    // const data = await doFetch('http://localhost:8088/du-exec?path=/data/web-projects/du-tree/');
    // const data = await doFetch('http://localhost:8088/du-exec?path=/data/web-projects/');
    // const data = await doFetch('http://localhost:8088/du-exec?path=/data/');
    // const data = await doFetch('http://localhost:8088/du-exec?path=/');
    // const data = await doFetch('http://localhost:8088/du-exec?path=/snap/');
    const url = "http://localhost:8088/du-exec?path=/data/web-projects/du-tree/test/"
    const wholePromise = doFetch0(url)
    const part = getPartWithDelay(1500)

    let result = await Promise.race([wholePromise, part])
    console.log(result)
    if (result.size < 0) {
        // while (result.size < 0) {
        //     result = await waitForPart(200)
        //     console.log(result)
        // }
        // document.dispatchEvent(new CustomEvent)
    } else {
    }

    // console.log(data);
    // max = data.content[0].size;
    // rootSize.textContent = handleBytes(data.size);
    // listBlock.innerHTML = addList(data.content);
}
