export function createRenderer() {
    const scheduler = createScheduler();
    
    return {
        mount,
        patch: scheduler.queueUpdate,
        unmount
    };
}

function mount(vnode, container) {
    if (vnode.type === Symbol.for('TEXT')) {
        const el = document.createTextNode(vnode.children);
        vnode.el = el;
        container.appendChild(el);
        return el;
    }

    const el = document.createElement(vnode.type);
    vnode.el = el;

    for (const key in vnode.props) {
        setAttribute(el, key, vnode.props[key]);
    }

    if (Array.isArray(vnode.children)) {
        vnode.children.forEach(child => {
            if (child) {
                const childEl = mount(child, el);
                if (childEl) {
                    el.appendChild(childEl);
                }
            }
        });
    }

    container.appendChild(el);
    return el;
}

function applyVirtualPatch(oldVNode, newVNode) {
    const diffResult = diff(oldVNode, newVNode);
    
    if (diffResult.action === 'REPLACE') {
        const parent = oldVNode.el.parentNode;
        unmount(oldVNode);
        return mount(newVNode, parent);
    } else {
        applyDomPatches(oldVNode.el, diffResult.patches);
        newVNode.el = oldVNode.el;
        return newVNode;
    }
}

function applyDomPatches(el, patches) {
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
                if (newChild) {
                    el.appendChild(newChild);
                }
                break;
            case 'REMOVE_CHILD':
                if (el.childNodes[patch.index]) {
                    el.removeChild(el.childNodes[patch.index]);
                }
                break;
            case 'MOVE_CHILD':
                const nodeToMove = el.childNodes[patch.from];
                if (nodeToMove) {
                    highlightNode(nodeToMove);
                    const targetNode = el.childNodes[patch.to];
                    if (targetNode) {
                        el.insertBefore(nodeToMove, targetNode);
                    } else {
                        el.appendChild(nodeToMove);
                    }
                }
                break;
            case 'PATCH_CHILD':
                const childNode = el.childNodes[patch.index];
                if (childNode) {
                    patchChildNode(childNode, patch.patch);
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

function patchChildNode(el, diffResult) {
    if (diffResult.action === 'REPLACE') {
        const parent = el.parentNode;
        const newEl = mount(diffResult.node, parent);
        parent.replaceChild(newEl, el);
    } else {
        applyDomPatches(el, diffResult.patches);
    }
}

function highlightNode(node) {
    node.classList.add('highlight');
    setTimeout(() => {
        node.classList.remove('highlight');
    }, 300);
}

function setAttribute(el, key, value) {
    if (key.startsWith('on') && typeof value === 'function') {
        const keyLC = key.toLowerCase()
        console.dir(el)
        const event = keyLC.slice(2);
        // el.addEventListener(event, value);
        el[keyLC] = value
        // console.dir(window)
    } else if (key === 'style' && typeof value === 'object') {
        Object.assign(el.style, value);
    } else {
        el.setAttribute(key, value);
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