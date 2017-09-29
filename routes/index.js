var express = require('express');
var router = express.Router();
var recom = require('./recommender');
var passport = require('passport');
var SpotifyStrategy = require('../node_modules/passport-spotify/lib/passport-spotify/index').Strategy;
var path = require('path');
var request = require('request');
var loginbase = "login-s8";

var appKey = 'a1d9f15f6ba54ef5aea0c5c4e19c0d2c';
var appSecret = 'b368bdb3003747ec861e62d3bf381ba0';

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session. Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing. However, since this example does not
//   have a database of user records, the complete spotify profile is serialized
//   and deserialized.
passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (obj, done) {
    done(null, obj);
});


// Use the SpotifyStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and spotify
//   profile), and invoke a callback with a user object.
passport.use(new SpotifyStrategy({
        clientID: appKey,
        clientSecret: appSecret,
        callbackURL: 'http://spotify-iui.eu-4.evennode.com/callback'
        //callbackURL: 'http://localhost:3000/callback'
    },
        function (accessToken, refreshToken, profile, done) {

        var token;

        // asynchronous verification, for effect...
        refresh = refreshToken
        token = accessToken;
        userid = profile.id
        console.log("first token", token)
        process.nextTick(function () {
            // To keep the example simple, the user's spotify profile is returned to
            // represent the logged-in user. In a typical application, you would want
            // to associate the spotify account with a user record in your database,
            // and return that user instead.
            return done(null, profile);
        });

        /*
         route for web API
         */

        console.log("second token", token)

        router.get('/getArtist',function (req,res) {
            var result = {}
            recom(token).getTopArtists().then(function (data) {
                result.items = data;
                res.json(result)})
        })

        router.get('/getTrack',function (req,res) {
            var result = {}
            recom(token).getTopTracks().then(function (data) {
                result.items = data;
                res.json(result)})
        })

        router.get('/getGenre',function (req,res) {
            var result = {}
            recom(token).getTopGenres().then(function (data) {
                result.items = data;
                res.json(result)})
        })


        router.get('/getRecom',function (req,res) {
            var result = {}
            recom(token).getRecommendation(req.query.limit,req.query.artistSeed,req.query.trackSeed,req.query.genreSeed,req.query.min_danceability, req.query.max_danceability,
                req.query.min_energy, req.query.max_energy, req.query.min_instrumentalness, req.query.max_instrumentalness, req.query.min_liveness, req.query.max_liveness,
                req.query.min_speechiness, req.query.max_speechiness, req.query.min_valence, req.query.max_valence).then(function (data) {
                result.items = data;
                res.json(result)})
        })

        router.get('/getRecomByArtist',function (req,res) {
            var result = {}
            recom(token).getRecommendationByArtist(req.query.limit,req.query.seed,req.query.min_danceability, req.query.max_danceability,
                req.query.min_energy, req.query.max_energy, req.query.min_instrumentalness, req.query.max_instrumentalness, req.query.min_liveness, req.query.max_liveness,
                req.query.min_speechiness, req.query.max_speechiness, req.query.min_valence, req.query.max_valence).then(function (data) {
                result.items = data;
                res.json(result)})
        })

        router.get('/getRecomByTrack',function (req,res) {
            var result = {}
            recom(token).getRecommendationByTrack(req.query.limit,req.query.seed,req.query.min_danceability, req.query.max_danceability,
                req.query.min_energy, req.query.max_energy, req.query.min_instrumentalness, req.query.max_instrumentalness, req.query.min_liveness, req.query.max_liveness,
                req.query.min_speechiness, req.query.max_speechiness, req.query.min_valence, req.query.max_valence).then(function (data) {
                result.items = data;
                res.json(result)})
        })

        router.get('/getRecomByGenre',function (req,res) {
            var result = {}
            recom(token).getRecommendationByGenre(req.query.limit,req.query.seed,req.query.min_danceability, req.query.max_danceability,
                req.query.min_energy, req.query.max_energy, req.query.min_instrumentalness, req.query.max_instrumentalness, req.query.min_liveness, req.query.max_liveness,
                req.query.min_speechiness, req.query.max_speechiness, req.query.min_valence, req.query.max_valence).then(function (data) {
                result.items = data;
                res.json(result)})
        })

        router.get('/getRecomByFollowSimilar',function (req,res) {
            var result = {}
            recom(token).getArtistRelatedArtists(req.query.id).then(function (data) {
                var selectedRelated = data.slice(0,5);
                result.similar = selectedRelated
                return selectedRelated
            }).then(function (data) {
                recom(token).getRecommendationByFollowedArtist(data,'US').then(function (data) {
                    result.items = data
                    res.json(result)
                })
            })
        })

        router.get('/getAccount',function (req,res) {
            recom(token).getRecommendationByGenre().then(function (data) {
                res.json(data)})
        })

        console.log("third token", token)

        router.get('/initiate', function (req, res) {
            //pass token to the webAPI used by recommender
            if (token) {

                console.log("fourth token", token)

                var reqData = {};
                reqData.token = token;

                console.log("fifth token", token)


                var getTopArtists =
                    recom(token).getTopArtists(50).then(function (data) {
                        reqData.artist = data;
                    });


                var getTracks =
                    recom(token).getTopTracks(50).then(function (data) {
                        reqData.track = data
                    });


                var getGenres =
                    recom(token).getTopGenres().then(function (data) {
                        reqData.genre = data
                    });

                Promise.all([getTopArtists, getTracks, getGenres]).then(function () {
                    res.json({
                        seed: reqData
                    })

                    console.log("sixth token", token)

                })
            }
            // else {
            //     reqData.user = req.user;
            //     res.json({
            //         seed: reqData
            //     })
            // }
        });

        // setInterval(function () {
        //     var refreshToken = function (refreshToken, clientID, clientSecret, next) {
        //         var auth = 'Basic ' +  (new Buffer(clientID + ':' + clientSecret).toString('base64'))
        //             , opts = {
        //             uri: 'https://accounts.spotify.com/api/token',
        //             method: 'POST',
        //             form: {
        //                 'grant_type': 'refresh_token',
        //                 'refresh_token': refreshToken
        //             },
        //             headers: {
        //                 'Authorization': auth
        //             },
        //             json:true
        //         }
        //         return request(opts, next)
        //     }
        //
        //     refreshToken(refresh, appKey, appSecret, function (err, res, body) {
        //         if (err) return
        //         console.log(refresh, appKey, appSecret, body)
        //         // var result = JSON.parse(body);
        //         token = body.access_token;
        //         reqData.token = body.access_token;
        //         //refresh = body.refresh_token;
        //     })
        // }, 1000*3500)
    }));



