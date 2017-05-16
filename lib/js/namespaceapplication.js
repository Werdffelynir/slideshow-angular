(function (window) {

    var NamespaceApplication = (function () {
        return function () {
            // Simplex
            if (!(this instanceof NamespaceApplication)) return new NamespaceApplication();

            // Public config properties
            this.path = '/';
            this.debug = true;

            // Private properties
            this._require_key = false;
            this._requires_stack = {};

            // Set Configurations
            if (arguments.length == 1 && arguments[0] && typeof arguments[0] === 'object') {
                for (var k in arguments[0]) {
                    if (this[k] === undefined || ['path', 'debug'].indexOf(k) !== -1)
                        this[k] = arguments[0][k];
                }
            }

            this._init_extensions();
            return this;
        }
    })();

    NamespaceApplication.prototype = (function () {
        /**
         * @namespace NamespaceApplication.prototype
         */
        var prototype = {};

        /**
         * Create namespace for module object
         *
         * @param namespace     namespace. Ex: "Module.Name" ="AppInstance.Module.Name"
         * @param callback      Must return Object or Function
         * @returns {NamespaceApplication.prototype.namespace|{}}
         */
        prototype.namespace = function (namespace, callback) {

            var
                i,
                name,
                path = namespace.split('.'),
                inst = this || {},
                len = path.length;

            for (i = 0; i < len; i++) {
                name = path[i].trim();
                if (typeof inst[name] !== 'object') {
                    inst[name] = (i + 1 >= len) ? (callback ? callback.call(inst, this, {}) : {}) : {};
                    inst = inst[name];
                } else
                    inst = inst[name];
            }

            return inst;
        };

        /**
         * Designate a list of scripts for loading
         *
         * @param key           list key (identifier)
         * @param path          array with scripts url
         * @param oncomplete    executing when all scripts are loaded
         * @param onerror
         * @returns {NamespaceApplication.prototype.require}
         */
        prototype.require = function (key, path, oncomplete, onerror) {
            this._require_key = key;
            this._requires_stack[key] = {
                src: Array.isArray(path) ? path : [path],
                elements: [],
                oncomplete: oncomplete,
                onerror: onerror
            };
            return this;
        };

        /**
         * Start loading the list of scripts by key (identifier)
         *
         * @param key
         * @returns {NamespaceApplication.prototype.requireStart}
         */
        prototype.requireStart = function (key) {
            key = key || this._require_key;
            if (this._requires_stack[key])
                this._load_scripts_recursive(0, key);
            else
                console.error("Require source not found! Key: " + key + " not exist!");

            return this;
        };

        prototype._load_scripts_recursive = function (i, key) {
            var self = this,
                requires = this._requires_stack[key];

            if (requires.src[i]) {
                if (!Array.isArray(requires.elements))
                    requires.elements = [];

                requires.elements.push(NamespaceApplication.loadJS(requires.src[i], function () {
                    self._load_scripts_recursive(++i, key);
                }, requires.onerror));
            }
            else if (i === requires.src.length)
                requires.oncomplete.call(self, requires.elements);
            else
                self._load_scripts_recursive(++i, key);
        };

        prototype._init_extensions = function () {
            if (typeof NamespaceApplication.extension === 'function' &&
                typeof NamespaceApplication.extension.stack === 'object') {
                var name, callback, stack = NamespaceApplication.extension.stack;
                for (name in stack) {
                    callback = stack[name]['callback'];
                    if (typeof callback === 'function') {
                        this[name] = callback.call(callback, this)
                    }
                }
            }
        };

        return prototype
    })();

    NamespaceApplication.prototype.constructor = NamespaceApplication;

    /** Static Methods * */

    /**
     * Loads a script element with javascript source
     *
     * @param src
     * @param onload
     * @param onerror
     * @returns {*}
     */
    NamespaceApplication.loadJS = function (src, onload, onerror) {
        if (!src) return null;
        if (NamespaceApplication.typeOf(src, 'array')) {
            var i;
            for (i = 0; i < src.length; i++) {
                NamespaceApplication.loadJS(src[i], onload, onerror);
            }
        } else {
            var script = document.createElement('script'),
                id = "src-" + Math.random().toString(32).slice(2);

            script.src = (src.substr(-3) === '.js') ? src : src + '.js';
            script.type = 'application/javascript';
            script.id = id;
            script.onload = onload;
            script.onerror = onerror;

            document.head.appendChild(script);
            return script
        }
    };


    /**
     * Loads a link element with CSS stylesheet
     *
     * @param src
     * @param onload
     * @param onerror
     * @returns {Element}
     */
    NamespaceApplication.loadCSS = function (src, onload, onerror) {
        if (!src) return null;
        if (NamespaceApplication.typeOf(src, 'array')) {
            var i;
            for (i = 0; i < src.length; i++) {
                NamespaceApplication.loadCSS(src[i], onload, onerror);
            }
        } else {
            var link = document.createElement('link'),
                id = "src-" + Math.random().toString(32).slice(2);

            link.href = (src.substr(-4) === '.css') ? src : src + '.css';
            link.rel = 'stylesheet';
            link.id = id;
            link.onload = onload;
            link.onerror = onerror;

            document.head.appendChild(link);
            return link
        }
    };

    /**
     * Create global extension.
     * Need declare after loading core, but before loading modules
     *
     * @param extensionName
     * @param callback
     */
    NamespaceApplication.extension = function (extensionName, callback) {
        NamespaceApplication.extension.stack[extensionName] = {
            name: extensionName,
            callback: callback
        };
    };
    NamespaceApplication.extension.stack = {};

    /**
     * Execute callback function if or when DOM is loaded
     *
     * @param callback
     */
    NamespaceApplication.domLoaded = function (callback) {
        if (document.querySelector('body'))
            callback.call();
        else
            document.addEventListener('DOMContentLoaded', function () {
                callback.call()
            }, false);
    };

    /**
     * Вернет обобщенный тип передаваемого параметра value,
     * или сравнит тип value с передаваемым type и вернет boolean
     * Поддержуемые значение типов: null, boolean, undefined, function, string, number, date, number, array, object
     * @param value
     * @param type
     * @returns {string}
     */
    NamespaceApplication.typeOf = function (value, type) {
        var simpleTypes = ['null', 'boolean', 'undefined', 'function', 'string', 'number', 'date', 'number', 'array', 'object'],
            t = NamespaceApplication.typeOfStrict(value).toLowerCase();
        if (simpleTypes.indexOf(t) === -1 && typeof value === 'object')
            t = 'object';

        return typeof type === 'string' ? type.toLowerCase() === t : t;
    };

    /**
     * Вернет строгий/точный тип передаваемого параметра value,
     * или сравнит тип value с передаваемым type и вернет boolean
     * Возможные заначения: null, Boolean, undefined, Function, String, Number, Date, Number, Array, Object ...
     * для HTML елементов / объектов WebAPI возвращает имя объекта, например для <a> вернет HTMLAnchorElement
     * https://developer.mozilla.org/ru/docs/Web/API
     *
     * @param value
     * @param type
     * @returns {*}
     */
    NamespaceApplication.typeOfStrict = function (value, type) {
        var t = Object.prototype.toString.call(value).slice(8, -1);
        return typeof type === 'string' ? type === t : t;
    };

    /**
     * Is defined value
     *
     * @param value
     * @returns {boolean}
     */
    NamespaceApplication.defined = function (value) {
        return value !== undefined
    };

    /**
     * An empty value check.
     * Return `true` for: ('', ' ', [], {}, null, false, NaN, undefined, 0, '0')
     * @param src
     * @returns {boolean}
     */
    NamespaceApplication.isEmpty = function (src) {
        if (NamespaceApplication.typeOf(src, 'object') || NamespaceApplication.typeOf(src, 'array')) {
            for (var key in src) {
                if (src.hasOwnProperty(key)) {
                    return false
                }
            }
            return true;
        } else if (NamespaceApplication.typeOf(src, 'string')) {
            src = src.replace(/\s/g, '');
            return src === "" || src === "0";
        } else {
            return (src === 0 || src === null || src === undefined || src === false || isNaN(src));
        }
    };

    /**
     * Checked value on nodeType Node.ELEMENT
     *
     * @param value
     * @returns {*|boolean}
     */
    NamespaceApplication.isNode = function (value) {
        return value && (value.nodeType === Node.TEXT_NODE ||
            value.nodeType === Node.ELEMENT_NODE ||
            value.nodeType === Node.DOCUMENT_FRAGMENT_NODE ||
            value.nodeType === Node.DOCUMENT_NODE)
    };

    /**
     * Deeply extends two objects
     *
     * @param  {Object} destination The destination object, This object will change
     * @param  {Object} source      The custom options to extend destination by
     * @return {Object}             The desination object
     */
    NamespaceApplication.extend = function (destination, source) {
        var property;
        for (property in source) {
            if (source[property] && source[property].constructor && source[property].constructor === Object) {
                destination[property] = destination[property] || {};
                NamespaceApplication.extend(destination[property], source[property]);
            } else
                destination[property] = source[property];
        }
        return destination;
    };

    /**
     * Get rel URI
     *
     * @param uri
     * @returns {string}
     */
    NamespaceApplication.uri = function (uri) {
        uri = uri || location.pathname;
        uri = uri.replace(/\/+/ig, '/');
        return uri.length > 1 && uri.slice(0, 1) != '/' ? '/' + uri : uri;
    };

    /**
     * Simple redirect
     *
     * @param to
     */
    NamespaceApplication.redirect = function (to) {
        window.location.href = to || window.location.href;
    };

    /**
     * Get route - URI Path
     *
     * @returns {string}
     */
    NamespaceApplication.routePath = function (hash, query) {
        var path = window.location.pathname;
        if (hash)
            path += window.location.hash;
        if (query)
            path += window.location.search;
        if (this.url && path.indexOf(this.url) === 0) {
            path = path.substr(this.url.length);
            if (path.slice(0, 1) !== '/') path = '/' + path;
        }
        return path;
    };

    /**
     * Return object with elements, selected by selector,
     * with  names keys by 'attr' or numeric
     *
     * .search('li.num', 'data-id')
     * .search('li')
     * .search('li', false, NodeElement)
     *
     * @param selector
     * @param attr
     * @param from
     * @returns {{}}
     */
    NamespaceApplication.search = function (selector, attr, from) {
        from = NamespaceApplication.isNode(from) ? from : NamespaceApplication.query(from);
        var i = 0, key, elements = {},
            queryElements = NamespaceApplication.queryAll(selector, from || document.body);
        if (queryElements) {
            while (i < queryElements.length) {
                if (!attr)
                    elements[i] = queryElements[i];
                else {
                    if (queryElements[i].hasAttribute(attr)) {
                        key = queryElements[i].getAttribute(attr);
                        elements[key] = queryElements[i];
                    }
                }
                i++;
            }
        }
        return elements;
    };

    /**
     * Select and return a one (first) element by selector
     *
     * @param selector      String
     * @param fromCallback  String|HTMLElement|Function
     * @param thisInstance  Object
     * @returns {Element|boolean|Node}
     */
    NamespaceApplication.query = function (selector, fromCallback, thisInstance) {
        var elems = NamespaceApplication.queryAll(selector, fromCallback, thisInstance);
        return elems && elems[0] ? elems[0] : false;
    };

    /**
     * Selects and return an all elements by selector
     *
     * @param selector      String
     * @param fromCallback  String|HTMLElement|Function
     * @param thisInstance  Object
     * @returns {*}
     */
    NamespaceApplication.queryAll = function (selector, fromCallback, thisInstance) {
        var type = typeof fromCallback,
            from = document,
            elements = [],
            callback = null;

        if (NamespaceApplication.isNode(selector))
            return [selector];

        if (type == "function")
            callback = fromCallback;
        else if (type == "string")
            from = document.querySelector(fromCallback);
        else if (type == "object" && NamespaceApplication.isNode(fromCallback))
            from = fromCallback;

        if (from)
            elements = [].slice.call(from.querySelectorAll(selector));

        if (callback)
            callback.call(thisInstance || {}, elements);

        return elements;
    };

    /**
     * Execute callback for each element in list
     *
     * @param list
     * @param callback
     * @param tmp
     */
    NamespaceApplication.each = function (list, callback, tmp) {
        var i = 0;
        if (list instanceof Array)
            for (i = 0; i < list.length; i++) callback.call({}, list[i], i, tmp);
        else
            for (i in list) callback.call({}, list[i], i, tmp);
    };

    /**
     * Execute callback for each parent element
     * and return array with parents elements
     * .eachParent('.my-class')
     * .eachParent('.my-class', function filter (parent) {}, 10)
     *
     * @param selector          Start selector or element
     * @param callbackFilter    Each return value it is filter mark, bool true add element to result array
     * @param loops
     * @returns {Array}
     */
    NamespaceApplication.eachParent = function (selector, callbackFilter, loops) {
        loops = loops === undefined ? 10 : loops;
        selector = NamespaceApplication.isNode(selector) ? selector : NamespaceApplication.query(selector);

        var result = [],
            get_parent = function (elem) {
                return elem && elem.parentNode ? elem.parentNode : false
            },
            parent = get_parent(selector);

        while (loops > 0 && parent) {
            loops--;

            if (typeof callbackFilter === 'function') {
                if (callbackFilter.call({}, parent))
                    result.push(parent);
            } else {
                result.push(parent);
            }

            parent = get_parent(parent);
        }
        return result;
    };

    /**
     * Simple add event listener
     *
     * @param selector
     * @param eventName
     * @param callback
     * @param bubble
     */
    NamespaceApplication.on = function (selector, eventName, callback, bubble) {
        var i, elements = null,
            typeSelector = NamespaceApplication.typeOf(selector);

        if (typeSelector == 'string')
            elements = NamespaceApplication.queryAll(selector);
        else if (typeSelector == 'object' && selector.nodeType == Node.ELEMENT_NODE)
            elements = [selector];
        else if (typeSelector == 'array')
            elements = selector;

        if (elements) {
            for (i = 0; i < elements.length; i++)
                if (typeof elements[i] === 'object')
                    elements[i].addEventListener(eventName, callback, !!bubble);
        }
    };

    /**
     * Get|Set attribute from|to element
     *  .attr (HTMLElement, name)
     *  .attr (HTMLElement, name, value)
     * @param element
     * @param name
     * @param value
     * @returns {string}
     */
    NamespaceApplication.attr = function (element, name, value) {
        if (NamespaceApplication.isNode(element) && arguments.length == 2) {
            if (NamespaceApplication.typeOf(name, 'object')) {
                for (var key in name)
                    NamespaceApplication.attr(element, key, name[key]);
            }
            else
                return element.getAttribute(name);
        }
        else if (NamespaceApplication.isNode(element) && arguments.length == 3)
            element.setAttribute(name, value);
    };

    /**
     * Common method for clone objects
     * @param src           'function', 'node', 'array', 'object'
     * @param addProperties for 'array' and 'object' - add or replace properties by indexes or keys,
     *                      concatenate for 'string', summarizes for 'number', cloned deep for NodeElements
     * @returns {*}
     */
    NamespaceApplication.copy = function (src, addProperties) {
        var type = NamespaceApplication.typeOf(src);

        if (type === 'object' && NamespaceApplication.isNode(src)) {
            return src.cloneNode(!!addProperties);
        }
        else if (type === 'function') {
            return src.bind({});
        }
        else if (type === 'array' || type === 'object') {
            var copy = JSON.parse(JSON.stringify(src));
            if (NamespaceApplication.typeOf(addProperties, 'object') || NamespaceApplication.typeOf(addProperties, 'array'))
                for (var i in addProperties)
                    copy[i] = addProperties[i];
            return copy;
        }
        else
            return NamespaceApplication.defined(addProperties) ? src + addProperties : src;
    };

    /**
     * App style\s to HTMLElement\s
     *
     * .css('.menuinline', 'background-color: #ffffff')
     * .css(HTMLElement, 'background-color: #10b626; color: #3a363f')
     * .css([HTMLElement, HTMLElement, ...], {fontSize: '22px'})
     *
     * @param selector
     * @param properties
     * @returns {*}
     */
    NamespaceApplication.css = function (selector, properties) {
        if (!selector || !properties) return;

        var i, k, elements = null,
            typeSelector = NamespaceApplication.typeOf(selector),
            typeProperties = NamespaceApplication.typeOf(properties),
            parse = function (str) {
                var i, p1 = str.split(';'), p2, pn, ix, o = {};
                for (i = 0; i < p1.length; i++) {
                    p2 = p1[i].split(':');
                    pn = p2[0].trim();
                    ix = pn.indexOf('-');
                    if (ix !== -1)
                        pn = pn.substring(0, ix) + pn[ix + 1].toUpperCase() + pn.substring(ix + 2);
                    if (p2.length == 2)
                        o[pn] = p2[1].trim()
                }
                return o;
            };

        if (typeProperties == 'string')
            properties = parse(properties);

        if (typeSelector == 'string')
            elements = NamespaceApplication.queryAll(selector);
        else if (typeSelector == 'object' && selector.nodeType == Node.ELEMENT_NODE)
            elements = [selector];
        else if (typeSelector == 'array')
            elements = selector;

        if (elements) {
            for (i in elements)
                for (k in properties)
                    elements[i].style[k] = properties[k];
        }
        return elements
    };

    NamespaceApplication.show = function (src) {
        NamespaceApplication._set_real_display_style(src);
        NamespaceApplication.css(src, {display: src && src['_real_display_style'] ? src['_real_display_style'] : 'block'});
    };
    NamespaceApplication.hide = function (src) {
        NamespaceApplication._set_real_display_style(src);
        NamespaceApplication.css(src, {display: 'none'});
    };
    NamespaceApplication.toggle = function (src) {
        if (NamespaceApplication.typeOf(src, 'string')) {
            NamespaceApplication.queryAll(src).map(NamespaceApplication.toggle);
        } else if (NamespaceApplication.isNode(src)) {
            if (src.style.display == 'none') NamespaceApplication.show(src);
            else NamespaceApplication.hide(src);
        }
    };
    NamespaceApplication._set_real_display_style = function (src) {
        if (NamespaceApplication.typeOf(src, 'string')) {
            NamespaceApplication.queryAll(src).map(NamespaceApplication._set_real_display_style);
        } else if (NamespaceApplication.isNode(src) && src['_real_display_style'] === undefined) {
            var style = src.style.display ? src.style.display : getComputedStyle(src).display;
            src['_real_display_style'] = (!style || style == 'none') ? 'block' : style;
        }
    };

    /**
     * Inject data into HTMLElement by selector
     *
     * @param selector
     * @param data
     * @param append
     * @param to
     * @returns {*}
     */
    NamespaceApplication.inject = function (selector, data, append, to) {
        if (typeof selector === 'string')
            selector = NamespaceApplication.query(selector, to);

        if (!append)
            selector.textContent = '';

        if (NamespaceApplication.isNode(selector)) {
            if (NamespaceApplication.isNode(data)) {
                selector.appendChild(data);
            } else if (NamespaceApplication.typeOf(data, 'array')) {
                var i;
                for (i = 0; i < data.length; i++)
                    NamespaceApplication.inject(selector, data[i], true, to);
            } else {
                selector.innerHTML = (!append) ? data : selector.innerHTML + data;
            }
            return selector;
        }
        return null;
    };

    /**
     * Formatting of string, or maybe template builder
     *
     * Examples:
     * .format("Hello {0}, your code is {1}!", ['Jade', 'Prefect']);
     * .format("Hello {name}, your code is {mean}!", {name:'Jade', mean: 'Prefect'});
     *
     * @param string    String
     * @param formated  Array|Object
     * @returns string
     */
    NamespaceApplication.format = function (string, formated) {
        var reg;
        if (Array.isArray(formated))
            reg = new RegExp(/{(\d+)}/g);
        else if (formated && typeof formated === 'object')
            reg = new RegExp(/{(\w+)}/g);

        return string.replace(reg, function (match, number) {
            return typeof formated[number] != 'undefined' ? formated[number] : match;
        });
    };

    /**
     * Base AJAX request.
     *
     * Example:
     * .ajax({method: 'POST', url: '/server.php', data: {id:123}}, function (status, data) {});
     *
     * @param {*} config        {method: 'POST', data: {}, headers: {}, action: '/index'}
     * @param callback          executing event - onloadend. function (status, responseText)
     * @param thisInstance      object 'this' for callback
     *
     * @returns {XMLHttpRequest}
     */
    NamespaceApplication.ajax = function (config, callback, thisInstance) {
        var kd,
            kh,
            form_data = new FormData(),
            xhr = new XMLHttpRequest(),
            conf = {
                method: config.method || 'GET',
                data: config.data || {},
                headers: config.headers || {},
                action: config.action || config.url || document.location.href
            };

        if (config.data instanceof FormData) {
            form_data = config.data;
            conf.data = {}
        }

        if (conf.method.toUpperCase() !== 'POST') {
            conf.action += conf.action.indexOf('?') === -1 ? '?' : '';
            for (kd in conf.data)
                conf.action += '&' + kd + '=' + encodeURIComponent(conf.data[kd])
        } else
            for (kd in conf.data)
                form_data.append(kd, encodeURIComponent(conf.data[kd]));

        xhr.open(conf.method, conf.action, true);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

        for (kd in conf.headers)
            xhr.setRequestHeader(kd, conf.headers[kd]);

        xhr.onloadend = function () {
            if (typeof thisInstance !== 'object') thisInstance = {};

            thisInstance.XMLHttpRequest = xhr;

            if (typeof callback === 'function')
                callback.call(thisInstance, xhr.status, xhr.responseText);
        };
        xhr.send(form_data);

        return xhr;
    };

    /**
     * Create DOM Element with attributes
     * .createElement ( 'div', {class: 'my-class'}, 'inject text')
     * .createElement ( 'div', {class: 'my-class'}, HTMLElement)
     * .createElement ( 'span', {class: 'my-class'}, [HTMLElement, HTMLElement])
     * .createElement ( 'span', {class: 'my-class'}, ['<h1>header</h1>', '<p>paragraph</p>'])
     * @param tag
     * @param attrs
     * @param inner
     * @returns {*}
     */
    NamespaceApplication.createElement = function (tag, attrs, inner) {
        var k, i, elem = document.createElement(tag);

        if (!elem) {
            return false;
        }

        if (NamespaceApplication.typeOf(attrs, 'object')) {
            for (k in attrs) {
                elem.setAttribute(k, attrs[k]);
            }
        }

        if (NamespaceApplication.typeOf(inner, 'string')) {
            elem.innerHTML = inner;
        }
        else if (NamespaceApplication.isNode(inner)) {
            elem.appendChild(inner);
        }
        else if (NamespaceApplication.typeOf(inner, 'array')) {
            for (i = 0; i < inner.length; i++) {
                if (NamespaceApplication.isNode(inner[i])) {
                    elem.appendChild(inner[i]);
                }
                else if (NamespaceApplication.typeOf(inner[i], 'string')) {
                    elem.innerHTML += inner[i];
                }
            }
        }
        return elem;
    };

    /**
     * Convert HTML string to DOMElement
     * @param string
     * @returns {*}
     */
    NamespaceApplication.str2node = function (string) {
        var i, fragment = document.createDocumentFragment(),
            container = document.createElement("div");
        container.innerHTML = string;

        while (i = container.firstChild)
            fragment.appendChild(i);

        return fragment.childNodes.length === 1 ? fragment.firstChild : fragment;
    };

    /**
     * Convert DOMElement to HTML string
     * @param element
     * @returns {*}
     */
    NamespaceApplication.node2str = function (element) {
        var container = document.createElement("div");
        container.appendChild(element.cloneNode(true));
        return container.innerHTML;
    };


    /**
     * Calculates the position and size of elements.
     *
     * @param elem
     * @returns {{y: number, x: number, width: number, height: number}}
     */
    NamespaceApplication.position = function (elem) {
        var data = {x: 0, y: 0, width: 0, height: 0};

        if (typeof elem === 'string')
            elem = document.querySelector(elem);

        if (elem === undefined || elem === window || elem === document) {
            data.width = window.innerWidth;
            data.height = window.innerHeight;
            data.element = window;
        }
        else if (elem && elem.nodeType === Node.ELEMENT_NODE) {
            if (elem.getBoundingClientRect) {
                var rect = elem.getBoundingClientRect(),
                    scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop,
                    scrollLeft = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft,
                    clientTop = document.documentElement.clientTop || document.body.clientTop || 0,
                    clientLeft = document.documentElement.clientLeft || document.body.clientLeft || 0;

                data.y = Math.round(rect.top + scrollTop - clientTop);
                data.x = Math.round(rect.left + scrollLeft - clientLeft);
                data.width = elem.offsetWidth;
                data.height = elem.offsetHeight;
            }
            else {
                var top = 0, left = 0;
                while (elem) {
                    top += parseInt(elem.offsetTop, 10);
                    left += parseInt(elem.offsetLeft, 10);
                    elem = elem.offsetParent;
                }
                data.y = top;
                data.x = left;
                data.width = elem.offsetWidth;
                data.height = elem.offsetHeight;
            }
            data.element = elem;
        }
        return data;
    };

    /**
     * Search all objects in array with key `attr` and value `attrValue`
     * @param values    Source array with objects
     * @param attr      Object search key
     * @param attrValue Object search value in key
     * @returns {Array}
     */
    NamespaceApplication.findObjects = function (values, attr, attrValue) {
        var i, tmp = [], list = values || [];
        for (i = 0; i < list.length; i++)
            if (list[i] && list[i][attr] !== undefined && list[i][attr] == attrValue)
                tmp.push(list[i]);
        return tmp;
    };

    /**
     * Search one object in array with key `attr` and value `attrValue`
     * @param values    Source array with objects
     * @param attr      Object search key
     * @param attrValue Object search value in key
     * @returns {boolean}
     */
    NamespaceApplication.findObject = function (values, attr, attrValue) {
        var tmp = NamespaceApplication.findObjects(values, attr, attrValue);
        return tmp.length ? tmp[0] : false;
    };

    /**
     * Simple timer realise. Return self-instance
     * timer = new .Timer(function(iterator, repeat){}, 1000, 5)
     *  Instance methods
     *      timer.repeat
     *      timer.iterator
     *      timer.start ()
     *      timer.stop ()
     *      timer.pause ()
     *      timer.reset ()
     *      timer.clear ()
     *  Static methods
     *      Timer.timeout (callback, ms, thisInst) : timeoutId
     *      Timer.interval (callback, ms, thisInst) : intervalId
     *      Timer.timeoutStop (timeoutId)
     *      Timer.intervalStop (intervalId)
     * @param callback
     * @param delay
     * @param repeat
     * @param thisInstance  if not set, uses instance of Timer
     * @returns {Window.NamespaceApplication.Timer|NamespaceApplication.Timer}
     * @constructor
     */
    NamespaceApplication.Timer = function (callback, delay, repeat, thisInstance) {
        if (!(this instanceof NamespaceApplication.Timer))
            return new NamespaceApplication.Timer(callback, delay, repeat, thisInstance);

        delay = delay !== undefined ? parseInt(delay) : 500;
        repeat = repeat !== undefined ? parseInt(repeat) : 0;

        var
            config = {self: this, callback: callback, delay: delay, repeat: repeat},
            ht = null,
            hc = function () {
                config.self.iterator++;
                if (config.repeat !== 0 && config.repeat <= config.self.iterator)
                    config.self.stop();
                config.callback.call(thisInstance || this, config.self.iterator, config.repeat);
            };

        this.repeat = repeat;
        this.iterator = 0;
        this.start = function () {
            if (config.repeat === 0 || config.repeat > config.self.iterator)
                ht = setInterval(hc, config.delay);
        };
        this.stop = function () {
            this.iterator = config.repeat;
            this.clear();
        };
        this.pause = function () {
            this.clear()
        };
        this.reset = function () {
            this.iterator = 0
        };
        this.clear = function () {
            clearInterval(ht)
        };
    };
    NamespaceApplication.Timer.timeout = function (callback, ms, thisInst) {
        if (typeof callback === 'function' && !isNaN(ms) && ms > 0) {
            thisInst = typeof thisInst === 'object' ? thisInst : {};
            return setTimeout(function () {
                callback.call(thisInst)
            }, ms)
        }
    };
    NamespaceApplication.Timer.interval = function (callback, ms, thisInst) {
        if (typeof callback === 'function' && !isNaN(ms) && ms > 0) {
            thisInst = typeof thisInst === 'object' ? thisInst : {};
            return setInterval(function () {
                callback.call(thisInst)
            }, ms)
        }
    };
    NamespaceApplication.Timer.timeoutStop = function (id) {
        clearTimeout(id)
    };
    NamespaceApplication.Timer.intervalStop = function (id) {
        clearInterval(id)
    };

    /**
     * Get, Set or Remove in cookie
     *
     * @param name
     * @param value
     * @returns {{set: (NamespaceApplication.Storage.set|*), get: (NamespaceApplication.Storage.get|*), remove: (NamespaceApplication.Storage.remove|*) }}
     * @constructor
     */
    NamespaceApplication.Cookie = function (name, value) {
        switch (arguments.length) {
            case 0:
                return {
                    set: NamespaceApplication.Cookie.set,
                    get: NamespaceApplication.Cookie.get,
                    remove: NamespaceApplication.Cookie.remove
                };
                break;
            case 1:
                return NamespaceApplication.Cookie.get(name);
                break;
            case 2:
                return NamespaceApplication.Cookie.set(name, value);
                break;
        }
    };

    /**
     * Get Cookie value by key
     * @param name
     * @returns {*}
     */
    NamespaceApplication.Cookie.get = function (name) {
        var decode, matches = document.cookie.match(new RegExp(
            "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
        ));
        decode = matches ? decodeURIComponent(matches[1]) : undefined;
        if (decode)
            try {
                decode = JSON.parse(decode)
            } catch (error) {
            }
        return decode
    };

    /**
     * Set Cookie key, value
     *  expires - ms, Date, -1, 0
     * @param name
     * @param value
     * @param {{}} options   {expires: 0, path: '/', domain: 'site.com', secure: false}
     */
    NamespaceApplication.Cookie.set = function (name, value, options) {
        options = options || {};
        try {
            value = JSON.stringify(value);
        } catch (error) {
        }
        var expires = options.expires;
        var updatedCookie = name + "=" + encodeURIComponent(value);
        if (typeof expires == "number" && expires) {
            var d = new Date();
            d.setTime(d.getTime() + expires * 1000);
            expires = options.expires = d;
        }
        if (expires && expires.toUTCString) {
            options.expires = expires.toUTCString();
        }
        for (var propName in options) {
            updatedCookie += "; " + propName;
            var propValue = options[propName];
            if (propValue !== true)
                updatedCookie += "=" + propValue;
        }
        document.cookie = updatedCookie;
    };

    /**
     * Remove Cookie by key
     * @param name
     * @param option
     */
    NamespaceApplication.Cookie.remove = function (name, option) {
        option = typeof option === 'object' ? option : {};
        option.expires = -1;
        NamespaceApplication.Cookie.set(name, "", option);
    };

    /**
     * LocalStorage wrapper
     *
     * @param name
     * @param value
     * @returns {{set: (NamespaceApplication.Storage.set|*), get: (NamespaceApplication.Storage.get|*), key: (NamespaceApplication.Storage.key|*), clear: (NamespaceApplication.Storage.clear|*), remove: (NamespaceApplication.Storage.remove|*), length: (NamespaceApplication.Storage.length|*)}}
     * @constructor
     */
    NamespaceApplication.Storage = function (name, value) {
        switch (arguments.length) {
            case 0:
                return {
                    set: NamespaceApplication.Storage.set,
                    get: NamespaceApplication.Storage.get,
                    key: NamespaceApplication.Storage.key,
                    clear: NamespaceApplication.Storage.clear,
                    remove: NamespaceApplication.Storage.remove,
                    length: NamespaceApplication.Storage.length
                };
                break;
            case 1:
                return NamespaceApplication.Storage.get(name);
                break;
            case 2:
                return NamespaceApplication.Storage.set(name, value);
                break;
        }
    };

    /**
     * Add item by name
     * @param name
     * @param value
     */
    NamespaceApplication.Storage.set = function (name, value) {
        try {
            value = JSON.stringify(value)
        } catch (error) {
        }
        return window.localStorage.setItem(name, value);
    };

    /**
     * Get item by name
     * @param name
     */
    NamespaceApplication.Storage.get = function (name) {
        var value = window.localStorage.getItem(name);
        if (value)
            try {
                value = JSON.parse(value)
            } catch (error) {
            }
        return value;
    };

    /**
     * Remove item by name
     * @param name
     */
    NamespaceApplication.Storage.remove = function (name) {
        return window.localStorage.removeItem(name)
    };

    /**
     * Get item by index
     * @param index
     * @returns {string}
     */
    NamespaceApplication.Storage.key = function (index) {
        return window.localStorage.key(index)
    };

    /**
     * When invoked, will empty all keys out of the storage.
     */
    NamespaceApplication.Storage.clear = function () {
        return window.localStorage.clear()
    };

    /**
     * Returns an integer representing the number of data items stored in the Storage object.
     * @returns {number}
     */
    NamespaceApplication.Storage.length = function () {
        return window.localStorage.length
    };

    /** @deprecated */
    NamespaceApplication.Util = {};
    /** @deprecated */
    NamespaceApplication.Util.filterArrayObject = function (values, attr, attrValue) {
        var tmp = NamespaceApplication.Util.filterArrayObjects(values, attr, attrValue);
        return tmp.length ? tmp[0] : false;
    };
    /** @deprecated */
    NamespaceApplication.Util.filterArrayObjects = function (values, attr, attrValue) {
        var i, tmp = [], list = values || [];
        for (i = 0; i < list.length; i++)
            if (list[i] && list[i][attr] !== undefined && list[i][attr] == attrValue)
                tmp.push(list[i]);
        return tmp
    };


    NamespaceApplication.Datetime = {};
    NamespaceApplication.Datetime.msInDay = 864e5;
    NamespaceApplication.Datetime.msInHour = 36e5;
    NamespaceApplication.Datetime.msInMinute = 6e4;

    /**
     * Return timestamp
     * @param date
     * @returns {number}
     */
    NamespaceApplication.Datetime.time = function (date) {
        return date instanceof Date ? date.getTime() : (new Date).getTime()
    };

    /**
     * Add days to some date
     * @param day           number of days. 0.04 - 1 hour, 0.5 - 12 hour, 1 - 1 day
     * @param startDate     type Date, start date
     * @returns {*}  type Date
     */
    NamespaceApplication.Datetime.addDays = function (day, startDate) {
        var date = startDate ? new Date(startDate) : new Date();
        date.setTime(date.getTime() + (day * 86400000));
        return date;
    };

    /**
     * Time between Dates
     * <pre>
     *     var from = new Date('2016-08-01 20:30');
     *     var to = new Date('2016-08-10 07:55');
     *     .Date.betweenDates(from, to); // Object { day: 8, hour: 11, minute: 25 }
     * </pre>
     * @param dateFrom
     * @param dateTo
     * @returns {{day: number, hour: number, minute: number}}
     */
    NamespaceApplication.Datetime.betweenDates = function (dateFrom, dateTo) {
        dateFrom = dateFrom || new Date();
        dateTo = dateTo || new Date();
        var diffMs = (dateTo - dateFrom),
            diffDays = Math.round(diffMs / 864e5),
            diffHrs = Math.round((diffMs % 864e5) / 36e5),
            diffMins = Math.round(((diffMs % 864e5) % 36e5) / 6e4);
        return {day: diffDays, hour: diffHrs, minute: diffMins};
    };

    /**
     * Convert date string to Date Object
     * yy - the year as a two-digit number ( 00 to 99 );
     * YY - the year as a four-digit number ( 1900-9999 );
     * mm - the month as a number with a leading zero ( 01 to 12 ) ( 1 to 12 );
     * dd - the day as a number with a leading zero ( 01 to 31 ) ( 1 to 31 );
     * hh HH - the hour ( 00 to 11 ) ( 00 to 23 ) ( 1 to 12 ) ( 0 to 23 );
     * ii - the minute as a number with a leading zero ( 00 to 59 );
     * ss - the second as a number with a leading zero ( 00 to 59 );
     * aa - displays am (for times from midnight until noon) and pm (for times from noon until midnight);
     *
     * .strToDate('12.05.2017 12:30:25', 'mm.dd.YY HH:ii:ss')
     * .strToDate('12/05/2017', 'mm/dd/YY')
     * .strToDate('12/5/2017', 'mm/dd/YY', true)
     * @param date
     * @param format
     * @param utc
     * @returns {Date}
     */
    NamespaceApplication.Datetime.strToDate = function (date, format, utc) {
        var set = [0, 0, 1, 0, 0, 0];
        var temp = date.match(/[a-zA-Z]+|[0-9]+/g);
        var mask = format.match(/[a-zA-Z]{2}/g);
        for (var i = 0; i < mask.length; i++) {
            switch (mask[i]) {
                case "dd":
                    set[2] = temp[i] || 1;
                    break;
                case "mm":
                    set[1] = (temp[i] || 1) - 1;
                    break;
                case "yy":
                    set[0] = temp[i] * 1 + (temp[i] > 50 ? 1900 : 2000);
                    break;
                case "hh":
                case "HH":
                    set[3] = temp[i] || 0;
                    break;
                case "ii":
                    set[4] = temp[i] || 0;
                    break;
                case "YY":
                    set[0] = temp[i] || 0;
                    break;
                case "aa":
                    set[3] = set[3] % 12 + ((temp[i] || '').toLowerCase() == 'am' ? 0 : 12);
                    break;
                case "ss":
                    set[5] = temp[i] || 0;
                    break;
                default:
                    break;
            }
        }
        if (utc) {
            return new Date(Date.UTC(set[0], set[1], set[2], set[3], set[4], set[5]));
        }
        return new Date(set[0], set[1], set[2], set[3], set[4], set[5]);
    };

    /** Expansion Base **/
    (function (prototype) {

        /**
         * Simple router
         *
         * @param uri
         * @param callback
         * @param hash
         * @param query
         * @returns {boolean}
         */
        prototype.router = function (uri, callback, hash, query) {
            uri = uri || '';
            var reg = new RegExp('^' + uri + '$', 'i'),
                path = NamespaceApplication.routePath.call(this, hash, query);

            if (reg.test(path)) {
                callback.call(this);
                return true;
            }
            return false;
        };

        /*assign static as instance methods*/
        prototype.loadJS = NamespaceApplication.loadJS;
        prototype.loadCSS = NamespaceApplication.loadCSS;
        prototype.domLoaded = NamespaceApplication.domLoaded;
        prototype.typeOf = NamespaceApplication.typeOf;
        prototype.typeOfStrict = NamespaceApplication.typeOfStrict;
        prototype.defined = NamespaceApplication.defined;
        prototype.isEmpty = NamespaceApplication.isEmpty;
        prototype.isNode = NamespaceApplication.isNode;
        prototype.extend = NamespaceApplication.extend;
        prototype.uri = NamespaceApplication.uri;
        prototype.redirect = NamespaceApplication.redirect;
        prototype.routePath = NamespaceApplication.routePath;
        prototype.search = NamespaceApplication.search;
        prototype.query = NamespaceApplication.query;
        prototype.queryAll = NamespaceApplication.queryAll;
        prototype.each = NamespaceApplication.each;
        prototype.eachParent = NamespaceApplication.eachParent;
        prototype.on = NamespaceApplication.on;
        prototype.css = NamespaceApplication.css;
        prototype.show = NamespaceApplication.show;
        prototype.hide = NamespaceApplication.hide;
        prototype.toggle = NamespaceApplication.toggle;
        prototype.attr = NamespaceApplication.attr;
        prototype.copy = NamespaceApplication.copy;
        prototype.inject = NamespaceApplication.inject;
        prototype.format = NamespaceApplication.format;
        prototype.ajax = NamespaceApplication.ajax;
        prototype.createElement = NamespaceApplication.createElement;
        prototype.node2str = NamespaceApplication.node2str;
        prototype.str2node = NamespaceApplication.str2node;
        prototype.position = NamespaceApplication.position;
        prototype.findObjects = NamespaceApplication.findObjects;
        prototype.findObject = NamespaceApplication.findObject;
        prototype.Timer = NamespaceApplication.Timer;
        prototype.Cookie = NamespaceApplication.Cookie;
        prototype.Storage = NamespaceApplication.Storage;
        prototype.Util = NamespaceApplication.Util;
        prototype.Datetime = NamespaceApplication.Datetime;

    })(NamespaceApplication.prototype);

    /**
     * Tries loading script init,  if it declared on attribute of data-init into script element
     */
    NamespaceApplication.domLoaded(function () {
        var script = NamespaceApplication.query('script[data-init]');
        if (script && script.getAttribute('data-init').length > 2) {
            NamespaceApplication.loadJS(script.getAttribute('data-init'));
        }
    });

    /**
     * Set script version. Property [read-only]
     */
    Object.defineProperty(NamespaceApplication, 'version', {
        enumerable: false, configurable: false, writable: false, value: '0.2.5'
    });

    window.NamespaceApplication = window.NSA = NamespaceApplication;

})(window)