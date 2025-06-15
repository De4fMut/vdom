export const PatchFlags = {
    TEXT: 1,
    CLASS: 2,
    STYLE: 4,
    PROPS: 8,
    FULL_PROPS: 16,
    KEYED_CHILDREN: 32,
    UNKEYED_CHILDREN: 64,
    COMPONENT: 128
};

// export function createVNode(type, props = {}, children = []) {
//     const normalizedChildren = normalizeChildren(children);
//     const key = props.key || null;
//     if (props.key) delete props.key;

//     return {
//         type,
//         props,
//         children: normalizedChildren,
//         key,
//         el: null,
//         flags: 0,
//         shapeFlag: getShapeFlag(type, normalizedChildren)
//     };
// }

// export function createTextVNode(text) {
//     return {
//         type: Symbol.for('TEXT'),
//         props: {},
//         children: String(text),
//         el: null,
//         key: null,
//         flags: PatchFlags.TEXT
//     };
// }

export function createVNode(tag, props = {}, children = []) {
    const normalizedChildren = normalizeChildren(children);
    const key = props.key || null;
    if (props.key) delete props.key;

    return {
        tag,
        props,
        children: normalizedChildren,
        key,
        el: null,
        eventHandlers: new Map(),
        flags: 0,
        shapeFlag: getShapeFlag(tag, normalizedChildren)
    };
}

export function createTextVNode(text) {
    return {
        tag: null,
        props: {},
        children: String(text),
        el: null,
        eventHandlers: new Map(),
        flags: PatchFlags.TEXT
    };
}

function normalizeChildren(children) {
    if (Array.isArray(children)) {
        return children.map(child => 
            (typeof child === 'string' || typeof child === 'number') 
                ? createTextVNode(child) 
                : child
        );
    }
    return [createTextVNode(children)];
}

function getShapeFlag(type, children) {
    let flag = 0;
    if (typeof type === 'string') flag |= 1;
    if (children.length > 0) flag |= 4;
    return flag;
}