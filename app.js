// rewrite all of the sql statements in the .js files and then put the ".." thing to actually be able to get the /???

const DEBUG = true;

//set up the server
const express = require("express");
const app = express();
const logger = require("morgan");
const dotenv = require("dotenv");
dotenv.config();
const helmet = require("helmet");
const db = require("./db/queries/init/db_pool");
const port = process.env.PORT || 8080;
const { auth } = require("express-openid-connect");
const { requiresAuth } = require("express-openid-connect");

app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));
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
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
};

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

// define middleware that logs all incoming requests
app.use((req, res, next) => {
    app.use(logger("dev"));
    // define middleware that serves static resources in the public directory
    app.use(express.static(__dirname + "/public"));
    next();
});

//define middleware that for each request, attaches auth info
//to the response, usable by EJS at render
app.use((req, res, next) => {
    res.locals.isLoggedIn = req.oidc.isAuthenticated();
    res.locals.user = req.oidc.user;

    next();
});

// req.isAuthenticated is provided from the auth router
app.get("/authtest", (req, res) => {
    res.send(req.oidc.isAuthenticated() ? "Logged in" : "Logged out");
});

app.get("/profile", requiresAuth(), (req, res) => {
    res.send(JSON.stringify(req.oidc.user));
});

// define a route for the default home page
app.get("/", (req, res) => {
    //console.log(`${req.method} ${req.url}`);
    res.render("index", {
        isLoggedIn: req.oidc.isAuthenticated(),
        user: req.oidc.user,
    });
});

const read_ingredient_sql = `SELECT 
    inventory_id, ingredient_name, ingredient_quantity, ingredient_price, category_name 
FROM 
    ingredient 
JOIN 
    categories 
ON 
    categories.category_id = ingredient.category_id 
WHERE 
    inventory_id = ?`;

app.get("/edit/:inventory_id", (req, res) => {
    console.log(
        "Route /edit/:inventory_id accessed. Inventory ID:",
        parseInt(req.params.inventory_id)
    );
    db.execute(
        read_ingredient_sql,
        [req.params.inventory_id],
        (error, results) => {
            if (error) {
                res.status(500).send(error); //internal server error
            } else if (results.length == 0) {
                res.status(404).send(
                    `No item found with id = "${parseInt(
                        req.params.inventory_id
                    )}"`
                );
            } else {
                res.render("edit", { ingredient: results }); //results[0]
            }
        }
    );
    //console.log(`${req.method} ${req.url}`);
    //res.render("/views/edit.html", results[0]);
});
const delete_ingredient_sql = `
DELETE FROM
    ingredient
WHERE
    inventory_id = ?`;

app.get("/edit/:inventory_id/delete", (req, res) => {
    db.execute(
        delete_ingredient_sql,
        [req.params.inventory_id],
        (error, results) => {
            if (error) {
                res.status(500).send(error); //internal server error
            } else if (results.length == 0) {
                res.status(404).send(
                    `No item found with id = "${parseInt(
                        req.params.inventory_id
                    )}"`
                );
            } else {
                res.redirect("/list");
            }
        }
    );
    //console.log(`${req.method} ${req.url}`);
    //res.render("/views/edit.html", results[0]);
});

const delete_category_sql = `
DELETE 
FROM
    categories
WHERE
    category_id = ?`;

app.get("/categories/:category_id/delete", (req, res) => {
    db.execute(
        delete_category_sql,
        [req.params.category_id],
        (error, results) => {
            if (error) {
                res.status(500).send(error); //internal server error
            } else if (results.length == 0) {
                res.status(404).send(
                    `No category found with id = "${parseInt(
                        req.params.category_id
                    )}"`
                );
            } else {
                res.redirect("/categories");
            }
        }
    );
    //console.log(`${req.method} ${req.url}`);
    //res.render("/views/edit.html", results[0]);
});
const update_ingredient_sql = `
UPDATE
    ingredient
SET
    ingredient_name = ?,
    ingredient_quantity = ?,
    ingredient_price = ?,
    ingredient_desc = ?
WHERE
    inventory_id = ?`;

app.post("/edit", (req, res) => {
    db.execute(
        update_ingredient_sql,
        [
            req.body.name,
            req.body.quantity,
            req.body.price,
            req.body.description,
            parseInt(req.body.inventory_id),
        ],
        (error, results) => {
            console.log(error);
            if (error) res.status(500).send(error); //Internal Server Error
            else {
                res.redirect(`/edit/${req.body.inventory_id}`);
            }
        }
    );
});

app.get("/transactions", (req, res) => {
    db.execute("select * from transactions", (error, results) => {
        if (error) {
            console.log(error);
        }
        console.log(results)
        res.render("transaction", { transactions: results });
    })
});

let listRouter = require("./routes/list.js");
app.use("/list", listRouter);
app.use("/edit", listRouter);

let categoriesRouter = require("./routes/categories.js");
app.use("/categories", categoriesRouter);

// start the server
app.listen(port, () => {
    console.log(
        `App server listening on ${port}. (Go to http://localhost:${port})`
    );
});
