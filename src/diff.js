import { PatchFlags } from "./vnode.js";

export function diff(oldVNode, newVNode) {
    // 1. Проверка на разные типы
    if (oldVNode.type !== newVNode.type) {
        return { action: "REPLACE", node: newVNode };
    }

    const patch = [];
    const flags = newVNode.flags;

    // 2. Проверка флагов для пропусков
    if (!(flags & PatchFlags.TEXT)) {
        // 3. Дифф пропсов
        diffProps(oldVNode, newVNode, patch);
    }

    // 4. Дифф детей
    if (!(flags & PatchFlags.KEYED_CHILDREN)) {
        diffChildren(oldVNode, newVNode, patch);
    } else {
        diffKeyedChildren(oldVNode, newVNode, patch);
    }

    return { action: "UPDATE", patch };
}

function diffProps(oldVNode, newVNode, patch) {
    const oldProps = oldVNode.props;
    const newProps = newVNode.props;

    // Добавление/изменение пропсов
    for (const key in newProps) {
        if (oldProps[key] !== newProps[key]) {
            patch.push({
                type: "SET_ATTR",
                key,
                value: newProps[key],
            });
        }
    }

    // Удаление пропсов
    for (const key in oldProps) {
        if (!(key in newProps)) {
            patch.push({
                type: "REMOVE_ATTR",
                key,
            });
        }
    }
}

function diffKeyedChildren(oldVNode, newVNode, patch) {
    const oldChildren = oldVNode.children || [];
    const newChildren = newVNode.children || [];

    // 1. Алгоритм с двойными указателями
    let i = 0;
    let e1 = oldChildren.length - 1;
    let e2 = newChildren.length - 1;

    // Сравнение от начала
    while (i <= e1 && i <= e2) {
        if (isSameVNode(oldChildren[i], newChildren[i])) {
            patch.push({
                type: "PATCH_CHILD",
                index: i,
                patch: diff(oldChildren[i], newChildren[i]),
            });
        } else {
            break;
        }
        i++;
    }

    // Сравнение от конца
    while (e1 >= i && e2 >= i) {
        if (isSameVNode(oldChildren[e1], newChildren[e2])) {
            patch.push({
                type: "PATCH_CHILD",
                index: e1,
                patch: diff(oldChildren[e1], newChildren[e2]),
            });
        } else {
            break;
        }
        e1--;
        e2--;
    }

    // 2. Обработка новых элементов
    if (i > e1 && i <= e2) {
        for (let j = i; j <= e2; j++) {
            patch.push({
                type: "ADD_CHILD",
                index: j,
                node: newChildren[j],
            });
        }
    }
    // 3. Обработка удаленных элементов
    else if (i > e2 && i <= e1) {
        for (let j = i; j <= e1; j++) {
            patch.push({
                type: "REMOVE_CHILD",
                index: j,
            });
        }
    }
    // 4. Обработка неизвестной последовательности
    else {
        const keyToNewIndexMap = new Map();
        for (let j = i; j <= e2; j++) {
            keyToNewIndexMap.set(newChildren[j].key, j);
        }

        const newIndexToOldIndexMap = new Array(e2 - i + 1).fill(-1);

        // Сопоставление старых индексов с новыми
        for (let j = i; j <= e1; j++) {
            const oldChild = oldChildren[j];
            const newIndex = keyToNewIndexMap.get(oldChild.key);

            if (newIndex === undefined) {
                patch.push({
                    type: "REMOVE_CHILD",
                    index: j,
                });
            } else {
                newIndexToOldIndexMap[newIndex - i] = j;
                patch.push({
                    type: "PATCH_CHILD",
                    index: j,
                    patch: diff(oldChild, newChildren[newIndex]),
                });
            }
        }

        // Поиск самого длинного возрастающего подпоследовательности
        const seq = findLongestIncreasingSubsequence(newIndexToOldIndexMap);
        let lastIndex = -1;

        for (let j = 0; j < newIndexToOldIndexMap.length; j++) {
            if (newIndexToOldIndexMap[j] === -1) {
                // Добавление нового элемента
                patch.push({
                    type: "ADD_CHILD",
                    index: i + j,
                    node: newChildren[i + j],
                });
            } else if (j !== seq[j]) {
                // Перемещение элемента
                patch.push({
                    type: "MOVE_CHILD",
                    from: newIndexToOldIndexMap[j],
                    to: i + j,
                });
            }
            lastIndex = j;
        }
    }
}

function isSameVNode(a, b) {
    if (!a || !b) return false;
    return a.type === b.type && a.key === b.key;
}

function findLongestIncreasingSubsequence(arr) {
    // Реализация алгоритма поиска LIS
    // (Для краткости используем упрощенную версию)
    const lis = [0];
    const prev = new Array(arr.length).fill(-1);

    for (let i = 1; i < arr.length; i++) {
        if (arr[i] === -1) continue;

        if (arr[i] > arr[lis[lis.length - 1]]) {
            prev[i] = lis[lis.length - 1];
            lis.push(i);
        } else {
            let left = 0,
                right = lis.length - 1;
            while (left < right) {
                const mid = (left + right) >> 1;
                if (arr[lis[mid]] < arr[i]) {
                    left = mid + 1;
                } else {
                    right = mid;
                }
            }

            if (arr[i] < arr[lis[left]]) {
                if (left > 0) prev[i] = lis[left - 1];
                lis[left] = i;
            }
        }
    }

    return lis;
}
