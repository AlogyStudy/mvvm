"use strict";
class Sue {
    constructor(options) {
        // 先把可用的东西挂载在实例上
        this.$el = options.el;
        this.$data = options.data;
        if (this.$el) {
            // 数据劫持，把对象的所有属性，改成`getter`和`setter`方法
            // @ts-ignore
            new Observer(this.$data);
            this.proxyData(this.$data);
            // 用数据和元素进行编译
            // @ts-ignore
            new Compile(this.$el, this);
        }
    }
    proxyData(data) {
        Object.keys(data).map(key => {
            Object.defineProperty(this, key, {
                get() {
                    return data[key];
                },
                set(newValue) {
                    data[key] = newValue;
                }
            });
        });
    }
}