router.get('/s1',function (req,res) {
    res.render('s1',{ data: req.user})
})

router.get('/s2',function (req,res) {
    res.render('s2',{ data: req.user})
})

router.get('/s3',function (req,res) {
    res.render('s3',{ data: req.user})
})

router.get('/s4',function (req,res) {
    res.render('s4',{ data: req.user})
})

router.get('/s5',function (req,res) {
    res.render('s5',{ data: req.user})
})

router.get('/s6',function (req,res) {
    res.render('s6',{ data: req.user})
})

router.get('/s7',function (req,res) {
    res.render('s7',{ data: req.user})
})

router.get('/s8',function (req,res) {
    res.render('s8',{ data: req.user})
})

router.get('/login-s1',function (req,res) {
    loginbase = 'login-s1'
    res.render('login-s1')
})

router.get('/login-s2',function (req,res) {
    loginbase = 'login-s2'
    res.render('login-s2')
})

router.get('/login-s3',function (req,res) {
    loginbase = 'login-s3'
    res.render('login-s3')
})

router.get('/login-s4',function (req,res) {
    loginbase = 'login-s4'
    res.render('login-s4')
})

router.get('/login-s5',function (req,res) {
    loginbase = 'login-s5'
    res.render('login-s5')
})

router.get('/login-s6',function (req,res) {
    loginbase = 'login-s6'
    res.render('login-s6')
})

router.get('/login-s7',function (req,res) {
    loginbase = 'login-s7'
    res.render('login-s7')
})

router.get('/login-s8',function (req,res) {
    loginbase = 'login-s8'
    res.render('login-s8')
})

router.get('/account', ensureAuthenticated, function (req, res) {
    res.render('account', {user: req.user});
});


// GET /auth/spotify
//   Use passport.authenticate() as route middleware to authenticate the
//   request. The first step in spotify authentication will involve redirecting
//   the user to spotify.com. After authorization, spotify will redirect the user
//   back to this application at /auth/spotify/callback
router.get('/auth/spotify',
    passport.authenticate('spotify', {
        scope: ['user-read-email', 'user-read-private', 'user-top-read'],
        showDialog: true
    }),
    function (req, res) {
        // The request will be redirected to spotify for authentication, so this
        // function will not be called.
    });

// GET /auth/spotify/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request. If authentication fails, the user will be redirected back to the
//   login page. Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
router.get('/callback',
    passport.authenticate('spotify', {failureRedirect: '/'}),
    function (req, res) {
        if(loginbase=="login-s1")
            res.redirect('/s1');
        else if(loginbase=="login-s2")
            res.redirect('/s2');
        else if(loginbase=="login-s3")
            res.redirect('/s3');
        else if(loginbase=="login-s4")
            res.redirect('/s4');
        else if(loginbase=="login-s5")
            res.redirect('/s5');
        else if(loginbase=="login-s6")
            res.redirect('/s6');
        else if(loginbase=="login-s7")
            res.redirect('/s7');
        else if(loginbase=="login-s8")
            res.redirect('/s8');
    });

router.get('/logout', function (req, res) {
    req.logout();
    if(loginbase=="login-s1")
        res.redirect('/login-s1');
    else if(loginbase=="login-s2")
        res.redirect('/login-s2');
    else if(loginbase=="login-s3")
        res.redirect('/login-s3');
    else if(loginbase=="login-s4")
        res.redirect('/login-s4');
    else if(loginbase=="login-s5")
        res.redirect('/login-s5');
    else if(loginbase=="login-s6")
        res.redirect('/login-s6');
    else if(loginbase=="login-s7")
        res.redirect('/login-s7');
    else if(loginbase=="login-s8")
        res.redirect('/login-s8');
});

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed. Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

module.exports = router;