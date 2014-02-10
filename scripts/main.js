(function(){
  var BUGID = location.search.match(/id=(\d+)/) ? RegExp.$1 : null;
  var BUGINFO = {};
  var DESCRIPTIONS = {
    "serversniff": "This website is using server side user agent detection to determine if a user is browsing using a desktop or mobile client. Unfortunately the site is not properly detecting the user agent string for mobile Firefox browsers. This is causing Firefox mobile browsers to be redirected to the desktop version of the website rather than mobile.",
    "clientsniff": "This website is using client side user agent detection to determine if a user is browsing using a desktop or mobile client. Unfortunately the site is not properly detecting the user agent string for mobile Firefox browsers. This is causing Firefox mobile browsers to be redirected to the desktop version of the website rather than mobile." 
  };
  var FIXES = {
    "serversniff": "The recommended way to detect Firefox and other mobile browsers is by searching for the string “Mobi”. This can be implemented through custom code or through a library/framework. If it is through a library/framework you can check that it is up to date or reach out to the vendor for more information. For more detailed information on user agent detection see the Mozilla Developer Network (https://developer.mozilla.org/en-US/docs/Browser_detection_using_the_user_agent#Mobile.2C_Tablet_or_Desktop).",
    "clientsniff": "The recommended way to detect Firefox and other mobile browsers is by searching for the string “Mobi”. For more detailed information on user agent detection see the Mozilla Developer Network (https://developer.mozilla.org/en-US/docs/Browser_detection_using_the_user_agent#Mobile.2C_Tablet_or_Desktop)."
  };

  function getAPIEndpoint(bug, comments) {
    var limit = (comments && comments.comments) ?
                "/comment" :
                "?include_fields=comments,url,summary,whiteboard,id";
    return "https://api-dev.bugzilla.mozilla.org/latest/bug/" + bug + limit;
  }

  function showResponse() {
    BUGINFO = JSON.parse(this.responseText);
    getBugLink();
    getDescription();
    getSuggestedFix();
  }

  function getBugInfo(url, hollaback) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Accept", "application/json");
    xhr.onload = hollaback;
    xhr.send();
  }


  function addPreText(id, text) {
    var pre = document.createElement("pre");
    var desc = document.getElementById(id);
    var text = document.createTextNode(text);
    desc.innerHTML = "";
    pre.appendChild(text);
    desc.appendChild(pre);
  }

  function getDefault(section, dict) {
    var whiteboard = BUGINFO.whiteboard;
    if (whiteboard && whiteboard.indexOf("[serversniff]") != -1) {
      addPreText(section, dict["serversniff"]);
    }
    if (whiteboard && whiteboard.indexOf("[clientsniff]") != -1) {
      addPreText(section, dict["clientsniff"]);
    }
  }

  function getTaggedComment(tag, callback) {
    // we have to make another request to the "/comment" API endpoint
    // until https://bugzilla.mozilla.org/show_bug.cgi?id=969630 is fixed.
    var commentUrl = getAPIEndpoint(BUGID, {comments: true});
    getBugInfo(commentUrl, function() {
      var response = JSON.parse(this.responseText);
      var comments = response.comments;
      // Loop from the bottom comment to the top, 
      // picking the last tag
      for (var i = comments.length - 1; i > 0; i--) {
        if (comments[i].tags && comments[i].tags.indexOf(tag) != -1) {
          addPreText(tag, comments[i].text);
          return;
        }
      }
      callback(comments);
    });
  }

  function getDescription() {
    getTaggedComment("description", function(comments) {
      // We didn't find a "description" tag. So let's take the first comment
      // (if it's nonempty)
      if (comments[0].text && comments[0].text.trim() !== "") {
        addPreText("description", comments[0].text);
      } else {
        // Otherwise let's show the pre-canned response.
        getDefault("description", DESCRIPTIONS);
      };
    });
  }

  function getSuggestedFix() {
    getTaggedComment("suggestedfix", function() {
      // We didn't have a suggestedfix tag, so just show the default.
      getDefault("suggestedfix", FIXES);
    });
  }

  function getBugLink() {
    var id = BUGINFO.id;
    var tmpl = [
      "Comment on the ",
      "<a href=\"https://bugzilla.mozilla.org/show_bug.cgi?id=",
        id, "\">bug ", id,
      "</a>.</p>"
    ];
    var link = document.getElementById("information");
    link.innerHTML = tmpl.join("");

    //kind of an ugly place to put this.
    var issueUrl = document.querySelector("#url .url");
    var link = document.createTextNode(BUGINFO.url);
    issueUrl.href = BUGINFO.url;
    issueUrl.appendChild(link);
    var domain = document.querySelector(".domain");
    var domainLink = document.createTextNode(issueUrl.hostname);
    domain.appendChild(domainLink);
  }

  //main entry method
  getBugInfo(getAPIEndpoint(BUGID), showResponse);
}());