"use strict";
class Compile {
    constructor(el, vm) {
        ;
        this.el = this.isElementNode(el) ? el : document.querySelector(el);
        this.vm = vm;
        if (this.el) {
            // 获取到元素
            /**
             * 1. 先把真实的DOM移入到内存中, fragment(文档碎片)
             * 2. 编译 -> 提取需要的元素节点（v-model）和 文本节点{{}}
             * 3. 把编译好的fragment在放回到document
             */
            let fragment = this.node2Fragment(this.el);
            this.compile(fragment);
            this.el.appendChild(fragment);
        }
    }
    // =================================
    // 专门辅助的方法
    isElementNode(node) {
        return node.nodeType === 1;
    }
    isDirective(name) {
        // return ~name.indexOf('v-') === -1
        return name.includes('v-');
    }
    // =================================
    // 核心的方法
    compileElement(node) {
        // 带 v-model, v-text
        let attrs = node.attributes; // 取出当前节点类型
        Array.from(attrs).forEach(attr => {
            // 判断属性名字是否包含`v-`
            let attrName = attr.name;
            if (this.isDirective(attrName)) {
                // 取到对应的值放到节点上
                let expr = attr.value;
                // node this.vm.$data, key // v-model v-text v-html
                // let funName = attrName.slice(attrName.indexOf('-') + 1)
                let [, funName] = attrName.split('-');
                CompileUtil[funName](node, this.vm, expr);
            }
        });
    }
    compileText(node) {
        // 带 {{}}
        let expr = node.textContent; // 取文本中的内容
        let reg = /\{\{([^}]+)\}\}/g;
        if (expr && reg.test(expr)) {
            // node this.vm.$data text
            ;
            CompileUtil['text'](node, this.vm, expr);
        }
    }
    compile(fragment) {
        // 递归方法
        let childNodes = fragment.childNodes;
        Array.from(childNodes).forEach(node => {
            if (this.isElementNode(node)) {
                // 元素节点，继续深入检查
                // 编译元素
                this.compileElement(node);
                this.compile(node);
            }
            else {
                // 文本节点
                this.compileText(node);
            }
        });
    }
    node2Fragment(el) {
        let fragment = document.createDocumentFragment();
        let firstChild;
        while (firstChild = el.firstChild) {
            fragment.appendChild(firstChild);
        }
        return fragment; // 返回内存中的节点
    }
}
let CompileUtil = {
    // 获取实例上对应的数据
    getDataValue(vm, path) {
        return path.split('.').reduce((prev, next) => prev && prev[next], vm.$data);
        // let expr = path.split('.') // ['msg', 'a', 'c'] 把第一次的结果，传到下一次。 reduce
        // return expr.reduce((prev, next) => {
        //     return prev[next]
        // }, vm.$data)
    },
    getDataText(vm, expr) {
        return expr.trim().replace(/^\{\{([^}]+)\}\}/g, ($1, $2) => {
            return this.getDataValue(vm, $2);
        });
    },
    setDataValue(vm, expr, newValue) {
        let path = expr.split('.');
        return path.reduce((prev, next, currentIndex) => {
            if (currentIndex === path.length - 1) {
                return prev[next] = newValue;
            }
            return prev[next];
        }, vm.$data);
    },
    text(node, vm, expr) {
        let updateFn = this.updater.textUpdater;
        let value = this.getDataText(vm, expr);
        // {{a}} {{b}}
        expr.trim().replace(/^\{\{([^}]+)\}\}/g, ($1, $2) => {
            // @ts-ignore
            new Watcher(vm, $2, (newValue) => {
                // 如果数据变化了，　文本节点需要重新获取依赖的属性更新文本的内容
                updateFn && updateFn(node, this.getDataText(vm, expr));
            });
            return '';
        });
        updateFn && updateFn(node, value);
    },
    model(node, vm, expr) {
        let updateFn = this.updater.modelUpdater;
        // 'msg.a' -> ['msg', 'a'] -> vm.$data.msg.a
        // expr.split('.')
        // 加监控，　数据变化了，应该调用这个watch的callback
        // @ts-ignore
        new Watcher(vm, expr, (newValue) => {
            // 当新值变化后会调用cb, 将新的值传递过来，等待`update`
            updateFn && updateFn(node, this.getDataValue(vm, expr));
        });
        node.addEventListener('input', (e) => {
            let newValue = e.target.value;
            this.setDataValue(vm, expr, newValue);
        });
        updateFn && updateFn(node, this.getDataValue(vm, expr));
    },
    html() { },
    updater: {
        // 文本更新
        textUpdater(node, value) {
            node.textContent = value;
        },
        // 输入框更新
        modelUpdater(node, value) {
            node.value = value;
        },
        // html更新
        htmlUpdater() { }
    }
};
