
// 给需要变化的那个元素增加一个观察者，当数据变化后执行对应方法

/**
 * 用新值和老值进行比对　如果发生变化，就调用更新方法
 */
class Watcher {
    constructor (vm: any, expr: string, cb: Function) {
        ;(<any>this).vm = vm
        ;(<any>this).expr = expr
        ;(<any>this).cb = cb
        // 获取老值
        ;(<any>this).value = this.getValue()
    }
    getDataValue (vm: any, path: string): string {
        return path.split('.').reduce((prev, next) => prev && prev[next], vm.$data)
    }
    getValue (): string {
        ;(<any>Dep).target = this // 获取值，触发`defineProperty`的`get`方法
        let value = this.getDataValue((<any>this).vm, (<any>this).expr)
        ;(<any>Dep).target = null
        return value
    }
    update () {
        let newValue = this.getValue()
        let oldValue = (<any>this).value
        if (newValue !== oldValue) {
            (<any>this).cb(newValue)
        }
    }
}

class Dep {
    constructor () {
        // 订阅数组
        ;(<any>this).subs = []
    }
    addSubs (watcher: Watcher) {
        ;(<any>this).subs.push(watcher)
    }
    notify () {
        ;(<any>this).subs.forEach((watcher: any) => watcher && watcher.update())
    }
}