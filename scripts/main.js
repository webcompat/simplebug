(function(){
  var hasWhiteboard = false;
  var BUGID = location.search.slice(4);
  var COOLGUYTAG = "suggestedfix";
  var DESCRIPTIONS = {
    "serversniff": "This website is using server side user agent detection to determine if a user is browsing using a desktop or mobile client. Unfortunately the site is not properly detecting the user agent string for mobile Firefox browsers. This is causing Firefox mobile browsers to be redirected to the desktop version of the website rather than mobile.",
    "clientsniff": "This website is using client side user agent detection to determine if a user is browsing using a desktop or mobile client. Unfortunately the site is not properly detecting the user agent string for mobile Firefox browsers. This is causing Firefox mobile browsers to be redirected to the desktop version of the website rather than mobile." 
  };
  var FIXES = {
    "serversniff": "The recommended way to detect Firefox and other mobile browsers is by searching for the string “Mobi”. This can be implemented through custom code or through a library/framework. If it is through a library/framework you can check that it is up to date or reach out to the vendor for more information. For more detailed information on user agent detection see the Mozilla Developer Network (https://developer.mozilla.org/en-US/docs/Browser_detection_using_the_user_agent#Mobile.2C_Tablet_or_Desktop).",
    "clientsniff": "The recommended way to detect Firefox and other mobile browsers is by searching for the string “Mobi”. For more detailed information on user agent detection see the Mozilla Developer Network (https://developer.mozilla.org/en-US/docs/Browser_detection_using_the_user_agent#Mobile.2C_Tablet_or_Desktop)."
  };

  function getAPI(config) {
    var base = "https://api-dev.bugzilla.mozilla.org/latest/bug/" + BUGID;
    if (config && config.whiteboard) {
      return base;
    } else {
      return base + "/comment";
    }
  }

  function getDescription(comments) {
    var text = Array.isArray(comments) ? comments[0].raw_text : comments;
    if (text.trim() === "") {
      getWhiteboard();
    } else {
      tmpl = ["<pre>", text, "</pre>"];
      var desc = document.getElementById("description");
      desc.innerHTML = tmpl.join("");
      getSuggestedFix(comments);
    }
  }

  function getDefaultDescription(key) {
    return DESCRIPTIONS[key];
  }

  function getDefaultSuggestedFix(key) {
    return FIXES[key];
  }

  function getWhiteboard() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", getAPI({whiteboard: true}));
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Accept", "application/json");
    xhr.onload = function(){
      var response = JSON.parse(this.responseText);
      whiteboard = response.whiteboard;
      hasWhiteboard = true;
      if (whiteboard && whiteboard.indexOf("[serversniff]") != -1) {
        getDescription.call(null, getDefaultDescription("serversniff"));
        getSuggestedFix.call(null, getDefaultSuggestedFix("serversniff"));
      }

      if (whiteboard && whiteboard.indexOf("[clientsniff]") != -1) {
        getDescription.call(null, getDefaultDescription("clientsniff"));
        getSuggestedFix.call(null, getDefaultSuggestedFix("clientsniff"));
      }
    }
    xhr.send();
  }

  function getSuggestedFix(comments) {
    var tmpl, fix;
    var render = function(text) {
      tmpl = ["<pre>", text, "</pre>"];
      fix = document.getElementById("suggested-fix");
      fix.innerHTML = tmpl.join("");
    };

    if (Array.isArray(comments)) {
      // Loop from the bottom comment to the top, picking the "oldest" tag
      for (var i = comments.length - 1; i > 0; i--) {
        if (comments[i].tags && comments[i].tags.indexOf(COOLGUYTAG) != -1) {
          render(comments[i].text)
          break;
        }
      }
    }
    else {
      render(comments);
    }
  }

  function getBugLink(id) {
    var tmpl = [
      "Comment on the bug here ",
      "<a href=https://bugzilla.mozilla.org/show_bug.cgi?id=\"",
        id, "\">", id,
      "</a>.</p>"
    ];
    var link = document.getElementById("information");
    link.innerHTML = tmpl.join("");
  }

  function showResponse() {
    var response = JSON.parse(xhr.responseText);
    var comments = response.comments;
    getDescription(comments);
    getBugLink(BUGID);
  }

  var xhr = new XMLHttpRequest();
  xhr.open("GET", getAPI());
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.setRequestHeader("Accept", "application/json");
  xhr.onload = showResponse;
  xhr.send();
}());