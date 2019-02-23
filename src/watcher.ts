
// 给需要变化的那个元素增加一个观察者，当数据变化后执行对应方法

/**
 * 用新值和老值进行比对　如果发生变化，就调用更新方法
 */
class Watcher {
    private vm: any
    private expr: string
    private cb: Function
    private value: any
    constructor (vm: any, expr: string, cb: Function) {
        this.vm = vm
        this.expr = expr
        this.cb = cb
        // 获取老值
        this.value = this.getValue()
    }
    getDataValue (vm: any, path: string): string {
        return path.split('.').reduce((prev, next) => prev && prev[next], vm.$data)
    }
    getValue (): string {
        Dep.target = this // 获取值，触发`defineProperty`的`get`方法
        let value = this.getDataValue(this.vm, this.expr)
        Dep.target = null
        return value
    }
    update () {
        let newValue = this.getValue()
        let oldValue = this.value
        if (newValue !== oldValue) {
            this.cb(newValue)
        }
    }
}

class Dep {
    private subs: Array<any>
    static target: any
    constructor () {
        // 订阅数组
        this.subs = []
    }
    addSubs (watcher: Watcher) {
        this.subs.push(watcher)
    }
    notify () {
        this.subs.forEach((watcher: any) => watcher && watcher.update())
    }
}