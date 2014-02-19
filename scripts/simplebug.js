var BugInfo = Backbone.Model.extend({
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

    this.set({
      bugID: response.id,
      url:    response.url,
      domain: getDomain(response.url)
    });
  }
});

var BugComments = Backbone.Model.extend({
  urlRoot: function() {
    var url = "https://api-dev.bugzilla.mozilla.org/latest/bug/";
    var limit = "/comment";
    return url + this.get('bugID') + limit;
  },
  defaults: {
    description: "Blah blah, this problem is blah blah blah etc.",
    suggestedFix: "Here is how you should fix this."
  },
  parse: function(response, options) {
    console.log(response);
  }
});

var HeaderView = Backbone.View.extend({
  tagName: 'h1',
  template: _.template($('#header-tmpl').html()),
  render: function() {
    this.$el.html(this.template(this.model.attributes));
    return this;
  }
});

var URLView = Backbone.View.extend({
  tagName: 'p',
  template: _.template($('#url-tmpl').html()),
  render: function() {
    this.$el.html(this.template(this.model.attributes));
    return this;
  }
});

var Description = Backbone.View.extend({
  tagName: 'pre',
  template: _.template($('#description-tmpl').html()),
  render: function() {
    this.$el.html(this.template(this.model.attributes));
    return this;
  }
});

var SuggestedFix = Backbone.View.extend({
  tagName: 'pre',
  template: _.template($('#suggestedfix-tmpl').html()),
  render: function() {
    this.$el.html(this.template(this.model.attributes));
    return this;
  }
});

var MoreInfo = Backbone.View.extend({
  tagName: 'p',
  template: _.template($('#information-tmpl').html()),
  render: function() {
    this.$el.html(this.template(this.model.attributes));
    return this;
  }
});

var MainView = Backbone.View.extend({
  el: $('#buginfo'),
  initialize: function() {
    $('#index').hide();
    // set up models
    this.bugInfo = new BugInfo({bugID: this.options.bugID});
    this.bugComments = new BugComments({bugID: this.options.bugID});
    this.initSubViews();
    this.fetchModels();
  },
  initSubViews: function() {
    this.url = new URLView({model: this.bugInfo});
    this.header = new HeaderView({model: this.bugInfo});
    this.moreInfo = new MoreInfo({model: this.bugInfo});
    this.desc = new Description({model: this.bugComments});
    this.suggestedFix = new SuggestedFix({model: this.bugComments});
  },
  fetchModels: function() {
    var self = this;
    this.bugInfo.fetch().complete(function(){
      self.url.setElement(self.$('#url')).render();
      self.header.setElement(self.$('.general')).render();
      self.moreInfo.setElement(self.$('#information')).render();
      // render() the MainView since we have at least the basic info.
      self.render();
    }).error(function(){console.log("TODO: actual error handling >_>");});

    this.bugComments.fetch().complete(function(){
      self.desc.setElement(self.$('#description')).render();
      self.suggestedFix.setElement(self.$('#suggestedfix')).render();
    }).error(function(){console.log("TODO: actual error handling >_>");});
  },
  render: function() {
    this.$el.show();
  }
});

var SimpleBug = Backbone.Router.extend({
    routes: {
        "": "index",
        "moz/:id":  "showBug"
    },
    initialize: function () {},
    index: function() { /* nothing for now */},
    showBug: function(id) {
      //need to validate id.
      document.title = "Web Compatibility Error Report for " + id;
      this.mainView = new MainView({bugID: id});
    }
});
//clean this up so it's not a ton of globals.
/* Let's get this party started. */
var router = new SimpleBug();
Backbone.history.start();