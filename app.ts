import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import querystring from 'querystring';
import cookieParser from 'cookie-parser';
import axios, { AxiosRequestConfig } from 'axios';

import { generateRandomString } from './helpers';

dotenv.config();

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;

const AUTHORIZE = 'https://accounts.spotify.com/authorize';
const TOKEN = 'https://accounts.spotify.com/api/token';
const ME = 'https://api.spotify.com/v1/me';

const stateKey = 'spotify_auth_state';

const app = express();

app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser());

app.get('/login', ((req, res) => {
    const state = generateRandomString(16);
    res.cookie(stateKey, state);

    const scope = 'user-read-private user-read-email user-library-read user-top-read';
    res.redirect(AUTHORIZE + '?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state
        }));
}));

app.get('/callback', async (req, res) => {
    const code = req.query.code ?? null;
    const state = req.query.state ?? null;
    const storedState = req.cookies ? req.cookies[stateKey] : null;

    if(state === null || state !== storedState) {
        res.redirect('/#' + 
            querystring.stringify({
                error: 'state_mismatch'
            }));
    } else {
        res.clearCookie(stateKey);
        const authOptions: AxiosRequestConfig = {
            method: 'post',
            url: TOKEN,
            params: {
                code: code,
                redirect_uri: redirect_uri,
                grant_type: 'authorization_code'
            },
            headers: {
                'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))
            }
        };
        
        const [access_token, refresh_token] = await axios(authOptions)
            .then((res) => {
                const access_token = res.data.access_token as string;
                const refresh_token = res.data.refresh_token as string;
                return [access_token, refresh_token];
            })
            .catch((err) => {
                res.redirect('/#' + 
                    querystring.stringify({
                        error: 'invalid_token'
                    }));
                    return [null];
            })

        const profileOptions: AxiosRequestConfig = {
            url: ME,
            method: 'get',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + access_token
            }
        }    
        const [name, picture] = await axios(profileOptions)
            .then(response => {
                let data = response.data;
                return [data.display_name as string, data.images[0].url as string]
        });

        res.redirect('/?' + 
            querystring.stringify({
                access_token: access_token,
                refresh_token:refresh_token,
                display_name:name,
                picture:picture
            }));
    }
});

const port = parseInt(process.env.PORT ?? '3000');
console.log(`Listening on ${port}`);
app.listen(port);