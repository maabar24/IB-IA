SELECT 
    inventory_id, ingredient_name, ingredient_quantity, ingredient_price, category_name, ingredient_desc 
FROM 
    ingredient 
JOIN 
    categories 
ON 
    categories.category_id = ingredient.category_id 
WHERE 
    inventory_id = ?
