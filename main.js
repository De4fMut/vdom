// import { createRenderer } from './renderer.js';
// import { createVNode, PatchFlags } from './vnode.js';
// import { diff, applyVirtualPatch } from './diff.js';

const renderer = createRenderer();
const container = document.getElementById('app');

// Application state
let state = {
    title: 'Virtual DOM Demo',
    items: [
        { id: 'a', text: 'Item A' },
        { id: 'b', text: 'Item B' },
        { id: 'c', text: 'Item C' }
    ]
};

// Render function
function render(state) {
    return createVNode('div', { class: 'container' }, [
        createVNode('h1', {}, state.title),
        createVNode('ul', { 
            key: 'list',
            flags: PatchFlags.KEYED_CHILDREN 
        }, state.items.map(item => 
            createVNode('li', { 
                key: item.id,
                onClick: () => alert(`Clicked: ${item.text}`)
            }, item.text)
        )),
        createVNode('button', {
            onClick: () => addRandomItem()
        }, 'Add Random Item')
    ]);
}

// Add random item
function addRandomItem() {
    console.log(state)
    const newId = Math.random().toString(36).slice(2, 6);
    state.items = [
        { id: newId, text: `Item ${newId.toUpperCase()}` },
        ...state.items
    ];
    update();
}

// Initial render
let currentVNode = render(state);
renderer.mount(currentVNode, container);

// Update UI
function update() {
    const newVNode = render(state);
    renderer.patch(() => {
        currentVNode = applyVirtualPatch(currentVNode, newVNode);
    });
}

// Demo update after 2 seconds
// setTimeout(() => {
//     state.title = 'Updated Virtual DOM';
//     state.items = [
//         { id: 'd', text: 'New Item D' },
//         { id: 'a', text: 'Updated Item A' },
//         { id: 'e', text: 'Item E' }
//     ];
//     update();
// }, 2000);