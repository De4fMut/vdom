// import { reactive, effect } from './reactivity.js';
// import { createVNode } from './vnode.js';
// import { createRenderer } from './renderer.js';
// import { diff } from './diff.js';

const state = reactive({
    title: "Reactive Virtual DOM",
    count: 0,
    lastEvent: "No events yet"
});

function renderApp() {
    return createVNode('div', { class: 'container' }, [
        createVNode('h1', {}, state.title),
        createVNode('div', {}, [
            createVNode('button', { 
                onClick: () => state.count-- 
            }, 'Decrement'),
            createVNode('span', { class: 'counter' }, state.count),
            createVNode('button', { 
                onClick: () => state.count++ 
            }, 'Increment')
        ]),
        createVNode('p', {}, `Count: ${state.count}`),
        createVNode('button', { 
            onClick: () => {
                state.lastEvent = `Clicked at ${new Date().toLocaleTimeString()}`;
            }
        }, 'Record Event'),
        createVNode('p', {}, state.lastEvent)
    ]);
}

const renderer = createRenderer();
const container = document.getElementById('app');

function applyPatch(oldVNode, newVNode) {
    const diffResult = diff(oldVNode, newVNode);
    
    if (diffResult.action === 'REPLACE') {
        container.innerHTML = '';
        newVNode.el = renderer.mount(newVNode, container);
        return newVNode;
    } else {
        // console.dir(oldVNode.el, diffResult.patches);
        // return
        renderer.applyPatch(oldVNode.el, diffResult.patches);
        newVNode.el = oldVNode.el;
        return newVNode;
    }
}

let currentVNode = renderApp();
currentVNode.el = renderer.mount(currentVNode, container);

effect(() => {
    const newVNode = renderApp();
    renderer.patch(() => {
        currentVNode = applyPatch(currentVNode, newVNode);
    });
});

setInterval(() => {
    state.title = `Updated: ${new Date().toLocaleTimeString()}`;
}, 5000);