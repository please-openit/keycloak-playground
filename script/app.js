//var keycloak = Keycloak();

if(getParam("url") != null && getParam("realm") != null && getParam("client") != null){
    var url = getParam("url");
    var realm = getParam("realm");
    var client = getParam("client");
    var scopes = getParam("scopes");
    saveParameters();
}else{
    var url = window.localStorage.getItem("poit.url");
    var realm = window.localStorage.getItem("poit.realm");
    var client = window.localStorage.getItem("poit.client");
    var scopes = window.localStorage.getItem("poit.scopes");
}
$("#url").val(url);
$("#realm").val(realm);
$("#client").val(client);
$("#scopes").val(scopes);

var keycloak = new Keycloak({
    url: url,
    realm: realm,
    clientId: client
}); 

var initOptions = {
    responseMode: 'fragment',
    flow: 'standard',
    onload: 'check-sso',
    pkceMethod: 'S256'
};

keycloak.init(initOptions).then(function(authenticated) {
    setTokens(authenticated);
}).catch(function() {
    output('Init Error');
});

 keycloak.onAuthSuccess = function () {
    event('Auth Success');
};

function saveParameters(){
    window.localStorage.setItem("poit.url", $("#url").val());
    window.localStorage.setItem("poit.realm", $("#realm").val());
    window.localStorage.setItem("poit.client", $("#client").val());
    window.localStorage.setItem("poit.scopes", $("#scopes").val());
}

function initKeycloak(){
    window.localStorage.setItem("poit.url", $("#url").val());
    window.localStorage.setItem("poit.realm", $("#realm").val());
    window.localStorage.setItem("poit.client", $("#client").val());
    window.localStorage.setItem("poit.scopes", $("#scopes").val());
    location.reload();
}


function serviceCallSimple() {
    var oReq = new XMLHttpRequest();
    oReq.open('GET', document.getElementById('serviceUrl').value, true);
    oReq.setRequestHeader('Authorization', 'Bearer ' + keycloak.token);
    oReq.send();

    oReq.onload = function () {
        if (oReq.readyState === oReq.DONE) {
            if (oReq.status === 200) {
                document.getElementById('result').innerHTML = oReq.responseText
            }
            if (oReq.status === 403) {
                document.getElementById('result').innerHTML = "Not Authorized !"
            }
            if (oReq.status === 404) {
                document.getElementById('result').innerHTML = "unavailable"
            }
        }
    };
    oReq.onerror = function() {
        document.getElementById('result').innerHTML = "unavailable"
      };
}

function refreshToken(minValidity) {
    keycloak.updateToken(minValidity).success(function(refreshed) {
        if (refreshed) {
            //output(keycloak.tokenParsed);
        } else {
            output('Token not refreshed, valid for ' + Math.round(keycloak.tokenParsed.exp + keycloak.timeSkew - new Date().getTime() / 1000) + ' seconds');
        }
    }).error(function() {
        output('Failed to refresh token');
    });
}


function output(data) {
    if (typeof data === 'object') {
        data = JSON.stringify(data, null, '  ');
    }
   document.getElementById('output').innerHTML = data;
}

function event(event) {
   document.getElementById('output').innerHTML = event;
}



keycloak.onAuthError = function (errorData) {
    event("Auth Error: " + JSON.stringify(errorData) );
};

keycloak.onAuthRefreshSuccess = function () {
    event('Auth Refresh Success');
    document.getElementById('token64').innerHTML = keycloak.token;
   document.getElementById('idToken').innerHTML = JSON.stringify(keycloak.idTokenParsed,null, 4);
   document.getElementById('token').innerHTML = JSON.stringify(keycloak.tokenParsed,null, 4);

};

keycloak.onAuthRefreshError = function () {
    event('Auth Refresh Error');
};

keycloak.onAuthLogout = function () {
    document.getElementById("login").style.display = "block";
};

keycloak.onTokenExpired = function () {
    event('Access token expired.');
    if(document.getElementById("refresh").checked) {
      refreshToken();
    }
};


function startTimer(duration, display) {
    var timer = duration, minutes, seconds;
    setInterval(function () {
        minutes = parseInt(timer / 60, 10)
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        display.textContent = minutes + ":" + seconds;

        if (--timer < 0) {
            timer = duration;
        }
    }, 1000);
}



function setTokens(authenticated){
    document.getElementById('idToken').innerHTML = JSON.stringify(keycloak.idTokenParsed,null, 4);
    document.getElementById('token').innerHTML = JSON.stringify(keycloak.tokenParsed,null, 4); 
    document.getElementById('token64').innerHTML = keycloak.token;
    output('Init Success (' + (authenticated ? 'Authenticated' : 'Not Authenticated') + ')');
    var fiveMinutes = Math.round(keycloak.tokenParsed.exp + keycloak.timeSkew - new Date().getTime() / 1000);
        display = document.querySelector('#time');
     startTimer(fiveMinutes, display);
   if(!authenticated) {
     document.getElementById("logout").style.display = "none";
     document.getElementById("login").style.display = "";
     
   }
 else {
      document.getElementById("logout").style.display = "";
     document.getElementById("login").style.display = "none";
     
 }
}

function getParam(param){
    return new URLSearchParams(window.location.search).get(param);
}

function copy() {
    var input = "https://playground.please-open.it?url="+encodeURI($("#url").val())+"&realm="+encodeURI($("#realm").val())+"&client="+encodeURI($("#client").val())+"&scopes="+encodeURI($("#scopes").val());
    if (navigator.clipboard) {
        navigator.clipboard.writeText(input).then(() => {
          $("#copy").html("COPIED !");
        }, (err) => {
            $("#copy").html("ERROR !");
        });
      }
      $("#copy").html("ERROR !");
  }