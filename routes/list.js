const DEBUG = true;
const express = require("express");
const db = require("../db/queries/init/db_pool");
const fs = require("fs");
const path = require("path");
const { requiresAuth } = require("express-openid-connect");

let listRouter = express.Router();

const read_ingredient_all_sql = `SELECT
    inventory_id, ingredient_name, ingredient_quantity, ingredient_price, category_name, ingredient_desc 
FROM 
    ingredient 
JOIN 
    categories 
ON 
    ingredient.category_id = categories.category_id`;

const read_categories_all_sql = `SELECT 
    categories.category_id, category_name
FROM
    categories`;

// define a route for the ingredient inventory page
listRouter.get("/", (req, res) => {
    db.execute(
        read_ingredient_all_sql,
        [req.oidc.user.email],
        (error, results) => {
            if (DEBUG) console.log(error ? error : results);
            if (error) {
                res.status(500).send(error); //internal server error
            } else {
                db.execute(read_categories_all_sql, (error2, results2) => {
                    if (DEBUG) console.log(error2 ? error2 : results2);
                    if (error2)
                        res.status(500).send(error2); //internal server error
                    else {
                        let data = {
                            ingredient: results,
                            categories: results2,
                        };
                        res.render("list", data);
                    }
                });
            }
        }
    );
    //console.log(`${req.method} ${req.url}`);
    //res.render("/views/list.html", results[0]);
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

// define a route for the item detail page
listRouter.get("/edit/:inventory_id", (req, res) => {
    console.log(
        "Route /edit/:inventory_id accessed. Inventory ID:",
        req.params.inventory_id
    );
    db.execute(
        read_ingredient_sql,
        [req.params.inventory_id, req.oidc.user.email],
        (error, results) => {
            if (error) {
                res.status(500).send(error); //internal server error
            } else if (results.length == 0) {
                res.status(404).send(
                    `No item found with id = "${req.params.inventory_id}"`
                );
            } else {
                //res.send(results[0]);
                console.log("Is ingredient an array:", Array.isArray(results));
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

listRouter.get("/edit/:inventory_id/delete", (req, res) => {
    db.execute(
        delete_ingredient_sql,
        [req.params.inventory_id, req.oidc.user.email],
        (error, results) => {
            if (error) res.status(500).send(error); //Internal Server Error
            else {
                res.redirect("/");
            }
        }
    );
});

const create_ingredient_sql = `
INSERT INTO ingredient
    (ingredient_name, ingredient_price, ingredient_quantity, category_id, ingredient_desc)
VALUES
    (?, ?, ?, ?, ?)`;

listRouter.post("/", (req, res) => {
    db.execute(
        create_ingredient_sql,
        [
            req.body.name,
            req.body.price,
            req.body.quantity,
            req.body.categories,
            req.oidc.user.email,
        ],
        (error, results) => {
            if (error) res.status(500).send(error); //Internal Server Error
            else {
                //results.insertId has the primary key (id) of the newly inserted element.
                res.redirect(`/edit/${results.insertId}`);
            }
        }
    );
});

const update_ingredient_sql = `
UPDATE
    ingredient
SET
    ingredient_name = ?,
    ingredient_quantity = ?,
    ingredient_price = ?
    category_id = ?
    ingredient_desc = ?
WHERE
    inventory_id = ?`;

listRouter.post("/edit/:inventory_id", (req, res) => {
    db.execute(
        update_ingredient_sql,
        [
            req.body.name,
            req.body.quantity,
            req.body.price,
            req.body.categories,
            req.params.inventory_id,
            req.oidc.user.email,
        ],
        (error, results) => {
            if (error) res.status(500).send(error); //Internal Server Error
            else {
                res.redirect(`/edit/${req.params.inventory_id}`);
            }
        }
    );
});

module.exports = listRouter;
