// (Re)Sets up the database, including a little bit of sample data
const db = require("./db_connection");

/**** Delete existing table, if any ****/

const drop_test_table_sql = "DROP TABLE IF EXISTS `test`;"

db.execute(drop_test_table_sql);

const create_test_table_sql = `
    CREATE TABLE test (
        id INT NOT NULL AUTO_INCREMENT,
        item VARCHAR(45) NOT NULL,
        price DOUBLE NOT NULL,
        quantity INT NOT NULL,
        description VARCHAR(150) NULL,
        PRIMARY KEY (id)
    );
`
db.execute(create_test_table_sql);


/**** Create some sample items ****/

const insert_test_table_sql = `
    INSERT INTO test 
        (item, price, quantity, description) 
    VALUES 
        (?, ?, ?, ?);
`
db.execute(insert_test_table_sql, ['Tomatoes', '.50', '30', 'I love tomatoes.' ]);

db.execute(insert_test_table_sql, ['Mozzarella', '1.20', '60', 'I hate mozz.' ]);

db.execute(insert_test_table_sql, ['Flour', '1.50', '10', 'Flower is mid.' ]);

db.execute(insert_test_table_sql, ['Garlic', '.25', '20', 'Garlic stinks.' ]);

/**** Read the sample items inserted ****/

const read_test_table_sql = "SELECT * FROM test";

db.execute(read_test_table_sql, 
    (error, results) => {
        if (error) 
            throw error;

        console.log("Table 'test' initialized with:")
        console.log(results);
    }
);

db.end();



