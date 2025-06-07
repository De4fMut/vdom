import { diff } from "./diff.js";
import { createTextVNode } from "./vnode.js";

export function createRenderer() {
    const scheduler = createScheduler();

    return {
        mount,
        patch: scheduler.queueUpdate,
        unmount,
    };
}

function mount(vnode, container) {
    try {
        // Обработка текстовых узлов
        if (vnode.type === Symbol.for("TEXT")) {
            const el = document.createTextNode(vnode.children);
            vnode.el = el;
            container.appendChild(el);
            return el;
        }

        // Обработка компонентов
        if (typeof vnode.type === "function") {
            return mountComponent(vnode, container);
        }

        // Создание DOM-элемента
        const el = document.createElement(vnode.type);
        vnode.el = el;

        // Установка атрибутов
        for (const key in vnode.props) {
            setAttribute(el, key, vnode.props[key]);
        }

        // Обработка детей
        if (Array.isArray(vnode.children)) {
            vnode.children.forEach((child) => {
                mount(child, el);
            });
        } else if (vnode.children !== null && vnode.children !== undefined) {
            el.textContent = vnode.children.toString();
        }

        container.appendChild(el);
        return el;
    } catch (error) {
        console.error("Mount error:", error);
        const fallback = createTextVNode("Render error");
        return mount(fallback, container);
    }
}

function patch(oldVNode, newVNode) {
    try {
        const diffResult = diff(oldVNode, newVNode);

        switch (diffResult.action) {
            case "REPLACE":
                unmount(oldVNode);
                return mount(newVNode, oldVNode.el.parentNode);
            case "UPDATE":
                applyPatch(oldVNode.el, diffResult.patch);
                return oldVNode.el;
        }
    } catch (error) {
        console.error("Patch error:", error);
        return oldVNode.el; // Сохраняем существующий DOM
    }
}

function applyPatch(el, patch) {
    patch.forEach((change) => {
        switch (change.type) {
            case "SET_ATTR":
                setAttribute(el, change.key, change.value);
                break;
            case "REMOVE_ATTR":
                el.removeAttribute(change.key);
                break;
            case "ADD_CHILD":
                const newChild = change.node;
                mount(newChild, el);
                break;
            case "REMOVE_CHILD":
                const child = el.childNodes[change.index];
                el.removeChild(child);
                break;
            case "MOVE_CHILD":
                const node = el.childNodes[change.from];
                const targetNode = el.childNodes[change.to];
                if (change.to < change.from) {
                    el.insertBefore(node, targetNode);
                } else {
                    el.insertBefore(node, targetNode.nextSibling);
                }
                break;
            case "PATCH_CHILD":
                const childNode = el.childNodes[change.index];
                patch(change.patch.oldVNode, change.patch.newVNode);
                break;
        }
    });
}

function setAttribute(el, key, value) {
    if (key.startsWith("on")) {
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, value);
    } else if (key === "style") {
        Object.assign(el.style, value);
    } else {
        el.setAttribute(key, value);
    }
}

function unmount(vnode) {
    if (vnode.component) {
        // Вызов хуков жизненного цикла
    }
    vnode.el.parentNode.removeChild(vnode.el);
}

// Компонентная система
function mountComponent(vnode, container) {
    const component = {
        render: vnode.type,
        state: {},
        props: vnode.props,
        vnode,
    };

    vnode.component = component;
    const renderResult = component.render(component.props);
    vnode.children = [renderResult];

    return mount(renderResult, container);
}

// Планировщик для асинхронных обновлений
function createScheduler() {
    let queue = [];
    let isFlushing = false;

    function queueUpdate(update) {
        queue.push(update);
        if (!isFlushing) {
            isFlushing = true;
            Promise.resolve().then(flushQueue);
        }
    }

    function flushQueue() {
        queue.forEach((update) => update());
        queue = [];
        isFlushing = false;
    }

    return { queueUpdate };
}
