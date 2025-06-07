import { createRenderer } from './renderer.js';
import { createVNode } from './vnode.js';

const renderer = createRenderer();
const container = document.getElementById('app');

// Инициализация
const vnode = createVNode('div', { class: 'container' }, [
    createVNode('h1', {}, ['Hello Virtual DOM']),
    createVNode('ul', {}, [
        createVNode('li', { key: 'a' }, ['Item A']),
        createVNode('li', { key: 'b' }, ['Item B']),
        createVNode('li', { key: 'c' }, ['Item C'])
    ])
]);

renderer.mount(vnode, container);

// Обновление через 2 секунды
setTimeout(() => {
    const newVNode = createVNode('div', { class: 'container modified' }, [
        createVNode('h1', {}, ['Updated Virtual DOM']),
        createVNode('ul', {}, [
            createVNode('li', { key: 'd' }, ['New Item D']),
            createVNode('li', { key: 'a' }, ['Updated Item A']),
            createVNode('li', { key: 'c' }, ['Item C']),
            createVNode('li', { key: 'e' }, ['New Item E'])
        ])
    ]);
    
    renderer.patch(() => renderer.patch(vnode, newVNode));
}, 2000);