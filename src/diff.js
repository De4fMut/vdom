import { PatchFlags } from './vnode.js';

export function diff(oldVNode, newVNode) {
    if (oldVNode.type !== newVNode.type) {
        return { action: 'REPLACE', node: newVNode };
    }

    const patches = [];
    
    // Для текстовых узлов - только обновление текста
    if (oldVNode.type === Symbol.for('TEXT')) {
        if (oldVNode.children !== newVNode.children) {
            patches.push({ type: 'UPDATE_TEXT', value: newVNode.children });
        }
        return { action: 'UPDATE', patches };
    }

    const flags = newVNode.flags;

    if (!(flags & PatchFlags.TEXT)) {
        diffProps(oldVNode, newVNode, patches);
    }

    if (Array.isArray(oldVNode.children) && Array.isArray(newVNode.children)) {
        if (newVNode.flags & PatchFlags.KEYED_CHILDREN) {
            diffKeyedChildren(oldVNode, newVNode, patches);
        } else {
            diffUnkeyedChildren(oldVNode, newVNode, patches);
        }
    }

    return { action: 'UPDATE', patches };
}

function diffProps(oldVNode, newVNode, patches) {
    const oldProps = oldVNode.props;
    const newProps = newVNode.props;

    for (const key in newProps) {
        if (oldProps[key] !== newProps[key]) {
            patches.push({ type: 'SET_ATTR', key, value: newProps[key] });
        }
    }

    for (const key in oldProps) {
        if (!(key in newProps)) {
            patches.push({ type: 'REMOVE_ATTR', key });
        }
    }
}

function diffKeyedChildren(oldVNode, newVNode, patches) {
    const oldChildren = oldVNode.children;
    const newChildren = newVNode.children;
    
    let i = 0;
    let e1 = oldChildren.length - 1;
    let e2 = newChildren.length - 1;

    while (i <= e1 && i <= e2) {
        if (isSameVNode(oldChildren[i], newChildren[i])) {
            patches.push({
                type: 'PATCH_CHILD',
                index: i,
                patch: diff(oldChildren[i], newChildren[i])
            });
            i++;
        } else {
            break;
        }
    }

    while (e1 >= i && e2 >= i) {
        if (isSameVNode(oldChildren[e1], newChildren[e2])) {
            patches.push({
                type: 'PATCH_CHILD',
                index: e1,
                patch: diff(oldChildren[e1], newChildren[e2])
            });
            e1--;
            e2--;
        } else {
            break;
        }
    }

    if (i > e1 && i <= e2) {
        for (let j = i; j <= e2; j++) {
            patches.push({ type: 'ADD_CHILD', index: j, node: newChildren[j] });
        }
    } 
    else if (i > e2 && i <= e1) {
        for (let j = i; j <= e1; j++) {
            patches.push({ type: 'REMOVE_CHILD', index: j });
        }
    }
    else {
        const keyToIndexMap = new Map();
        for (let j = i; j <= e2; j++) {
            keyToIndexMap.set(newChildren[j].key, j);
        }

        const newIndexToOldIndex = new Array(e2 - i + 1).fill(-1);
        let moved = false;
        let lastIndex = 0;

        for (let j = i; j <= e1; j++) {
            const oldChild = oldChildren[j];
            const newIndex = keyToIndexMap.get(oldChild.key);

            if (newIndex === undefined) {
                patches.push({ type: 'REMOVE_CHILD', index: j });
            } else {
                newIndexToOldIndex[newIndex - i] = j;
                if (newIndex < lastIndex) {
                    moved = true;
                } else {
                    lastIndex = newIndex;
                }
            }
        }

        if (moved) {
            const seq = getSequence(newIndexToOldIndex);
            let seqIndex = seq.length - 1;

            for (let j = newIndexToOldIndex.length - 1; j >= 0; j--) {
                if (newIndexToOldIndex[j] === -1) {
                    patches.push({ 
                        type: 'ADD_CHILD', 
                        index: j + i, 
                        node: newChildren[j + i] 
                    });
                } else if (j !== seq[seqIndex]) {
                    patches.push({ 
                        type: 'MOVE_CHILD', 
                        from: newIndexToOldIndex[j], 
                        to: j + i 
                    });
                } else {
                    seqIndex--;
                }
            }
        }
    }
}

function diffUnkeyedChildren(oldVNode, newVNode, patches) {
    const oldChildren = oldVNode.children;
    const newChildren = newVNode.children;
    const commonLength = Math.min(oldChildren.length, newChildren.length);

    for (let i = 0; i < commonLength; i++) {
        patches.push({
            type: 'PATCH_CHILD',
            index: i,
            patch: diff(oldChildren[i], newChildren[i])
        });
    }

    if (newChildren.length > oldChildren.length) {
        for (let i = commonLength; i < newChildren.length; i++) {
            patches.push({ 
                type: 'ADD_CHILD', 
                index: i, 
                node: newChildren[i] 
            });
        }
    }
    else if (oldChildren.length > newChildren.length) {
        for (let i = commonLength; i < oldChildren.length; i++) {
            patches.push({ 
                type: 'REMOVE_CHILD', 
                index: i 
            });
        }
    }
}

function isSameVNode(a, b) {
    return a.type === b.type && a.key === b.key;
}

function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;

    for (i = 0; i < arr.length; i++) {
        if (arr[i] === -1) continue;
        
        j = result[result.length - 1];
        if (arr[j] < arr[i]) {
            p[i] = j;
            result.push(i);
            continue;
        }

        u = 0;
        v = result.length - 1;
        while (u < v) {
            c = (u + v) >> 1;
            if (arr[result[c]] < arr[i]) {
                u = c + 1;
            } else {
                v = c;
            }
        }

        if (arr[i] < arr[result[u]]) {
            if (u > 0) p[i] = result[u - 1];
            result[u] = i;
        }
    }

    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }

    return result;
}