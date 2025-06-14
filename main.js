// import { reactive } from './reactivity.js';
// import { createVNode } from './vnode.js';
// import { createRenderer } from './renderer.js';
// import { effect } from './reactivity.js';
// import { diff } from './diff.js'; // Импорт diff

// Реактивное состояние
const state = reactive({
    title: "Reactive Virtual DOM",
    count: 0,
    lastEvent: "No events yet"
});

// Функция рендеринга
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

// Создание рендерера
const renderer = createRenderer();
const container = document.getElementById('app');

// Функция для применения патчей
function applyPatch(oldVNode, newVNode) {
    const diffResult = diff(oldVNode, newVNode);
    
    if (diffResult.action === 'REPLACE') {
        container.innerHTML = '';
        return renderer.mount(newVNode, container);
    } else {
        renderer.applyPatch(oldVNode.el, diffResult.patches);
        // applyVirtualPatch(oldVNode.el, diffResult.patches);
        return newVNode;
    }
}

// Инициализация
let currentVNode = renderApp();
renderer.mount(currentVNode, container);

// Реактивное обновление
effect(() => {
    const newVNode = renderApp();
    renderer.patch(() => {
        currentVNode = applyPatch(currentVNode, newVNode);
    });
});

// Демо: обновление заголовка каждые 5 секунд
setInterval(() => {
    state.title = `Updated: ${new Date().toLocaleTimeString()}`;
}, 5000);