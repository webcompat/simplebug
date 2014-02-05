(function(){
  var BUGID = location.search.slice(4);
  var COOLGUYTAG = "suggestedfix";

  function getAPI() {
    return "https://api-dev.bugzilla.mozilla.org/latest/bug/" + BUGID + "/comment";
  }

  function getDescription(text) {
    var tmpl = ["<p><pre>", text, "</pre></p>"];
    var desc = document.getElementById("description");
    desc.innerHTML = tmpl.join("");
  }

  function getSuggestedFix(comments) {
    var tmpl, fix;

    for (var i = 0; i < comments.length; i++) {
      if (comments[i].tags && comments[i].tags.indexOf(COOLGUYTAG) != -1) {
        tmpl = ["<p><pre>", comments[i].text, "</pre></p>"];
        fix = document.getElementById("suggested-fix");
        fix.innerHTML = tmpl.join("");
        break;
      }
    }
  }

  function getBugLink(id) {
    var tmpl = [
      "Comment on the bug here ",
      "<a href=https://bugzilla.mozilla.org/show_bug.cgi?id=\"",
        id, "\">", id,
      "</a>.</p>"
    ];
    var link = document.getElementById("bug-link");
    link.innerHTML = tmpl.join("");
  }

  function showResponse() {
    var response = JSON.parse(xhr.responseText);
    var comments = response.comments;
    getDescription(comments[0].raw_text);
    getSuggestedFix(comments);
    getBugLink(BUGID);
  }

  var xhr = new XMLHttpRequest();
  xhr.open("GET", getAPI());
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.setRequestHeader("Accept", "application/json");
  xhr.onload = showResponse;
  xhr.send();
}());