let access_token = null;
let refresh_token = null;
let display_name = '';
let picture = '';
let IFrame = null;

const ARTISTS = 'https://api.spotify.com/v1/me/top/artists';
const TRACKS = 'https://api.spotify.com/v1/me/top/tracks';

const onPageLoad = () => {
    if(window.location.search.length > 0){
        getTokens();
        updateHeader();
    }else {
        let login = document.getElementById('loginBtn');
        login.classList.remove('hidden');
    }
}

window.onSpotifyIframeApiReady = (IFrameAPI) => {
    IFrame = IFrameAPI;
};

const updateHeader = () => {
    let loggedInfo = document.getElementById('loggedInfo');
    loggedInfo.classList.remove('hidden');

    let loginButton = document.getElementById('loginBtn');
    loginButton.classList.add('hidden');

    let pfp = document.getElementById('pfp');
    pfp.src = picture;

    let loggedAs = document.getElementById('loggedAs');
    loggedAs.innerText = 'Logged as'

    let name = document.getElementById('name');
    name.innerText = `${display_name}`;

    let options = document.getElementById('options');
    options.classList.remove('hidden');
}

const getTokens = () => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    access_token = urlParams.get('access_token');
    refresh_token = urlParams.get('refresh_token');
    display_name = urlParams.get('display_name');
    picture = urlParams.get('picture');
}

const callApi = async (url) => {
    clearList();
    config = {
        url: url,
        method: 'get',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + access_token
        },
        params: {
            limit: 10,
        }
    }

    const items = await axios(config)
        .then(res => {
            return res.data.items;
    });

    return items;
}

const getTracks = async () => {
    const tracks = await callApi(TRACKS);
    tracks.forEach(item => addItem(item));    
}

const getArtists = async () => {
    const artists = await callApi(ARTISTS);
    artists.forEach(item => addItem(item));
}

const addItem = (item) => {
    let embeds = document.getElementById('embeds');
    let embedded = document.createElement(
        tagName='div',
        {id: 'embed-iframe'}
    )
    embeds.appendChild(embedded);
    let options = {
        uri: item.uri,
        width: '400',
        height: '100'
    };
    let callback = (EmbedController) => {};
    IFrame.createController(embedded, options, callback);
}

const clearList = () => {
    let embeds = document.getElementById('embeds');
    while(embeds.firstChild) {
        embeds.firstChild.remove();
    }
}