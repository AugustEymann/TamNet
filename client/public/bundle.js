
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
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
    function subscribe(store, ...callbacks) {
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
            if (typeof $$scope.dirty === 'object') {
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
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
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
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
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
    function claim_element(nodes, name, attributes, svg) {
        for (let i = 0; i < nodes.length; i += 1) {
            const node = nodes[i];
            if (node.nodeName === name) {
                let j = 0;
                while (j < node.attributes.length) {
                    const attribute = node.attributes[j];
                    if (attributes[attribute.name]) {
                        j++;
                    }
                    else {
                        node.removeAttribute(attribute.name);
                    }
                }
                return nodes.splice(i, 1)[0];
            }
        }
        return svg ? svg_element(name) : element(name);
    }
    function claim_text(nodes, data) {
        for (let i = 0; i < nodes.length; i += 1) {
            const node = nodes[i];
            if (node.nodeType === 3) {
                node.data = '' + data;
                return nodes.splice(i, 1)[0];
            }
        }
        return text(data);
    }
    function claim_space(nodes) {
        return claim_text(nodes, ' ');
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
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
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
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
    function create_component(block) {
        block && block.c();
    }
    function claim_component(block, parent_nodes) {
        block && block.l(parent_nodes);
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
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
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

    /* node_modules\svelte-routing\src\Router.svelte generated by Svelte v3.17.3 */

    function create_fragment(ctx) {
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[16].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[15], null);

    	return {
    		c() {
    			if (default_slot) default_slot.c();
    		},
    		l(nodes) {
    			if (default_slot) default_slot.l(nodes);
    		},
    		m(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 32768) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[15], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[15], dirty, null));
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};
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
    	component_subscribe($$self, routes, value => $$invalidate(8, $routes = value));
    	const activeRoute = writable(null);
    	let hasActiveRoute = false; // Used in SSR to synchronously set that a Route is active.

    	// If locationContext is not set, this is the topmost Router in the tree.
    	// If the `url` prop is given we force the location to it.
    	const location = locationContext || writable(url ? { pathname: url } : globalHistory.location);

    	component_subscribe($$self, location, value => $$invalidate(7, $location = value));

    	// If routerContext is set, the routerBase of the parent Router
    	// will be the base for this Router's descendants.
    	// If routerContext is not set, the path and resolved uri will both
    	// have the value of the basepath prop.
    	const base = routerContext
    	? routerContext.routerBase
    	: writable({ path: basepath, uri: basepath });

    	component_subscribe($$self, base, value => $$invalidate(6, $base = value));

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

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("basepath" in $$props) $$invalidate(3, basepath = $$props.basepath);
    		if ("url" in $$props) $$invalidate(4, url = $$props.url);
    		if ("$$scope" in $$props) $$invalidate(15, $$scope = $$props.$$scope);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$base*/ 64) {
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

    		if ($$self.$$.dirty & /*$routes, $location*/ 384) {
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

    	return [
    		routes,
    		location,
    		base,
    		basepath,
    		url,
    		hasActiveRoute,
    		$base,
    		$location,
    		$routes,
    		locationContext,
    		routerContext,
    		activeRoute,
    		routerBase,
    		registerRoute,
    		unregisterRoute,
    		$$scope,
    		$$slots
    	];
    }

    class Router extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance, create_fragment, safe_not_equal, { basepath: 3, url: 4 });
    	}
    }

    /* node_modules\svelte-routing\src\Route.svelte generated by Svelte v3.17.3 */

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

    	return {
    		c() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l(nodes) {
    			if_block.l(nodes);
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
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
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    // (43:2) {:else}
    function create_else_block(ctx) {
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[13].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[12], get_default_slot_context);

    	return {
    		c() {
    			if (default_slot) default_slot.c();
    		},
    		l(nodes) {
    			if (default_slot) default_slot.l(nodes);
    		},
    		m(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (default_slot && default_slot.p && dirty & /*$$scope, routeParams, $location*/ 4114) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[12], get_default_slot_context), get_slot_changes(default_slot_template, /*$$scope*/ ctx[12], dirty, get_default_slot_changes));
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    }

    // (41:2) {#if component !== null}
    function create_if_block_1(ctx) {
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

    		return { props: switch_instance_props };
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props());
    	}

    	return {
    		c() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		l(nodes) {
    			if (switch_instance) claim_component(switch_instance.$$.fragment, nodes);
    			switch_instance_anchor = empty();
    		},
    		m(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
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
    		i(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};
    }

    function create_fragment$1(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$activeRoute*/ ctx[3] !== null && /*$activeRoute*/ ctx[3].route === /*route*/ ctx[7] && create_if_block(ctx);

    	return {
    		c() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l(nodes) {
    			if (if_block) if_block.l(nodes);
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			if (/*$activeRoute*/ ctx[3] !== null && /*$activeRoute*/ ctx[3].route === /*route*/ ctx[7]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
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
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $activeRoute;
    	let $location;
    	let { path = "" } = $$props;
    	let { component = null } = $$props;
    	const { registerRoute, unregisterRoute, activeRoute } = getContext(ROUTER);
    	component_subscribe($$self, activeRoute, value => $$invalidate(3, $activeRoute = value));
    	const location = getContext(LOCATION);
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

    	$$self.$set = $$new_props => {
    		$$invalidate(11, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("path" in $$new_props) $$invalidate(8, path = $$new_props.path);
    		if ("component" in $$new_props) $$invalidate(0, component = $$new_props.component);
    		if ("$$scope" in $$new_props) $$invalidate(12, $$scope = $$new_props.$$scope);
    	};

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
    		registerRoute,
    		unregisterRoute,
    		$$props,
    		$$scope,
    		$$slots
    	];
    }

    class Route extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { path: 8, component: 0 });
    	}
    }

    /* node_modules\svelte-routing\src\Link.svelte generated by Svelte v3.17.3 */

    function create_fragment$2(ctx) {
    	let a;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[16].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[15], null);

    	let a_levels = [
    		{ href: /*href*/ ctx[0] },
    		{ "aria-current": /*ariaCurrent*/ ctx[2] },
    		/*props*/ ctx[1]
    	];

    	let a_data = {};

    	for (let i = 0; i < a_levels.length; i += 1) {
    		a_data = assign(a_data, a_levels[i]);
    	}

    	return {
    		c() {
    			a = element("a");
    			if (default_slot) default_slot.c();
    			this.h();
    		},
    		l(nodes) {
    			a = claim_element(nodes, "A", { href: true, "aria-current": true });
    			var a_nodes = children(a);
    			if (default_slot) default_slot.l(a_nodes);
    			a_nodes.forEach(detach);
    			this.h();
    		},
    		h() {
    			set_attributes(a, a_data);
    		},
    		m(target, anchor) {
    			insert(target, a, anchor);

    			if (default_slot) {
    				default_slot.m(a, null);
    			}

    			current = true;
    			dispose = listen(a, "click", /*onClick*/ ctx[5]);
    		},
    		p(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 32768) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[15], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[15], dirty, null));
    			}

    			set_attributes(a, get_spread_update(a_levels, [
    				dirty & /*href*/ 1 && { href: /*href*/ ctx[0] },
    				dirty & /*ariaCurrent*/ 4 && { "aria-current": /*ariaCurrent*/ ctx[2] },
    				dirty & /*props*/ 2 && /*props*/ ctx[1]
    			]));
    		},
    		i(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(a);
    			if (default_slot) default_slot.d(detaching);
    			dispose();
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $base;
    	let $location;
    	let { to = "#" } = $$props;
    	let { replace = false } = $$props;
    	let { state = {} } = $$props;
    	let { getProps = () => ({}) } = $$props;
    	const { base } = getContext(ROUTER);
    	component_subscribe($$self, base, value => $$invalidate(12, $base = value));
    	const location = getContext(LOCATION);
    	component_subscribe($$self, location, value => $$invalidate(13, $location = value));
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

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("to" in $$props) $$invalidate(6, to = $$props.to);
    		if ("replace" in $$props) $$invalidate(7, replace = $$props.replace);
    		if ("state" in $$props) $$invalidate(8, state = $$props.state);
    		if ("getProps" in $$props) $$invalidate(9, getProps = $$props.getProps);
    		if ("$$scope" in $$props) $$invalidate(15, $$scope = $$props.$$scope);
    	};

    	let ariaCurrent;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*to, $base*/ 4160) {
    			 $$invalidate(0, href = to === "/" ? $base.uri : resolve(to, $base.uri));
    		}

    		if ($$self.$$.dirty & /*$location, href*/ 8193) {
    			 $$invalidate(10, isPartiallyCurrent = startsWith($location.pathname, href));
    		}

    		if ($$self.$$.dirty & /*href, $location*/ 8193) {
    			 $$invalidate(11, isCurrent = href === $location.pathname);
    		}

    		if ($$self.$$.dirty & /*isCurrent*/ 2048) {
    			 $$invalidate(2, ariaCurrent = isCurrent ? "page" : undefined);
    		}

    		if ($$self.$$.dirty & /*getProps, $location, href, isPartiallyCurrent, isCurrent*/ 11777) {
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
    		isPartiallyCurrent,
    		isCurrent,
    		$base,
    		$location,
    		dispatch,
    		$$scope,
    		$$slots
    	];
    }

    class Link extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { to: 6, replace: 7, state: 8, getProps: 9 });
    	}
    }

    /* src\components\Navbar.svelte generated by Svelte v3.17.3 */

    function create_default_slot_3(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("Dashboard");
    		},
    		l(nodes) {
    			t = claim_text(nodes, "Dashboard");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    // (45:16) <Link to="/dashboard">
    function create_default_slot_2(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("Projects");
    		},
    		l(nodes) {
    			t = claim_text(nodes, "Projects");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    // (52:16) <Link to="/dashboard">
    function create_default_slot_1(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("Photo Archive");
    		},
    		l(nodes) {
    			t = claim_text(nodes, "Photo Archive");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    // (57:8) {#if userData}
    function create_if_block$1(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*userData*/ ctx[0].role === "admin" && create_if_block_1$1(ctx);

    	return {
    		c() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l(nodes) {
    			if (if_block) if_block.l(nodes);
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			if (/*userData*/ ctx[0].role === "admin") {
    				if (!if_block) {
    					if_block = create_if_block_1$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					transition_in(if_block, 1);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    // (58:12) {#if userData.role === 'admin'}
    function create_if_block_1$1(ctx) {
    	let ul;
    	let li;
    	let current;

    	const link = new Link({
    			props: {
    				to: "/admin",
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			}
    		});

    	return {
    		c() {
    			ul = element("ul");
    			li = element("li");
    			create_component(link.$$.fragment);
    			this.h();
    		},
    		l(nodes) {
    			ul = claim_element(nodes, "UL", { class: true });
    			var ul_nodes = children(ul);
    			li = claim_element(ul_nodes, "LI", {});
    			var li_nodes = children(li);
    			claim_component(link.$$.fragment, li_nodes);
    			li_nodes.forEach(detach);
    			ul_nodes.forEach(detach);
    			this.h();
    		},
    		h() {
    			attr(ul, "class", "uk-navbar-nav");
    		},
    		m(target, anchor) {
    			insert(target, ul, anchor);
    			append(ul, li);
    			mount_component(link, li, null);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(link.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(link.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(ul);
    			destroy_component(link);
    		}
    	};
    }

    // (61:20) <Link to="/admin">
    function create_default_slot(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("Admin Panel");
    		},
    		l(nodes) {
    			t = claim_text(nodes, "Admin Panel");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    function create_fragment$3(ctx) {
    	let nav;
    	let div1;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let ul0;
    	let li0;
    	let t1;
    	let ul1;
    	let li1;
    	let t2;
    	let ul2;
    	let li2;
    	let t3;
    	let t4;
    	let div2;
    	let ul3;
    	let li3;
    	let button;
    	let t5;
    	let span;
    	let current;
    	let dispose;

    	const link0 = new Link({
    			props: {
    				to: "/dashboard",
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			}
    		});

    	const link1 = new Link({
    			props: {
    				to: "/dashboard",
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			}
    		});

    	const link2 = new Link({
    			props: {
    				to: "/dashboard",
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			}
    		});

    	let if_block = /*userData*/ ctx[0] && create_if_block$1(ctx);

    	return {
    		c() {
    			nav = element("nav");
    			div1 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			ul0 = element("ul");
    			li0 = element("li");
    			create_component(link0.$$.fragment);
    			t1 = space();
    			ul1 = element("ul");
    			li1 = element("li");
    			create_component(link1.$$.fragment);
    			t2 = space();
    			ul2 = element("ul");
    			li2 = element("li");
    			create_component(link2.$$.fragment);
    			t3 = space();
    			if (if_block) if_block.c();
    			t4 = space();
    			div2 = element("div");
    			ul3 = element("ul");
    			li3 = element("li");
    			button = element("button");
    			t5 = text("Logout ");
    			span = element("span");
    			this.h();
    		},
    		l(nodes) {
    			nav = claim_element(nodes, "NAV", { class: true, "uk-navbar": true });
    			var nav_nodes = children(nav);
    			div1 = claim_element(nav_nodes, "DIV", { class: true });
    			var div1_nodes = children(div1);
    			div0 = claim_element(div1_nodes, "DIV", { class: true });
    			var div0_nodes = children(div0);

    			img = claim_element(div0_nodes, "IMG", {
    				src: true,
    				alt: true,
    				width: true,
    				height: true
    			});

    			div0_nodes.forEach(detach);
    			t0 = claim_space(div1_nodes);
    			ul0 = claim_element(div1_nodes, "UL", { class: true });
    			var ul0_nodes = children(ul0);
    			li0 = claim_element(ul0_nodes, "LI", {});
    			var li0_nodes = children(li0);
    			claim_component(link0.$$.fragment, li0_nodes);
    			li0_nodes.forEach(detach);
    			ul0_nodes.forEach(detach);
    			t1 = claim_space(div1_nodes);
    			ul1 = claim_element(div1_nodes, "UL", { class: true });
    			var ul1_nodes = children(ul1);
    			li1 = claim_element(ul1_nodes, "LI", {});
    			var li1_nodes = children(li1);
    			claim_component(link1.$$.fragment, li1_nodes);
    			li1_nodes.forEach(detach);
    			ul1_nodes.forEach(detach);
    			t2 = claim_space(div1_nodes);
    			ul2 = claim_element(div1_nodes, "UL", { class: true });
    			var ul2_nodes = children(ul2);
    			li2 = claim_element(ul2_nodes, "LI", {});
    			var li2_nodes = children(li2);
    			claim_component(link2.$$.fragment, li2_nodes);
    			li2_nodes.forEach(detach);
    			ul2_nodes.forEach(detach);
    			t3 = claim_space(div1_nodes);
    			if (if_block) if_block.l(div1_nodes);
    			div1_nodes.forEach(detach);
    			t4 = claim_space(nav_nodes);
    			div2 = claim_element(nav_nodes, "DIV", { class: true });
    			var div2_nodes = children(div2);
    			ul3 = claim_element(div2_nodes, "UL", { class: true });
    			var ul3_nodes = children(ul3);
    			li3 = claim_element(ul3_nodes, "LI", {});
    			var li3_nodes = children(li3);
    			button = claim_element(li3_nodes, "BUTTON", { class: true });
    			var button_nodes = children(button);
    			t5 = claim_text(button_nodes, "Logout ");
    			span = claim_element(button_nodes, "SPAN", { "uk-icon": true });
    			children(span).forEach(detach);
    			button_nodes.forEach(detach);
    			li3_nodes.forEach(detach);
    			ul3_nodes.forEach(detach);
    			div2_nodes.forEach(detach);
    			nav_nodes.forEach(detach);
    			this.h();
    		},
    		h() {
    			if (img.src !== (img_src_value = "https://yt3.ggpht.com/a/AGF-l78ytThuDYFlcW6jiU-2d894DUBYb_wIyIZjWA=s288-c-k-c0xffffffff-no-rj-mo")) attr(img, "src", img_src_value);
    			attr(img, "alt", "Logo");
    			attr(img, "width", "50px");
    			attr(img, "height", "50px    ");
    			attr(div0, "class", "uk-navbar-item uk-logo");
    			attr(ul0, "class", "uk-navbar-nav");
    			attr(ul1, "class", "uk-navbar-nav");
    			attr(ul2, "class", "uk-navbar-nav");
    			attr(div1, "class", "uk-navbar-left");
    			attr(span, "uk-icon", "sign-out");
    			attr(button, "class", "uk-button uk-button-danger");
    			attr(ul3, "class", "uk-navbar-nav uk-margin-medium-right");
    			attr(div2, "class", "uk-navbar-right");
    			attr(nav, "class", "uk-navbar-container uk-margin");
    			attr(nav, "uk-navbar", "");
    		},
    		m(target, anchor) {
    			insert(target, nav, anchor);
    			append(nav, div1);
    			append(div1, div0);
    			append(div0, img);
    			append(div1, t0);
    			append(div1, ul0);
    			append(ul0, li0);
    			mount_component(link0, li0, null);
    			append(div1, t1);
    			append(div1, ul1);
    			append(ul1, li1);
    			mount_component(link1, li1, null);
    			append(div1, t2);
    			append(div1, ul2);
    			append(ul2, li2);
    			mount_component(link2, li2, null);
    			append(div1, t3);
    			if (if_block) if_block.m(div1, null);
    			append(nav, t4);
    			append(nav, div2);
    			append(div2, ul3);
    			append(ul3, li3);
    			append(li3, button);
    			append(button, t5);
    			append(button, span);
    			current = true;
    			dispose = listen(button, "click", logOut);
    		},
    		p(ctx, [dirty]) {
    			const link0_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				link0_changes.$$scope = { dirty, ctx };
    			}

    			link0.$set(link0_changes);
    			const link1_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				link1_changes.$$scope = { dirty, ctx };
    			}

    			link1.$set(link1_changes);
    			const link2_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				link2_changes.$$scope = { dirty, ctx };
    			}

    			link2.$set(link2_changes);

    			if (/*userData*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div1, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(link0.$$.fragment, local);
    			transition_in(link1.$$.fragment, local);
    			transition_in(link2.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(link0.$$.fragment, local);
    			transition_out(link1.$$.fragment, local);
    			transition_out(link2.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(nav);
    			destroy_component(link0);
    			destroy_component(link1);
    			destroy_component(link2);
    			if (if_block) if_block.d();
    			dispose();
    		}
    	};
    }

    function logOut() {
    	localStorage.removeItem("token");
    	navigate("/", { replace: true });
    }

    function instance$3($$self, $$props, $$invalidate) {
    	var userData;

    	onMount(() => {
    		if (!localStorage.getItem("token")) {
    			navigate("/");
    		}

    		fetch("http://localhost:8080/", {
    			headers: {
    				authorization: `Bearer ${localStorage.getItem("token")}`
    			}
    		}).then(res => res.json()).then(result => {
    			if (result.user) {
    				$$invalidate(0, userData = result.user);
    			} else {
    				localStorage.removeItem("token");
    			}
    		});
    	});

    	return [userData];
    }

    class Navbar extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});
    	}
    }

    /* src\pages\Dashboard.svelte generated by Svelte v3.17.3 */

    function create_else_block$1(ctx) {
    	let center;
    	let img;
    	let img_src_value;

    	return {
    		c() {
    			center = element("center");
    			img = element("img");
    			this.h();
    		},
    		l(nodes) {
    			center = claim_element(nodes, "CENTER", {});
    			var center_nodes = children(center);
    			img = claim_element(center_nodes, "IMG", { src: true, alt: true });
    			center_nodes.forEach(detach);
    			this.h();
    		},
    		h() {
    			if (img.src !== (img_src_value = "https://faviconer.net/preloaders/25/Snake.gif")) attr(img, "src", img_src_value);
    			attr(img, "alt", "Loading...");
    		},
    		m(target, anchor) {
    			insert(target, center, anchor);
    			append(center, img);
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(center);
    		}
    	};
    }

    // (38:5) {#if userData}
    function create_if_block$2(ctx) {
    	let h2;
    	let t0;
    	let t1_value = /*userData*/ ctx[0].username + "";
    	let t1;

    	return {
    		c() {
    			h2 = element("h2");
    			t0 = text("Welcome, ");
    			t1 = text(t1_value);
    		},
    		l(nodes) {
    			h2 = claim_element(nodes, "H2", {});
    			var h2_nodes = children(h2);
    			t0 = claim_text(h2_nodes, "Welcome, ");
    			t1 = claim_text(h2_nodes, t1_value);
    			h2_nodes.forEach(detach);
    		},
    		m(target, anchor) {
    			insert(target, h2, anchor);
    			append(h2, t0);
    			append(h2, t1);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*userData*/ 1 && t1_value !== (t1_value = /*userData*/ ctx[0].username + "")) set_data(t1, t1_value);
    		},
    		d(detaching) {
    			if (detaching) detach(h2);
    		}
    	};
    }

    function create_fragment$4(ctx) {
    	let main;
    	let t;
    	let div;
    	let current;
    	const navbar = new Navbar({});

    	function select_block_type(ctx, dirty) {
    		if (/*userData*/ ctx[0]) return create_if_block$2;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	return {
    		c() {
    			main = element("main");
    			create_component(navbar.$$.fragment);
    			t = space();
    			div = element("div");
    			if_block.c();
    			this.h();
    		},
    		l(nodes) {
    			main = claim_element(nodes, "MAIN", {});
    			var main_nodes = children(main);
    			claim_component(navbar.$$.fragment, main_nodes);
    			t = claim_space(main_nodes);
    			div = claim_element(main_nodes, "DIV", { class: true });
    			var div_nodes = children(div);
    			if_block.l(div_nodes);
    			div_nodes.forEach(detach);
    			main_nodes.forEach(detach);
    			this.h();
    		},
    		h() {
    			attr(div, "class", "uk-container");
    		},
    		m(target, anchor) {
    			insert(target, main, anchor);
    			mount_component(navbar, main, null);
    			append(main, t);
    			append(main, div);
    			if_block.m(div, null);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(navbar.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(main);
    			destroy_component(navbar);
    			if_block.d();
    		}
    	};
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let userData;

    	onMount(() => {
    		if (!localStorage.getItem("token")) {
    			navigate("/");
    		}

    		fetch("http://localhost:8080/", {
    			headers: {
    				authorization: `Bearer ${localStorage.getItem("token")}`
    			}
    		}).then(res => res.json()).then(result => {
    			if (result.user) {
    				$$invalidate(0, userData = result.user);
    			} else {
    				localStorage.removeItem("token");
    			}
    		});
    	});

    	return [userData];
    }

    class Dashboard extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});
    	}
    }

    /* src\pages\LogIn.svelte generated by Svelte v3.17.3 */

    function create_if_block$3(ctx) {
    	let div;
    	let a;
    	let t0;
    	let p;
    	let t1;

    	return {
    		c() {
    			div = element("div");
    			a = element("a");
    			t0 = space();
    			p = element("p");
    			t1 = text(/*errorNotification*/ ctx[2]);
    			this.h();
    		},
    		l(nodes) {
    			div = claim_element(nodes, "DIV", { class: true, "uk-alert": true });
    			var div_nodes = children(div);
    			a = claim_element(div_nodes, "A", { class: true, "uk-close": true });
    			children(a).forEach(detach);
    			t0 = claim_space(div_nodes);
    			p = claim_element(div_nodes, "P", {});
    			var p_nodes = children(p);
    			t1 = claim_text(p_nodes, /*errorNotification*/ ctx[2]);
    			p_nodes.forEach(detach);
    			div_nodes.forEach(detach);
    			this.h();
    		},
    		h() {
    			attr(a, "class", "uk-alert-close");
    			attr(a, "uk-close", "");
    			attr(div, "class", "uk-alert-danger");
    			attr(div, "uk-alert", "");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, a);
    			append(div, t0);
    			append(div, p);
    			append(p, t1);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*errorNotification*/ 4) set_data(t1, /*errorNotification*/ ctx[2]);
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    function create_fragment$5(ctx) {
    	let main;
    	let center;
    	let div10;
    	let div9;
    	let img;
    	let img_src_value;
    	let t0;
    	let div8;
    	let div7;
    	let div6;
    	let t1;
    	let h3;
    	let t2;
    	let t3;
    	let form;
    	let div1;
    	let div0;
    	let span0;
    	let t4;
    	let input0;
    	let t5;
    	let div3;
    	let div2;
    	let span1;
    	let t6;
    	let input1;
    	let t7;
    	let div4;
    	let button;
    	let t8;
    	let t9;
    	let div5;
    	let t10;
    	let dispose;
    	let if_block = /*errorNotification*/ ctx[2] !== "" && create_if_block$3(ctx);

    	return {
    		c() {
    			main = element("main");
    			center = element("center");
    			div10 = element("div");
    			div9 = element("div");
    			img = element("img");
    			t0 = space();
    			div8 = element("div");
    			div7 = element("div");
    			div6 = element("div");
    			if (if_block) if_block.c();
    			t1 = space();
    			h3 = element("h3");
    			t2 = text("Welcome!");
    			t3 = space();
    			form = element("form");
    			div1 = element("div");
    			div0 = element("div");
    			span0 = element("span");
    			t4 = space();
    			input0 = element("input");
    			t5 = space();
    			div3 = element("div");
    			div2 = element("div");
    			span1 = element("span");
    			t6 = space();
    			input1 = element("input");
    			t7 = space();
    			div4 = element("div");
    			button = element("button");
    			t8 = text("Login");
    			t9 = space();
    			div5 = element("div");
    			t10 = text("Not registered? Ask an Administrator");
    			this.h();
    		},
    		l(nodes) {
    			main = claim_element(nodes, "MAIN", {});
    			var main_nodes = children(main);
    			center = claim_element(main_nodes, "CENTER", {});
    			var center_nodes = children(center);
    			div10 = claim_element(center_nodes, "DIV", { class: true, "uk-height-viewport": true });
    			var div10_nodes = children(div10);
    			div9 = claim_element(div10_nodes, "DIV", { class: true });
    			var div9_nodes = children(div9);
    			img = claim_element(div9_nodes, "IMG", { class: true, src: true, alt: true });
    			t0 = claim_space(div9_nodes);
    			div8 = claim_element(div9_nodes, "DIV", { class: true, "uk-grid": true });
    			var div8_nodes = children(div8);
    			div7 = claim_element(div8_nodes, "DIV", { class: true });
    			var div7_nodes = children(div7);
    			div6 = claim_element(div7_nodes, "DIV", { class: true });
    			var div6_nodes = children(div6);
    			if (if_block) if_block.l(div6_nodes);
    			t1 = claim_space(div6_nodes);
    			h3 = claim_element(div6_nodes, "H3", { class: true });
    			var h3_nodes = children(h3);
    			t2 = claim_text(h3_nodes, "Welcome!");
    			h3_nodes.forEach(detach);
    			t3 = claim_space(div6_nodes);
    			form = claim_element(div6_nodes, "FORM", {});
    			var form_nodes = children(form);
    			div1 = claim_element(form_nodes, "DIV", { class: true });
    			var div1_nodes = children(div1);
    			div0 = claim_element(div1_nodes, "DIV", { class: true });
    			var div0_nodes = children(div0);
    			span0 = claim_element(div0_nodes, "SPAN", { class: true, "uk-icon": true });
    			children(span0).forEach(detach);
    			t4 = claim_space(div0_nodes);
    			input0 = claim_element(div0_nodes, "INPUT", { class: true, type: true });
    			div0_nodes.forEach(detach);
    			div1_nodes.forEach(detach);
    			t5 = claim_space(form_nodes);
    			div3 = claim_element(form_nodes, "DIV", { class: true });
    			var div3_nodes = children(div3);
    			div2 = claim_element(div3_nodes, "DIV", { class: true });
    			var div2_nodes = children(div2);
    			span1 = claim_element(div2_nodes, "SPAN", { class: true, "uk-icon": true });
    			children(span1).forEach(detach);
    			t6 = claim_space(div2_nodes);
    			input1 = claim_element(div2_nodes, "INPUT", { class: true, type: true });
    			div2_nodes.forEach(detach);
    			div3_nodes.forEach(detach);
    			t7 = claim_space(form_nodes);
    			div4 = claim_element(form_nodes, "DIV", { class: true });
    			var div4_nodes = children(div4);
    			button = claim_element(div4_nodes, "BUTTON", { class: true });
    			var button_nodes = children(button);
    			t8 = claim_text(button_nodes, "Login");
    			button_nodes.forEach(detach);
    			div4_nodes.forEach(detach);
    			t9 = claim_space(form_nodes);
    			div5 = claim_element(form_nodes, "DIV", { class: true });
    			var div5_nodes = children(div5);
    			t10 = claim_text(div5_nodes, "Not registered? Ask an Administrator");
    			div5_nodes.forEach(detach);
    			form_nodes.forEach(detach);
    			div6_nodes.forEach(detach);
    			div7_nodes.forEach(detach);
    			div8_nodes.forEach(detach);
    			div9_nodes.forEach(detach);
    			div10_nodes.forEach(detach);
    			center_nodes.forEach(detach);
    			main_nodes.forEach(detach);
    			this.h();
    		},
    		h() {
    			attr(img, "class", "mainImage svelte-1fwdt1z");
    			if (img.src !== (img_src_value = "https://thinklocalsantacruz.org/logos/social_media/limage-1644-336-photo.png")) attr(img, "src", img_src_value);
    			attr(img, "alt", "Tam Communications");
    			attr(h3, "class", "uk-card-title uk-text-center");
    			attr(span0, "class", "uk-form-icon");
    			attr(span0, "uk-icon", "icon: user");
    			attr(input0, "class", "uk-input uk-form-large");
    			attr(input0, "type", "text");
    			attr(div0, "class", "uk-inline uk-width-1-1");
    			attr(div1, "class", "uk-margin");
    			attr(span1, "class", "uk-form-icon");
    			attr(span1, "uk-icon", "icon: lock");
    			attr(input1, "class", "uk-input uk-form-large");
    			attr(input1, "type", "password");
    			attr(div2, "class", "uk-inline uk-width-1-1");
    			attr(div3, "class", "uk-margin");
    			attr(button, "class", "uk-button uk-button-primary uk-button-large uk-width-1-1");
    			attr(div4, "class", "uk-margin");
    			attr(div5, "class", "uk-text-small uk-text-center");
    			attr(div6, "class", "uk-margin uk-width-large uk-margin-auto uk-card uk-card-default uk-card-body uk-box-shadow-large");
    			attr(div7, "class", "uk-width-1-1@m");
    			attr(div8, "class", "uk-grid-margin uk-grid uk-grid-stack");
    			attr(div8, "uk-grid", "");
    			attr(div9, "class", "uk-container");
    			attr(div10, "class", "uk-section uk-section-muted uk-flex uk-flex-middle uk-animation-fade");
    			attr(div10, "uk-height-viewport", "");
    		},
    		m(target, anchor) {
    			insert(target, main, anchor);
    			append(main, center);
    			append(center, div10);
    			append(div10, div9);
    			append(div9, img);
    			append(div9, t0);
    			append(div9, div8);
    			append(div8, div7);
    			append(div7, div6);
    			if (if_block) if_block.m(div6, null);
    			append(div6, t1);
    			append(div6, h3);
    			append(h3, t2);
    			append(div6, t3);
    			append(div6, form);
    			append(form, div1);
    			append(div1, div0);
    			append(div0, span0);
    			append(div0, t4);
    			append(div0, input0);
    			set_input_value(input0, /*username*/ ctx[0]);
    			append(form, t5);
    			append(form, div3);
    			append(div3, div2);
    			append(div2, span1);
    			append(div2, t6);
    			append(div2, input1);
    			set_input_value(input1, /*password*/ ctx[1]);
    			append(form, t7);
    			append(form, div4);
    			append(div4, button);
    			append(button, t8);
    			append(form, t9);
    			append(form, div5);
    			append(div5, t10);

    			dispose = [
    				listen(input0, "input", /*input0_input_handler*/ ctx[4]),
    				listen(input1, "input", /*input1_input_handler*/ ctx[5]),
    				listen(form, "submit", prevent_default(/*signIn*/ ctx[3]))
    			];
    		},
    		p(ctx, [dirty]) {
    			if (/*errorNotification*/ ctx[2] !== "") {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					if_block.m(div6, t1);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*username*/ 1 && input0.value !== /*username*/ ctx[0]) {
    				set_input_value(input0, /*username*/ ctx[0]);
    			}

    			if (dirty & /*password*/ 2 && input1.value !== /*password*/ ctx[1]) {
    				set_input_value(input1, /*password*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(main);
    			if (if_block) if_block.d();
    			run_all(dispose);
    		}
    	};
    }

    const LOGIN_URL = "http://localhost:8080/auth/login";

    function instance$5($$self, $$props, $$invalidate) {
    	let username = "";
    	let password = "";
    	let errorNotification = "";

    	onMount(() => {
    		if (localStorage.getItem("token")) {
    			navigate("/dashboard");
    		}
    	});

    	function signIn() {
    		const body = { username, password };

    		fetch(LOGIN_URL, {
    			method: "POST",
    			headers: { "content-type": "application/json" },
    			body: JSON.stringify(body)
    		}).then(response => {
    			if (response.ok) {
    				return response.json();
    			}

    			return response.json().then(error => {
    				$$invalidate(2, errorNotification = error.message);
    				console.log(error.message);
    				throw new Error(error.message);
    			});
    		}).then(result => {
    			localStorage.setItem("token", result.token);

    			setTimeout(
    				() => {
    					navigate("/dashboard", { replace: true });
    				},
    				1000
    			);
    		}).catch(error => {
    			setTimeout(
    				() => {
    					$$invalidate(2, errorNotification = error.message);
    				},
    				1000
    			);
    		});
    	}

    	function input0_input_handler() {
    		username = this.value;
    		$$invalidate(0, username);
    	}

    	function input1_input_handler() {
    		password = this.value;
    		$$invalidate(1, password);
    	}

    	return [
    		username,
    		password,
    		errorNotification,
    		signIn,
    		input0_input_handler,
    		input1_input_handler
    	];
    }

    class LogIn extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});
    	}
    }

    /* src\pages\Admin.svelte generated by Svelte v3.17.3 */

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (151:8) {:else}
    function create_else_block$2(ctx) {
    	let center;
    	let img;
    	let img_src_value;

    	return {
    		c() {
    			center = element("center");
    			img = element("img");
    			this.h();
    		},
    		l(nodes) {
    			center = claim_element(nodes, "CENTER", {});
    			var center_nodes = children(center);
    			img = claim_element(center_nodes, "IMG", { src: true, alt: true });
    			center_nodes.forEach(detach);
    			this.h();
    		},
    		h() {
    			if (img.src !== (img_src_value = "https://faviconer.net/preloaders/25/Snake.gif")) attr(img, "src", img_src_value);
    			attr(img, "alt", "Loading...");
    		},
    		m(target, anchor) {
    			insert(target, center, anchor);
    			append(center, img);
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(center);
    		}
    	};
    }

    // (94:5) {#if userData}
    function create_if_block$4(ctx) {
    	let h20;
    	let t0;
    	let span0;
    	let t1;
    	let button0;
    	let t2;
    	let t3;
    	let div0;
    	let t4;
    	let div9;
    	let div8;
    	let button1;
    	let t5;
    	let div1;
    	let h21;
    	let t6;
    	let t7;
    	let div6;
    	let t8;
    	let form;
    	let div3;
    	let div2;
    	let span1;
    	let t9;
    	let input0;
    	let t10;
    	let div5;
    	let div4;
    	let span2;
    	let t11;
    	let input1;
    	let t12;
    	let div7;
    	let button2;
    	let t13;
    	let t14;
    	let button3;
    	let t15;
    	let dispose;
    	let each_value = /*users*/ ctx[4];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	let if_block = /*errorNotification*/ ctx[3] !== "" && create_if_block_1$2(ctx);

    	return {
    		c() {
    			h20 = element("h2");
    			t0 = text("Admin Panel ");
    			span0 = element("span");
    			t1 = space();
    			button0 = element("button");
    			t2 = text("Create a User");
    			t3 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t4 = space();
    			div9 = element("div");
    			div8 = element("div");
    			button1 = element("button");
    			t5 = space();
    			div1 = element("div");
    			h21 = element("h2");
    			t6 = text("Account Creation");
    			t7 = space();
    			div6 = element("div");
    			if (if_block) if_block.c();
    			t8 = space();
    			form = element("form");
    			div3 = element("div");
    			div2 = element("div");
    			span1 = element("span");
    			t9 = space();
    			input0 = element("input");
    			t10 = space();
    			div5 = element("div");
    			div4 = element("div");
    			span2 = element("span");
    			t11 = space();
    			input1 = element("input");
    			t12 = space();
    			div7 = element("div");
    			button2 = element("button");
    			t13 = text("Cancel");
    			t14 = space();
    			button3 = element("button");
    			t15 = text("Create");
    			this.h();
    		},
    		l(nodes) {
    			h20 = claim_element(nodes, "H2", {});
    			var h20_nodes = children(h20);
    			t0 = claim_text(h20_nodes, "Admin Panel ");
    			span0 = claim_element(h20_nodes, "SPAN", { "uk-icon": true });
    			children(span0).forEach(detach);
    			h20_nodes.forEach(detach);
    			t1 = claim_space(nodes);

    			button0 = claim_element(nodes, "BUTTON", {
    				class: true,
    				type: true,
    				"uk-toggle": true
    			});

    			var button0_nodes = children(button0);
    			t2 = claim_text(button0_nodes, "Create a User");
    			button0_nodes.forEach(detach);
    			t3 = claim_space(nodes);
    			div0 = claim_element(nodes, "DIV", { class: true, "uk-grid": true });
    			var div0_nodes = children(div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].l(div0_nodes);
    			}

    			div0_nodes.forEach(detach);
    			t4 = claim_space(nodes);
    			div9 = claim_element(nodes, "DIV", { id: true, "uk-modal": true });
    			var div9_nodes = children(div9);
    			div8 = claim_element(div9_nodes, "DIV", { class: true });
    			var div8_nodes = children(div8);

    			button1 = claim_element(div8_nodes, "BUTTON", {
    				class: true,
    				type: true,
    				"uk-close": true
    			});

    			children(button1).forEach(detach);
    			t5 = claim_space(div8_nodes);
    			div1 = claim_element(div8_nodes, "DIV", { class: true });
    			var div1_nodes = children(div1);
    			h21 = claim_element(div1_nodes, "H2", { class: true });
    			var h21_nodes = children(h21);
    			t6 = claim_text(h21_nodes, "Account Creation");
    			h21_nodes.forEach(detach);
    			div1_nodes.forEach(detach);
    			t7 = claim_space(div8_nodes);
    			div6 = claim_element(div8_nodes, "DIV", { class: true, "uk-overflow-auto": true });
    			var div6_nodes = children(div6);
    			if (if_block) if_block.l(div6_nodes);
    			t8 = claim_space(div6_nodes);
    			form = claim_element(div6_nodes, "FORM", {});
    			var form_nodes = children(form);
    			div3 = claim_element(form_nodes, "DIV", { class: true });
    			var div3_nodes = children(div3);
    			div2 = claim_element(div3_nodes, "DIV", { class: true });
    			var div2_nodes = children(div2);
    			span1 = claim_element(div2_nodes, "SPAN", { class: true, "uk-icon": true });
    			children(span1).forEach(detach);
    			t9 = claim_space(div2_nodes);
    			input0 = claim_element(div2_nodes, "INPUT", { class: true, type: true });
    			div2_nodes.forEach(detach);
    			div3_nodes.forEach(detach);
    			t10 = claim_space(form_nodes);
    			div5 = claim_element(form_nodes, "DIV", { class: true });
    			var div5_nodes = children(div5);
    			div4 = claim_element(div5_nodes, "DIV", { class: true });
    			var div4_nodes = children(div4);
    			span2 = claim_element(div4_nodes, "SPAN", { class: true, "uk-icon": true });
    			children(span2).forEach(detach);
    			t11 = claim_space(div4_nodes);
    			input1 = claim_element(div4_nodes, "INPUT", { class: true, type: true });
    			div4_nodes.forEach(detach);
    			div5_nodes.forEach(detach);
    			form_nodes.forEach(detach);
    			div6_nodes.forEach(detach);
    			t12 = claim_space(div8_nodes);
    			div7 = claim_element(div8_nodes, "DIV", { class: true });
    			var div7_nodes = children(div7);
    			button2 = claim_element(div7_nodes, "BUTTON", { class: true, type: true });
    			var button2_nodes = children(button2);
    			t13 = claim_text(button2_nodes, "Cancel");
    			button2_nodes.forEach(detach);
    			t14 = claim_space(div7_nodes);
    			button3 = claim_element(div7_nodes, "BUTTON", { class: true, type: true });
    			var button3_nodes = children(button3);
    			t15 = claim_text(button3_nodes, "Create");
    			button3_nodes.forEach(detach);
    			div7_nodes.forEach(detach);
    			div8_nodes.forEach(detach);
    			div9_nodes.forEach(detach);
    			this.h();
    		},
    		h() {
    			attr(span0, "uk-icon", "icon: cog; ratio: 1.5");
    			attr(button0, "class", "uk-button uk-button-primary");
    			attr(button0, "type", "button");
    			attr(button0, "uk-toggle", "target: #modal-userCreator");
    			attr(div0, "class", "uk-margin-medium-top uk-grid-medium");
    			attr(div0, "uk-grid", "");
    			attr(button1, "class", "uk-modal-close-default");
    			attr(button1, "type", "button");
    			attr(button1, "uk-close", "");
    			attr(h21, "class", "uk-modal-title");
    			attr(div1, "class", "uk-modal-header");
    			attr(span1, "class", "uk-form-icon");
    			attr(span1, "uk-icon", "icon: user");
    			attr(input0, "class", "uk-input uk-form-large");
    			attr(input0, "type", "text");
    			attr(div2, "class", "uk-inline uk-width-1-1");
    			attr(div3, "class", "uk-margin");
    			attr(span2, "class", "uk-form-icon");
    			attr(span2, "uk-icon", "icon: lock");
    			attr(input1, "class", "uk-input uk-form-large");
    			attr(input1, "type", "password");
    			attr(div4, "class", "uk-inline uk-width-1-1");
    			attr(div5, "class", "uk-margin");
    			attr(div6, "class", "uk-modal-body");
    			attr(div6, "uk-overflow-auto", "");
    			attr(button2, "class", "uk-button uk-button-default uk-modal-close");
    			attr(button2, "type", "button");
    			attr(button3, "class", "uk-button uk-button-primary");
    			attr(button3, "type", "button");
    			attr(div7, "class", "uk-modal-footer uk-text-right");
    			attr(div8, "class", "uk-modal-dialog");
    			attr(div9, "id", "modal-userCreator");
    			attr(div9, "uk-modal", "");
    		},
    		m(target, anchor) {
    			insert(target, h20, anchor);
    			append(h20, t0);
    			append(h20, span0);
    			insert(target, t1, anchor);
    			insert(target, button0, anchor);
    			append(button0, t2);
    			insert(target, t3, anchor);
    			insert(target, div0, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			insert(target, t4, anchor);
    			insert(target, div9, anchor);
    			append(div9, div8);
    			append(div8, button1);
    			append(div8, t5);
    			append(div8, div1);
    			append(div1, h21);
    			append(h21, t6);
    			append(div8, t7);
    			append(div8, div6);
    			if (if_block) if_block.m(div6, null);
    			append(div6, t8);
    			append(div6, form);
    			append(form, div3);
    			append(div3, div2);
    			append(div2, span1);
    			append(div2, t9);
    			append(div2, input0);
    			set_input_value(input0, /*username*/ ctx[0]);
    			append(form, t10);
    			append(form, div5);
    			append(div5, div4);
    			append(div4, span2);
    			append(div4, t11);
    			append(div4, input1);
    			set_input_value(input1, /*password*/ ctx[1]);
    			append(div8, t12);
    			append(div8, div7);
    			append(div7, button2);
    			append(button2, t13);
    			append(div7, t14);
    			append(div7, button3);
    			append(button3, t15);

    			dispose = [
    				listen(input0, "input", /*input0_input_handler*/ ctx[7]),
    				listen(input1, "input", /*input1_input_handler*/ ctx[8]),
    				listen(button3, "click", /*createUser*/ ctx[5])
    			];
    		},
    		p(ctx, dirty) {
    			if (dirty & /*users*/ 16) {
    				each_value = /*users*/ ctx[4];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (/*errorNotification*/ ctx[3] !== "") {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$2(ctx);
    					if_block.c();
    					if_block.m(div6, t8);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*username*/ 1 && input0.value !== /*username*/ ctx[0]) {
    				set_input_value(input0, /*username*/ ctx[0]);
    			}

    			if (dirty & /*password*/ 2 && input1.value !== /*password*/ ctx[1]) {
    				set_input_value(input1, /*password*/ ctx[1]);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(h20);
    			if (detaching) detach(t1);
    			if (detaching) detach(button0);
    			if (detaching) detach(t3);
    			if (detaching) detach(div0);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach(t4);
    			if (detaching) detach(div9);
    			if (if_block) if_block.d();
    			run_all(dispose);
    		}
    	};
    }

    // (99:20) {#each users as user}
    function create_each_block(ctx) {
    	let div1;
    	let div0;
    	let a;
    	let t0;
    	let p0;
    	let t1;
    	let t2_value = /*user*/ ctx[9]._id + "";
    	let t2;
    	let t3;
    	let p1;
    	let t4;
    	let t5_value = /*user*/ ctx[9].username + "";
    	let t5;
    	let t6;
    	let p2;
    	let t7;
    	let t8_value = /*user*/ ctx[9].role + "";
    	let t8;
    	let t9;

    	return {
    		c() {
    			div1 = element("div");
    			div0 = element("div");
    			a = element("a");
    			t0 = space();
    			p0 = element("p");
    			t1 = text("id: ");
    			t2 = text(t2_value);
    			t3 = space();
    			p1 = element("p");
    			t4 = text("Username: ");
    			t5 = text(t5_value);
    			t6 = space();
    			p2 = element("p");
    			t7 = text("Role: ");
    			t8 = text(t8_value);
    			t9 = space();
    			this.h();
    		},
    		l(nodes) {
    			div1 = claim_element(nodes, "DIV", {});
    			var div1_nodes = children(div1);
    			div0 = claim_element(div1_nodes, "DIV", { class: true });
    			var div0_nodes = children(div0);
    			a = claim_element(div0_nodes, "A", { class: true, "uk-icon": true });
    			children(a).forEach(detach);
    			t0 = claim_space(div0_nodes);
    			p0 = claim_element(div0_nodes, "P", {});
    			var p0_nodes = children(p0);
    			t1 = claim_text(p0_nodes, "id: ");
    			t2 = claim_text(p0_nodes, t2_value);
    			p0_nodes.forEach(detach);
    			t3 = claim_space(div0_nodes);
    			p1 = claim_element(div0_nodes, "P", {});
    			var p1_nodes = children(p1);
    			t4 = claim_text(p1_nodes, "Username: ");
    			t5 = claim_text(p1_nodes, t5_value);
    			p1_nodes.forEach(detach);
    			t6 = claim_space(div0_nodes);
    			p2 = claim_element(div0_nodes, "P", {});
    			var p2_nodes = children(p2);
    			t7 = claim_text(p2_nodes, "Role: ");
    			t8 = claim_text(p2_nodes, t8_value);
    			p2_nodes.forEach(detach);
    			div0_nodes.forEach(detach);
    			t9 = claim_space(div1_nodes);
    			div1_nodes.forEach(detach);
    			this.h();
    		},
    		h() {
    			attr(a, "class", "uk-position-right uk-padding-small");
    			attr(a, "uk-icon", "chevron-down");
    			attr(div0, "class", "uk-card uk-card-default uk-card-hover uk-card-body");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, div0);
    			append(div0, a);
    			append(div0, t0);
    			append(div0, p0);
    			append(p0, t1);
    			append(p0, t2);
    			append(div0, t3);
    			append(div0, p1);
    			append(p1, t4);
    			append(p1, t5);
    			append(div0, t6);
    			append(div0, p2);
    			append(p2, t7);
    			append(p2, t8);
    			append(div1, t9);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*users*/ 16 && t2_value !== (t2_value = /*user*/ ctx[9]._id + "")) set_data(t2, t2_value);
    			if (dirty & /*users*/ 16 && t5_value !== (t5_value = /*user*/ ctx[9].username + "")) set_data(t5, t5_value);
    			if (dirty & /*users*/ 16 && t8_value !== (t8_value = /*user*/ ctx[9].role + "")) set_data(t8, t8_value);
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    		}
    	};
    }

    // (121:24) {#if errorNotification !== ''}
    function create_if_block_1$2(ctx) {
    	let div;
    	let a;
    	let t0;
    	let p;
    	let t1;

    	return {
    		c() {
    			div = element("div");
    			a = element("a");
    			t0 = space();
    			p = element("p");
    			t1 = text(/*errorNotification*/ ctx[3]);
    			this.h();
    		},
    		l(nodes) {
    			div = claim_element(nodes, "DIV", { class: true, "uk-alert": true });
    			var div_nodes = children(div);
    			a = claim_element(div_nodes, "A", { class: true, "uk-close": true });
    			children(a).forEach(detach);
    			t0 = claim_space(div_nodes);
    			p = claim_element(div_nodes, "P", {});
    			var p_nodes = children(p);
    			t1 = claim_text(p_nodes, /*errorNotification*/ ctx[3]);
    			p_nodes.forEach(detach);
    			div_nodes.forEach(detach);
    			this.h();
    		},
    		h() {
    			attr(a, "class", "uk-alert-close");
    			attr(a, "uk-close", "");
    			attr(div, "class", "uk-alert-danger");
    			attr(div, "uk-alert", "");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, a);
    			append(div, t0);
    			append(div, p);
    			append(p, t1);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*errorNotification*/ 8) set_data(t1, /*errorNotification*/ ctx[3]);
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    function create_fragment$6(ctx) {
    	let main;
    	let t;
    	let div;
    	let current;
    	const navbar = new Navbar({});

    	function select_block_type(ctx, dirty) {
    		if (/*userData*/ ctx[2]) return create_if_block$4;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	return {
    		c() {
    			main = element("main");
    			create_component(navbar.$$.fragment);
    			t = space();
    			div = element("div");
    			if_block.c();
    			this.h();
    		},
    		l(nodes) {
    			main = claim_element(nodes, "MAIN", {});
    			var main_nodes = children(main);
    			claim_component(navbar.$$.fragment, main_nodes);
    			t = claim_space(main_nodes);
    			div = claim_element(main_nodes, "DIV", { class: true });
    			var div_nodes = children(div);
    			if_block.l(div_nodes);
    			div_nodes.forEach(detach);
    			main_nodes.forEach(detach);
    			this.h();
    		},
    		h() {
    			attr(div, "class", "uk-container");
    		},
    		m(target, anchor) {
    			insert(target, main, anchor);
    			mount_component(navbar, main, null);
    			append(main, t);
    			append(main, div);
    			if_block.m(div, null);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(navbar.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(main);
    			destroy_component(navbar);
    			if_block.d();
    		}
    	};
    }

    const CREATEUSER_URL = "http://localhost:8080/auth/signup";

    function closeModal() {
    	UIkit.modal("#modal-userCreator").hide();
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let username;
    	let password;
    	let userData;
    	let errorNotification = "";
    	let users = [];

    	function getUsers() {
    		fetch("http://localhost:8080/api/v1/users", {
    			headers: {
    				authorization: `Bearer ${localStorage.getItem("token")}`
    			}
    		}).then(res => res.json()).then(result => {
    			$$invalidate(4, users = result);
    		});
    	}

    	onMount(() => {
    		if (!localStorage.getItem("token")) {
    			navigate("/");
    		}

    		fetch("http://localhost:8080/", {
    			headers: {
    				authorization: `Bearer ${localStorage.getItem("token")}`
    			}
    		}).then(res => res.json()).then(result => {
    			if (result.user) {
    				if (result.user.role !== "admin") {
    					navigate("/dashboard", { replace: true });
    				} else {
    					$$invalidate(2, userData = result.user);
    				}
    			} else {
    				localStorage.removeItem("token");
    			}
    		});

    		getUsers();
    	});

    	function createUser() {
    		let body = { username, password };

    		fetch(CREATEUSER_URL, {
    			method: "POST",
    			headers: {
    				"content-type": "application/json",
    				authorization: `Bearer ${localStorage.getItem("token")}`
    			},
    			body: JSON.stringify(body)
    		}).then(response => {
    			if (response.ok) {
    				return response.json();
    			}

    			return response.json().then(error => {
    				$$invalidate(3, errorNotification = error.message);
    				console.log(error.message);
    				throw new Error(error.message);
    			});
    		}).then(result => {
    			closeModal();
    			getUsers();
    		}).catch(error => {
    			setTimeout(
    				() => {
    					$$invalidate(3, errorNotification = error.message);
    				},
    				1000
    			);
    		});
    	}

    	function input0_input_handler() {
    		username = this.value;
    		$$invalidate(0, username);
    	}

    	function input1_input_handler() {
    		password = this.value;
    		$$invalidate(1, password);
    	}

    	return [
    		username,
    		password,
    		userData,
    		errorNotification,
    		users,
    		createUser,
    		getUsers,
    		input0_input_handler,
    		input1_input_handler
    	];
    }

    class Admin extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});
    	}
    }

    /* src\App.svelte generated by Svelte v3.17.3 */

    function create_default_slot$1(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let current;
    	const route0 = new Route({ props: { path: "*", component: LogIn } });

    	const route1 = new Route({
    			props: { path: "/dashboard", component: Dashboard }
    		});

    	const route2 = new Route({
    			props: { path: "/admin", component: Admin }
    		});

    	return {
    		c() {
    			div = element("div");
    			create_component(route0.$$.fragment);
    			t0 = space();
    			create_component(route1.$$.fragment);
    			t1 = space();
    			create_component(route2.$$.fragment);
    		},
    		l(nodes) {
    			div = claim_element(nodes, "DIV", {});
    			var div_nodes = children(div);
    			claim_component(route0.$$.fragment, div_nodes);
    			t0 = claim_space(div_nodes);
    			claim_component(route1.$$.fragment, div_nodes);
    			t1 = claim_space(div_nodes);
    			claim_component(route2.$$.fragment, div_nodes);
    			div_nodes.forEach(detach);
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(route0, div, null);
    			append(div, t0);
    			mount_component(route1, div, null);
    			append(div, t1);
    			mount_component(route2, div, null);
    			current = true;
    		},
    		p: noop,
    		i(local) {
    			if (current) return;
    			transition_in(route0.$$.fragment, local);
    			transition_in(route1.$$.fragment, local);
    			transition_in(route2.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(route0.$$.fragment, local);
    			transition_out(route1.$$.fragment, local);
    			transition_out(route2.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			destroy_component(route0);
    			destroy_component(route1);
    			destroy_component(route2);
    		}
    	};
    }

    function create_fragment$7(ctx) {
    	let main;
    	let current;

    	const router = new Router({
    			props: {
    				url: /*url*/ ctx[0],
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			}
    		});

    	return {
    		c() {
    			main = element("main");
    			create_component(router.$$.fragment);
    		},
    		l(nodes) {
    			main = claim_element(nodes, "MAIN", {});
    			var main_nodes = children(main);
    			claim_component(router.$$.fragment, main_nodes);
    			main_nodes.forEach(detach);
    		},
    		m(target, anchor) {
    			insert(target, main, anchor);
    			mount_component(router, main, null);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			const router_changes = {};
    			if (dirty & /*url*/ 1) router_changes.url = /*url*/ ctx[0];

    			if (dirty & /*$$scope*/ 2) {
    				router_changes.$$scope = { dirty, ctx };
    			}

    			router.$set(router_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(main);
    			destroy_component(router);
    		}
    	};
    }

    function getPath() {
    	let location = window.location.href;
    	let path = location.substr(21, 21);
    	return path;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { url = "" } = $$props;

    	onMount(() => {
    		let currentPath = getPath();
    		console.log(currentPath);

    		if (currentPath === "/dashboard") {
    			navigate("/dashboard", { replace: true });
    		}
    	});

    	$$self.$set = $$props => {
    		if ("url" in $$props) $$invalidate(0, url = $$props.url);
    	};

    	return [url];
    }

    class App extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { url: 0 });
    	}
    }

    const app = new App({
    	target: document.body,
    	hydratable: true
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
