// Флаги для оптимизации диффинга
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

export function createVNode(type, props = {}, children = []) {
    const key = props.key || null;
    delete props.key;
    
    return {
        type,
        props,
        children,
        key,
        el: null,
        flags: 0,
        component: null,
        shapeFlag: getShapeFlag(type, children),
        // Для компонентов
        slots: null,
        ctx: null
    };
}

export function createTextVNode(text) {
    return {
        type: Symbol.for('TEXT'),
        props: {},
        children: text,
        el: null,
        key: null,
        flags: PatchFlags.TEXT
    };
}

function getShapeFlag(type, children) {
    let flag = 0;
    
    if (typeof type === 'string') {
        flag |= 1; // ELEMENT
    } else if (typeof type === 'object' || typeof type === 'function') {
        flag |= 2; // COMPONENT
    }
    
    if (Array.isArray(children)) {
        flag |= 4; // ARRAY_CHILDREN
    } else if (typeof children === 'string') {
        flag |= 8; // TEXT_CHILDREN
    }
    
    return flag;
}