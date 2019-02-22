"use strict";
// 给需要变化的那个元素增加一个观察者，当数据变化后执行对应方法
/**
 * 用新值和老值进行比对　如果发生变化，就调用更新方法
 */
class Watcher {
    constructor(vm, expr, cb) {
        ;
        this.vm = vm;
        this.expr = expr;
        this.cb = cb;
        this.value = this.getValue();
    }
    getDataValue(vm, path) {
        return path.split('.').reduce((prev, next) => prev && prev[next], vm.$data);
    }
    getValue() {
        ;
        Dep.target = this; // 获取值，触发`defineProperty`的`get`方法
        let value = this.getDataValue(this.vm, this.expr);
        Dep.target = null;
        return value;
    }
    update() {
        let newValue = this.getValue();
        let oldValue = this.value;
        if (newValue !== oldValue) {
            this.cb(newValue);
        }
    }
}
class Dep {
    constructor() {
        // 订阅数组
        ;
        this.subs = [];
    }
    addSubs(watcher) {
        ;
        this.subs.push(watcher);
    }
    notify() {
        ;
        this.subs.forEach((watcher) => watcher && watcher.update());
    }
}
