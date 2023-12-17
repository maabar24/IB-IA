const DEBUG = true;
const express = require("express");
const db = require("../db/queries/init/db_pool_promise");
const fs = require("fs");
const path = require("path");
const { requiresAuth } = require("express-openid-connect");

let transacationRouter = express.Router();

const read_transaction_all_sql = `
    SELECT 
        .category_id, category_name
    FROM
        categories
`;
categoriesRouter.get("/", requiresAuth(), (req, res) => {
    db.execute(
        read_categories_all_sql,
        [req.oidc.user.sub],
        (error, results) => {
            if (DEBUG) console.log(error ? error : results);
            if (error) res.status(500).send(error); //Internal Server Error
            else {
                res.render("categories", { categoriesList: results });
            }
        }
    );
});

const create_categories_sql = `
    INSERT INTO categories
        (category_name)
    VALUES
        (?)
`;
categoriesRouter.post("/", requiresAuth(), (req, res) => {
    db.execute(
        create_categories_sql,
        [req.body.category_name, req.oidc.user.sub],
        (error, results) => {
            if (DEBUG) console.log(error ? error : results);
            if (error) res.status(500).send(error); //Internal Server Error
            else {
                res.redirect("/");
            }
        }
    );
});

const delete_categories_sql = `
    DELETE 
    FROM
        categories
    WHERE
        category_id = ?
`;
categoriesRouter.get("/:category_id/delete", (req, res) => {
    db.execute(delete_categories_sql, [req.params.id], (error, results) => {
        if (DEBUG) console.log(error ? error : results);
        if (error) {
            //special error if any assignments associated with the subject
            if (error.code == "ER_ROW_IS_REFERENCED_2") {
                res.status(500).send(
                    "There are foods still associated with that categories!"
                );
            } else res.status(500).send(error); //Internal Server Error
        } else {
            res.redirect("/");
        }
    });
});

module.exports = categoriesRouter;
