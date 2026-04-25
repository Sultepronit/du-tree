import doFetch from './api/fetch';
import getData from './api/getData';
import handleBytes from './helpers/handleBytes';
import timePromise from './helpers/timePromise';
import './style/main.css'
import execute from './view/buildTree';

execute();

// let max = -1;
// const branches = [];

// const rootSize = document.getElementById('root')!;
// const listBlock = document.getElementById('list')!;

// // function addList(data: any[], element: HTMLElement) {
// // function addList(data: any[], max = -1) {
// function addList(data: any[], prePath = '') {
//     // const sorted = data.sort((a, b) => b.size - a.size);
//     const lis = data.map(entry => {
//         let content = '';
//         // if (entry.content) {
//         if (entry.hasContent) {
//             // branches.push(entry.content);
//             // index = branches.length - 1;
//             const path = prePath ? `${prePath}/${entry.name}` : entry.name
//             content = `data-path="${path}"`
//         }
//         return `<li class="${content ? 'nested' : ''}">
//             <div class="fd-entry">
//                 <div class="fd-vizual-size" style="width: ${entry.size / max * 100}%"></div>
//                 <div class="fd-size ${content ? 'interactive' : ''}" ${content}>
//                     ${handleBytes(entry.size)}
//                 </div>
//                 <div class="fd-name">${entry.name}</div>
//             </div>
           
//         </li>`; 
//     }).join('');

//     return `<ul class="dir-content">${lis}</ul>`;
//     // element.innerHTML = `<ul>${lis}</ul>`;

// }

// console.log(data);
// console.log(data.content);
// data[0]
// addList(data.content, listBlock);
// rootSize.textContent = handleBytes(data.size);
// listBlock.innerHTML = addList(data.content);



// async function init() {
//     // const data = await doFetch('http://localhost:8088/du-exec?path=/data/web-projects/du-tree/test/');
//     // const data = await doFetch('http://localhost:8088/du-exec?path=/data/web-projects/du-tree/back/');
//     // const data = await doFetch('http://localhost:8088/du-exec?path=/data/web-projects/du-tree/');
//     // const data = await doFetch('http://localhost:8088/du-exec?path=/data/web-projects/');
//     // const data = await doFetch('http://localhost:8088/du-exec?path=/data/');
//     // const data = await doFetch('http://localhost:8088/du-exec?path=/');
//     // const data = await doFetch('http://localhost:8088/du-exec?path=/snap/');
//     const url = 'http://localhost:8088/du-exec?path=/data/web-projects/du-tree/test/';
//     const wholePromise = doFetch(url);
//     const limiter = timePromise(500);

//     const first = await Promise.race([wholePromise, limiter]);
//     console.log(first)

//     console.log(data);
//     max = data.content[0].size;
//     rootSize.textContent = handleBytes(data.size);
//     listBlock.innerHTML = addList(data.content);
// }
// init();
// getData();

// listBlock.addEventListener('click', async (e) => {
//     console.log(e.target)
//     // if (e.target?.classList.contains('fd-size')) {
//     if (e.target?.dataset.path) {
//         const target = e.target as HTMLDivElement;
//         const path = target.dataset.path
//         const li = target.closest('li');
//         console.log(path);

//         const data = await doFetch(`http://localhost:8088/get-branch?path=${path}`);
//         const html = addList(data, path);
//         // console.log(html);

//         // insertAdjacentHTML!
//         // const template = document.createElement('template');
//         // template.innerHTML = html;
//         // console.log(template.content);
//         // li?.appendChild(template.content);
//         li.insertAdjacentHTML('beforeend', html);

//         target.dataset.path = '';
//         target.dataset.unfolded = 'true';
//     } else if (e.target?.dataset.unfolded) {
//         const target = e.target as HTMLDivElement;
//         const li = target.closest('li')!;
//         // console.log(li);

//         const unfolded = JSON.parse(target.dataset.unfolded as string);
//         // console.log(unfolded);
//         li.querySelector<HTMLDivElement>('.dir-content')!.hidden = unfolded;
//         target.dataset.unfolded = JSON.stringify(!unfolded);
//     }
// })