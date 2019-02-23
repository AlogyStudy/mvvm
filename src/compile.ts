class Compile {
    private el: any
    private vm: any
    constructor (el: any, vm: any) {
        this.el = this.isElementNode(el) ? el : document.querySelector(el)
        this.vm = vm
        if (this.el) {
            // 获取到元素
            /**
             * 1. 先把真实的DOM移入到内存中, fragment(文档碎片)
             * 2. 编译 -> 提取需要的元素节点（v-model）和 文本节点{{}}
             * 3. 把编译好的fragment在放回到document
             */
            let fragment = this.node2Fragment(this.el)
            this.compile(fragment)
            this.el.appendChild(fragment)
        }
    }
    // =================================
    // 专门辅助的方法
    isElementNode (node: Node): boolean {
        return node.nodeType === 1
    }
    isDirective (name: string): boolean {
        // return ~name.indexOf('v-') === -1
        return name.includes('v-')
    }
    // =================================
    // 核心的方法
    compileElement (node: Element | Node): void {
        // 带 v-model, v-text
        let attrs = (<any>node).attributes // 取出当前节点类型
        Array.from(attrs).forEach(attr => {
            // 判断属性名字是否包含`v-`
            let attrName = (<any>attr).name
            if (this.isDirective(attrName)) {
                // 取到对应的值放到节点上
                let expr = (<any>attr).value
                // node this.vm.$data, key // v-model v-text v-html
                // let funName = attrName.slice(attrName.indexOf('-') + 1)
                let [, funName] = attrName.split('-')
                ;(<any>CompileUtil)[funName](node, this.vm, expr)
            }
        })
    }
    compileText (node: Node): void {
        // 带 {{}}
        let expr: string = <string>node.textContent // 取文本中的内容
        let reg = /\{\{([^}]+)\}\}/g
        if (expr && reg.test(expr)) {
            // node this.vm.$data text
            ;(<any>CompileUtil)['text'](node, this.vm, expr)
        }
    }
    compile (fragment: DocumentFragment | Node): void {
        // 递归方法
        let childNodes = fragment.childNodes
        Array.from(childNodes).forEach(node => {
            if (this.isElementNode(node)) {
                // 元素节点，继续深入检查
                // 编译元素
                this.compileElement(node)
                this.compile(node)
            } else {
                // 文本节点
                this.compileText(node)
            }
        })
    }
    node2Fragment (el: Element): DocumentFragment {
        let fragment = document.createDocumentFragment()
        let firstChild
        while (firstChild = el.firstChild) {
            fragment.appendChild(firstChild)
        }
        return fragment // 返回内存中的节点
    }
}


let CompileUtil: ICompileUtil = {
    // 获取实例上对应的数据
    getDataValue (vm: any, path: string): string {
        return path.split('.').reduce((prev, next) => prev && prev[next], vm.$data)
        // let expr = path.split('.') // ['msg', 'a', 'c'] 把第一次的结果，传到下一次。 reduce
        // return expr.reduce((prev, next) => {
        //     return prev[next]
        // }, vm.$data)
    },
    getDataText (vm: any, expr: string): string {
        return expr.trim().replace(/^\{\{([^}]+)\}\}/g, ($1, $2) => {
            return this.getDataValue(vm, $2)
        })
    },
    setDataValue (vm: any, expr: string, newValue: string): void {
        let path = expr.split('.')
        return path.reduce((prev, next, currentIndex) => {
            if (currentIndex === path.length - 1) {
                return prev[next] = newValue
            }
            return prev[next]
        }, vm.$data)
    },
    text (node: Node, vm: any, expr: string): void { // 文本处理
        let updateFn = this.updater.textUpdater
        let value = this.getDataText(vm, expr)
        // {{a}} {{b}}
        expr.trim().replace(/^\{\{([^}]+)\}\}/g, ($1, $2) => {
            // @ts-ignore
            new Watcher(vm, $2, (newValue) => {
                // 如果数据变化了，　文本节点需要重新获取依赖的属性更新文本的内容
                updateFn && updateFn(node, this.getDataText(vm, expr))
            })
            return ''
        })
        updateFn && updateFn(node, value)
    },
    model (node: Node, vm: any, expr: string): void { // 输入框处理
        let updateFn = this.updater.modelUpdater
        // 'msg.a' -> ['msg', 'a'] -> vm.$data.msg.a
        // expr.split('.')
        // 加监控，　数据变化了，应该调用这个watch的callback
        // @ts-ignore
        new Watcher(vm, expr, (newValue) => {
            // 当新值变化后会调用cb, 将新的值传递过来，等待`update`
            updateFn && updateFn(node, this.getDataValue(vm, expr))
        })
        node.addEventListener('input', (e: Event) => {
            let newValue = (<any>e.target).value
            this.setDataValue(vm, expr, newValue)
        })
        updateFn && updateFn(node, this.getDataValue(vm, expr))
    },
    html () {},
    updater: {
        // 文本更新
        textUpdater (node: Node, value: string): void {
            node.textContent = value
        },
        // 输入框更新
        modelUpdater (node: Node, value: string): void {
            (<any>node).value = value
        },
        // html更新
        htmlUpdater (): void {}
    }
}

interface ICompileUtil {
    getDataValue (vm: any, path: string): string
    getDataText (vm: any, expr: string): string
    setDataValue(vm: any, expr: string, newValue: string): void
    text(node: Node, vm: any, expr: string): void
    model(node: Node, vm: any, expr: string): void
    html(): void
    updater: {
        textUpdater (node: Node, value: string): void
        modelUpdater (node: Node, value: string): void
        htmlUpdater (): void
    }
}
