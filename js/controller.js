var App = new NamespaceApplication();

// HELPERS FUNCTIONS

/**
 * <template hidden>
 *     <div data-template="head">...</div>
 *     <div data-template="menu">...</div>
 * </template>
 *
 * Template ()           // return an object with all templates
 * Template ('head')     // return context of templates by name 'head'
 *
 * @param name      String, attribute value 'data-template'
 * @returns {Element|boolean|Node|*}
 */
var Template = function (name) {
    var templateContent,
        parent = Template.parent,
        selector = Template.selector,
        templateElement = App.query(selector, App.createElement('div', null, parent));

    if (!templateElement)
        throw Error('Not find element. selector: "' + selector + '" name: "' + name + '"');

    templateContent = App.search('[data-template]', 'data-template', templateElement.content ? templateElement.content : templateElement);
    return name ? templateContent[name] : templateContent;
};
Template.parent = document;
Template.selector = 'template';


// Load source file for Template
App.ajax({url:'/template/common.html'}, function (status, response) {
    if (status === 200) {
        Template.parent = App.str2node(response);
    } else { throw Error ('Request to get /template/common.html is failed'); }
});


App.namespace('PageLoader', function () {

    /** @namespace App.PageLoader */
    var __ = {
        data: {},
        iter: 0,
        count: false,
        callback: false
    };

    /** @namespace App.PageLoader.loadPageFiles */
    __.loadPageFiles = function (files, callback) {
        __.count = files.length;
        __.callback = callback;

        files.map (__.load);
    };

    __.load = function (url) {
        var fullUrl = '/page/' + url + '.html';
        App.ajax({method: 'POST', url: fullUrl, data: {}}, function (status, data) {
            __.iter ++;

            if (status === 200) {
                __.data[url] = data;

                if (__.iter === __.count) {
                    __.callback.call(null, __.data);
                }
            } else {
                var errmsg = App.format('Can not load the page: {0}; Status: {1};', [fullUrl, status]);
                throw Error(errmsg);
            }
        });
    };

    return __;
});


App.namespace('Controller', function () {

    /** @namespace App.Controller */
    var __ = {
        node: {},
        pageData: {},
        renderData: document.createDocumentFragment()
    };

    /** @namespace App.Controller.init */
    __.init = function () {

        __.node['root'] = App.query('.slides[data-section="root"]');

        var loadPageNames = [

            'itis',
            'history',
            'semver',
            'stat',
            'avtonext',
            'ecommerce',
            'dev',
            'pluses',
            'minuses',
            'enemy'

        ];

        App.PageLoader.loadPageFiles(loadPageNames, function (data) {
            __.pageData = data;

            var addSection = function (name) {
                __.renderData.appendChild( App.createElement('section', null, (data[name] === undefined) ? 'DATA NOT FOUND' : data[name]) );
            };

            loadPageNames.map (function (item) {
                addSection ( item );
            });

            App.inject(__.node['root'],  __.renderData);

            App.Controller.initSlider();
        });
    };

    /** @namespace App.Controller.initSlider */
    __.initSlider = function () {
        // More info about config & dependencies:
        // - https://github.com/hakimel/reveal.js#configuration
        // - https://github.com/hakimel/reveal.js#dependencies
        Reveal.initialize({
            dependencies: [
                {src: 'plugin/markdown/marked.js'},
                {src: 'plugin/markdown/markdown.js'},
                {src: 'plugin/notes/notes.js', async: true},
                {src: 'plugin/highlight/highlight.js', async: true, callback: function () {hljs.initHighlightingOnLoad();}}
            ]
        });
    };

    __.a = function () { };

    __.b = function () { };

    __.c = function () { };

    __.d = function () { };

    return __;
});



















App.domLoaded(function () {

    var save_data = [];
    if (App.Storage.get('tasks')) {
        save_data = App.Storage.get('tasks');
    }

    App.Controller.init(save_data);

});