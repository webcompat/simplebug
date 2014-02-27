var simplebug = simplebug || {};

simplebug.BugInfo = Backbone.Model.extend({
  urlRoot: function() {
    var url = "https://api-dev.bugzilla.mozilla.org/latest/bug/";
    var limit = "?include_fields=comments,url,summary,whiteboard,id";
    return url + this.get('bugID') + limit;
  },
  defaults: {
    domain: "http://www.example.com"
  },
  parse: function(response, options) {
    function getDomain(url) {
      var a = document.createElement('a');
      a.href = url;
      return a.hostname;
    }
    // stash whiteboard so BugComments model can peek at it
    simplebug.whiteboard = response.whiteboard || "";

    this.set({
      bugID:  response.id,
      url:    response.url,
      domain: getDomain(response.url)
    });
  }
});

simplebug.BugComments = Backbone.Model.extend({
  urlRoot: function() {
    var url = "https://api-dev.bugzilla.mozilla.org/latest/bug/";
    var limit = "/comment";
    return url + this.get('bugID') + limit;
  },
  defaults: {
    suggestedfix: "The recommended way to detect Firefox and other mobile browsers is by searching for the string “Mobi”. This can be implemented through custom code or through a library/framework. If it is through a library/framework you can check that it is up to date or reach out to the vendor for more information. Mozilla Developer Network has detailed <a href='https://developer.mozilla.org/en-US/docs/Browser_detection_using_the_user_agent#Mobile.2C_Tablet_or_Desktop'>information on user agent detection</a>."
  },
  description: function(type) {
      var type = type || "server or client";
      var copy = "This website is using " + type + " side user agent detection to determine if a user is browsing using a desktop or mobile client. Unfortunately the site is not properly detecting the user agent string for mobile Firefox browsers. This is causing Firefox mobile browsers to be redirected to the desktop version of the website rather than mobile."
      return copy;
  },
  parse: function(response, options) {
    this.sanitize(response.comments);
    this.set("firstComment", response.comments[0].raw_text.trim());
    this.getDescription(response);
    this.getSuggestedFix(response);
  },
  sanitize: function(commentsArray) {
    if (!$.isArray(commentsArray)) {
        return;
    }
    // clean up any codenames that make little sense to the outside world
    // this may need to be smarter in the future (i.e., ignore text found in
    // code ticks `device.fxos`, etc).
    $.each(commentsArray, function(index, item) {
        item.raw_text = item.raw_text.replace(/b2g/ig, 'Firefox OS')
                                     .replace(/fxos/ig, 'Firefox OS')
                                     .replace(/fennec/ig, 'Firefox for Android');
    });
  },
  getTaggedComment: function(tag, comments) {
    var result = false;
    // loop from the bottom up. in case there are multiple results --
    // we only want the latest one.
    for (var i = comments.length - 1; i >= 0; i--) {
      if (comments[i].tags && comments[i].tags.indexOf(tag) != -1) {
        result = [tag, comments[i].raw_text];
        break;
      }
    }
    // result is either a useful array, or `false`.
    return result;
  },
  getDefaultDescription: function() {
    if (simplebug.whiteboard && /(server|client)/.exec(simplebug.whiteboard)) {
      return this.description(RegExp.$1);
    }
  },
  getDescription: function(response) {
    // if any comment is tagged "description", use it.
    var descriptionTag = this.getTaggedComment("description", response.comments);
    if (descriptionTag) {
      this.set(descriptionTag[0], descriptionTag[1]);
    } else {
      // if first comment is tagged "simplebug-ignore", use default.
      // OR if the first comment is empty, use default.
      var ignoreTag = this.getTaggedComment("simplebug-ignore", response.comments);
      if (ignoreTag || this.get("firstComment") == "") {
        this.set("description", this.getDefaultDescription());
      } else {
        // Use first comment (which is the description in the Bugzilla UI)
        this.set("description", this.get("firstComment"));
      }
    }
  },
  getSuggestedFix: function(response){
    var suggestedfixTag = this.getTaggedComment("suggestedfix", response.comments);
    if (suggestedfixTag) {
        this.set(suggestedfixTag[0], suggestedfixTag[1]);
    } // otherwise it will use defaults.suggestedfix
  }
});

