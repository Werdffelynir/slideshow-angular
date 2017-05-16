
var App = new NamespaceApplication();

// help funcs
App.Template = function () {
    var template = App.query('template');
    if (!template) throw Error('Not find node elements of templates');
    return App.search('[data-template]', 'data-template', template.content);
};

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
        App.ajax({method: 'POST', url: '/page/' + url + '.html', data: {}}, function (status, data) {
            console.log(url, status, data);

            if (status === 200) {
                __.iter ++;
                __.data[url] = data;
                if (__.iter === __.count) {
                    __.callback.call(null, __.data);
                }
            } else { throw Error('Error on loading page. Status: ' + status); }
        });
    };

    __.c = function () { };

    __.d = function () { };

    return __;
});

App.namespace('Controller', function () {
    /** @namespace App.Controller */
    var __ = {
        node: {},
        page: {},
        htmlData: null,
    };

    /** @namespace App.Controller.init */
    __.init = function () {

        App.PageLoader.loadPageFiles([

            'itis',
            'start',
            'semver',
            'stat',
            'avtonext',
            'ecommerce',
            'dev',
            'ang-plus',
            'ang-min'

        ], function (data) {
            __.page = data;
            __.htmlData = document.createDocumentFragment();

            __.htmlData.appendChild(App.createElement('section'), {}, __.page['itis']);
            __.htmlData.appendChild(App.createElement('section'), {}, __.page['start']);
            __.htmlData.appendChild(App.createElement('section'), {}, __.page['semver']);
            __.htmlData.appendChild(App.createElement('section'), {}, __.page['stat']);
            __.htmlData.appendChild(App.createElement('section'), {}, __.page['avtonext']);
            __.htmlData.appendChild(App.createElement('section'), {}, __.page['ecommerce']);
            __.htmlData.appendChild(App.createElement('section'), {}, __.page['dev']);
            __.htmlData.appendChild(App.createElement('section'), {}, __.page['ang-plus']);
            __.htmlData.appendChild(App.createElement('section'), {}, __.page['ang-min']);

            console.log('PAGE DATA: ', __.htmlData);
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

    var _data = [];
    if (App.Storage.get('tasks')) {
        _data = App.Storage.get('tasks');
    }

    App.Controller.init(_data);

});