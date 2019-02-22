
interface Ioptions {
    el: object
    data: object
}

class Sue {
    constructor (options: Ioptions) {
        // 先把可用的东西挂载在实例上
        (<any>this).$el = options.el;
        (<any>this).$data = options.data;

        if ((<any>this).$el) {
            // 数据劫持，把对象的所有属性，改成`getter`和`setter`方法
            // @ts-ignore
            new Observer((<any>this).$data)
            this.proxyData((<any>this).$data)
            // 用数据和元素进行编译
            // @ts-ignore
            new Compile((<any>this).$el, this)
        }
    }
    proxyData (data: any) {
        Object.keys(data).map(key => {
            Object.defineProperty(this, key, {
                get () {
                    return data[key]
                },
                set (newValue) {
                    data[key] = newValue
                }
            })
        })
    }
}
