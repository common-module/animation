define('Animation', function (require, exports, module) {
    var inherit = require('util:inherit');
    var Event = require('event:Event');
    var EventTarget = require('event:EventTarget');

    /**
     * 输出
     */
    module.exports = Animation;

    /**
     * 动画
     * @param {Object} options 配置
     */
    function Animation(options) {
        var me = this;

        /**
         * 继承事件的构造函数
         */
        EventTarget.call(me);

        /**
         * 验证参数，options
         */
        options = options || {};

        /**
         * 验证初始值
         */
        if (typeof options.startValue === 'undefined') {
            throw new Error('animation start value is required');
        }

        /**
         * 验证结束值
         */
        if (typeof options.endValue === 'undefined') {
            throw new Error('animation end value is required');
        }

        /**
         * 验证时长
         */
        if (typeof options.duration === 'undefined') {
            throw new Error('animation duration is required');
        }

        /**
         * 配置
         */
        me.config = {
            /**
             * 动画起始值
             */
            startValue: options.startValue,

            /**
             * 动画结束值
             */
            endValue: options.endValue,

            /**
             * 动画时长
             */
            duration: options.duration,

            /**
             * 曲线
             * 默认直线
             */
            delta: options.delta || function (value) {
                return value;
            },

            /**
             * 帧速率
             * 默认60
             */
            fps: options.fps || 60,

            /**
             * 让第一帧以起始值开始
             */
            enableStartValueFrame: options.enableStartValueFrame || true,

            /**
             * 让最后一帧以结束值结束
             */
            enableEndValueFrame: options.enableEndValueFrame || true
        }

        /**
         * 状态，有'initial'、'running'、'paused'、'stopped'和'end'
         * 默认'initial'
         */
        me.state = 'initial';

        /**
         * 监听动画开始事件
         */
        me.addEventListener('start', function (startEvent) {
            /**
             * 如果允许初始值为第一帧
             */
            if (me.config.enableStartValueFrame) {
                var frameEvent;

                frameEvent = new Event('frame');
                frameEvent.value = me.config.startValue;
                me.dispatchEvent(frameEvent);
            }
        });

        /**
         * 监听动画结束事件
         */
        me.addEventListener('end', function (endEvent) {
            /**
             * 如果允许结束值为最后一帧
             */
            if (me.config.enableEndValueFrame) {
                var frameEvent;

                frameEvent = new Event('frame');
                frameEvent.value = me.config.endValue;
                me.dispatchEvent(frameEvent);
            }
        });
    }

    /**
     * 继承事件原型
     */
    inherit(Animation, EventTarget);

    /**
     * 开始动画
     */
    Animation.prototype.start = function () {
        var me = this;

        /**
         * 判断动画是否已开始
         */
        if (me.state !== 'initial') {
            throw new Error('animation is started');
        }

        /**
         * 标注动画状态为运行
         */
        me.state = 'running';

        /**
         * 派发开始事件
         */
        var startEvent;

        startEvent = new Event('start');
        startEvent.value = me.config.startValue;
        me.dispatchEvent(startEvent);

        /**
         * 开始动画的每一帧
         */
        me.startTime = new Date();
        me.timeoutId = setTimeout(oneFrame, 1000 / me.config.fps);

        function oneFrame() {
            /**
             * 先清空timeoutId
             */
            me.timeoutId = null

            /**
             * 判断动画状态是否在运行
             */
            if (me.state !== 'running') {
                return;
            }

            /**
             * 逝去时间
             */
            var passedTime = new Date() - me.startTime;

            /**
             * 判断逝去时间与动画的总时间
             */
            if (passedTime >= me.config.duration) {
                /**
                 * 逝去时间已到，标注动画状态为结束
                 */
                me.state = 'end';

                /**
                 * 派发结束事件
                 */
                var endEvent;

                endEvent = new Event('end');
                endEvent.value = me.config.endValue;
                me.dispatchEvent(endEvent);
            } else {
                /**
                 * 逝去时间还没到
                 */

                /**
                 * 值改变了多少
                 */
                var valueChang;

                valueChang = (me.config.endValue - me.config.startValue) * me.config.delta((passedTime / me.config.duration));

                /**
                 * 派发帧事件
                 */
                var frameEvent;

                frameEvent = new Event('frame');
                frameEvent.value = me.config.startValue + valueChang;
                me.dispatchEvent(frameEvent);

                /**
                 * 如果动画还在运行，继续下一帧
                 */
                if (me.state === 'running') {
                    me.timeoutId = setTimeout(oneFrame, 1000 / me.config.fps);
                }
            }
        }
    }

    /**
     * 停止动画
     */
    Animation.prototype.stop = function () {
        var me = this;

        if (me.state !== 'running') {
            throw new Error('animation is not running');
        }

        if (typeof me.timeoutId === 'undefined' || me.timeoutId === null) {
            throw new Error('no timeout has found');
        }

        /**
         * 清空timeout
         */
        clearTimeout(me.timeoutId);
        me.timeoutId = null;

        /**
         * 标注动画状态为停止
         */
        me.state = 'stopped';
    }

    /**
     * 暂停动画
     * TODO
     */
    Animation.prototype.pause = function () {
        var me = this;

        if (me.state !== 'running') {
            throw new Error('animation is not running');
        }

        if (typeof me.timeoutId === 'undefined' || me.timeoutId === null) {
            throw new Error('no timeout has found');
        }

        /**
         * 清空timeout
         */
        clearTimeout(me.timeoutId);
        me.timeoutId = null;

        /**
         * 标注动画状态为暂停
         */
        me.state = 'paused';
    }

    /**
     * 恢复动画
     * TODO
     */
    Animation.prototype.resume = function () {
        var me = this;

        if (me.state !== 'paused') {
            throw new Error('animation is not paused');
        }

        /**
         * 标注动画状态为运行
         */
        me.state = 'running';
    }

    /**
     * 获取动画当前的值
     */
    Animation.prototype.getValue = function () {
        var me = this;
        var passedTime;

        passedTime = new Date() - me.startTime;
        valueChang = (me.config.endValue - me.config.startValue) * me.config.delta((passedTime / me.config.duration));

        return me.config.startValue + valueChang;
    }

    /**
     * 获取动画初始值
     */
    Animation.prototype.getStartValue = function () {
        return this.config.startValue;
    }

    /**
     * 获取动画结束值
     */
    Animation.prototype.getEndValue = function () {
        return this.config.endValue;
    }
});
