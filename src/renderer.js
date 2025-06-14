import { diff } from './diff.js';
import { createTextVNode } from './vnode.js';

export function createRenderer() {
    const scheduler = createScheduler();
    
    return {
        mount,
        patch: scheduler.queueUpdate,
        unmount,
        applyPatch
    };
}

function mount(vnode, container) {
    let el;
    console.dir(vnode)
    // return
    
    if (vnode.tag === null) {
        el = document.createTextNode(vnode.children);
    } else {
        el = document.createElement(vnode.tag);
        
        // Установка свойств
        for (const key in vnode.props) {
            setAttribute(el, key, vnode.props[key], vnode);
        }
        
        // Рекурсивное монтирование детей
        vnode.children.forEach(child => {
            if (child) {
                const childEl = mount(child, document.createElement('div'));
                el.appendChild(childEl);
            }
        });
    }
    
    vnode.el = el;
    container.appendChild(el);
    return el;
}

function applyPatch(el, patches) {
    patches.forEach(patch => {
        switch (patch.type) {
            case 'SET_ATTR':
                setAttribute(el, patch.key, patch.value);
                break;
                
            case 'REMOVE_ATTR':
                el.removeAttribute(patch.key);
                break;
                
            case 'ADD_CHILD':
                const newChild = mount(patch.node, document.createElement('div'));
                if (el.childNodes[patch.index]) {
                    el.insertBefore(newChild, el.childNodes[patch.index]);
                } else {
                    el.appendChild(newChild);
                }
                break;
                
            case 'REMOVE_CHILD':
                if (el.childNodes[patch.index]) {
                    el.removeChild(el.childNodes[patch.index]);
                }
                break;
                
            case 'PATCH_CHILD':
                const childEl = el.childNodes[patch.index];
                if (childEl) {
                    patchNode(childEl, patch.patch);
                }
                break;
                
            case 'UPDATE_TEXT':
                if (el.nodeType === Node.TEXT_NODE) {
                    el.nodeValue = patch.value;
                }
                break;
        }
    });
}

function patchNode(el, diffResult) {
    if (diffResult.action === 'REPLACE') {
        const parent = el.parentNode;
        const newEl = mount(diffResult.node, parent);
        parent.replaceChild(newEl, el);
    } else {
        applyPatch(el, diffResult.patches);
    }
}

function setAttribute(el, key, value, vnode) {
    if (key.startsWith('on')) {
        const eventName = key.slice(2).toLowerCase();
        
        // Удаление предыдущего обработчика
        if (vnode.eventHandlers.has(eventName)) {
            const prevHandler = vnode.eventHandlers.get(eventName);
            el.removeEventListener(eventName, prevHandler);
        }
        
        // Добавление нового обработчика
        el.addEventListener(eventName, value);
        vnode.eventHandlers.set(eventName, value);
    } else {
        el.setAttribute(key, value);
    }
}

function updatePropsAndEvents(oldVNode, newVNode) {
    const el = oldVNode.el;
    const oldProps = oldVNode.props;
    const newProps = newVNode.props;
    
    // Удаление старых атрибутов
    for (const key in oldProps) {
        if (!(key in newProps)) {
            if (key.startsWith('on')) {
                const eventName = key.slice(2).toLowerCase();
                if (oldVNode.eventHandlers.has(eventName)) {
                    const handler = oldVNode.eventHandlers.get(eventName);
                    el.removeEventListener(eventName, handler);
                    oldVNode.eventHandlers.delete(eventName);
                }
            } else {
                el.removeAttribute(key);
            }
        }
    }
    
    // Добавление/обновление атрибутов
    for (const key in newProps) {
        if (oldProps[key] !== newProps[key]) {
            setAttribute(el, key, newProps[key], newVNode);
        }
    }
}

function unmount(vnode) {
    if (vnode.el && vnode.el.parentNode) {
        vnode.el.parentNode.removeChild(vnode.el);
    }
}

function createScheduler() {
    let queue = [];
    let isFlushing = false;

    function queueUpdate(updateFn) {
        queue.push(updateFn);
        if (!isFlushing) {
            isFlushing = true;
            Promise.resolve().then(flushQueue);
        }
    }

    function flushQueue() {
        const currentQueue = [...queue];
        queue = [];
        currentQueue.forEach(fn => fn());
        isFlushing = false;
    }

    return { queueUpdate };
}