
class Observer {
    private data: object
    constructor (data: object) {
        this.data = data
        this.observer(data)
    }
    observer (data: object) {
        // 把data数据，改成`getter`和`setter`的形式
        if (!data || typeof data !== 'object') return
        Object.keys(data).map(key => {
            // 劫持数据
            this.defineReactive(data, key, (<any>data)[key])
            this.observer((<any>data)[key]) // 深度递归劫持
        })
    }
    // 定义响应
    defineReactive (obj: any, key: string, value: any) {
        let _this = this
        let dep = new Dep() // 每个变化的数据都会对应一个数组，这个数组是存放所有的更新操作
        Object.defineProperty(obj, key, {
            enumerable: true,
            configurable: true,
            get () {
                Dep.target && dep.addSubs(Dep.target)
                return value
            },
            set (newValue) {
                if (newValue !== value) {
                    _this.observer(newValue)
                    value = newValue
                    dep.notify() // 通知所有人，数据更新
                }
            }
        })
    }
}
