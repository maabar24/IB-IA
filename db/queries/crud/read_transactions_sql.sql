SELECT 
    transaction_id, input_output_id, inventory_id, date, input_output_quantity_id
FROM 
    transactions 
JOIN 
    ingredient 
ON 
    transactions.inventory_id = ingredient.inventory_id 
JOIN
    input_output
ON
    input_output.input_output_id = transactions.input_output_id
WHERE 
    transaction_id = ?