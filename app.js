var redirect_uri = 'http://127.0.0.1:5500/Luis-music-tracker/index.html';
var client_id = '7695d2ea0520498fa93a5c3c364e022a'; 
var client_secret = '5f34504d97894b6bad62d1bfc916af51';

var access_token = null;
var refresh_token = null;

const AUTHORIZE = 'https://accounts.spotify.com/authorize';
const TOKEN = 'https://accounts.spotify.com/api/token';
const PLAYLISTS = 'https://api.spotify.com/v1/me/playlists';
const ARTISTS = 'https://api.spotify.com/v1/me/top/artists';
const TRACKS = 'https://api.spotify.com/v1/me/top/tracks';
const DEVICES = 'https://api.spotify.com/v1/me/player/devices';

function onPageLoad(){
    if(window.location.search.length > 0){
        handleRedirect();
    }
}

function requestAuthorization(){
    localStorage.setItem("client_id", client_id);
    localStorage.setItem("client_secret", client_secret);

    let url = AUTHORIZE;
    url += "?client_id=" + client_id;
    url += "&response_type=code";
    url += "&redirect_uri=" + encodeURI(redirect_uri);
    url += "&show_dialog=true";
    url += "&scope=user-read-private user-read-email user-library-read user-top-read";
    window.location.href = url; // Show Spotify's authorization screen
}

function handleRedirect(){
    let code = getCode();   
    fetchAccessToken(code);
    window.history.pushState("", "",redirect_uri);
}

function getCode(){
    let code = null;
    const queryString = window.location.search;
    if(queryString.length > 0){
        const urlParams = new URLSearchParams(queryString);
        code = urlParams.get('code');
    }
    return code;
}

function fetchAccessToken(code){
    let body = "grant_type=authorization_code";
    body += "&code=" + code; 
    body += "&redirect_uri=" + encodeURI(redirect_uri);
    body += "&client_id=" + client_id;
    body += "&client_secret=" + client_secret;
    callAuthorizationApi(body);
}

function callAuthorizationApi(body){
    let xhr = new XMLHttpRequest();
    xhr.open("POST", TOKEN, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('Authorization', 'Basic ' + btoa(client_id + ":" + client_secret));
    xhr.send(body);
    xhr.onload = handleAuthorizationResponse;
}

function handleAuthorizationResponse(){
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        console.log(data);
        var data = JSON.parse(this.responseText);
        if ( data.access_token != undefined ){
            access_token = data.access_token;
            localStorage.setItem("access_token", access_token);
        }
        if ( data.refresh_token  != undefined ){
            refresh_token = data.refresh_token;
            localStorage.setItem("refresh_token", refresh_token);
        }
        onPageLoad();
    }
    else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function callApi(method, url, body, callback){
    let xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
    xhr.send(body);
    xhr.onload = callback;
}

function getTopArtists(){
    callApi("GET", ARTISTS, null, handleArtistsResponse);
}

function handleArtistsResponse(){
    if(this.status == 200){
        var data = JSON.parse(this.responseText);
        console.log(data);
        clearListItems();
        data.items.forEach(item => addArtist(item));
    }
    else if(this.status == 401){

    }
    else{
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function addArtist(item){
    let node = document.createElement('li');
    node.value = item.id;
    node.innerHTML = item.name;
    document.getElementById("list").appendChild(node);
}

function getTopTracks(){
    callApi("GET", TRACKS, null, handleTracksResponse);
}

function handleTracksResponse(){
    console.log(`code received: ${this.status}`);
    if(this.status == 200){
        var data = JSON.parse(this.responseText);
        console.log(data);
        clearListItems();
        data.items.forEach(item => addTrack(item));
    }
    else if(this.status == 401){

    }
    else{
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function addTrack(item){
    let node = document.createElement('li');
    node.value = item.id;
    console.log(item.artists[0].name);
    node.innerHTML = `${item.name} - ${item.artists[0].name}`;
    document.getElementById("list").appendChild(node);
}

function clearListItems(){
    let node = document.getElementById("list");
    while(node.firstChild){
        node.removeChild(node.firstChild);
    }
}

function emptyLocalStorage(){
    localStorage.clear();
}
