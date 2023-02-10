//set up the server
const express = require( "express" );
const app = express();
const port = 8080;
const logger = require("morgan");
const db = require("./db/db_connection")
app.set("views", __dirname + "/views")
app.set('view engine', "ejs")
app.use( express.urlencoded({ extended: false }) );

// define middleware that logs all incoming requests
app.use((req, res, next) => {
    app.use(logger("dev"));
    // define middleware that serves static resources in the public directory
    app.use(express.static(__dirname + '/public'));    
    next();
} );

// define a route for the default home page
app.get( "/", ( req, res ) => {
    //console.log(`${req.method} ${req.url}`);
    res.render('index');
} );

const read_stuff_all_sql = " SELECT id, item, quantity, price FROM stuff"

// define a route for the stuff inventory page
app.get( "/list", ( req, res ) => {
    db.execute(read_stuff_all_sql, (error, results) => {
        if (error) {
            res.status(500).send(error); //internal server error
        }
        else {
            res.render('list', { inventory : results });
        }
    })
    //console.log(`${req.method} ${req.url}`);
    //res.render("/views/list.html", results[0]);
} );

const read_item_sql = "SELECT id, item, quantity, price FROM stuff WHERE id = ?"

// define a route for the item detail page
app.get( "/list/edit/:id", ( req, res ) => {
    db.execute(read_item_sql, [req.params.id], (error, results) => {
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
    
    })
    //console.log(`${req.method} ${req.url}`);
    //res.render("/views/edit.html", results[0]);
} );

const delete_item_sql = `
    DELETE 
    FROM
        stuff
    WHERE
        id = ?
`
app.get("/list/edit/:id/delete", ( req, res ) => {
    db.execute(delete_item_sql, [req.params.id], (error, results) => {
        if (error)
            res.status(500).send(error); //Internal Server Error
        else {
            res.redirect("/list");
        }
    });
})

const create_item_sql = `
    INSERT INTO stuff
        (item, price, quantity)
    VALUES
        (?, ?, ?)
`
app.post("/list", ( req, res ) => {
    db.execute(create_item_sql, [req.body.name, req.body.price, req.body.quantity], (error, results) => {
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
    WHERE
        id = ?
` //still have to fix this button
app.post("/list/edit/:id", ( req, res ) => {
    db.execute(update_item_sql, [req.body.name, req.body.quantity, req.body.price, req.params.id], (error, results) => {
        if (error)
            res.status(500).send(error); //Internal Server Error
        else {
            res.redirect(`/list/edit/${req.params.id}`);
        }
    });
})


// start the server
app.listen( port, () => {
    console.log(`App server listening on ${ port }. (Go to http://localhost:${ port })` );
} );