import doFetch from "../api/fetch";
import handleBytes from "../helpers/handleBytes";
import timePromise from "../helpers/timePromise";

const totalSize = document.getElementById("root")!;
const treeBlock = document.getElementById("list")!;

let max = -1;

function setTotalSize(value: number, isTemp = false) {
  totalSize.textContent = (isTemp ? "~" : "") + handleBytes(value);
}

function createLi(data, prePath = ""): string {
  let content = "";
  if (data.hasContent) {
    const path = prePath ? `${prePath}/${data.name}` : data.name;
    content = `data-path="${path}"`;
  }
  // console.log(data.size / max * 100);
  return `<li class="${content ? "nested" : ""}" data-size="${data.size}">
        <div class="fd-entry">
            <div
                class="fd-vizual-size"
                style="width: ${(data.size / max) * 100}%"
                data-size="${data.size}"
                data-max="${max}"
            ></div>
            <div class="fd-size ${content ? "interactive" : ""}" ${content}>
                ${handleBytes(data.size)}
            </div>
            <div class="fd-name">${data.name}</div>
        </div>
        
    </li>`;
}

function createBranch(data: any[], prePath = ""): string {
  const lis = data.map((entry) => createLi(entry, prePath)).join("");
  return `<ul class="dir-content">${lis}</ul>`;
}

let partialData = {
  content: [], // do we need this???
};

function reDrawVisualSize() {
  const bars = document.querySelectorAll(
    ".fd-vizual-size",
  ) as NodeListOf<HTMLDivElement>;
  console.log(bars);
  bars.forEach((bar) => {
    if (bar.dataset.max === max.toString()) return;
    bar.style.width = (Number(bar.dataset.size) / max) * 100 + "%";
  });
}

function insertLis(data) {
  const lis = treeBlock.firstChild.childNodes as NodeListOf<HTMLLIElement>;
  let liIndex = 0;
  data.content.forEach((entry) => {
    // console.log(entry.size);
    while (true) {
      if (entry.size > lis[liIndex].dataset.size) {
        // console.log('bigger!');
        lis[liIndex].insertAdjacentHTML("beforebegin", createLi(entry));
      } else if (liIndex < lis.length - 1) {
        liIndex++;
        continue;
      } else {
        lis[liIndex].insertAdjacentHTML("afterend", createLi(entry));
      }
      break;
    }
  });
}

async function buildGradually(data) {
  console.log(data);
  if (data.content) {
    data.content.sort((a, b) => b.size - a.size);

    if (data.content[0].size > max) {
      max = data.content[0].size;
      reDrawVisualSize();
    }

    if (!partialData.content.length) {
      treeBlock.innerHTML = createBranch(data.content);
    } else {
      insertLis(data);
    }

    partialData.content.push(...data.content);
    // totalSize.textContent = partialData.content.reduce((sum, entry) => sum + entry.size, 0);
    setTotalSize(
      partialData.content.reduce((sum, entry) => sum + entry.size, 0),
      true,
    );
  }

  if (data.size >= 0) {
    console.timeEnd("t1");
    setTotalSize(data.size);
    return;
  }

  buildGradually(await getPartWithDelay(1000));
}

async function getPartWithDelay(delay: number) {
  await timePromise(delay);
  // console.log('try...')
  // return await doFetch('http://localhost:8088/get-part');
  const { size, content: rawContent } = await doFetch(
    "http://localhost:8088/get-part",
  );
  const content =
    Array.isArray(rawContent) && rawContent.length > partialData.content.length
      ? rawContent.slice(partialData.content.length)
      : null;
  return { size, content };
}

export default async function execute() {
  console.time("t1");
  // const data = await doFetch('http://localhost:8088/du-exec?path=/data/web-projects/du-tree/back/');
  // const data = await doFetch('http://localhost:8088/du-exec?path=/data/web-projects/du-tree/');
  // const data = await doFetch('http://localhost:8088/du-exec?path=/data/');
  // const url = await doFetch("http://localhost:8088/du-exec?path=/snap/");
  // const url = 'http://localhost:8088/du-exec?path=/data/web-projects/du-tree/test/';
  // const url = "http://localhost:8088/du-exec?path=/data/web-projects/";
  // const url = "http://localhost:8088/du-exec?path=/data/";
  // const url = "http://localhost:8088/du-exec?path=/";
  const url = "http://localhost:8088/du-exec?path=~";
  const wholePromise = doFetch(url);
  const part = getPartWithDelay(500);

  // let result = await Promise.race([wholePromise, part]);
  const result = await part;
  console.log(result);
  buildGradually(result);
  // if (result.size < 0) {
  //     buildGradually(result);
  // } else {

  // }
}

treeBlock.addEventListener("click", async (e) => {
  console.log(e.target);
  // if (e.target?.classList.contains('fd-size')) {
  if (e.target?.dataset.path) {
    const target = e.target as HTMLDivElement;
    const path = encodeURIComponent(target.dataset.path);
    const li = target.closest("li");
    console.log(path);

    const data = await doFetch(`http://localhost:8088/get-branch?path=${path}`);
    const html = createBranch(data, path);

    li.insertAdjacentHTML("beforeend", html);

    target.dataset.path = "";
    target.dataset.unfolded = "true";
  } else if (e.target?.dataset.unfolded) {
    const target = e.target as HTMLDivElement;
    const li = target.closest("li")!;
    // console.log(li);

    const unfolded = JSON.parse(target.dataset.unfolded as string);
    // console.log(unfolded);
    li.querySelector<HTMLDivElement>(".dir-content")!.hidden = unfolded;
    target.dataset.unfolded = JSON.stringify(!unfolded);
  }
});
