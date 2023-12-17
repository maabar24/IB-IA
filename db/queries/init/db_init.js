// (Re)Sets up the database, including a little bit of sample data
const db = require("./db_connection");

/**** Delete existing table, if any ****/

const drop_ingredient_table_sql = "DROP TABLE IF EXISTS `ingredient`;";

db.execute(drop_ingredient_table_sql);

const create_ingredient_table_sql = `
    CREATE TABLE ingredient (
        id INT NOT NULL AUTO_INCREMENT,
        item VARCHAR(45) NOT NULL,
        quantity INT NOT NULL,
        price DOUBLE NULL,
        VARCHAR(50) NULL,
        PRIMARY KEY (id)
    );
`;
db.execute(create_ingredient_table_sql);

/**** Create some sample items ****/

const insert_ingredient_table_sql = `
    INSERT INTO ingredient 
        (item, quantity, price) 
    VALUES 
        (?, ?, ?);
`;
db.execute(insert_ingredient_table_sql, ["Pizza", "118", "1.99"]);

db.execute(insert_ingredient_table_sql, ["Pasta", "180", "10.99"]);

db.execute(insert_ingredient_table_sql, ["Garlic Knots", "114", "4.99"]);

/**** Read the sample items inserted ****/

const read_ingredient_table_sql = "SELECT * FROM ingredient";

db.execute(read_ingredient_table_sql, (error, results) => {
    if (error) throw error;

    console.log("Table 'ingredient' initialized with:");
    console.log(results);
});

db.end();
