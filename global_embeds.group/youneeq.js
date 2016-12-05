/**
 * @typedef YqResultsList
 * @type {object}
 */

/*
 * A YouneeqHandler instance is automatically created for each element with the ID or class "youneeq".
 * Parameters for each YouneeqHandler instance can be passed as data attributes on the containing element, and must be
 * prefixed with "data-yq-". Some parameters can have multiple values if they are separated by "|".
 * For example:
 *
 *     <div id="youneeq" data-yq-suggest-count="6" data-yq-observe="true" data-yq-content-id="12345"
 *         data-yq-features="google-analytics|gigya"></div>
 *
 * Recognized parameters include:
 * 
 * suggest-count: Number of articles to display.
 * suggest-function: Name of a function that gathers suggest parameters and returns it as an object.
 *     Either suggest-function or suggest-count must be defined in order for recommendations to be returned.
 * suggest-categories: Category filter for recommended articles. Accepts multiple values.
 * suggest-domains: Domain filter for recommended articles.
 *     Can be "true", "false", or a list of domains. Accepts multiple values.
 * suggest-date-start: Starting date for date filter.
 * suggest-date-end: Ending date for date filter.
 * suggest-panel-custom: Defines article metadata fields to be returned. Accepts multiple values.
 * suggest-sponsored-count: Number of sponsored articles to display.
 *
 * observe: Indicates that the article should be observed. Can be "true" or "false".
 * observe-function: Name of a function that gathers article metadata and returns it as an object.
 *     Either observe-function or observe and content-id must be defined in order for articles to be observed.
 * observe-title: Title of the article.
 * observe-image: Article image URL.
 * observe-description: Article description.
 * observe-date: Article publish date.
 * observe-categories: Article categories. Accepts multiple values.
 * observe-sponsored: Indicates that the article is sponsored content. Can be "true" or "false".
 *
 * content-id: Content ID of the current article.
 *     Content ID can also be provided through suggest-function or observe-function.
 * domain: Indicates the current site's domain name.
 * report-domain: Indicates the current site's reporting domain, for analytics.
 * alt-href: Page URL.
 * display-function: Name of a function that accepts "response" and "tags" parameters and generates recommendation HTML.
 * features: List of additional behaviours to be assigned to this instance.
 *     Recognized features include "google-analytics", "gigya", and "infinite-scroll". Accepts multiple values.
 * priority: Priority of the recommendation element. Elements with a higher priority will process first.
 *     Defaults to 0 if not set.
 */

/**
 * Represents a single Youneeq element.
 *
 * @class
 * @classdesc Processes recommendations and collects article metadata.
 *
 * @param {HTMLElement} box - HTML element that will be represented by this handler.
 */
function YouneeqHandler(box) {
    this.box = box;
    this.content_id = false;
    this.domain = window.location.hostname;
    this.report_domain = '';
    this.alt_href = '';
    this.content_type = 'article';
    this.suggest = false;
    this.observe = false;
    this.features = [];
    this.is_loading = false;

    YouneeqHandler.instances.push(
        this.init_all_data().request(['first', 'observe'])
    );
}

/**
 * Array of all youneeq box handlers present on the page.
 */
YouneeqHandler.instances = [];

YouneeqHandler.generate = function() {
    var youneeq_boxes = jQuery('#youneeq, .youneeq').get().sort(function(a, b) {
        var prio_a = jQuery(a).attr('data-yq-priority'),
            prio_b = jQuery(b).attr('data-yq-priority');

        prio_a = prio_a ? parseInt(prio_a) : 0;
        prio_b = prio_b ? parseInt(prio_b) : 0;

        if (prio_a > prio_b) {
            return 1;
        }
        else if (prio_a < prio_b) {
            return -1;
        }

        return 0;
    });

    if (youneeq_boxes.length) {
        jQuery.when(
            jQuery.getScript('//api.youneeq.ca/scripts/json2.js'),
            jQuery.getScript('//api.youneeq.ca/scripts/detect_timezone.js'),
            jQuery.getScript('//api.youneeq.ca/scripts/popper/tinybox.js'),
            jQuery.getScript('//api.youneeq.ca/scripts/popper/script.js')
        )
        .then(function() {
            jQuery.getScript('//api.youneeq.ca/app/yqmin', function() {
                Yq.onready(function() {
                    youneeq_boxes.forEach(function(e) {
                        var handler = new YouneeqHandler(e);
                        jQuery(e).data('youneeqHandler', handler);
                    });
                });
            });
        });
    }
};

