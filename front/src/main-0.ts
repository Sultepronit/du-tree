import handleBytes from './helpers/handleBytes';
import './style/main.css'
import data from './test1.json';
// import data from './test2.json';
// import data from './test3.json';

let max = -1;
const branches = [];

const rootSize = document.getElementById('root')!;
const listBlock = document.getElementById('list')!;

// function addList(data: any[], element: HTMLElement) {
// function addList(data: any[], max = -1) {
function addList(data: any[]) {
    const sorted = data.sort((a, b) => b.size - a.size);
    // console.log(sorted[0].size);
    // const max = sorted[0].size;
    if (max < 0) max = sorted[0].size;
    const lis = sorted.map(entry => {
        // const content = entry.content ? addList(entry.content, max) : '';
        // const content = entry.content ? `data-content=${JSON.stringify({
        //     // data: entry.content,
        //     // max
        //     ind
        // })}` : '';
        let content = '';
        if (entry.content) {
            branches.push(entry.content);
            // index = branches.length - 1;
            content = `data-index="${branches.length - 1}"`
        }
        return `<li class="${entry.content ? 'nested' : ''}">
            <div class="fd-entry">
                <div class="fd-vizual-size" style="width: ${entry.size / max * 99}%"></div>
                <div class="fd-size ${content ? 'interactive' : ''}" ${content}>
                    ${handleBytes(entry.size)}
                </div>
                <div class="fd-name">${entry.name}</div>
            </div>
           
        </li>`; 
    }).join('');

    return `<ul class="dir-content">${lis}</ul>`;
    // element.innerHTML = `<ul>${lis}</ul>`;

}

console.log(data);
console.log(data.content);
// data[0]
// addList(data.content, listBlock);
rootSize.textContent = handleBytes(data.size);
listBlock.innerHTML = addList(data.content);

listBlock.addEventListener('click', (e) => {
    console.log(e.target)
    // if (e.target?.classList.contains('fd-size')) {
    if (e.target?.dataset.content) {
        const target = e.target as HTMLDivElement;
        const li = target.closest('li');

        const { data, max } = JSON.parse(target.dataset.content as string);
        const html = addList(data);
        console.log(html);

        // insertAdjacentHTML!
        const template = document.createElement('template');
        template.innerHTML = html;
        console.log(template.content);
        li?.appendChild(template.content);

        target.dataset.content = '';
        target.dataset.unfolded = 'true';
    } else if (e.target?.dataset.index) {
        const target = e.target as HTMLDivElement;
        const li = target.closest('li');

        // const { data, max } = JSON.parse(target.dataset.content as string);
        const html = addList(branches[Number(target.dataset.index)]);
        console.log(html);

        // insertAdjacentHTML!
        const template = document.createElement('template');
        template.innerHTML = html;
        console.log(template.content);
        li?.appendChild(template.content);

        target.dataset.index = '';
        target.dataset.unfolded = 'true';
    } else if (e.target?.dataset.unfolded) {
        const target = e.target as HTMLDivElement;
        const li = target.closest('li')!;
        console.log(li);

        const unfolded = JSON.parse(target.dataset.unfolded as string);
        console.log(unfolded);
        li.querySelector<HTMLDivElement>('.dir-content')!.hidden = unfolded;
        target.dataset.unfolded = JSON.stringify(!unfolded);
    }
})