simplebug.HeaderView = Backbone.View.extend({
  tagName: 'h1',
  template: _.template($('#header-tmpl').html()),
  render: function() {
    this.$el.html(this.template(this.model.attributes));
    return this;
  }
});

simplebug.URLView = Backbone.View.extend({
  tagName: 'p',
  template: _.template($('#url-tmpl').html()),
  render: function() {
    this.$el.html(this.template(this.model.attributes));
    return this;
  }
});

simplebug.Description = Backbone.View.extend({
  template: _.template($('#description-tmpl').html()),
  render: function() {
    this.$el.html(this.template(this.model.attributes));
    return this;
  }
});

simplebug.SuggestedFix = Backbone.View.extend({
  template: _.template($('#suggestedfix-tmpl').html()),
  render: function() {
    this.$el.html(this.template(this.model.attributes));
    return this;
  }
});

simplebug.MoreInfo = Backbone.View.extend({
  tagName: 'p',
  template: _.template($('#information-tmpl').html()),
  render: function() {
    this.$el.html(this.template(this.model.attributes));
    return this;
  }
});

simplebug.MainView = Backbone.View.extend({
  el: $('#buginfo'),
  initialize: function(opts) {
    $('#main-loader').show();
    $('#index').hide();
    // set up models
    this.bugInfo = new simplebug.BugInfo({bugID: opts.bugID});
    this.bugComments = new simplebug.BugComments({bugID: opts.bugID});
    this.initSubViews();
    this.fetchModels();
  },
  initSubViews: function() {
    this.url = new simplebug.URLView({model: this.bugInfo});
    this.header = new simplebug.HeaderView({model: this.bugInfo});
    this.moreInfo = new simplebug.MoreInfo({model: this.bugInfo});
    this.desc = new simplebug.Description({model: this.bugComments});
    this.suggestedFix = new simplebug.SuggestedFix({model: this.bugComments});
  },
  fetchModels: function() {
    var self = this;
    this.bugInfo.fetch().success(function(){
      self.url.setElement(self.$('#url')).render();
      self.header.setElement(self.$('.general')).render();
      self.moreInfo.setElement(self.$('#information')).render();
      self.bugComments.fetch().success(function(){
        self.desc.setElement(self.$('#description')).render();
        self.suggestedFix.setElement(self.$('#suggestedfix')).render();
        $('#main-loader, #error').fadeOut(300);
        // render() the MainView.
        // Note, we can move this up above this fetch() if we want to show
        // the explanation before we add in the description and suggestedfix
        // That makes the page feel faster, maybe.
        self.render();
      }).error(function(){console.log("TODO: actual error handling >_>");});
    }).error(function(){$('#error').show();});


  },
  render: function() {
    this.$el.fadeIn();
  }
});

simplebug.Router = Backbone.Router.extend({
    routes: {
        "mozilla/:id":  "showBug",
        "*catchall": "index",
    },
    initialize: function () {},
    index: function() {
      // backwards compatibility with early version of simplebug
      // that only used a single id get param.
      var oldParam;
      if (oldParam = location.href.match(/\?id=(\d+)/)) {
        if (history.replaceState) history.replaceState({}, "", "index.html");
        this.navigate("mozilla/" + oldParam[1], {trigger: true});
      }
      $('#main-loader').hide();
    },
    showBug: function(id) {
      //need to validate id.
      document.title = "Web Compatibility Error Report for " + id;
      this.mainView = new simplebug.MainView({bugID: id});
    }
});
//clean this up so it's not a ton of globals.
/* Let's get this party started. */
jQuery.ajaxSetup({timeout: 7500});
var router = new simplebug.Router();
Backbone.history.start();