YouneeqHandler.prototype = {
    /**
     * Send a Youneeq request.
     *
     * @returns {YouneeqHandler} This object.
     * @param {string[]} tags - List of tags specifying request context.
     */
    request: function(tags) {
        if (!this.is_loading) {
            this.is_loading = true;
            tags = tags || [];
            var data = {
                    'domain': this.domain,
                    'content_type': this.content_type
                },
                can_observe = false,
                request_method = window.yq_sent_request ? Yq.observeMin : Yq.observe;
            window.yq_sent_request = true;

            for (var i = 0; i < tags.length; i++) {
                if ('observe' == tags[i]) {
                    can_observe = true;
                }
            }

            if (this.content_id) {
                data.content_id = this.content_id;
            }
            if (this.report_domain) {
                data.report_domain = this.report_domain;
            }
            if (this.alt_href) {
                data.alt_href = this.alt_href;
            }

            if (this.suggest) {
                data.suggest = [this.suggest];
            }
            if (can_observe && this.observe) {
                data.observe = [this.observe];
            }

            request_method(data, this._populate(tags));
        }

        return this;
    },

    /**
     * Generate recommended article HTML and display it on the page.
     *
     * @param {YqResultsList} response - Returned data from Youneeq request.
     * @param {string[]} tags - List of tags specifying request context.
     */
    display: function(response, tags) {
        if (response && response.suggest && response.suggest.node) {
            var stories = response.suggest.node, story_num = stories.length, $box = jQuery(this.box);

            for (var i = 0; i < story_num; i++) {
                var s = {
                    'id': stories[i].id ? stories[i].id : '',
                    'title': stories[i].title ? stories[i].title : '',
                    'url': stories[i].url ? stories[i].url : '',
                    'img': stories[i].image ? stories[i].image : '',
                    'desc': stories[i].description ? stories[i].description : '',
                };

                $box.append(
                    '<div class="yq-article" data-yq-id="' + s.id + '" data-yq-title="' + s.title +
                    '" data-yq-url="' + s.url + '"><a href="' + s.url + '">' + (s.img ?
                    '<img class="yq-image" src="' + s.img + '" alt="' + s.title + '" />' : '') +
                    '<h3 class="yq-title">' + s.title + '</h3></a>' + (s.desc ? '<p class="yq-desc">' + s.desc +
                    '</p>' : '') + '</div>'
                );
            }
        }
    },

    /**
     * Call object initialization methods.
     *
     * @returns {YouneeqHandler} This object.
     */
    init_all_data: function() {
        var args = this.get_args();
        return this.init_request_data(args)
            .init_suggest_data(args)
            .init_observe_data(args)
            .init_method_overrides(args)
            .init_features(args)
            .init_handlers(args);
    },

    /**
     * Get element arguments from data attributes.
     *
     * @returns {object} Arguments object.
     */
    get_args: function() {
        var count = this.box.attributes.length, args = {};

        for (var i = 0; i < count; i++) {
            var arg_name = this.box.attributes[i].name;
            if (arg_name.substr(0, 8) == 'data-yq-') {
                args[arg_name.substr(8).replace(/-/g, '_')] = this.box.attributes[i].value;
            }
        }

        return args;
    },

    /**
     * Collect basic request data.
     *
     * @returns {YouneeqHandler} This object.
     * @param {object} args - Arguments object.
     */
    init_request_data: function(args) {
        if ('content_id' in args) {
            this.content_id = args.content_id;
        }

        if ('report_domain' in args) {
            this.report_domain = args.report_domain;
        }

        if ('alt_href' in args) {
            this.alt_href = args.alt_href;
        }
        else {
            og = jQuery('meta[property="og:url"]');
            this.alt_href = og.length ? og.attr('content') : '';
        }

        if ('content_type' in args) {
            this.content_type = args.content_type;
        }

        return this;
    },

    /**
     * Collect suggest request data.
     *
     * @returns {YouneeqHandler} This object.
     * @param {object} args - Arguments object.
     */
    init_suggest_data: function(args) {
        if (args.suggest_count || args.suggest_function) {
            var count = 0, data = {};

            if ('suggest_function' in args) {
                data = window[args.suggest_function]();
            }

            if ('name' in data) {
                this.content_id = data.name;
            }

            if ('count' in data) {
                count = data.count;
            }
            else if ('suggest_count' in args) {
                count = args.suggest_count;
            }

            if (count) {
                this.suggest = {
                    'type': 'node',
                    'count': '' + count,
                    'categories': [],
                    'is_panel_detailed': 'true',
                };

                if ('categories' in data) {
                    this.suggest.categories = data.categories;
                }
                if ('suggest_categories' in args) {
                    this.suggest.categories = args.suggest_categories.split('|');
                }

                if ('domains' in data) {
                    if (data.domains === true || data.domains === false) {
                        this.suggest.isAllClientDomains = 'true';
                    }
                    else {
                        this.suggest.domains = data.domains;
                    }
                }
                else if ('suggest_domains' in args) {
                    if (args.suggest_domains == 'true') {
                        this.suggest.isAllClientDomains = 'true';
                    }
                    else {
                        this.suggest.domains = args.suggest_domains.split('|');
                    }
                }
                else {
                    this.suggest.isAllClientDomains = 'false';
                }

                if ('date_start' in data) {
                    this.suggest.date_start = data.date_start;
                }
                else if ('suggest_date_start' in args) {
                    this.suggest.date_start = new Date(args.suggest_date_start).toISOString();
                }

                if ('date_end' in data) {
                    this.suggest.date_end = data.date_end;
                }
                else if ('suggest_date_end' in args) {
                    this.suggest.date_end = new Date(args.suggest_date_end).toISOString();
                }

                if ('panel_custom' in data) {
                    this.suggest.panel_custom = data.panel_custom;
                }
                else if ('suggest_panel_custom' in args) {
                    this.suggest.panel_custom = args.suggest_panel_custom.split('|');
                }
                
                if ('panel_type' in data) {
                    this.suggest.panel_type = data.panel_type;
                }
                else if ('suggest_panel_type' in args) {
                    this.suggest.panel_type = args.suggest_panel_type;
                }

                if ('sponsored_count' in data) {
                    this.suggest.sponsored_count = data.sponsored_count;
                }
                else if ('suggest_sponsored_count' in args) {
                    this.suggest.sponsored_count = args.suggest_sponsored_count;
                }
            }
        }

        return this;
    },

    /**
     * Collect observe request data.
     *
     * @returns {YouneeqHandler} This object.
     * @param {object} args - Arguments object.
     */
    init_observe_data: function(args) {
        if (args.observe || args.observe_function) {
            var title = '', og = '', data = {};

            if ('observe_function' in args) {
                data = window[args.observe_function]();
            }

            if ('name' in data) {
                this.content_id = data.name;
            }

            if ('title' in data) {
                title = data.title;
            }
            else if ('observe_title' in args) {
                title = args.observe_title;
            }
            else {
                og = jQuery('meta[property="og:title"]');
                title = og.length ? og.attr('content') : '';
            }

            if (this.content_id && title) {
                this.observe = {
                    'type': 'node',
                    'title': title
                };

                if ('url' in data) {
                    this.alt_href = data.url;
                }

                if ('image' in data) {
                    this.observe.image = data.image;
                }
                else if ('observe_image' in args) {
                    this.observe.image = args.observe_image;
                }
                else {
                    og = jQuery('meta[property="og:image"]');
                    this.observe.image = og.length ? og.attr('content') : '';
                }

                if ('description' in data) {
                    this.observe.description = data.description;
                }
                else if ('observe_description' in args) {
                    this.observe.description = args.observe_description;
                }
                else {
                    og = jQuery('meta[property="og:description"]');
                    this.observe.description = og.length ? og.attr('content') : '';
                }

                if ('create_date' in data) {
                    this.observe.create_date = data.create_date;
                }
                else if ('observe_date' in args) {
                    this.observe.create_date = new Date(args.observe_date).toISOString();
                }
                else {
                    og = jQuery('meta[property="article:published_time"]');
                    this.observe.create_date = og.length ? new Date(og.attr('content')).toISOString() : '';
                }

                if ('categories' in data) {
                    this.observe.categories = data.categories;
                }
                else if ('observe_categories' in args) {
                    this.observe.categories = args.observe_categories.split('|');
                }

                if ('content_type' in data) {
                    this.content_type = data.content_type;
                }
            }
        }

        return this;
    },

    /**
     * Set up method overrides.
     *
     * @returns {YouneeqHandler} This object.
     * @param {object} args - Arguments object.
     */
    init_method_overrides: function(args) {
        if (args.display_function) {
            this.display = window[args.display_function];
        }

        return this;
    },

    /**
     * Activate optional recommendation functionality.
     *
     * @returns {YouneeqHandler} This object.
     * @param {object} args - Arguments object.
     */
    init_features: function(args) {
        if (args.features) {
            this.features = args.features.split('|');
        }

        return this;
    },

    /**
     * Set up event handlers.
     *
     * @returns {YouneeqHandler} This object.
     * @param {object} args - Arguments object.
     */
    init_handlers: function(args) {
        var $box = jQuery(this.box)
            .on('yq:populateAttach', this.attach_click_tracking);

        for (var i = 0; i < this.features.length; i++) {
            switch (this.features[i]) {
                case 'google-analytics':
                    $box.on('yq:populateAttach', this.attach_ga_tracking);
                    break;
                case 'gigya':
                    this.send_gigya_data();
                    break;
                case 'infinite-scroll':
                    this.setup_infinite_scroll();
                    break;
            }
        }

        return this;
    },

    /**
     * Attaches infinite scroll handler.
     *
     * @returns {YouneeqHandler} This object.
     */
    setup_infinite_scroll: function() {
        var page = jQuery(window);
        page.on('scroll.yq', function() {
            if ((jQuery(document).height() - page.scrollTop() - page.height()) < 300) {
                this.request(['scroll']);
            }
        });

        return this;
    },

    /**
     * Attaches click tracking to each displayed article.
     *
     * @param {object} event - jQuery event object.
     * @param {YqResultsList} response - Returned data from Youneeq request.
     * @param {string[]} tags - List of tags specifying request context.
     */
    attach_click_tracking: function(event, response, tags) {
        jQuery('.yq-article', this).each(function() {
            var yq_id = jQuery(this).data('yqId'),
                yq_title = Yq.titleTrim(jQuery(this).data('yqTitle')),
                yq_url = jQuery(this).data('yqUrl');
            jQuery('a', this).on('mousedown.yq', function() {
                Yq.yq_panel_click(yq_url, yq_title, yq_id);
            });
        });
    },

    /**
     * Attaches Google Analytics tracking to each displayed article.
     *
     * @param {object} event - jQuery event object.
     * @param {YqResultsList} response - Returned data from Youneeq request.
     * @param {string[]} tags - List of tags specifying request context.
     */
    attach_ga_tracking: function(event, response, tags) {
        jQuery('.yq-article', this).each(function() {
            var yq_url = jQuery(this).data('yqUrl');
            jQuery('a', this).on('mousedown.yq', function() {
                ga('send', 'event', 'Articles', 'Youneeq View', yq_url);
            });
        });
    },

    /**
     * Sends Gigya user profile to the server.
     */
    send_gigya_data: function() {
        gigya.socialize.getUserInfo({
            callback: function(response){
                if (response.errorCode == 0) {
                    user_obj = response['user'];
                    Yq.observeMin({
                        'gigya': user_obj
                    }, on_yq_suggest);
                }
                else {
                    user_obj = {};
                }
            }
        });
    },

    /**
     * Return a function that triggers populate events and displays recommendations.
     *
     * @returns {function}
     * @param {string[]} tags - List of tags specifying request context.
     */
    _populate: function(tags) {
        var self = this;
        return function(response) {
            self.is_loading = false;
            var $box = jQuery(self.box);

            $box.trigger('yq:populatePrepare', [response, tags]);
            self.display(response, tags);
            $box.trigger('yq:populateAttach', [response, tags]);
        };
    },
};

jQuery(document).ready(function($) {
    YouneeqHandler.generate();
});
