
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_attributes(node, attributes) {
        // @ts-ignore
        const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
        for (const key in attributes) {
            if (attributes[key] == null) {
                node.removeAttribute(key);
            }
            else if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (key === '__value') {
                node.value = node[key] = attributes[key];
            }
            else if (descriptors[key] && descriptors[key].set) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.24.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    const LOCATION = {};
    const ROUTER = {};

    /**
     * Adapted from https://github.com/reach/router/blob/b60e6dd781d5d3a4bdaaf4de665649c0f6a7e78d/src/lib/history.js
     *
     * https://github.com/reach/router/blob/master/LICENSE
     * */

    function getLocation(source) {
      return {
        ...source.location,
        state: source.history.state,
        key: (source.history.state && source.history.state.key) || "initial"
      };
    }

    function createHistory(source, options) {
      const listeners = [];
      let location = getLocation(source);

      return {
        get location() {
          return location;
        },

        listen(listener) {
          listeners.push(listener);

          const popstateListener = () => {
            location = getLocation(source);
            listener({ location, action: "POP" });
          };

          source.addEventListener("popstate", popstateListener);

          return () => {
            source.removeEventListener("popstate", popstateListener);

            const index = listeners.indexOf(listener);
            listeners.splice(index, 1);
          };
        },

        navigate(to, { state, replace = false } = {}) {
          state = { ...state, key: Date.now() + "" };
          // try...catch iOS Safari limits to 100 pushState calls
          try {
            if (replace) {
              source.history.replaceState(state, null, to);
            } else {
              source.history.pushState(state, null, to);
            }
          } catch (e) {
            source.location[replace ? "replace" : "assign"](to);
          }

          location = getLocation(source);
          listeners.forEach(listener => listener({ location, action: "PUSH" }));
        }
      };
    }

    // Stores history entries in memory for testing or other platforms like Native
    function createMemorySource(initialPathname = "/") {
      let index = 0;
      const stack = [{ pathname: initialPathname, search: "" }];
      const states = [];

      return {
        get location() {
          return stack[index];
        },
        addEventListener(name, fn) {},
        removeEventListener(name, fn) {},
        history: {
          get entries() {
            return stack;
          },
          get index() {
            return index;
          },
          get state() {
            return states[index];
          },
          pushState(state, _, uri) {
            const [pathname, search = ""] = uri.split("?");
            index++;
            stack.push({ pathname, search });
            states.push(state);
          },
          replaceState(state, _, uri) {
            const [pathname, search = ""] = uri.split("?");
            stack[index] = { pathname, search };
            states[index] = state;
          }
        }
      };
    }

    // Global history uses window.history as the source if available,
    // otherwise a memory history
    const canUseDOM = Boolean(
      typeof window !== "undefined" &&
        window.document &&
        window.document.createElement
    );
    const globalHistory = createHistory(canUseDOM ? window : createMemorySource());
    const { navigate } = globalHistory;

    /**
     * Adapted from https://github.com/reach/router/blob/b60e6dd781d5d3a4bdaaf4de665649c0f6a7e78d/src/lib/utils.js
     *
     * https://github.com/reach/router/blob/master/LICENSE
     * */

    const paramRe = /^:(.+)/;

    const SEGMENT_POINTS = 4;
    const STATIC_POINTS = 3;
    const DYNAMIC_POINTS = 2;
    const SPLAT_PENALTY = 1;
    const ROOT_POINTS = 1;

    /**
     * Check if `string` starts with `search`
     * @param {string} string
     * @param {string} search
     * @return {boolean}
     */
    function startsWith(string, search) {
      return string.substr(0, search.length) === search;
    }

    /**
     * Check if `segment` is a root segment
     * @param {string} segment
     * @return {boolean}
     */
    function isRootSegment(segment) {
      return segment === "";
    }

    /**
     * Check if `segment` is a dynamic segment
     * @param {string} segment
     * @return {boolean}
     */
    function isDynamic(segment) {
      return paramRe.test(segment);
    }

    /**
     * Check if `segment` is a splat
     * @param {string} segment
     * @return {boolean}
     */
    function isSplat(segment) {
      return segment[0] === "*";
    }

    /**
     * Split up the URI into segments delimited by `/`
     * @param {string} uri
     * @return {string[]}
     */
    function segmentize(uri) {
      return (
        uri
          // Strip starting/ending `/`
          .replace(/(^\/+|\/+$)/g, "")
          .split("/")
      );
    }

    /**
     * Strip `str` of potential start and end `/`
     * @param {string} str
     * @return {string}
     */
    function stripSlashes(str) {
      return str.replace(/(^\/+|\/+$)/g, "");
    }

    /**
     * Score a route depending on how its individual segments look
     * @param {object} route
     * @param {number} index
     * @return {object}
     */
    function rankRoute(route, index) {
      const score = route.default
        ? 0
        : segmentize(route.path).reduce((score, segment) => {
            score += SEGMENT_POINTS;

            if (isRootSegment(segment)) {
              score += ROOT_POINTS;
            } else if (isDynamic(segment)) {
              score += DYNAMIC_POINTS;
            } else if (isSplat(segment)) {
              score -= SEGMENT_POINTS + SPLAT_PENALTY;
            } else {
              score += STATIC_POINTS;
            }

            return score;
          }, 0);

      return { route, score, index };
    }

    /**
     * Give a score to all routes and sort them on that
     * @param {object[]} routes
     * @return {object[]}
     */
    function rankRoutes(routes) {
      return (
        routes
          .map(rankRoute)
          // If two routes have the exact same score, we go by index instead
          .sort((a, b) =>
            a.score < b.score ? 1 : a.score > b.score ? -1 : a.index - b.index
          )
      );
    }

    /**
     * Ranks and picks the best route to match. Each segment gets the highest
     * amount of points, then the type of segment gets an additional amount of
     * points where
     *
     *  static > dynamic > splat > root
     *
     * This way we don't have to worry about the order of our routes, let the
     * computers do it.
     *
     * A route looks like this
     *
     *  { path, default, value }
     *
     * And a returned match looks like:
     *
     *  { route, params, uri }
     *
     * @param {object[]} routes
     * @param {string} uri
     * @return {?object}
     */
    function pick(routes, uri) {
      let match;
      let default_;

      const [uriPathname] = uri.split("?");
      const uriSegments = segmentize(uriPathname);
      const isRootUri = uriSegments[0] === "";
      const ranked = rankRoutes(routes);

      for (let i = 0, l = ranked.length; i < l; i++) {
        const route = ranked[i].route;
        let missed = false;

        if (route.default) {
          default_ = {
            route,
            params: {},
            uri
          };
          continue;
        }

        const routeSegments = segmentize(route.path);
        const params = {};
        const max = Math.max(uriSegments.length, routeSegments.length);
        let index = 0;

        for (; index < max; index++) {
          const routeSegment = routeSegments[index];
          const uriSegment = uriSegments[index];

          if (routeSegment !== undefined && isSplat(routeSegment)) {
            // Hit a splat, just grab the rest, and return a match
            // uri:   /files/documents/work
            // route: /files/* or /files/*splatname
            const splatName = routeSegment === "*" ? "*" : routeSegment.slice(1);

            params[splatName] = uriSegments
              .slice(index)
              .map(decodeURIComponent)
              .join("/");
            break;
          }

          if (uriSegment === undefined) {
            // URI is shorter than the route, no match
            // uri:   /users
            // route: /users/:userId
            missed = true;
            break;
          }

          let dynamicMatch = paramRe.exec(routeSegment);

          if (dynamicMatch && !isRootUri) {
            const value = decodeURIComponent(uriSegment);
            params[dynamicMatch[1]] = value;
          } else if (routeSegment !== uriSegment) {
            // Current segments don't match, not dynamic, not splat, so no match
            // uri:   /users/123/settings
            // route: /users/:id/profile
            missed = true;
            break;
          }
        }

        if (!missed) {
          match = {
            route,
            params,
            uri: "/" + uriSegments.slice(0, index).join("/")
          };
          break;
        }
      }

      return match || default_ || null;
    }

    /**
     * Check if the `path` matches the `uri`.
     * @param {string} path
     * @param {string} uri
     * @return {?object}
     */
    function match(route, uri) {
      return pick([route], uri);
    }

    /**
     * Add the query to the pathname if a query is given
     * @param {string} pathname
     * @param {string} [query]
     * @return {string}
     */
    function addQuery(pathname, query) {
      return pathname + (query ? `?${query}` : "");
    }

    /**
     * Resolve URIs as though every path is a directory, no files. Relative URIs
     * in the browser can feel awkward because not only can you be "in a directory",
     * you can be "at a file", too. For example:
     *
     *  browserSpecResolve('foo', '/bar/') => /bar/foo
     *  browserSpecResolve('foo', '/bar') => /foo
     *
     * But on the command line of a file system, it's not as complicated. You can't
     * `cd` from a file, only directories. This way, links have to know less about
     * their current path. To go deeper you can do this:
     *
     *  <Link to="deeper"/>
     *  // instead of
     *  <Link to=`{${props.uri}/deeper}`/>
     *
     * Just like `cd`, if you want to go deeper from the command line, you do this:
     *
     *  cd deeper
     *  # not
     *  cd $(pwd)/deeper
     *
     * By treating every path as a directory, linking to relative paths should
     * require less contextual information and (fingers crossed) be more intuitive.
     * @param {string} to
     * @param {string} base
     * @return {string}
     */
    function resolve(to, base) {
      // /foo/bar, /baz/qux => /foo/bar
      if (startsWith(to, "/")) {
        return to;
      }

      const [toPathname, toQuery] = to.split("?");
      const [basePathname] = base.split("?");
      const toSegments = segmentize(toPathname);
      const baseSegments = segmentize(basePathname);

      // ?a=b, /users?b=c => /users?a=b
      if (toSegments[0] === "") {
        return addQuery(basePathname, toQuery);
      }

      // profile, /users/789 => /users/789/profile
      if (!startsWith(toSegments[0], ".")) {
        const pathname = baseSegments.concat(toSegments).join("/");

        return addQuery((basePathname === "/" ? "" : "/") + pathname, toQuery);
      }

      // ./       , /users/123 => /users/123
      // ../      , /users/123 => /users
      // ../..    , /users/123 => /
      // ../../one, /a/b/c/d   => /a/b/one
      // .././one , /a/b/c/d   => /a/b/c/one
      const allSegments = baseSegments.concat(toSegments);
      const segments = [];

      allSegments.forEach(segment => {
        if (segment === "..") {
          segments.pop();
        } else if (segment !== ".") {
          segments.push(segment);
        }
      });

      return addQuery("/" + segments.join("/"), toQuery);
    }

    /**
     * Combines the `basepath` and the `path` into one path.
     * @param {string} basepath
     * @param {string} path
     */
    function combinePaths(basepath, path) {
      return `${stripSlashes(
    path === "/" ? basepath : `${stripSlashes(basepath)}/${stripSlashes(path)}`
  )}/`;
    }

    /**
     * Decides whether a given `event` should result in a navigation or not.
     * @param {object} event
     */
    function shouldNavigate(event) {
      return (
        !event.defaultPrevented &&
        event.button === 0 &&
        !(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
      );
    }

    function hostMatches(anchor) {
      const host = location.host;
      return (
        anchor.host == host ||
        // svelte seems to kill anchor.host value in ie11, so fall back to checking href
        anchor.href.indexOf(`https://${host}`) === 0 ||
        anchor.href.indexOf(`http://${host}`) === 0
      )
    }

    /* node_modules\svelte-routing\src\Router.svelte generated by Svelte v3.24.0 */

    function create_fragment(ctx) {
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[6].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 32) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[5], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $base;
    	let $location;
    	let $routes;
    	let { basepath = "/" } = $$props;
    	let { url = null } = $$props;
    	const locationContext = getContext(LOCATION);
    	const routerContext = getContext(ROUTER);
    	const routes = writable([]);
    	validate_store(routes, "routes");
    	component_subscribe($$self, routes, value => $$invalidate(10, $routes = value));
    	const activeRoute = writable(null);
    	let hasActiveRoute = false; // Used in SSR to synchronously set that a Route is active.

    	// If locationContext is not set, this is the topmost Router in the tree.
    	// If the `url` prop is given we force the location to it.
    	const location = locationContext || writable(url ? { pathname: url } : globalHistory.location);

    	validate_store(location, "location");
    	component_subscribe($$self, location, value => $$invalidate(9, $location = value));

    	// If routerContext is set, the routerBase of the parent Router
    	// will be the base for this Router's descendants.
    	// If routerContext is not set, the path and resolved uri will both
    	// have the value of the basepath prop.
    	const base = routerContext
    	? routerContext.routerBase
    	: writable({ path: basepath, uri: basepath });

    	validate_store(base, "base");
    	component_subscribe($$self, base, value => $$invalidate(8, $base = value));

    	const routerBase = derived([base, activeRoute], ([base, activeRoute]) => {
    		// If there is no activeRoute, the routerBase will be identical to the base.
    		if (activeRoute === null) {
    			return base;
    		}

    		const { path: basepath } = base;
    		const { route, uri } = activeRoute;

    		// Remove the potential /* or /*splatname from
    		// the end of the child Routes relative paths.
    		const path = route.default
    		? basepath
    		: route.path.replace(/\*.*$/, "");

    		return { path, uri };
    	});

    	function registerRoute(route) {
    		const { path: basepath } = $base;
    		let { path } = route;

    		// We store the original path in the _path property so we can reuse
    		// it when the basepath changes. The only thing that matters is that
    		// the route reference is intact, so mutation is fine.
    		route._path = path;

    		route.path = combinePaths(basepath, path);

    		if (typeof window === "undefined") {
    			// In SSR we should set the activeRoute immediately if it is a match.
    			// If there are more Routes being registered after a match is found,
    			// we just skip them.
    			if (hasActiveRoute) {
    				return;
    			}

    			const matchingRoute = match(route, $location.pathname);

    			if (matchingRoute) {
    				activeRoute.set(matchingRoute);
    				hasActiveRoute = true;
    			}
    		} else {
    			routes.update(rs => {
    				rs.push(route);
    				return rs;
    			});
    		}
    	}

    	function unregisterRoute(route) {
    		routes.update(rs => {
    			const index = rs.indexOf(route);
    			rs.splice(index, 1);
    			return rs;
    		});
    	}

    	if (!locationContext) {
    		// The topmost Router in the tree is responsible for updating
    		// the location store and supplying it through context.
    		onMount(() => {
    			const unlisten = globalHistory.listen(history => {
    				location.set(history.location);
    			});

    			return unlisten;
    		});

    		setContext(LOCATION, location);
    	}

    	setContext(ROUTER, {
    		activeRoute,
    		base,
    		routerBase,
    		registerRoute,
    		unregisterRoute
    	});

    	const writable_props = ["basepath", "url"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Router", $$slots, ['default']);

    	$$self.$set = $$props => {
    		if ("basepath" in $$props) $$invalidate(3, basepath = $$props.basepath);
    		if ("url" in $$props) $$invalidate(4, url = $$props.url);
    		if ("$$scope" in $$props) $$invalidate(5, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		setContext,
    		onMount,
    		writable,
    		derived,
    		LOCATION,
    		ROUTER,
    		globalHistory,
    		pick,
    		match,
    		stripSlashes,
    		combinePaths,
    		basepath,
    		url,
    		locationContext,
    		routerContext,
    		routes,
    		activeRoute,
    		hasActiveRoute,
    		location,
    		base,
    		routerBase,
    		registerRoute,
    		unregisterRoute,
    		$base,
    		$location,
    		$routes
    	});

    	$$self.$inject_state = $$props => {
    		if ("basepath" in $$props) $$invalidate(3, basepath = $$props.basepath);
    		if ("url" in $$props) $$invalidate(4, url = $$props.url);
    		if ("hasActiveRoute" in $$props) hasActiveRoute = $$props.hasActiveRoute;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$base*/ 256) {
    			// This reactive statement will update all the Routes' path when
    			// the basepath changes.
    			 {
    				const { path: basepath } = $base;

    				routes.update(rs => {
    					rs.forEach(r => r.path = combinePaths(basepath, r._path));
    					return rs;
    				});
    			}
    		}

    		if ($$self.$$.dirty & /*$routes, $location*/ 1536) {
    			// This reactive statement will be run when the Router is created
    			// when there are no Routes and then again the following tick, so it
    			// will not find an active Route in SSR and in the browser it will only
    			// pick an active Route after all Routes have been registered.
    			 {
    				const bestMatch = pick($routes, $location.pathname);
    				activeRoute.set(bestMatch);
    			}
    		}
    	};

    	return [routes, location, base, basepath, url, $$scope, $$slots];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { basepath: 3, url: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get basepath() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set basepath(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get url() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set url(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelte-routing\src\Route.svelte generated by Svelte v3.24.0 */

    const get_default_slot_changes = dirty => ({
    	params: dirty & /*routeParams*/ 2,
    	location: dirty & /*$location*/ 16
    });

    const get_default_slot_context = ctx => ({
    	params: /*routeParams*/ ctx[1],
    	location: /*$location*/ ctx[4]
    });

    // (40:0) {#if $activeRoute !== null && $activeRoute.route === route}
    function create_if_block(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*component*/ ctx[0] !== null) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(40:0) {#if $activeRoute !== null && $activeRoute.route === route}",
    		ctx
    	});

    	return block;
    }

    // (43:2) {:else}
    function create_else_block(ctx) {
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[10].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[9], get_default_slot_context);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope, routeParams, $location*/ 530) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[9], dirty, get_default_slot_changes, get_default_slot_context);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(43:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (41:2) {#if component !== null}
    function create_if_block_1(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;

    	const switch_instance_spread_levels = [
    		{ location: /*$location*/ ctx[4] },
    		/*routeParams*/ ctx[1],
    		/*routeProps*/ ctx[2]
    	];

    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*$location, routeParams, routeProps*/ 22)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*$location*/ 16 && { location: /*$location*/ ctx[4] },
    					dirty & /*routeParams*/ 2 && get_spread_object(/*routeParams*/ ctx[1]),
    					dirty & /*routeProps*/ 4 && get_spread_object(/*routeProps*/ ctx[2])
    				])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(41:2) {#if component !== null}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$activeRoute*/ ctx[3] !== null && /*$activeRoute*/ ctx[3].route === /*route*/ ctx[7] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$activeRoute*/ ctx[3] !== null && /*$activeRoute*/ ctx[3].route === /*route*/ ctx[7]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$activeRoute*/ 8) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $activeRoute;
    	let $location;
    	let { path = "" } = $$props;
    	let { component = null } = $$props;
    	const { registerRoute, unregisterRoute, activeRoute } = getContext(ROUTER);
    	validate_store(activeRoute, "activeRoute");
    	component_subscribe($$self, activeRoute, value => $$invalidate(3, $activeRoute = value));
    	const location = getContext(LOCATION);
    	validate_store(location, "location");
    	component_subscribe($$self, location, value => $$invalidate(4, $location = value));

    	const route = {
    		path,
    		// If no path prop is given, this Route will act as the default Route
    		// that is rendered if no other Route in the Router is a match.
    		default: path === ""
    	};

    	let routeParams = {};
    	let routeProps = {};
    	registerRoute(route);

    	// There is no need to unregister Routes in SSR since it will all be
    	// thrown away anyway.
    	if (typeof window !== "undefined") {
    		onDestroy(() => {
    			unregisterRoute(route);
    		});
    	}

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Route", $$slots, ['default']);

    	$$self.$set = $$new_props => {
    		$$invalidate(13, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("path" in $$new_props) $$invalidate(8, path = $$new_props.path);
    		if ("component" in $$new_props) $$invalidate(0, component = $$new_props.component);
    		if ("$$scope" in $$new_props) $$invalidate(9, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		onDestroy,
    		ROUTER,
    		LOCATION,
    		path,
    		component,
    		registerRoute,
    		unregisterRoute,
    		activeRoute,
    		location,
    		route,
    		routeParams,
    		routeProps,
    		$activeRoute,
    		$location
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(13, $$props = assign(assign({}, $$props), $$new_props));
    		if ("path" in $$props) $$invalidate(8, path = $$new_props.path);
    		if ("component" in $$props) $$invalidate(0, component = $$new_props.component);
    		if ("routeParams" in $$props) $$invalidate(1, routeParams = $$new_props.routeParams);
    		if ("routeProps" in $$props) $$invalidate(2, routeProps = $$new_props.routeProps);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$activeRoute*/ 8) {
    			 if ($activeRoute && $activeRoute.route === route) {
    				$$invalidate(1, routeParams = $activeRoute.params);
    			}
    		}

    		 {
    			const { path, component, ...rest } = $$props;
    			$$invalidate(2, routeProps = rest);
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		component,
    		routeParams,
    		routeProps,
    		$activeRoute,
    		$location,
    		activeRoute,
    		location,
    		route,
    		path,
    		$$scope,
    		$$slots
    	];
    }

    class Route extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { path: 8, component: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Route",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get path() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set path(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get component() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set component(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelte-routing\src\Link.svelte generated by Svelte v3.24.0 */
    const file = "node_modules\\svelte-routing\\src\\Link.svelte";

    function create_fragment$2(ctx) {
    	let a;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[11].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[10], null);

    	let a_levels = [
    		{ href: /*href*/ ctx[0] },
    		{ "aria-current": /*ariaCurrent*/ ctx[2] },
    		/*props*/ ctx[1]
    	];

    	let a_data = {};

    	for (let i = 0; i < a_levels.length; i += 1) {
    		a_data = assign(a_data, a_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			a = element("a");
    			if (default_slot) default_slot.c();
    			set_attributes(a, a_data);
    			add_location(a, file, 40, 0, 1249);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);

    			if (default_slot) {
    				default_slot.m(a, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*onClick*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 1024) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[10], dirty, null, null);
    				}
    			}

    			set_attributes(a, a_data = get_spread_update(a_levels, [
    				(!current || dirty & /*href*/ 1) && { href: /*href*/ ctx[0] },
    				(!current || dirty & /*ariaCurrent*/ 4) && { "aria-current": /*ariaCurrent*/ ctx[2] },
    				dirty & /*props*/ 2 && /*props*/ ctx[1]
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $base;
    	let $location;
    	let { to = "#" } = $$props;
    	let { replace = false } = $$props;
    	let { state = {} } = $$props;
    	let { getProps = () => ({}) } = $$props;
    	const { base } = getContext(ROUTER);
    	validate_store(base, "base");
    	component_subscribe($$self, base, value => $$invalidate(14, $base = value));
    	const location = getContext(LOCATION);
    	validate_store(location, "location");
    	component_subscribe($$self, location, value => $$invalidate(15, $location = value));
    	const dispatch = createEventDispatcher();
    	let href, isPartiallyCurrent, isCurrent, props;

    	function onClick(event) {
    		dispatch("click", event);

    		if (shouldNavigate(event)) {
    			event.preventDefault();

    			// Don't push another entry to the history stack when the user
    			// clicks on a Link to the page they are currently on.
    			const shouldReplace = $location.pathname === href || replace;

    			navigate(href, { state, replace: shouldReplace });
    		}
    	}

    	const writable_props = ["to", "replace", "state", "getProps"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Link> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Link", $$slots, ['default']);

    	$$self.$set = $$props => {
    		if ("to" in $$props) $$invalidate(6, to = $$props.to);
    		if ("replace" in $$props) $$invalidate(7, replace = $$props.replace);
    		if ("state" in $$props) $$invalidate(8, state = $$props.state);
    		if ("getProps" in $$props) $$invalidate(9, getProps = $$props.getProps);
    		if ("$$scope" in $$props) $$invalidate(10, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		createEventDispatcher,
    		ROUTER,
    		LOCATION,
    		navigate,
    		startsWith,
    		resolve,
    		shouldNavigate,
    		to,
    		replace,
    		state,
    		getProps,
    		base,
    		location,
    		dispatch,
    		href,
    		isPartiallyCurrent,
    		isCurrent,
    		props,
    		onClick,
    		$base,
    		$location,
    		ariaCurrent
    	});

    	$$self.$inject_state = $$props => {
    		if ("to" in $$props) $$invalidate(6, to = $$props.to);
    		if ("replace" in $$props) $$invalidate(7, replace = $$props.replace);
    		if ("state" in $$props) $$invalidate(8, state = $$props.state);
    		if ("getProps" in $$props) $$invalidate(9, getProps = $$props.getProps);
    		if ("href" in $$props) $$invalidate(0, href = $$props.href);
    		if ("isPartiallyCurrent" in $$props) $$invalidate(12, isPartiallyCurrent = $$props.isPartiallyCurrent);
    		if ("isCurrent" in $$props) $$invalidate(13, isCurrent = $$props.isCurrent);
    		if ("props" in $$props) $$invalidate(1, props = $$props.props);
    		if ("ariaCurrent" in $$props) $$invalidate(2, ariaCurrent = $$props.ariaCurrent);
    	};

    	let ariaCurrent;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*to, $base*/ 16448) {
    			 $$invalidate(0, href = to === "/" ? $base.uri : resolve(to, $base.uri));
    		}

    		if ($$self.$$.dirty & /*$location, href*/ 32769) {
    			 $$invalidate(12, isPartiallyCurrent = startsWith($location.pathname, href));
    		}

    		if ($$self.$$.dirty & /*href, $location*/ 32769) {
    			 $$invalidate(13, isCurrent = href === $location.pathname);
    		}

    		if ($$self.$$.dirty & /*isCurrent*/ 8192) {
    			 $$invalidate(2, ariaCurrent = isCurrent ? "page" : undefined);
    		}

    		if ($$self.$$.dirty & /*getProps, $location, href, isPartiallyCurrent, isCurrent*/ 45569) {
    			 $$invalidate(1, props = getProps({
    				location: $location,
    				href,
    				isPartiallyCurrent,
    				isCurrent
    			}));
    		}
    	};

    	return [
    		href,
    		props,
    		ariaCurrent,
    		base,
    		location,
    		onClick,
    		to,
    		replace,
    		state,
    		getProps,
    		$$scope,
    		$$slots
    	];
    }

    class Link extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { to: 6, replace: 7, state: 8, getProps: 9 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Link",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get to() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set to(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get replace() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set replace(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get state() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set state(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getProps() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set getProps(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /**
     * A link action that can be added to <a href=""> tags rather
     * than using the <Link> component.
     *
     * Example:
     * ```html
     * <a href="/post/{postId}" use:link>{post.title}</a>
     * ```
     */
    function link(node) {
      function onClick(event) {
        const anchor = event.currentTarget;

        if (
          anchor.target === "" &&
          hostMatches(anchor) &&
          shouldNavigate(event)
        ) {
          event.preventDefault();
          navigate(anchor.pathname + anchor.search, { replace: anchor.hasAttribute("replace") });
        }
      }

      node.addEventListener("click", onClick);

      return {
        destroy() {
          node.removeEventListener("click", onClick);
        }
      };
    }

    /**
     * An action to be added at a root element of your application to
     * capture all relative links and push them onto the history stack.
     *
     * Example:
     * ```html
     * <div use:links>
     *   <Router>
     *     <Route path="/" component={Home} />
     *     <Route path="/p/:projectId/:docId?" component={ProjectScreen} />
     *     {#each projects as project}
     *       <a href="/p/{project.id}">{project.title}</a>
     *     {/each}
     *   </Router>
     * </div>
     * ```
     */
    function links(node) {
      function findClosest(tagName, el) {
        while (el && el.tagName !== tagName) {
          el = el.parentNode;
        }
        return el;
      }

      function onClick(event) {
        const anchor = findClosest("A", event.target);

        if (
          anchor &&
          anchor.target === "" &&
          hostMatches(anchor) &&
          shouldNavigate(event) &&
          !anchor.hasAttribute("noroute")
        ) {
          event.preventDefault();
          navigate(anchor.pathname + anchor.search, { replace: anchor.hasAttribute("replace") });
        }
      }

      node.addEventListener("click", onClick);

      return {
        destroy() {
          node.removeEventListener("click", onClick);
        }
      };
    }

    /* src\client\routes\Creatures.svelte generated by Svelte v3.24.0 */

    const file$1 = "src\\client\\routes\\Creatures.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	child_ctx[3] = i;
    	return child_ctx;
    }

    // (40:0) {#each creatures as creature, i}
    function create_each_block(ctx) {
    	let img;
    	let img_src_value;
    	let t0;
    	let div;
    	let h1;
    	let t1_value = /*creature*/ ctx[1].name + "";
    	let t1;
    	let t2;
    	let ul;
    	let li0;
    	let b0;
    	let t4;
    	let t5_value = /*creature*/ ctx[1].age + "";
    	let t5;
    	let t6;
    	let li1;
    	let b1;
    	let t8;
    	let t9_value = /*creature*/ ctx[1].species + "";
    	let t9;
    	let t10;
    	let li2;
    	let b2;
    	let t12;
    	let t13_value = /*creature*/ ctx[1].breed + "";
    	let t13;
    	let t14;
    	let li3;
    	let b3;
    	let t16;
    	let t17_value = /*creature*/ ctx[1].color + "";
    	let t17;
    	let t18;
    	let li4;
    	let b4;
    	let t20;
    	let t21_value = /*creature*/ ctx[1].occupation + "";
    	let t21;
    	let t22;

    	const block = {
    		c: function create() {
    			img = element("img");
    			t0 = space();
    			div = element("div");
    			h1 = element("h1");
    			t1 = text(t1_value);
    			t2 = space();
    			ul = element("ul");
    			li0 = element("li");
    			b0 = element("b");
    			b0.textContent = "Age:";
    			t4 = space();
    			t5 = text(t5_value);
    			t6 = space();
    			li1 = element("li");
    			b1 = element("b");
    			b1.textContent = "Species:";
    			t8 = space();
    			t9 = text(t9_value);
    			t10 = space();
    			li2 = element("li");
    			b2 = element("b");
    			b2.textContent = "Breed:";
    			t12 = space();
    			t13 = text(t13_value);
    			t14 = space();
    			li3 = element("li");
    			b3 = element("b");
    			b3.textContent = "Color:";
    			t16 = space();
    			t17 = text(t17_value);
    			t18 = space();
    			li4 = element("li");
    			b4 = element("b");
    			b4.textContent = "Occupation:";
    			t20 = space();
    			t21 = text(t21_value);
    			t22 = space();
    			if (img.src !== (img_src_value = /*creature*/ ctx[1].picture)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "class", "svelte-khjbph");
    			add_location(img, file$1, 40, 2, 774);
    			add_location(h1, file$1, 42, 4, 843);
    			add_location(b0, file$1, 45, 8, 899);
    			add_location(li0, file$1, 44, 6, 885);
    			add_location(b1, file$1, 49, 8, 969);
    			add_location(li1, file$1, 48, 6, 955);
    			add_location(b2, file$1, 53, 8, 1047);
    			add_location(li2, file$1, 52, 6, 1033);
    			add_location(b3, file$1, 57, 8, 1121);
    			add_location(li3, file$1, 56, 6, 1107);
    			add_location(b4, file$1, 61, 8, 1195);
    			add_location(li4, file$1, 60, 6, 1181);
    			add_location(ul, file$1, 43, 4, 873);
    			attr_dev(div, "class", "creature");
    			add_location(div, file$1, 41, 2, 815);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(h1, t1);
    			append_dev(div, t2);
    			append_dev(div, ul);
    			append_dev(ul, li0);
    			append_dev(li0, b0);
    			append_dev(li0, t4);
    			append_dev(li0, t5);
    			append_dev(ul, t6);
    			append_dev(ul, li1);
    			append_dev(li1, b1);
    			append_dev(li1, t8);
    			append_dev(li1, t9);
    			append_dev(ul, t10);
    			append_dev(ul, li2);
    			append_dev(li2, b2);
    			append_dev(li2, t12);
    			append_dev(li2, t13);
    			append_dev(ul, t14);
    			append_dev(ul, li3);
    			append_dev(li3, b3);
    			append_dev(li3, t16);
    			append_dev(li3, t17);
    			append_dev(ul, t18);
    			append_dev(ul, li4);
    			append_dev(li4, b4);
    			append_dev(li4, t20);
    			append_dev(li4, t21);
    			append_dev(div, t22);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(40:0) {#each creatures as creature, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let each_1_anchor;
    	let each_value = /*creatures*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*creatures*/ 1) {
    				each_value = /*creatures*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	const creatures = [
    		{
    			name: "Ruby Hopper",
    			age: 4,
    			species: "Rabbit",
    			breed: "Havana",
    			color: "Black",
    			occupation: "Professional Salad Taster",
    			picture: "/imgs/ruby.png"
    		},
    		{
    			name: "Paz Hopper",
    			age: 5,
    			species: "Rabbit",
    			breed: "Mix",
    			color: "Multi",
    			occupation: "Bunstruction Worker",
    			picture: "/imgs/paz.png"
    		},
    		{
    			name: "Barnacle",
    			age: 0.5,
    			species: "Hamster",
    			breed: "Dwarf",
    			color: "Gray",
    			occupation: "Wheel Runner",
    			picture: "/imgs/barnacle.jpg"
    		}
    	];

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Creatures> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Creatures", $$slots, []);
    	$$self.$capture_state = () => ({ creatures });
    	return [creatures];
    }

    class Creatures extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Creatures",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\client\components\Footer.svelte generated by Svelte v3.24.0 */

    const file$2 = "src\\client\\components\\Footer.svelte";

    function create_fragment$4(ctx) {
    	let footer;
    	let div;
    	let a0;
    	let i0;
    	let t0;
    	let a1;
    	let i1;
    	let t1;
    	let a2;
    	let i2;
    	let t2;
    	let a3;
    	let i3;

    	const block = {
    		c: function create() {
    			footer = element("footer");
    			div = element("div");
    			a0 = element("a");
    			i0 = element("i");
    			t0 = space();
    			a1 = element("a");
    			i1 = element("i");
    			t1 = space();
    			a2 = element("a");
    			i2 = element("i");
    			t2 = space();
    			a3 = element("a");
    			i3 = element("i");
    			attr_dev(i0, "class", "fa fa-github");
    			add_location(i0, file$2, 21, 6, 372);
    			attr_dev(a0, "href", "https://github.com/janeBenson");
    			attr_dev(a0, "title", "github");
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "class", "svelte-1s9vvw8");
    			add_location(a0, file$2, 20, 4, 293);
    			attr_dev(i1, "class", "fa fa-linkedin-square");
    			add_location(i1, file$2, 27, 6, 536);
    			attr_dev(a1, "href", "https://www.linkedin.com/in/jane-benson-08788491/");
    			attr_dev(a1, "title", "linkedin");
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "class", "svelte-1s9vvw8");
    			add_location(a1, file$2, 23, 4, 414);
    			attr_dev(i2, "class", "fa fa-facebook-square");
    			add_location(i2, file$2, 34, 6, 728);
    			attr_dev(a2, "href", "https://www.facebook.com/jane.benson1/");
    			attr_dev(a2, "title", "facebook");
    			attr_dev(a2, "target", "_blank");
    			attr_dev(a2, "class", "svelte-1d87n8l svelte-1s9vvw8");
    			add_location(a2, file$2, 29, 4, 587);
    			attr_dev(i3, "class", "fa fa-instagram");
    			add_location(i3, file$2, 42, 6, 922);
    			attr_dev(a3, "href", "https://www.instagram.com/benson4301/");
    			attr_dev(a3, "title", "instagram");
    			attr_dev(a3, "target", "_blank");
    			attr_dev(a3, "class", "svelte-1d87n8l svelte-1s9vvw8");
    			add_location(a3, file$2, 37, 4, 781);
    			attr_dev(div, "class", "social-icons");
    			add_location(div, file$2, 19, 2, 261);
    			attr_dev(footer, "class", "container-fluid bg-4 text-center svelte-1s9vvw8");
    			add_location(footer, file$2, 18, 0, 208);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, footer, anchor);
    			append_dev(footer, div);
    			append_dev(div, a0);
    			append_dev(a0, i0);
    			append_dev(div, t0);
    			append_dev(div, a1);
    			append_dev(a1, i1);
    			append_dev(div, t1);
    			append_dev(div, a2);
    			append_dev(a2, i2);
    			append_dev(div, t2);
    			append_dev(div, a3);
    			append_dev(a3, i3);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Footer", $$slots, []);
    	return [];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\client\routes\Home.svelte generated by Svelte v3.24.0 */
    const file$3 = "src\\client\\routes\\Home.svelte";

    function create_fragment$5(ctx) {
    	let div0;
    	let h30;
    	let t1;
    	let img0;
    	let img0_src_value;
    	let t2;
    	let h31;
    	let t4;
    	let div4;
    	let div3;
    	let div1;
    	let h1;
    	let t6;
    	let div2;
    	let p0;
    	let t7;
    	let br0;
    	let t8;
    	let br1;
    	let t9;
    	let br2;
    	let t10;
    	let br3;
    	let t11;
    	let br4;
    	let t12;
    	let br5;
    	let t13;
    	let br6;
    	let t14;
    	let br7;
    	let t15;
    	let br8;
    	let t16;
    	let br9;
    	let t17;
    	let t18;
    	let div10;
    	let h32;
    	let t20;
    	let div8;
    	let div5;
    	let p1;
    	let t22;
    	let a0;
    	let img1;
    	let img1_src_value;
    	let link_action;
    	let t23;
    	let div6;
    	let p2;
    	let t25;
    	let a1;
    	let img2;
    	let img2_src_value;
    	let t26;
    	let div7;
    	let p3;
    	let t28;
    	let img3;
    	let img3_src_value;
    	let t29;
    	let div9;
    	let a2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			h30 = element("h3");
    			h30.textContent = "Jane E. Benson";
    			t1 = space();
    			img0 = element("img");
    			t2 = space();
    			h31 = element("h3");
    			h31.textContent = "Web Developer & Technical Writer";
    			t4 = space();
    			div4 = element("div");
    			div3 = element("div");
    			div1 = element("div");
    			h1 = element("h1");
    			h1.textContent = "\"Programming is the purest form of applied math\"";
    			t6 = space();
    			div2 = element("div");
    			p0 = element("p");
    			t7 = text("Hi there! I'm Jane - web developer, technical writer, and mom of two\r\n        (rabbits). I received my Bachelors degree in math from the University of\r\n        Minnesota in 2016. My journey from college to present has expanded my\r\n        professional skillset and informed my professional philosophy. With\r\n        various experiences in math education and technical communication, I've\r\n        adopted teaching as a philosophy. I'm a firm believer that you can only\r\n        master a topic if you can effectively teach it to someone else. I strive\r\n        to be approachable and open-minded in everything I do. As cliche as it\r\n        sounds, there is something new to learn each day. It's important to be\r\n        receptive to it.\r\n        ");
    			br0 = element("br");
    			t8 = space();
    			br1 = element("br");
    			t9 = text("\r\n        My experiences as a technical writer - documentating software for\r\n        developers, testing API endpoints in Postman, catching bugs, and\r\n        creating my own code samples - provided me with invaluable experience\r\n        and a desire to be the one creating the software. Translating tech into\r\n        english is my forte and is especially useful when annotating code,\r\n        naming variables, communicating my technical masterpieces to others, and\r\n        approaching projects in a logical manner.\r\n        ");
    			br2 = element("br");
    			t10 = space();
    			br3 = element("br");
    			t11 = text("\r\n        My love for software development began in my first computer science\r\n        class. I saw the very logic that I learned in my mathematical proofs\r\n        class applied to solve a real-world problem in Python. That logical\r\n        \"and\" operator sent shivers up my spine. In that moment, I realized\r\n        programming is the purest form of applied math.\r\n        ");
    			br4 = element("br");
    			t12 = space();
    			br5 = element("br");
    			t13 = text("\r\n        When I'm not technical writing or coding, you can find me hiking,\r\n        listening to music, trying out new, plant-based recipes, photographing\r\n        lighthouses, and building castles for my rabbits.\r\n        ");
    			br6 = element("br");
    			t14 = space();
    			br7 = element("br");
    			t15 = text("\r\n        Thanks for reading my novel. I can't wait to connect with you.\r\n        ");
    			br8 = element("br");
    			t16 = space();
    			br9 = element("br");
    			t17 = text("\r\n        - Jane");
    			t18 = space();
    			div10 = element("div");
    			h32 = element("h3");
    			h32.textContent = "Portfolio";
    			t20 = space();
    			div8 = element("div");
    			div5 = element("div");
    			p1 = element("p");
    			p1.textContent = "Random Image Generator";
    			t22 = space();
    			a0 = element("a");
    			img1 = element("img");
    			t23 = space();
    			div6 = element("div");
    			p2 = element("p");
    			p2.textContent = "To Do List";
    			t25 = space();
    			a1 = element("a");
    			img2 = element("img");
    			t26 = space();
    			div7 = element("div");
    			p3 = element("p");
    			p3.textContent = "Websockets";
    			t28 = space();
    			img3 = element("img");
    			t29 = space();
    			div9 = element("div");
    			a2 = element("a");
    			a2.textContent = "See More";
    			attr_dev(h30, "class", "mb-4");
    			add_location(h30, file$3, 26, 2, 437);
    			if (img0.src !== (img0_src_value = "/imgs/jane.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "class", "img-thumbnail img-fluid");
    			attr_dev(img0, "alt", "Jane");
    			attr_dev(img0, "width", "350");
    			attr_dev(img0, "height", "350");
    			add_location(img0, file$3, 27, 2, 477);
    			attr_dev(h31, "class", "mt-4");
    			add_location(h31, file$3, 33, 2, 602);
    			attr_dev(div0, "class", "container-fluid bg-1 text-center svelte-1vebgez");
    			add_location(div0, file$3, 25, 0, 387);
    			add_location(h1, file$3, 39, 6, 786);
    			attr_dev(div1, "class", "col-4 text-center align-self-center");
    			add_location(div1, file$3, 38, 4, 729);
    			add_location(br0, file$3, 53, 8, 1645);
    			add_location(br1, file$3, 54, 8, 1661);
    			add_location(br2, file$3, 62, 8, 2195);
    			add_location(br3, file$3, 63, 8, 2211);
    			add_location(br4, file$3, 69, 8, 2593);
    			add_location(br5, file$3, 70, 8, 2609);
    			add_location(br6, file$3, 74, 8, 2839);
    			add_location(br7, file$3, 75, 8, 2855);
    			add_location(br8, file$3, 77, 8, 2943);
    			add_location(br9, file$3, 78, 8, 2959);
    			add_location(p0, file$3, 42, 6, 886);
    			attr_dev(div2, "class", "col");
    			add_location(div2, file$3, 41, 4, 861);
    			attr_dev(div3, "class", "row");
    			add_location(div3, file$3, 37, 2, 706);
    			attr_dev(div4, "class", "container-fluid bg-2 svelte-1vebgez");
    			add_location(div4, file$3, 36, 0, 668);
    			add_location(h32, file$3, 86, 2, 3077);
    			add_location(p1, file$3, 89, 6, 3161);
    			if (img1.src !== (img1_src_value = "/imgs/random-images.jpg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "class", "rounded img-fluid");
    			attr_dev(img1, "alt", "Image");
    			add_location(img1, file$3, 91, 8, 3261);
    			attr_dev(a0, "href", "/portfolio/random-image-generator");
    			add_location(a0, file$3, 90, 6, 3198);
    			attr_dev(div5, "class", "col-md-4 .col-sm-");
    			add_location(div5, file$3, 88, 4, 3122);
    			add_location(p2, file$3, 98, 6, 3438);
    			if (img2.src !== (img2_src_value = "/imgs/to-do-list.jpg")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "class", "rounded img-fluid");
    			attr_dev(img2, "alt", "Image");
    			add_location(img2, file$3, 100, 8, 3491);
    			attr_dev(a1, "href", "/resume");
    			add_location(a1, file$3, 99, 6, 3463);
    			attr_dev(div6, "class", "col-md-4 .col-sm-");
    			add_location(div6, file$3, 97, 4, 3399);
    			add_location(p3, file$3, 104, 6, 3632);
    			if (img3.src !== (img3_src_value = "/imgs/websockets.jpg")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "class", "rounded img-fluid");
    			attr_dev(img3, "alt", "Image");
    			add_location(img3, file$3, 105, 6, 3657);
    			attr_dev(div7, "class", "col-md-4 .col-sm-");
    			add_location(div7, file$3, 103, 4, 3593);
    			attr_dev(div8, "class", "row");
    			add_location(div8, file$3, 87, 2, 3099);
    			attr_dev(a2, "href", "/portfolio");
    			attr_dev(a2, "type", "button");
    			attr_dev(a2, "class", "btn btn-outline-dark");
    			add_location(a2, file$3, 110, 4, 3793);
    			attr_dev(div9, "class", "text-center mt-4");
    			add_location(div9, file$3, 109, 2, 3757);
    			attr_dev(div10, "class", "container-fluid bg-3 text-center svelte-1vebgez");
    			add_location(div10, file$3, 85, 0, 3027);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, h30);
    			append_dev(div0, t1);
    			append_dev(div0, img0);
    			append_dev(div0, t2);
    			append_dev(div0, h31);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, div1);
    			append_dev(div1, h1);
    			append_dev(div3, t6);
    			append_dev(div3, div2);
    			append_dev(div2, p0);
    			append_dev(p0, t7);
    			append_dev(p0, br0);
    			append_dev(p0, t8);
    			append_dev(p0, br1);
    			append_dev(p0, t9);
    			append_dev(p0, br2);
    			append_dev(p0, t10);
    			append_dev(p0, br3);
    			append_dev(p0, t11);
    			append_dev(p0, br4);
    			append_dev(p0, t12);
    			append_dev(p0, br5);
    			append_dev(p0, t13);
    			append_dev(p0, br6);
    			append_dev(p0, t14);
    			append_dev(p0, br7);
    			append_dev(p0, t15);
    			append_dev(p0, br8);
    			append_dev(p0, t16);
    			append_dev(p0, br9);
    			append_dev(p0, t17);
    			insert_dev(target, t18, anchor);
    			insert_dev(target, div10, anchor);
    			append_dev(div10, h32);
    			append_dev(div10, t20);
    			append_dev(div10, div8);
    			append_dev(div8, div5);
    			append_dev(div5, p1);
    			append_dev(div5, t22);
    			append_dev(div5, a0);
    			append_dev(a0, img1);
    			append_dev(div8, t23);
    			append_dev(div8, div6);
    			append_dev(div6, p2);
    			append_dev(div6, t25);
    			append_dev(div6, a1);
    			append_dev(a1, img2);
    			append_dev(div8, t26);
    			append_dev(div8, div7);
    			append_dev(div7, p3);
    			append_dev(div7, t28);
    			append_dev(div7, img3);
    			append_dev(div10, t29);
    			append_dev(div10, div9);
    			append_dev(div9, a2);

    			if (!mounted) {
    				dispose = action_destroyer(link_action = link.call(null, a0));
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div4);
    			if (detaching) detach_dev(t18);
    			if (detaching) detach_dev(div10);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Home", $$slots, []);
    	$$self.$capture_state = () => ({ link });
    	return [];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\client\components\NavBar.svelte generated by Svelte v3.24.0 */

    const file$4 = "src\\client\\components\\NavBar.svelte";

    function create_fragment$6(ctx) {
    	let nav;
    	let a0;
    	let t1;
    	let button;
    	let span;
    	let t2;
    	let div;
    	let ul;
    	let li0;
    	let a1;
    	let t4;
    	let li1;
    	let a2;
    	let t6;
    	let li2;
    	let a3;

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			a0 = element("a");
    			a0.textContent = "Jane Benson";
    			t1 = space();
    			button = element("button");
    			span = element("span");
    			t2 = space();
    			div = element("div");
    			ul = element("ul");
    			li0 = element("li");
    			a1 = element("a");
    			a1.textContent = "Resumé";
    			t4 = space();
    			li1 = element("li");
    			a2 = element("a");
    			a2.textContent = "Portfolio";
    			t6 = space();
    			li2 = element("li");
    			a3 = element("a");
    			a3.textContent = "Creatures";
    			attr_dev(a0, "class", "navbar-brand svelte-hs622j");
    			attr_dev(a0, "href", "/");
    			add_location(a0, file$4, 25, 2, 381);
    			attr_dev(span, "class", "navbar-toggler-icon");
    			add_location(span, file$4, 33, 4, 592);
    			attr_dev(button, "class", "navbar-toggler");
    			attr_dev(button, "type", "button");
    			attr_dev(button, "data-toggle", "collapse");
    			attr_dev(button, "data-target", "#collapsibleNavbar");
    			add_location(button, file$4, 28, 2, 470);
    			attr_dev(a1, "class", "nav-link svelte-hs622j");
    			attr_dev(a1, "href", "/resume");
    			add_location(a1, file$4, 42, 8, 829);
    			attr_dev(li0, "class", "nav-item");
    			add_location(li0, file$4, 41, 6, 799);
    			attr_dev(a2, "class", "nav-link svelte-hs622j");
    			attr_dev(a2, "href", "/portfolio");
    			add_location(a2, file$4, 45, 8, 923);
    			attr_dev(li1, "class", "nav-item");
    			add_location(li1, file$4, 44, 6, 893);
    			attr_dev(a3, "class", "nav-link svelte-hs622j");
    			attr_dev(a3, "href", "/creatures");
    			add_location(a3, file$4, 48, 8, 1023);
    			attr_dev(li2, "class", "nav-item");
    			add_location(li2, file$4, 47, 6, 993);
    			attr_dev(ul, "class", "navbar-nav");
    			add_location(ul, file$4, 40, 4, 769);
    			attr_dev(div, "class", "collapse navbar-collapse d-flex justify-content-end");
    			attr_dev(div, "id", "collapsibleNavbar");
    			add_location(div, file$4, 37, 2, 668);
    			attr_dev(nav, "class", "navbar navbar-expand-md bg-dark navbar-dark svelte-hs622j");
    			add_location(nav, file$4, 23, 0, 304);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, a0);
    			append_dev(nav, t1);
    			append_dev(nav, button);
    			append_dev(button, span);
    			append_dev(nav, t2);
    			append_dev(nav, div);
    			append_dev(div, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a1);
    			append_dev(ul, t4);
    			append_dev(ul, li1);
    			append_dev(li1, a2);
    			append_dev(ul, t6);
    			append_dev(ul, li2);
    			append_dev(li2, a3);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<NavBar> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("NavBar", $$slots, []);
    	return [];
    }

    class NavBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NavBar",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\client\routes\Portfolio.svelte generated by Svelte v3.24.0 */

    const file$5 = "src\\client\\routes\\Portfolio.svelte";

    function create_fragment$7(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			div0.textContent = "Portfolio content TBA";
    			add_location(div0, file$5, 9, 2, 78);
    			attr_dev(div1, "class", "page-content");
    			add_location(div1, file$5, 8, 0, 48);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Portfolio> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Portfolio", $$slots, []);
    	return [];
    }

    class Portfolio extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Portfolio",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity }) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }

    /* src\client\components\AboutModal.svelte generated by Svelte v3.24.0 */
    const file$6 = "src\\client\\components\\AboutModal.svelte";
    const get_footer_slot_changes = dirty => ({});
    const get_footer_slot_context = ctx => ({});
    const get_body_slot_changes = dirty => ({});
    const get_body_slot_context = ctx => ({});
    const get_title_slot_changes = dirty => ({});
    const get_title_slot_context = ctx => ({});

    // (41:0) {#if showModal}
    function create_if_block$1(ctx) {
    	let div4;
    	let div3;
    	let div0;
    	let h5;
    	let t0;
    	let div1;
    	let t1;
    	let div2;
    	let div3_transition;
    	let current;
    	const title_slot_template = /*$$slots*/ ctx[3].title;
    	const title_slot = create_slot(title_slot_template, ctx, /*$$scope*/ ctx[2], get_title_slot_context);
    	const title_slot_or_fallback = title_slot || fallback_block_2(ctx);
    	const body_slot_template = /*$$slots*/ ctx[3].body;
    	const body_slot = create_slot(body_slot_template, ctx, /*$$scope*/ ctx[2], get_body_slot_context);
    	const body_slot_or_fallback = body_slot || fallback_block_1(ctx);
    	const footer_slot_template = /*$$slots*/ ctx[3].footer;
    	const footer_slot = create_slot(footer_slot_template, ctx, /*$$scope*/ ctx[2], get_footer_slot_context);
    	const footer_slot_or_fallback = footer_slot || fallback_block(ctx);

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			h5 = element("h5");
    			if (title_slot_or_fallback) title_slot_or_fallback.c();
    			t0 = space();
    			div1 = element("div");
    			if (body_slot_or_fallback) body_slot_or_fallback.c();
    			t1 = space();
    			div2 = element("div");
    			if (footer_slot_or_fallback) footer_slot_or_fallback.c();
    			add_location(h5, file$6, 44, 8, 818);
    			attr_dev(div0, "class", "card-header text-center p-3 svelte-rhxt2z");
    			add_location(div0, file$6, 43, 6, 767);
    			attr_dev(div1, "class", "card-body overflow-auto svelte-rhxt2z");
    			add_location(div1, file$6, 48, 6, 920);
    			attr_dev(div2, "class", "card-footer text-center svelte-rhxt2z");
    			add_location(div2, file$6, 84, 6, 3496);
    			attr_dev(div3, "class", "card shadow svelte-rhxt2z");
    			add_location(div3, file$6, 42, 4, 691);
    			attr_dev(div4, "class", "card-wrapper");
    			add_location(div4, file$6, 41, 2, 659);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			append_dev(div0, h5);

    			if (title_slot_or_fallback) {
    				title_slot_or_fallback.m(h5, null);
    			}

    			append_dev(div3, t0);
    			append_dev(div3, div1);

    			if (body_slot_or_fallback) {
    				body_slot_or_fallback.m(div1, null);
    			}

    			append_dev(div3, t1);
    			append_dev(div3, div2);

    			if (footer_slot_or_fallback) {
    				footer_slot_or_fallback.m(div2, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (title_slot) {
    				if (title_slot.p && dirty & /*$$scope*/ 4) {
    					update_slot(title_slot, title_slot_template, ctx, /*$$scope*/ ctx[2], dirty, get_title_slot_changes, get_title_slot_context);
    				}
    			}

    			if (body_slot) {
    				if (body_slot.p && dirty & /*$$scope*/ 4) {
    					update_slot(body_slot, body_slot_template, ctx, /*$$scope*/ ctx[2], dirty, get_body_slot_changes, get_body_slot_context);
    				}
    			}

    			if (footer_slot) {
    				if (footer_slot.p && dirty & /*$$scope*/ 4) {
    					update_slot(footer_slot, footer_slot_template, ctx, /*$$scope*/ ctx[2], dirty, get_footer_slot_changes, get_footer_slot_context);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(title_slot_or_fallback, local);
    			transition_in(body_slot_or_fallback, local);
    			transition_in(footer_slot_or_fallback, local);

    			add_render_callback(() => {
    				if (!div3_transition) div3_transition = create_bidirectional_transition(div3, fly, { y: 200, duration: 500 }, true);
    				div3_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(title_slot_or_fallback, local);
    			transition_out(body_slot_or_fallback, local);
    			transition_out(footer_slot_or_fallback, local);
    			if (!div3_transition) div3_transition = create_bidirectional_transition(div3, fly, { y: 200, duration: 500 }, false);
    			div3_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			if (title_slot_or_fallback) title_slot_or_fallback.d(detaching);
    			if (body_slot_or_fallback) body_slot_or_fallback.d(detaching);
    			if (footer_slot_or_fallback) footer_slot_or_fallback.d(detaching);
    			if (detaching && div3_transition) div3_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(41:0) {#if showModal}",
    		ctx
    	});

    	return block;
    }

    // (46:29) Image Generator Project
    function fallback_block_2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Image Generator Project");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block_2.name,
    		type: "fallback",
    		source: "(46:29) Image Generator Project",
    		ctx
    	});

    	return block;
    }

    // (50:26)             Contrary to popular belief, Lorem Ipsum is not simply random text. It            has roots in a piece of classical Latin literature from 45 BC, making            it over 2000 years old. Richard McClintock, a Latin professor at            Hampden-Sydney College in Virginia, looked up one of the more obscure            Latin words, consectetur, from a Lorem Ipsum passage, and going            through the cites of the word in classical literature, discovered the            undoubtable source. Lorem Ipsum comes from sections 1.10.32 and            1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and            Evil) by Cicero, written in 45 BC. This book is a treatise on the            theory of ethics, very popular during the Renaissance. The first line            of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in            section 1.10.32. The standard chunk of Lorem Ipsum used since the            1500s is reproduced below for those interested. Sections 1.10.32 and            1.10.33 from "de Finibus Bonorum et Malorum" by Cicero are also            reproduced in their exact original form, accompanied by English            versions from the 1914 translation by H. Rackham. Contrary to popular            belief, Lorem Ipsum is not simply random text. It has roots in a piece            of classical Latin literature from 45 BC, making it over 2000 years            old. Richard McClintock, a Latin professor at Hampden-Sydney College            in Virginia, looked up one of the more obscure Latin words,            consectetur, from a Lorem Ipsum passage, and going through the cites            of the word in classical literature, discovered the undoubtable            source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de            Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero,            written in 45 BC. This book is a treatise on the theory of ethics,            very popular during the Renaissance. The first line of Lorem Ipsum,            "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32.            The standard chunk of Lorem Ipsum used since the 1500s is reproduced            below for those interested. Sections 1.10.32 and 1.10.33 from "de            Finibus Bonorum et Malorum" by Cicero are also reproduced in their            exact original form, accompanied by English versions from the 1914            translation by H. Rackham.          
    function fallback_block_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Contrary to popular belief, Lorem Ipsum is not simply random text. It\r\n          has roots in a piece of classical Latin literature from 45 BC, making\r\n          it over 2000 years old. Richard McClintock, a Latin professor at\r\n          Hampden-Sydney College in Virginia, looked up one of the more obscure\r\n          Latin words, consectetur, from a Lorem Ipsum passage, and going\r\n          through the cites of the word in classical literature, discovered the\r\n          undoubtable source. Lorem Ipsum comes from sections 1.10.32 and\r\n          1.10.33 of \"de Finibus Bonorum et Malorum\" (The Extremes of Good and\r\n          Evil) by Cicero, written in 45 BC. This book is a treatise on the\r\n          theory of ethics, very popular during the Renaissance. The first line\r\n          of Lorem Ipsum, \"Lorem ipsum dolor sit amet..\", comes from a line in\r\n          section 1.10.32. The standard chunk of Lorem Ipsum used since the\r\n          1500s is reproduced below for those interested. Sections 1.10.32 and\r\n          1.10.33 from \"de Finibus Bonorum et Malorum\" by Cicero are also\r\n          reproduced in their exact original form, accompanied by English\r\n          versions from the 1914 translation by H. Rackham. Contrary to popular\r\n          belief, Lorem Ipsum is not simply random text. It has roots in a piece\r\n          of classical Latin literature from 45 BC, making it over 2000 years\r\n          old. Richard McClintock, a Latin professor at Hampden-Sydney College\r\n          in Virginia, looked up one of the more obscure Latin words,\r\n          consectetur, from a Lorem Ipsum passage, and going through the cites\r\n          of the word in classical literature, discovered the undoubtable\r\n          source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of \"de\r\n          Finibus Bonorum et Malorum\" (The Extremes of Good and Evil) by Cicero,\r\n          written in 45 BC. This book is a treatise on the theory of ethics,\r\n          very popular during the Renaissance. The first line of Lorem Ipsum,\r\n          \"Lorem ipsum dolor sit amet..\", comes from a line in section 1.10.32.\r\n          The standard chunk of Lorem Ipsum used since the 1500s is reproduced\r\n          below for those interested. Sections 1.10.32 and 1.10.33 from \"de\r\n          Finibus Bonorum et Malorum\" by Cicero are also reproduced in their\r\n          exact original form, accompanied by English versions from the 1914\r\n          translation by H. Rackham.");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block_1.name,
    		type: "fallback",
    		source: "(50:26)             Contrary to popular belief, Lorem Ipsum is not simply random text. It            has roots in a piece of classical Latin literature from 45 BC, making            it over 2000 years old. Richard McClintock, a Latin professor at            Hampden-Sydney College in Virginia, looked up one of the more obscure            Latin words, consectetur, from a Lorem Ipsum passage, and going            through the cites of the word in classical literature, discovered the            undoubtable source. Lorem Ipsum comes from sections 1.10.32 and            1.10.33 of \\\"de Finibus Bonorum et Malorum\\\" (The Extremes of Good and            Evil) by Cicero, written in 45 BC. This book is a treatise on the            theory of ethics, very popular during the Renaissance. The first line            of Lorem Ipsum, \\\"Lorem ipsum dolor sit amet..\\\", comes from a line in            section 1.10.32. The standard chunk of Lorem Ipsum used since the            1500s is reproduced below for those interested. Sections 1.10.32 and            1.10.33 from \\\"de Finibus Bonorum et Malorum\\\" by Cicero are also            reproduced in their exact original form, accompanied by English            versions from the 1914 translation by H. Rackham. Contrary to popular            belief, Lorem Ipsum is not simply random text. It has roots in a piece            of classical Latin literature from 45 BC, making it over 2000 years            old. Richard McClintock, a Latin professor at Hampden-Sydney College            in Virginia, looked up one of the more obscure Latin words,            consectetur, from a Lorem Ipsum passage, and going through the cites            of the word in classical literature, discovered the undoubtable            source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of \\\"de            Finibus Bonorum et Malorum\\\" (The Extremes of Good and Evil) by Cicero,            written in 45 BC. This book is a treatise on the theory of ethics,            very popular during the Renaissance. The first line of Lorem Ipsum,            \\\"Lorem ipsum dolor sit amet..\\\", comes from a line in section 1.10.32.            The standard chunk of Lorem Ipsum used since the 1500s is reproduced            below for those interested. Sections 1.10.32 and 1.10.33 from \\\"de            Finibus Bonorum et Malorum\\\" by Cicero are also reproduced in their            exact original form, accompanied by English versions from the 1914            translation by H. Rackham.          ",
    		ctx
    	});

    	return block;
    }

    // (86:28) See the code
    function fallback_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("See the code");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block.name,
    		type: "fallback",
    		source: "(86:28) See the code",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*showModal*/ ctx[0] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*showModal*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*showModal*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { canCloseModal = () => true } = $$props;
    	let { showModal } = $$props;

    	function toggleModal() {
    		$$invalidate(0, showModal = !showModal);
    	}

    	function handleClose() {
    		if (canCloseModal()) {
    			toggleModal();
    		}

    		return;
    	}

    	const writable_props = ["canCloseModal", "showModal"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<AboutModal> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("AboutModal", $$slots, ['title','body','footer']);

    	$$self.$set = $$props => {
    		if ("canCloseModal" in $$props) $$invalidate(1, canCloseModal = $$props.canCloseModal);
    		if ("showModal" in $$props) $$invalidate(0, showModal = $$props.showModal);
    		if ("$$scope" in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		fade,
    		fly,
    		canCloseModal,
    		showModal,
    		toggleModal,
    		handleClose
    	});

    	$$self.$inject_state = $$props => {
    		if ("canCloseModal" in $$props) $$invalidate(1, canCloseModal = $$props.canCloseModal);
    		if ("showModal" in $$props) $$invalidate(0, showModal = $$props.showModal);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [showModal, canCloseModal, $$scope, $$slots];
    }

    class AboutModal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { canCloseModal: 1, showModal: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AboutModal",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*showModal*/ ctx[0] === undefined && !("showModal" in props)) {
    			console.warn("<AboutModal> was created without expected prop 'showModal'");
    		}
    	}

    	get canCloseModal() {
    		throw new Error("<AboutModal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set canCloseModal(value) {
    		throw new Error("<AboutModal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showModal() {
    		throw new Error("<AboutModal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showModal(value) {
    		throw new Error("<AboutModal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\client\components\About.svelte generated by Svelte v3.24.0 */
    const file$7 = "src\\client\\components\\About.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (41:4) <span slot="title">
    function create_title_slot(ctx) {
    	let span;
    	let t_value = /*aboutData*/ ctx[0].title + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "slot", "title");
    			add_location(span, file$7, 40, 4, 747);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*aboutData*/ 1 && t_value !== (t_value = /*aboutData*/ ctx[0].title + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_title_slot.name,
    		type: "slot",
    		source: "(41:4) <span slot=\\\"title\\\">",
    		ctx
    	});

    	return block;
    }

    // (47:8) {#each aboutData.tags as tag}
    function create_each_block$1(ctx) {
    	let span;
    	let t_value = /*tag*/ ctx[4] + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "badge badge-dark svelte-1m5zuhu");
    			add_location(span, file$7, 47, 10, 970);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*aboutData*/ 1 && t_value !== (t_value = /*tag*/ ctx[4] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(47:8) {#each aboutData.tags as tag}",
    		ctx
    	});

    	return block;
    }

    // (42:4) <span slot="body">
    function create_body_slot(ctx) {
    	let span;
    	let div0;
    	let raw_value = /*aboutData*/ ctx[0].summary + "";
    	let t;
    	let div1;
    	let each_value = /*aboutData*/ ctx[0].tags;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			span = element("span");
    			div0 = element("div");
    			t = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "f16");
    			add_location(div0, file$7, 42, 6, 822);
    			attr_dev(div1, "class", "tags mt-2");
    			add_location(div1, file$7, 45, 6, 896);
    			attr_dev(span, "slot", "body");
    			add_location(span, file$7, 41, 4, 796);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, div0);
    			div0.innerHTML = raw_value;
    			append_dev(span, t);
    			append_dev(span, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*aboutData*/ 1 && raw_value !== (raw_value = /*aboutData*/ ctx[0].summary + "")) div0.innerHTML = raw_value;
    			if (dirty & /*aboutData*/ 1) {
    				each_value = /*aboutData*/ ctx[0].tags;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_body_slot.name,
    		type: "slot",
    		source: "(42:4) <span slot=\\\"body\\\">",
    		ctx
    	});

    	return block;
    }

    // (52:4) <span slot="footer">
    function create_footer_slot(ctx) {
    	let span;
    	let a;
    	let t;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			span = element("span");
    			a = element("a");
    			t = text("See the code");
    			attr_dev(a, "href", a_href_value = /*aboutData*/ ctx[0].link);
    			attr_dev(a, "target", "_blank");
    			add_location(a, file$7, 52, 6, 1091);
    			attr_dev(span, "slot", "footer");
    			add_location(span, file$7, 51, 4, 1063);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, a);
    			append_dev(a, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*aboutData*/ 1 && a_href_value !== (a_href_value = /*aboutData*/ ctx[0].link)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_footer_slot.name,
    		type: "slot",
    		source: "(52:4) <span slot=\\\"footer\\\">",
    		ctx
    	});

    	return block;
    }

    // (40:2) <AboutModal bind:showModal>
    function create_default_slot(ctx) {
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = space();
    			t1 = space();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(40:2) <AboutModal bind:showModal>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let div;
    	let a;
    	let i;
    	let i_class_value;
    	let t;
    	let aboutmodal;
    	let updating_showModal;
    	let current;
    	let mounted;
    	let dispose;

    	function aboutmodal_showModal_binding(value) {
    		/*aboutmodal_showModal_binding*/ ctx[3].call(null, value);
    	}

    	let aboutmodal_props = {
    		$$slots: {
    			default: [create_default_slot],
    			footer: [create_footer_slot],
    			body: [create_body_slot],
    			title: [create_title_slot]
    		},
    		$$scope: { ctx }
    	};

    	if (/*showModal*/ ctx[1] !== void 0) {
    		aboutmodal_props.showModal = /*showModal*/ ctx[1];
    	}

    	aboutmodal = new AboutModal({ props: aboutmodal_props, $$inline: true });
    	binding_callbacks.push(() => bind(aboutmodal, "showModal", aboutmodal_showModal_binding));

    	const block = {
    		c: function create() {
    			div = element("div");
    			a = element("a");
    			i = element("i");
    			t = space();
    			create_component(aboutmodal.$$.fragment);

    			attr_dev(i, "class", i_class_value = "" + (null_to_empty(/*showModal*/ ctx[1]
    			? "fa fa-chevron-circle-down"
    			: "fa fa-info-circle") + " svelte-1m5zuhu"));

    			add_location(i, file$7, 36, 4, 625);
    			attr_dev(a, "href", "/");
    			add_location(a, file$7, 35, 2, 568);
    			add_location(div, file$7, 33, 0, 557);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, a);
    			append_dev(a, i);
    			append_dev(div, t);
    			mount_component(aboutmodal, div, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(a, "click", prevent_default(/*toggleExpand*/ ctx[2]), false, true, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*showModal*/ 2 && i_class_value !== (i_class_value = "" + (null_to_empty(/*showModal*/ ctx[1]
    			? "fa fa-chevron-circle-down"
    			: "fa fa-info-circle") + " svelte-1m5zuhu"))) {
    				attr_dev(i, "class", i_class_value);
    			}

    			const aboutmodal_changes = {};

    			if (dirty & /*$$scope, aboutData*/ 129) {
    				aboutmodal_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_showModal && dirty & /*showModal*/ 2) {
    				updating_showModal = true;
    				aboutmodal_changes.showModal = /*showModal*/ ctx[1];
    				add_flush_callback(() => updating_showModal = false);
    			}

    			aboutmodal.$set(aboutmodal_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(aboutmodal.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(aboutmodal.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(aboutmodal);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { aboutData = {
    		title: "Project name here",
    		content: "Lots of content about project here",
    		link: "/"
    	} } = $$props;

    	let showModal = false;

    	function toggleExpand() {
    		$$invalidate(1, showModal = !showModal);
    	}

    	const writable_props = ["aboutData"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<About> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("About", $$slots, []);

    	function aboutmodal_showModal_binding(value) {
    		showModal = value;
    		$$invalidate(1, showModal);
    	}

    	$$self.$set = $$props => {
    		if ("aboutData" in $$props) $$invalidate(0, aboutData = $$props.aboutData);
    	};

    	$$self.$capture_state = () => ({
    		fade,
    		fly,
    		AboutModal,
    		aboutData,
    		showModal,
    		toggleExpand
    	});

    	$$self.$inject_state = $$props => {
    		if ("aboutData" in $$props) $$invalidate(0, aboutData = $$props.aboutData);
    		if ("showModal" in $$props) $$invalidate(1, showModal = $$props.showModal);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [aboutData, showModal, toggleExpand, aboutmodal_showModal_binding];
    }

    class About extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { aboutData: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "About",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get aboutData() {
    		throw new Error("<About>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set aboutData(value) {
    		throw new Error("<About>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var scrollToTop = () => {
      window.scrollTo(0, 0);
    };

    /* src\client\routes\portfolio\RandomImageGenerator.svelte generated by Svelte v3.24.0 */

    const { console: console_1 } = globals;
    const file$8 = "src\\client\\routes\\portfolio\\RandomImageGenerator.svelte";

    // (62:2) {#if src}
    function create_if_block$2(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (!/*buttonDisabled*/ ctx[4]) return create_if_block_1$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(62:2) {#if src}",
    		ctx
    	});

    	return block;
    }

    // (81:4) {:else}
    function create_else_block$1(ctx) {
    	let div;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			if (img.src !== (img_src_value = "/imgs/fail.jpg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "class", "img-thumbnail");
    			set_style(img, "height", "600px");
    			set_style(img, "width", "600px");
    			add_location(img, file$8, 82, 8, 2293);
    			attr_dev(div, "class", "d-flex justify-content-center m-2");
    			add_location(div, file$8, 81, 6, 2236);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(81:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (63:4) {#if !buttonDisabled}
    function create_if_block_1$1(ctx) {
    	let div0;
    	let t0;
    	let a0;
    	let t1;
    	let a0_href_value;
    	let t2;
    	let a1;
    	let t4;
    	let div1;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = text("Photo by  \r\n        ");
    			a0 = element("a");
    			t1 = text(/*author*/ ctx[0]);
    			t2 = text("\r\n          on  \r\n        ");
    			a1 = element("a");
    			a1.textContent = "Unsplash";
    			t4 = space();
    			div1 = element("div");
    			img = element("img");
    			attr_dev(a0, "href", a0_href_value = "" + (/*portfolio*/ ctx[1] + "?utm_source=Jane-Benson&utm_medium=referral"));
    			attr_dev(a0, "target", "_blank");
    			add_location(a0, file$8, 65, 8, 1756);
    			attr_dev(a1, "href", "https://unsplash.com/?utm_source=Jane-Benson&utm_medium=referral");
    			attr_dev(a1, "target", "_blank");
    			add_location(a1, file$8, 71, 8, 1929);
    			attr_dev(div0, "class", "d-flex justify-content-center m-2");
    			add_location(div0, file$8, 63, 6, 1674);
    			if (img.src !== (img_src_value = /*src*/ ctx[2])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "alt-text");
    			attr_dev(img, "class", "img-thumbnail");
    			add_location(img, file$8, 78, 8, 2151);
    			attr_dev(div1, "class", "d-flex justify-content-center");
    			add_location(div1, file$8, 77, 6, 2098);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, t0);
    			append_dev(div0, a0);
    			append_dev(a0, t1);
    			append_dev(div0, t2);
    			append_dev(div0, a1);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, img);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*author*/ 1) set_data_dev(t1, /*author*/ ctx[0]);

    			if (dirty & /*portfolio*/ 2 && a0_href_value !== (a0_href_value = "" + (/*portfolio*/ ctx[1] + "?utm_source=Jane-Benson&utm_medium=referral"))) {
    				attr_dev(a0, "href", a0_href_value);
    			}

    			if (dirty & /*src*/ 4 && img.src !== (img_src_value = /*src*/ ctx[2])) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(63:4) {#if !buttonDisabled}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let div1;
    	let div0;
    	let button;
    	let t0;
    	let button_class_value;
    	let button_disabled_value;
    	let t1;
    	let t2;
    	let about;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*src*/ ctx[2] && create_if_block$2(ctx);

    	about = new About({
    			props: {
    				aboutData: /*aboutData*/ ctx[5],
    				"}": true
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			button = element("button");
    			t0 = text(/*buttonText*/ ctx[3]);
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			create_component(about.$$.fragment);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", button_class_value = "btn btn-outline-dark " + (/*buttonDisabled*/ ctx[4] ? "disabled" : ""));
    			button.disabled = button_disabled_value = /*buttonDisabled*/ ctx[4] || undefined;
    			add_location(button, file$8, 53, 4, 1405);
    			attr_dev(div0, "class", "d-flex justify-content-center m-4");
    			add_location(div0, file$8, 52, 2, 1352);
    			attr_dev(div1, "class", "page-content");
    			add_location(div1, file$8, 51, 0, 1322);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, button);
    			append_dev(button, t0);
    			append_dev(div1, t1);
    			if (if_block) if_block.m(div1, null);
    			append_dev(div1, t2);
    			mount_component(about, div1, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*handleClick*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*buttonText*/ 8) set_data_dev(t0, /*buttonText*/ ctx[3]);

    			if (!current || dirty & /*buttonDisabled*/ 16 && button_class_value !== (button_class_value = "btn btn-outline-dark " + (/*buttonDisabled*/ ctx[4] ? "disabled" : ""))) {
    				attr_dev(button, "class", button_class_value);
    			}

    			if (!current || dirty & /*buttonDisabled*/ 16 && button_disabled_value !== (button_disabled_value = /*buttonDisabled*/ ctx[4] || undefined)) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}

    			if (/*src*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(div1, t2);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(about.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(about.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    			destroy_component(about);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let author, portfolio, src;
    	let buttonText = "Get your random image!";
    	let buttonDisabled = false;
    	let clickCount = 0;

    	let aboutData = {
    		title: "Random Image Generator",
    		summary: `This project uses the <a href="https://unsplash.com/documentation#get-a-random-photo" target="_blank">Unsplash API</a> to get a random image when the button is clicked.`,
    		tags: ["Fetch API", "Unsplash API", "Bootstrap", "Svelte"],
    		link: "/"
    	};

    	async function getImage() {
    		try {
    			const data = await fetch("/api/random-image").then(res => res.json());
    			console.log(data);
    			$$invalidate(0, author = data.author.name);
    			$$invalidate(1, portfolio = data.author.portfolio);
    			$$invalidate(2, src = data.urls.small);
    		} catch(error) {
    			console.log(error);
    		}
    	}

    	async function handleClick() {
    		await getImage();
    		$$invalidate(7, clickCount++, clickCount);
    	}

    	scrollToTop();
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<RandomImageGenerator> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("RandomImageGenerator", $$slots, []);

    	$$self.$capture_state = () => ({
    		About,
    		scrollToTop,
    		author,
    		portfolio,
    		src,
    		buttonText,
    		buttonDisabled,
    		clickCount,
    		aboutData,
    		getImage,
    		handleClick
    	});

    	$$self.$inject_state = $$props => {
    		if ("author" in $$props) $$invalidate(0, author = $$props.author);
    		if ("portfolio" in $$props) $$invalidate(1, portfolio = $$props.portfolio);
    		if ("src" in $$props) $$invalidate(2, src = $$props.src);
    		if ("buttonText" in $$props) $$invalidate(3, buttonText = $$props.buttonText);
    		if ("buttonDisabled" in $$props) $$invalidate(4, buttonDisabled = $$props.buttonDisabled);
    		if ("clickCount" in $$props) $$invalidate(7, clickCount = $$props.clickCount);
    		if ("aboutData" in $$props) $$invalidate(5, aboutData = $$props.aboutData);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*clickCount*/ 128) {
    			 {
    				if (clickCount >= 5) {
    					$$invalidate(3, buttonText = "No more for you...");
    					$$invalidate(4, buttonDisabled = true);
    				} else if (clickCount >= 3) {
    					$$invalidate(3, buttonText = "What was wrong with the last one?");
    				} else if (clickCount >= 1) {
    					$$invalidate(3, buttonText = "Get another random image!");
    				}
    			}
    		}
    	};

    	return [author, portfolio, src, buttonText, buttonDisabled, aboutData, handleClick];
    }

    class RandomImageGenerator extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RandomImageGenerator",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src\client\routes\Resume.svelte generated by Svelte v3.24.0 */

    const file$9 = "src\\client\\routes\\Resume.svelte";

    function create_fragment$b(ctx) {
    	let div;
    	let h30;
    	let t1;
    	let hr0;
    	let t2;
    	let p0;
    	let b0;
    	let t4;
    	let span0;
    	let b1;
    	let t6;
    	let br0;
    	let t7;
    	let b2;
    	let t9;
    	let span1;
    	let b3;
    	let t11;
    	let br1;
    	let t12;
    	let span2;
    	let t14;
    	let h31;
    	let t16;
    	let hr1;
    	let t17;
    	let p1;
    	let b4;
    	let t19;
    	let br2;
    	let t20;
    	let b5;
    	let t22;
    	let br3;
    	let t23;
    	let b6;
    	let t25;
    	let br4;
    	let t26;
    	let b7;
    	let t28;
    	let br5;
    	let t29;
    	let b8;
    	let t31;
    	let br6;
    	let t32;
    	let h32;
    	let t34;
    	let hr2;
    	let t35;
    	let p2;
    	let b9;
    	let t37;
    	let span3;
    	let b10;
    	let t39;
    	let br7;
    	let t40;
    	let b11;
    	let t42;
    	let span4;
    	let b12;
    	let t44;
    	let ul0;
    	let li0;
    	let t46;
    	let li1;
    	let t48;
    	let li2;
    	let t50;
    	let li3;
    	let t52;
    	let li4;
    	let t54;
    	let p3;
    	let b13;
    	let t56;
    	let span5;
    	let b14;
    	let t58;
    	let br8;
    	let t59;
    	let b15;
    	let t61;
    	let span6;
    	let b16;
    	let t63;
    	let br9;
    	let t64;
    	let ul1;
    	let li5;
    	let t66;
    	let li6;
    	let t68;
    	let li7;
    	let t70;
    	let li8;
    	let t72;
    	let li9;
    	let t74;
    	let p4;
    	let b17;
    	let t76;
    	let span7;
    	let b18;
    	let t78;
    	let br10;
    	let t79;
    	let b19;
    	let t81;
    	let span8;
    	let b20;
    	let t83;
    	let br11;
    	let t84;
    	let ul2;
    	let li10;
    	let t86;
    	let li11;
    	let t88;
    	let li12;
    	let t90;
    	let p5;
    	let b21;
    	let t92;
    	let span9;
    	let b22;
    	let t94;
    	let br12;
    	let t95;
    	let b23;
    	let t97;
    	let span10;
    	let b24;
    	let t99;
    	let br13;
    	let t100;
    	let ul3;
    	let li13;
    	let t102;
    	let li14;
    	let t104;
    	let li15;
    	let t106;
    	let p6;
    	let b25;
    	let t108;
    	let span11;
    	let b26;
    	let t110;
    	let br14;
    	let t111;
    	let b27;
    	let t113;
    	let span12;
    	let b28;
    	let t115;
    	let br15;
    	let t116;
    	let ul4;
    	let li16;
    	let t118;
    	let li17;
    	let t120;
    	let li18;
    	let t122;
    	let p7;
    	let b29;
    	let t124;
    	let span13;
    	let b30;
    	let t126;
    	let br16;
    	let t127;
    	let b31;
    	let t129;
    	let span14;
    	let b32;
    	let t131;
    	let br17;
    	let t132;
    	let ul5;
    	let li19;
    	let t134;
    	let li20;
    	let t136;
    	let li21;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h30 = element("h3");
    			h30.textContent = "Education";
    			t1 = space();
    			hr0 = element("hr");
    			t2 = space();
    			p0 = element("p");
    			b0 = element("b");
    			b0.textContent = "University of Minnesota - Twin Cities";
    			t4 = space();
    			span0 = element("span");
    			b1 = element("b");
    			b1.textContent = "Minneapolis, MN";
    			t6 = space();
    			br0 = element("br");
    			t7 = space();
    			b2 = element("b");
    			b2.textContent = "Bachelor of Arts, Mathematics";
    			t9 = space();
    			span1 = element("span");
    			b3 = element("b");
    			b3.textContent = "May 2016";
    			t11 = space();
    			br1 = element("br");
    			t12 = text("\r\n    Emphasis in Math Education\r\n    ");
    			span2 = element("span");
    			span2.textContent = "Cumulative GPA: 3.74";
    			t14 = space();
    			h31 = element("h3");
    			h31.textContent = "Technical Skills";
    			t16 = space();
    			hr1 = element("hr");
    			t17 = space();
    			p1 = element("p");
    			b4 = element("b");
    			b4.textContent = "Client-side languages:";
    			t19 = text("\r\n    HTML, CSS, JavaScript\r\n    ");
    			br2 = element("br");
    			t20 = space();
    			b5 = element("b");
    			b5.textContent = "Client-side frameworks:";
    			t22 = text("\r\n    Svelte\r\n    ");
    			br3 = element("br");
    			t23 = space();
    			b6 = element("b");
    			b6.textContent = "Server-side languages:";
    			t25 = text("\r\n    Python, Node.js\r\n    ");
    			br4 = element("br");
    			t26 = space();
    			b7 = element("b");
    			b7.textContent = "Backend frameworks:";
    			t28 = text("\r\n    Flask, Express.js\r\n    ");
    			br5 = element("br");
    			t29 = space();
    			b8 = element("b");
    			b8.textContent = "Databases:";
    			t31 = text("\r\n    SQLite (SQLAlchemy, Sequelize), MongoDB (Mongoose)\r\n    ");
    			br6 = element("br");
    			t32 = space();
    			h32 = element("h3");
    			h32.textContent = "Experience";
    			t34 = space();
    			hr2 = element("hr");
    			t35 = space();
    			p2 = element("p");
    			b9 = element("b");
    			b9.textContent = "Contract Technical Writer";
    			t37 = space();
    			span3 = element("span");
    			b10 = element("b");
    			b10.textContent = "April 2020 – Present";
    			t39 = space();
    			br7 = element("br");
    			t40 = space();
    			b11 = element("b");
    			b11.textContent = "BlueSnap";
    			t42 = space();
    			span4 = element("span");
    			b12 = element("b");
    			b12.textContent = "Remote";
    			t44 = space();
    			ul0 = element("ul");
    			li0 = element("li");
    			li0.textContent = "Manage technical documentation for BlueSnap and their child company,\r\n      Armatic.";
    			t46 = space();
    			li1 = element("li");
    			li1.textContent = "Determine documentation requirements for agile releases.";
    			t48 = space();
    			li2 = element("li");
    			li2.textContent = "Collaborate with product team and developers to gather information.";
    			t50 = space();
    			li3 = element("li");
    			li3.textContent = "Write, edit, and release REST API reference sections, technical guides,\r\n      and more to meet strict release deadlines.";
    			t52 = space();
    			li4 = element("li");
    			li4.textContent = "Test API endpoints in Postman and write custom code samples.";
    			t54 = space();
    			p3 = element("p");
    			b13 = element("b");
    			b13.textContent = "Technical Writer";
    			t56 = space();
    			span5 = element("span");
    			b14 = element("b");
    			b14.textContent = "January 2017 – April 2018";
    			t58 = space();
    			br8 = element("br");
    			t59 = space();
    			b15 = element("b");
    			b15.textContent = "BlueSnap";
    			t61 = space();
    			span6 = element("span");
    			b16 = element("b");
    			b16.textContent = "Waltham, MA";
    			t63 = space();
    			br9 = element("br");
    			t64 = space();
    			ul1 = element("ul");
    			li5 = element("li");
    			li5.textContent = "Managed 2 documentation websites via ReadMe.io for an ecommerce software\r\n      company.";
    			t66 = space();
    			li6 = element("li");
    			li6.textContent = "Wrote and edited comprehensive online content for developers and other\r\n      target audiences.";
    			t68 = space();
    			li7 = element("li");
    			li7.textContent = "Authored REST API reference guides, integration manuals, FAQs, and more.";
    			t70 = space();
    			li8 = element("li");
    			li8.textContent = "Interviewed subject-matter experts to gather information and ensure\r\n      documentation accuracy.";
    			t72 = space();
    			li9 = element("li");
    			li9.textContent = "Learned and applied HTML, CSS, and JavaScript to enhance website UX/UI.";
    			t74 = space();
    			p4 = element("p");
    			b17 = element("b");
    			b17.textContent = "Technical Writer and Trainer";
    			t76 = space();
    			span7 = element("span");
    			b18 = element("b");
    			b18.textContent = "September 2016 – November 2016";
    			t78 = space();
    			br10 = element("br");
    			t79 = space();
    			b19 = element("b");
    			b19.textContent = "Barton Associates";
    			t81 = space();
    			span8 = element("span");
    			b20 = element("b");
    			b20.textContent = "Peabody, MA";
    			t83 = space();
    			br11 = element("br");
    			t84 = space();
    			ul2 = element("ul");
    			li10 = element("li");
    			li10.textContent = "Managed Barton Associates’ internal timesheet training program.";
    			t86 = space();
    			li11 = element("li");
    			li11.textContent = "Filmed, edited, and produced training videos using Camtasia.";
    			t88 = space();
    			li12 = element("li");
    			li12.textContent = "Created and led webinars for 180+ employees through collaborative learning\r\n      strategies.";
    			t90 = space();
    			p5 = element("p");
    			b21 = element("b");
    			b21.textContent = "Training and Development Assistant";
    			t92 = space();
    			span9 = element("span");
    			b22 = element("b");
    			b22.textContent = "February 2016 – January 2017";
    			t94 = space();
    			br12 = element("br");
    			t95 = space();
    			b23 = element("b");
    			b23.textContent = "University of Minnesota, Peer-Assisted Learning Program";
    			t97 = space();
    			span10 = element("span");
    			b24 = element("b");
    			b24.textContent = "Remote";
    			t99 = space();
    			br13 = element("br");
    			t100 = space();
    			ul3 = element("ul");
    			li13 = element("li");
    			li13.textContent = "Collaborated with the Program Director to evaluate training curriculum and\r\n      identify improvement areas.";
    			t102 = space();
    			li14 = element("li");
    			li14.textContent = "Designed and authored a 50-page team leader handbook using Microsoft Word.";
    			t104 = space();
    			li15 = element("li");
    			li15.textContent = "Edited training videos for professional development workshops.";
    			t106 = space();
    			p6 = element("p");
    			b25 = element("b");
    			b25.textContent = "Team Leader";
    			t108 = space();
    			span11 = element("span");
    			b26 = element("b");
    			b26.textContent = "August 2015 – May 2016";
    			t110 = space();
    			br14 = element("br");
    			t111 = space();
    			b27 = element("b");
    			b27.textContent = "University of Minnesota, Peer-Assisted Learning Program";
    			t113 = space();
    			span12 = element("span");
    			b28 = element("b");
    			b28.textContent = "Minneapolis, MN";
    			t115 = space();
    			br15 = element("br");
    			t116 = space();
    			ul4 = element("ul");
    			li16 = element("li");
    			li16.textContent = "Led and mentored a group of 7 Peer-Assisted Learning Facilitators.";
    			t118 = space();
    			li17 = element("li");
    			li17.textContent = "Assisted with planning and conducting bi-annual employee training and\r\n      new-hire orientations.";
    			t120 = space();
    			li18 = element("li");
    			li18.textContent = "Planned and conducted weekly 50-minute meetings, and drafted meeting\r\n      reports in a timely manner.";
    			t122 = space();
    			p7 = element("p");
    			b29 = element("b");
    			b29.textContent = "Peer-Assisted Learning Facilitator";
    			t124 = space();
    			span13 = element("span");
    			b30 = element("b");
    			b30.textContent = "August 2014 – May 2016";
    			t126 = space();
    			br16 = element("br");
    			t127 = space();
    			b31 = element("b");
    			b31.textContent = "University of Minnesota, Peer-Assisted Learning Program";
    			t129 = space();
    			span14 = element("span");
    			b32 = element("b");
    			b32.textContent = "Minneapolis, MN";
    			t131 = space();
    			br17 = element("br");
    			t132 = space();
    			ul5 = element("ul");
    			li19 = element("li");
    			li19.textContent = "Facilitated weekly 50-minute academic sessions and managed classrooms of\r\n      30+ pre-calculus students.";
    			t134 = space();
    			li20 = element("li");
    			li20.textContent = "Identified learning objectives and prepared session plans, worksheets, and\r\n      other materials in support.";
    			t136 = space();
    			li21 = element("li");
    			li21.textContent = "Demonstrated clear communication and active listening regarding difficult\r\n      technical concepts.";
    			add_location(h30, file$9, 30, 2, 496);
    			add_location(hr0, file$9, 31, 2, 518);
    			add_location(b0, file$9, 33, 4, 537);
    			add_location(b1, file$9, 35, 6, 621);
    			attr_dev(span0, "class", "float-right");
    			add_location(span0, file$9, 34, 4, 587);
    			add_location(br0, file$9, 37, 4, 662);
    			add_location(b2, file$9, 38, 4, 674);
    			add_location(b3, file$9, 40, 6, 750);
    			attr_dev(span1, "class", "float-right");
    			add_location(span1, file$9, 39, 4, 716);
    			add_location(br1, file$9, 42, 4, 784);
    			attr_dev(span2, "class", "float-right");
    			add_location(span2, file$9, 44, 4, 828);
    			attr_dev(p0, "class", "svelte-19cfzn5");
    			add_location(p0, file$9, 32, 2, 528);
    			add_location(h31, file$9, 47, 2, 895);
    			add_location(hr1, file$9, 48, 2, 924);
    			add_location(b4, file$9, 50, 4, 943);
    			add_location(br2, file$9, 52, 4, 1005);
    			add_location(b5, file$9, 53, 4, 1017);
    			add_location(br3, file$9, 55, 4, 1065);
    			add_location(b6, file$9, 56, 4, 1077);
    			add_location(br4, file$9, 58, 4, 1133);
    			add_location(b7, file$9, 59, 4, 1145);
    			add_location(br5, file$9, 61, 4, 1200);
    			add_location(b8, file$9, 62, 4, 1212);
    			add_location(br6, file$9, 64, 4, 1291);
    			attr_dev(p1, "class", "svelte-19cfzn5");
    			add_location(p1, file$9, 49, 2, 934);
    			add_location(h32, file$9, 67, 2, 1311);
    			add_location(hr2, file$9, 68, 2, 1334);
    			add_location(b9, file$9, 70, 4, 1353);
    			add_location(b10, file$9, 72, 6, 1425);
    			attr_dev(span3, "class", "float-right");
    			add_location(span3, file$9, 71, 4, 1391);
    			add_location(br7, file$9, 74, 4, 1471);
    			add_location(b11, file$9, 75, 4, 1483);
    			add_location(b12, file$9, 77, 6, 1538);
    			attr_dev(span4, "class", "float-right");
    			add_location(span4, file$9, 76, 4, 1504);
    			attr_dev(p2, "class", "svelte-19cfzn5");
    			add_location(p2, file$9, 69, 2, 1344);
    			add_location(li0, file$9, 81, 4, 1586);
    			add_location(li1, file$9, 85, 4, 1699);
    			add_location(li2, file$9, 86, 4, 1770);
    			add_location(li3, file$9, 87, 4, 1852);
    			add_location(li4, file$9, 91, 4, 2002);
    			attr_dev(ul0, "class", "svelte-19cfzn5");
    			add_location(ul0, file$9, 80, 2, 1576);
    			add_location(b13, file$9, 94, 4, 2093);
    			add_location(b14, file$9, 96, 6, 2156);
    			attr_dev(span5, "class", "float-right");
    			add_location(span5, file$9, 95, 4, 2122);
    			add_location(br8, file$9, 98, 4, 2207);
    			add_location(b15, file$9, 99, 4, 2219);
    			add_location(b16, file$9, 101, 6, 2274);
    			attr_dev(span6, "class", "float-right");
    			add_location(span6, file$9, 100, 4, 2240);
    			add_location(br9, file$9, 103, 4, 2311);
    			attr_dev(p3, "class", "svelte-19cfzn5");
    			add_location(p3, file$9, 93, 2, 2084);
    			add_location(li5, file$9, 106, 4, 2339);
    			add_location(li6, file$9, 110, 4, 2456);
    			add_location(li7, file$9, 114, 4, 2580);
    			add_location(li8, file$9, 117, 4, 2681);
    			add_location(li9, file$9, 121, 4, 2808);
    			attr_dev(ul1, "class", "svelte-19cfzn5");
    			add_location(ul1, file$9, 105, 2, 2329);
    			add_location(b17, file$9, 126, 4, 2924);
    			add_location(b18, file$9, 128, 6, 2999);
    			attr_dev(span7, "class", "float-right");
    			add_location(span7, file$9, 127, 4, 2965);
    			add_location(br10, file$9, 130, 4, 3055);
    			add_location(b19, file$9, 131, 4, 3067);
    			add_location(b20, file$9, 133, 6, 3131);
    			attr_dev(span8, "class", "float-right");
    			add_location(span8, file$9, 132, 4, 3097);
    			add_location(br11, file$9, 135, 4, 3168);
    			attr_dev(p4, "class", "svelte-19cfzn5");
    			add_location(p4, file$9, 125, 2, 2915);
    			add_location(li10, file$9, 138, 4, 3196);
    			add_location(li11, file$9, 139, 4, 3274);
    			add_location(li12, file$9, 140, 4, 3349);
    			attr_dev(ul2, "class", "svelte-19cfzn5");
    			add_location(ul2, file$9, 137, 2, 3186);
    			add_location(b21, file$9, 148, 4, 3491);
    			add_location(b22, file$9, 150, 6, 3572);
    			attr_dev(span9, "class", "float-right");
    			add_location(span9, file$9, 149, 4, 3538);
    			add_location(br12, file$9, 152, 4, 3626);
    			add_location(b23, file$9, 153, 4, 3638);
    			add_location(b24, file$9, 155, 6, 3740);
    			attr_dev(span10, "class", "float-right");
    			add_location(span10, file$9, 154, 4, 3706);
    			add_location(br13, file$9, 157, 4, 3772);
    			attr_dev(p5, "class", "svelte-19cfzn5");
    			add_location(p5, file$9, 147, 2, 3482);
    			add_location(li13, file$9, 160, 4, 3800);
    			add_location(li14, file$9, 164, 4, 3938);
    			add_location(li15, file$9, 167, 4, 4041);
    			attr_dev(ul3, "class", "svelte-19cfzn5");
    			add_location(ul3, file$9, 159, 2, 3790);
    			add_location(b25, file$9, 171, 4, 4136);
    			add_location(b26, file$9, 173, 6, 4194);
    			attr_dev(span11, "class", "float-right");
    			add_location(span11, file$9, 172, 4, 4160);
    			add_location(br14, file$9, 175, 4, 4242);
    			add_location(b27, file$9, 176, 4, 4254);
    			add_location(b28, file$9, 178, 6, 4356);
    			attr_dev(span12, "class", "float-right");
    			add_location(span12, file$9, 177, 4, 4322);
    			add_location(br15, file$9, 180, 4, 4397);
    			attr_dev(p6, "class", "svelte-19cfzn5");
    			add_location(p6, file$9, 170, 2, 4127);
    			add_location(li16, file$9, 183, 4, 4425);
    			add_location(li17, file$9, 184, 4, 4506);
    			add_location(li18, file$9, 188, 4, 4634);
    			attr_dev(ul4, "class", "svelte-19cfzn5");
    			add_location(ul4, file$9, 182, 2, 4415);
    			add_location(b29, file$9, 195, 4, 4784);
    			add_location(b30, file$9, 197, 6, 4865);
    			attr_dev(span13, "class", "float-right");
    			add_location(span13, file$9, 196, 4, 4831);
    			add_location(br16, file$9, 199, 4, 4913);
    			add_location(b31, file$9, 200, 4, 4925);
    			add_location(b32, file$9, 202, 6, 5027);
    			attr_dev(span14, "class", "float-right");
    			add_location(span14, file$9, 201, 4, 4993);
    			add_location(br17, file$9, 204, 4, 5068);
    			attr_dev(p7, "class", "svelte-19cfzn5");
    			add_location(p7, file$9, 194, 2, 4775);
    			add_location(li19, file$9, 207, 4, 5096);
    			add_location(li20, file$9, 211, 4, 5231);
    			add_location(li21, file$9, 215, 4, 5369);
    			attr_dev(ul5, "class", "svelte-19cfzn5");
    			add_location(ul5, file$9, 206, 2, 5086);
    			attr_dev(div, "class", "resume page-content svelte-19cfzn5");
    			add_location(div, file$9, 29, 0, 459);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h30);
    			append_dev(div, t1);
    			append_dev(div, hr0);
    			append_dev(div, t2);
    			append_dev(div, p0);
    			append_dev(p0, b0);
    			append_dev(p0, t4);
    			append_dev(p0, span0);
    			append_dev(span0, b1);
    			append_dev(p0, t6);
    			append_dev(p0, br0);
    			append_dev(p0, t7);
    			append_dev(p0, b2);
    			append_dev(p0, t9);
    			append_dev(p0, span1);
    			append_dev(span1, b3);
    			append_dev(p0, t11);
    			append_dev(p0, br1);
    			append_dev(p0, t12);
    			append_dev(p0, span2);
    			append_dev(div, t14);
    			append_dev(div, h31);
    			append_dev(div, t16);
    			append_dev(div, hr1);
    			append_dev(div, t17);
    			append_dev(div, p1);
    			append_dev(p1, b4);
    			append_dev(p1, t19);
    			append_dev(p1, br2);
    			append_dev(p1, t20);
    			append_dev(p1, b5);
    			append_dev(p1, t22);
    			append_dev(p1, br3);
    			append_dev(p1, t23);
    			append_dev(p1, b6);
    			append_dev(p1, t25);
    			append_dev(p1, br4);
    			append_dev(p1, t26);
    			append_dev(p1, b7);
    			append_dev(p1, t28);
    			append_dev(p1, br5);
    			append_dev(p1, t29);
    			append_dev(p1, b8);
    			append_dev(p1, t31);
    			append_dev(p1, br6);
    			append_dev(div, t32);
    			append_dev(div, h32);
    			append_dev(div, t34);
    			append_dev(div, hr2);
    			append_dev(div, t35);
    			append_dev(div, p2);
    			append_dev(p2, b9);
    			append_dev(p2, t37);
    			append_dev(p2, span3);
    			append_dev(span3, b10);
    			append_dev(p2, t39);
    			append_dev(p2, br7);
    			append_dev(p2, t40);
    			append_dev(p2, b11);
    			append_dev(p2, t42);
    			append_dev(p2, span4);
    			append_dev(span4, b12);
    			append_dev(div, t44);
    			append_dev(div, ul0);
    			append_dev(ul0, li0);
    			append_dev(ul0, t46);
    			append_dev(ul0, li1);
    			append_dev(ul0, t48);
    			append_dev(ul0, li2);
    			append_dev(ul0, t50);
    			append_dev(ul0, li3);
    			append_dev(ul0, t52);
    			append_dev(ul0, li4);
    			append_dev(div, t54);
    			append_dev(div, p3);
    			append_dev(p3, b13);
    			append_dev(p3, t56);
    			append_dev(p3, span5);
    			append_dev(span5, b14);
    			append_dev(p3, t58);
    			append_dev(p3, br8);
    			append_dev(p3, t59);
    			append_dev(p3, b15);
    			append_dev(p3, t61);
    			append_dev(p3, span6);
    			append_dev(span6, b16);
    			append_dev(p3, t63);
    			append_dev(p3, br9);
    			append_dev(div, t64);
    			append_dev(div, ul1);
    			append_dev(ul1, li5);
    			append_dev(ul1, t66);
    			append_dev(ul1, li6);
    			append_dev(ul1, t68);
    			append_dev(ul1, li7);
    			append_dev(ul1, t70);
    			append_dev(ul1, li8);
    			append_dev(ul1, t72);
    			append_dev(ul1, li9);
    			append_dev(div, t74);
    			append_dev(div, p4);
    			append_dev(p4, b17);
    			append_dev(p4, t76);
    			append_dev(p4, span7);
    			append_dev(span7, b18);
    			append_dev(p4, t78);
    			append_dev(p4, br10);
    			append_dev(p4, t79);
    			append_dev(p4, b19);
    			append_dev(p4, t81);
    			append_dev(p4, span8);
    			append_dev(span8, b20);
    			append_dev(p4, t83);
    			append_dev(p4, br11);
    			append_dev(div, t84);
    			append_dev(div, ul2);
    			append_dev(ul2, li10);
    			append_dev(ul2, t86);
    			append_dev(ul2, li11);
    			append_dev(ul2, t88);
    			append_dev(ul2, li12);
    			append_dev(div, t90);
    			append_dev(div, p5);
    			append_dev(p5, b21);
    			append_dev(p5, t92);
    			append_dev(p5, span9);
    			append_dev(span9, b22);
    			append_dev(p5, t94);
    			append_dev(p5, br12);
    			append_dev(p5, t95);
    			append_dev(p5, b23);
    			append_dev(p5, t97);
    			append_dev(p5, span10);
    			append_dev(span10, b24);
    			append_dev(p5, t99);
    			append_dev(p5, br13);
    			append_dev(div, t100);
    			append_dev(div, ul3);
    			append_dev(ul3, li13);
    			append_dev(ul3, t102);
    			append_dev(ul3, li14);
    			append_dev(ul3, t104);
    			append_dev(ul3, li15);
    			append_dev(div, t106);
    			append_dev(div, p6);
    			append_dev(p6, b25);
    			append_dev(p6, t108);
    			append_dev(p6, span11);
    			append_dev(span11, b26);
    			append_dev(p6, t110);
    			append_dev(p6, br14);
    			append_dev(p6, t111);
    			append_dev(p6, b27);
    			append_dev(p6, t113);
    			append_dev(p6, span12);
    			append_dev(span12, b28);
    			append_dev(p6, t115);
    			append_dev(p6, br15);
    			append_dev(div, t116);
    			append_dev(div, ul4);
    			append_dev(ul4, li16);
    			append_dev(ul4, t118);
    			append_dev(ul4, li17);
    			append_dev(ul4, t120);
    			append_dev(ul4, li18);
    			append_dev(div, t122);
    			append_dev(div, p7);
    			append_dev(p7, b29);
    			append_dev(p7, t124);
    			append_dev(p7, span13);
    			append_dev(span13, b30);
    			append_dev(p7, t126);
    			append_dev(p7, br16);
    			append_dev(p7, t127);
    			append_dev(p7, b31);
    			append_dev(p7, t129);
    			append_dev(p7, span14);
    			append_dev(span14, b32);
    			append_dev(p7, t131);
    			append_dev(p7, br17);
    			append_dev(div, t132);
    			append_dev(div, ul5);
    			append_dev(ul5, li19);
    			append_dev(ul5, t134);
    			append_dev(ul5, li20);
    			append_dev(ul5, t136);
    			append_dev(ul5, li21);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Resume> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Resume", $$slots, []);
    	return [];
    }

    class Resume extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Resume",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src\client\App.svelte generated by Svelte v3.24.0 */
    const file$a = "src\\client\\App.svelte";

    // (50:4) <Route path="/">
    function create_default_slot_5(ctx) {
    	let home;
    	let current;
    	home = new Home({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(home.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(home, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(home.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(home.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(home, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(50:4) <Route path=\\\"/\\\">",
    		ctx
    	});

    	return block;
    }

    // (54:4) <Route path="resume">
    function create_default_slot_4(ctx) {
    	let resume;
    	let current;
    	resume = new Resume({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(resume.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(resume, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(resume.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(resume.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(resume, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(54:4) <Route path=\\\"resume\\\">",
    		ctx
    	});

    	return block;
    }

    // (58:4) <Route path="portfolio">
    function create_default_slot_3(ctx) {
    	let portfolio;
    	let current;
    	portfolio = new Portfolio({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(portfolio.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(portfolio, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(portfolio.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(portfolio.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(portfolio, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(58:4) <Route path=\\\"portfolio\\\">",
    		ctx
    	});

    	return block;
    }

    // (62:4) <Route path="creatures">
    function create_default_slot_2(ctx) {
    	let creatures;
    	let current;
    	creatures = new Creatures({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(creatures.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(creatures, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(creatures.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(creatures.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(creatures, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(62:4) <Route path=\\\"creatures\\\">",
    		ctx
    	});

    	return block;
    }

    // (67:4) <Route path="/portfolio/random-image-generator">
    function create_default_slot_1(ctx) {
    	let randomimagegenerator;
    	let current;
    	randomimagegenerator = new RandomImageGenerator({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(randomimagegenerator.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(randomimagegenerator, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(randomimagegenerator.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(randomimagegenerator.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(randomimagegenerator, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(67:4) <Route path=\\\"/portfolio/random-image-generator\\\">",
    		ctx
    	});

    	return block;
    }

    // (46:2) <Router>
    function create_default_slot$1(ctx) {
    	let navbar;
    	let t0;
    	let route0;
    	let t1;
    	let route1;
    	let t2;
    	let route2;
    	let t3;
    	let route3;
    	let t4;
    	let route4;
    	let t5;
    	let footer;
    	let current;
    	navbar = new NavBar({ $$inline: true });

    	route0 = new Route({
    			props: {
    				path: "/",
    				$$slots: { default: [create_default_slot_5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	route1 = new Route({
    			props: {
    				path: "resume",
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	route2 = new Route({
    			props: {
    				path: "portfolio",
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	route3 = new Route({
    			props: {
    				path: "creatures",
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	route4 = new Route({
    			props: {
    				path: "/portfolio/random-image-generator",
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(navbar.$$.fragment);
    			t0 = space();
    			create_component(route0.$$.fragment);
    			t1 = space();
    			create_component(route1.$$.fragment);
    			t2 = space();
    			create_component(route2.$$.fragment);
    			t3 = space();
    			create_component(route3.$$.fragment);
    			t4 = space();
    			create_component(route4.$$.fragment);
    			t5 = space();
    			create_component(footer.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(navbar, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(route0, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(route1, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(route2, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(route3, target, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(route4, target, anchor);
    			insert_dev(target, t5, anchor);
    			mount_component(footer, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const route0_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				route0_changes.$$scope = { dirty, ctx };
    			}

    			route0.$set(route0_changes);
    			const route1_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				route1_changes.$$scope = { dirty, ctx };
    			}

    			route1.$set(route1_changes);
    			const route2_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				route2_changes.$$scope = { dirty, ctx };
    			}

    			route2.$set(route2_changes);
    			const route3_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				route3_changes.$$scope = { dirty, ctx };
    			}

    			route3.$set(route3_changes);
    			const route4_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				route4_changes.$$scope = { dirty, ctx };
    			}

    			route4.$set(route4_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			transition_in(route0.$$.fragment, local);
    			transition_in(route1.$$.fragment, local);
    			transition_in(route2.$$.fragment, local);
    			transition_in(route3.$$.fragment, local);
    			transition_in(route4.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			transition_out(route0.$$.fragment, local);
    			transition_out(route1.$$.fragment, local);
    			transition_out(route2.$$.fragment, local);
    			transition_out(route3.$$.fragment, local);
    			transition_out(route4.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(navbar, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(route0, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(route1, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(route2, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(route3, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(route4, detaching);
    			if (detaching) detach_dev(t5);
    			destroy_component(footer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(46:2) <Router>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let link0;
    	let link1;
    	let link2;
    	let link3;
    	let t;
    	let div;
    	let router;
    	let links_action;
    	let current;
    	let mounted;
    	let dispose;

    	router = new Router({
    			props: {
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			link0 = element("link");
    			link1 = element("link");
    			link2 = element("link");
    			link3 = element("link");
    			t = space();
    			div = element("div");
    			create_component(router.$$.fragment);
    			attr_dev(link0, "rel", "icon");
    			attr_dev(link0, "href", "/imgs/rabbit.png");
    			add_location(link0, file$a, 21, 2, 582);
    			attr_dev(link1, "rel", "stylesheet");
    			attr_dev(link1, "href", "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css");
    			add_location(link1, file$a, 24, 2, 653);
    			attr_dev(link2, "rel", "stylesheet");
    			attr_dev(link2, "href", "https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css");
    			attr_dev(link2, "integrity", "sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh");
    			attr_dev(link2, "crossorigin", "anonymous");
    			add_location(link2, file$a, 29, 2, 802);
    			attr_dev(link3, "href", "https://fonts.googleapis.com/css?family=Montserrat");
    			attr_dev(link3, "rel", "stylesheet");
    			add_location(link3, file$a, 36, 2, 1058);
    			document.title = "Jane Benson";
    			add_location(div, file$a, 44, 0, 1197);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, link0);
    			append_dev(document.head, link1);
    			append_dev(document.head, link2);
    			append_dev(document.head, link3);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div, anchor);
    			mount_component(router, div, null);
    			current = true;

    			if (!mounted) {
    				dispose = action_destroyer(links_action = links.call(null, div));
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const router_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				router_changes.$$scope = { dirty, ctx };
    			}

    			router.$set(router_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			detach_dev(link0);
    			detach_dev(link1);
    			detach_dev(link2);
    			detach_dev(link3);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div);
    			destroy_component(router);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	$$self.$capture_state = () => ({
    		Router,
    		Link,
    		Route,
    		links,
    		onMount,
    		Creatures,
    		Footer,
    		Home,
    		NavBar,
    		Portfolio,
    		RandomImageGenerator,
    		Resume,
    		scrollToTop
    	});

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    const app = new App({
      target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
