SELECT 
    inventory_id, ingredient_name, ingredient_quantity, ingredient_price, category_name 
FROM 
    ingredient 
JOIN 
    categories 
ON 
    ingredient.category_id = categories.category_id 

