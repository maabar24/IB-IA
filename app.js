// rewrite all of the sql statements in the .js files and then put the ".." thing to actually be able to get the /???


const DEBUG = true;

//set up the server
const express = require( "express" );
const app = express();
const logger = require("morgan");
const dotenv = require('dotenv');
dotenv.config();
const helmet = require("helmet");
const db = require("./db/queries/init/db_pool")
const port = process.env.PORT || 8080;
const { auth } = require('express-openid-connect');
const { requiresAuth } = require('express-openid-connect');


app.set("views", __dirname + "/views")
app.set('view engine', "ejs")
app.use(express.urlencoded({extended:false}));
// app.use(helmet( { 
//     contentSecurityPolicy: {
//     directives: {
//         defaultSrc: ["'self'"],
//         scriptSrc: ["'self'", "cdnjs.cloudfare.com"],
//     }
//     }}
// ));


const config = {
    authRequired: true,
    auth0Logout: true,
    secret: process.env.AUTH0_SECRET,
    baseURL: process.env.AUTH0_BASE_URL,
    clientID: process.env.AUTH0_CLIENT_ID,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL
  };
  
// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

// define middleware that logs all incoming requests
app.use((req, res, next) => {
    app.use(logger("dev"));
    // define middleware that serves static resources in the public directory
    app.use(express.static(__dirname + '/public'));    
    next();
} );

//define middleware that for each request, attaches auth info
//to the response, usable by EJS at render
app.use((req, res, next) => {
    res.locals.isLoggedIn = req.oidc.isAuthenticated()
    res.locals.user = req.oidc.user;

    next();
})

// req.isAuthenticated is provided from the auth router
app.get('/authtest', (req, res) => {
    res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
  });

app.get('/profile', requiresAuth(), (req, res) => {
    res.send(JSON.stringify(req.oidc.user));
  });

// define a route for the default home page
app.get( "/", ( req, res ) => {
    //console.log(`${req.method} ${req.url}`);
    res.render('index', {isLoggedIn : req.oidc.isAuthenticated(),
        user : req.oidc.user
    });
} );

app.get( "/list/edit/:inventory_id", ( req, res ) => {
    //console.log(`${req.method} ${req.url}`);
    res.render('edit', {isLoggedIn : req.oidc.isAuthenticated(),
        user : req.oidc.user
    });
} );


let listRouter = require("./routes/list.js");
app.use("/list", listRouter);
app.use("/list/edit", listRouter);

let categoriesRouter = require("./routes/categories.js");
app.use("/categories", categoriesRouter);


// start the server
app.listen( port, () => {
    console.log(`App server listening on ${ port }. (Go to http://localhost:${ port })` );
} );

