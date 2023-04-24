const DEBUG = true;

//set up the server
const express = require( "express" );
const app = express();
const logger = require("morgan");
const dotenv = require('dotenv');
dotenv.config();
const helmet = require("helmet");
const db = require("./db/db_pool")
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


const read_stuff_all_sql = " SELECT id, item, quantity, price, categoryName FROM stuff JOIN category ON stuff.categoryId = category.categoryId WHERE userid = ?"
// define a route for the stuff inventory page
app.get( "/list", ( req, res ) => {
    db.execute(read_stuff_all_sql, [req.oidc.user.email], (error, results) => {
        if (DEBUG)
        console.log(error ? error : results);
        if (error) {
            res.status(500).send(error); //internal server error
        }
        else {
            db.execute(read_categories_all_sql, (error2, results2) => {
                if (DEBUG)
                    console.log(error2 ? error2 : results2);
                if (error2)
                    res.status(500).send(error2); //internal server error
                else {
                    let data = {inventory: results, category: results2};
                    res.render('list', data);
                }
            });
            
        }
    })
    //console.log(`${req.method} ${req.url}`);
    //res.render("/views/list.html", results[0]);
} );




const read_item_sql = "SELECT id, item, quantity, price, categoryName FROM stuff JOIN category ON category.categoryId = stuff.categoryId WHERE id = ? AND userid = ?"
// define a route for the item detail page
app.get( "/list/edit/:id", ( req, res ) => {
    db.execute(read_item_sql, [req.params.id, req.oidc.user.email], (error, results) => {
        if (error) {
            res.status(500).send(error); //internal server error
        } 
        else if (results.length == 0){
            res.status(404).send(`No item found with id = "${req.params.id}"`)
        }
        else {
            //res.send(results[0]);
            res.render('edit', results[0]); //results[0]
        }
    
    });
    //console.log(`${req.method} ${req.url}`);
    //res.render("/views/edit.html", results[0]);
} );

const delete_item_sql = `
    DELETE 
    FROM
        stuff
    WHERE
        id = ?
        AND
        userid = ?`
app.get("/list/edit/:id/delete", ( req, res ) => {
    db.execute(delete_item_sql, [req.params.id, req.oidc.user.email], (error, results) => {
        if (error)
            res.status(500).send(error); //Internal Server Error
        else {
            res.redirect("/list");
        }
    });
})

const create_item_sql = `
    INSERT INTO stuff
        (item, price, quantity, categoryName, userid)
    VALUES
        (?, ?, ?, ?, ?)`
app.post("/list", ( req, res ) => {
    db.execute(create_item_sql, [req.body.name, req.body.price, req.body.quantity, req.body.category, req.oidc.user.email], (error, results) => {
        if (error)
            res.status(500).send(error); //Internal Server Error
        else {
            //results.insertId has the primary key (id) of the newly inserted element.
            res.redirect(`/list/edit/${results.insertId}`);
        }
    });
})


const update_item_sql = `
    UPDATE
        stuff
    SET
        item = ?,
        quantity = ?,
        price = ?
        category = ?
    WHERE
        id = ?
        AND
        userid = ?`
app.post("/list/edit/:id", ( req, res ) => {
    db.execute(update_item_sql, [req.body.name, req.body.quantity, req.body.price, req.body.category, req.params.id, req.oidc.user.email], (error, results) => {
        if (error)
            res.status(500).send(error); //Internal Server Error
        else {
            res.redirect(`/list/edit/${req.params.id}`);
        }
    });
})

const read_categories_all_sql = `
    SELECT 
        category.categoryId, categoryName
    FROM
        category
`
app.get('/categories', requiresAuth(), (req, res) => {
    db.execute(read_categories_all_sql, [req.oidc.user.sub], (error, results) => {
        if (DEBUG)
            console.log(error ? error : results);
        if (error)
            res.status(500).send(error); //Internal Server Error
        else {
            res.render("categories", {categoryList: results});
        }
    });
});

const create_category_sql = `
    INSERT INTO category
        (categoryName)
    VALUES
        (?)
`
app.post('/categories', requiresAuth(), (req, res) => {
    db.execute(create_category_sql, [req.body.categoryName, req.oidc.user.sub], (error, results) =>{
        if (DEBUG)
            console.log(error ? error : results);
        if (error)
            res.status(500).send(error); //Internal Server Error
        else {
            res.redirect("/categories");
        }
    });
});

const delete_category_sql = `
    DELETE 
    FROM
        category
    WHERE
        categoryId = ?
`
app.get("/categories/:id/delete", (req, res) => {
    db.execute(delete_category_sql, [req.params.id, req.oidc.user.sub], (error, results) => {
        if (DEBUG)
            console.log(error ? error : results);
        if (error){
            //special error if any assignments associated with the subject
            if (error.code == "ER_ROW_IS_REFERENCED_2"){
                res.status(500).send("There are foods still associated with that category!")
            }
            else 
                res.status(500).send(error); //Internal Server Error
        }
        else {
            res.redirect("/categories");
        }
    })
})




// start the server
app.listen( port, () => {
    console.log(`App server listening on ${ port }. (Go to http://localhost:${ port })` );
} );