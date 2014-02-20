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

    this.set({
      bugID: response.id,
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
    description: "I am a default description.",
    suggestedfix: "I am a default suggestedfix.",
    description_ss: "This website is using server side user agent detection to determine if a user is browsing using a desktop or mobile client. Unfortunately the site is not properly detecting the user agent string for mobile Firefox browsers. This is causing Firefox mobile browsers to be redirected to the desktop version of the website rather than mobile.",
    description_cs: "This website is using client side user agent detection to determine if a user is browsing using a desktop or mobile client. Unfortunately the site is not properly detecting the user agent string for mobile Firefox browsers. This is causing Firefox mobile browsers to be redirected to the desktop version of the website rather than mobile.",
    suggestedfix_ss: "The recommended way to detect Firefox and other mobile browsers is by searching for the string “Mobi”. This can be implemented through custom code or through a library/framework. If it is through a library/framework you can check that it is up to date or reach out to the vendor for more information. Mozilla Developer Network has detailed <a href='https://developer.mozilla.org/en-US/docs/Browser_detection_using_the_user_agent#Mobile.2C_Tablet_or_Desktop'>information on user agent detection</a>.",
    suggestedfix_cs: "The recommended way to detect Firefox and other mobile browsers is by searching for the string “Mobi”. Mozilla Developer Network has detailed <a href='https://developer.mozilla.org/en-US/docs/Browser_detection_using_the_user_agent#Mobile.2C_Tablet_or_Desktop'>information on user agent detection</a>."
  },
  parse: function(response, options) {
    this.getDescription(response);
    this.getSuggestedFix(response);
  },
  getTaggedComment: function(tag, comments) {
    for (var i = comments.length - 1; i > 0; i--) {
      if (comments[i].tags && comments[i].tags.indexOf(tag) != -1) {
        return [tag, comments[i].text];
      }
    }
    // If we didn't find a tagged comment, return false.
    return false;
  },
  getDescription: function(response){
    // If any comment is tagged "description", use it. Otherwise,
    // If first comment is tagged "simplebug_ignore", use default. Otherwise,
    // If there is no first comment, use default. Otherwise,
    // Use first comment
    var descriptionTag = this.getTaggedComment("description", response.comments);
    this.set(descriptionTag[0], descriptionTag[1]);
  },
  getSuggestedFix: function(response){
    var tagged = this.getTaggedComment("suggestedfix", response.comments);
    this.set(tagged[0], tagged[1]);
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
  tagName: 'pre',
  template: _.template($('#description-tmpl').html()),
  render: function() {
    this.$el.html(this.template(this.model.attributes));
    return this;
  }
});

simplebug.SuggestedFix = Backbone.View.extend({
  tagName: 'pre',
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
  initialize: function() {
    $('#index').hide();
    // set up models
    this.bugInfo = new simplebug.BugInfo({bugID: this.options.bugID});
    this.bugComments = new simplebug.BugComments({bugID: this.options.bugID});
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

simplebug.Router = Backbone.Router.extend({
    routes: {
        "": "index",
        "moz/:id":  "showBug"
    },
    initialize: function () {},
    index: function() { /* nothing for now */},
    showBug: function(id) {
      //need to validate id.
      document.title = "Web Compatibility Error Report for " + id;
      this.mainView = new simplebug.MainView({bugID: id});
    }
});
//clean this up so it's not a ton of globals.
/* Let's get this party started. */
var router = new simplebug.Router();
Backbone.history.start();