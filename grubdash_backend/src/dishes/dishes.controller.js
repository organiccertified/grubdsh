const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
const listDishes = (req, res) => {
	res.json({ data: dishes });
}

const createDish = (req, res) => {
	const { data: { name, description, price, image_url } = {}} = req.body;
	const newDish = {
		id: nextId(),
		name: name,
		description: description,
		price: price,
		image_url: image_url,
	};

	dishes.push(newDish);
	res.status(201).json({ data: newDish });
}

const dishExists = (req, res, next) => {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);

 if (foundDish) { res.locals.dish = foundDish; return next(); }
 next({ status: 404, message: `Dish does not exist: ${dishId}` });
}
  

const bodyHasProperty = (property) => {
	return function validateProperty(req, res, next) {
		const { data = {} } = req.body;
		if (data[property] && data[property] !== "") {
			return next();
		}
		next({ status: 400, message: `Dish must include a ${property}` });
	};
}
const hasValidPrice = (req, res, next) => {
	const { data: { price } = {} } = req.body;
	if (Number(price) > 0 && Number.isInteger(price)) {
		return next();
	}
	next({ status: 400, message: `Dish must have a price that is an integer greater than 0` });
}

const getDish = (req, res) => {
	res.json({ data: res.locals.dish });
}

const validateDishId = (req, res, next) => {
	const { dishId } = req.params;
	const foundDish = dishes.find((dish) => dish.id === dishId);

	if(foundDish) {
		res.locals.dish = foundDish;
		return next();
	}

	next({
		status: 404,
		message: `Dish id does not exist: ${dishId}`,
	})
}

const updateDish = (req, res) => {
	const dish = res.locals.dish;
	const { data: { name, description, price, image_url } = {} } = req.body;

	dish.name = name;
	dish.description = description;
	dish.price = price;
	dish.image_url = image_url;

	res.json({ data: dish });
}

const validateDishBodyId = (req, res, next) => {
	const { dishId } = req.params;
	const { data: { id } = {} } = req.body;
	if (id) {
		if (id === dishId) {
			return next();
		}

		return next({
			status: 400,
			message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
		});
	}
	next();
}
 

module.exports = {
	listDishes,
	createDish: [
		bodyHasProperty("name"),
		bodyHasProperty("description"),
		bodyHasProperty("price"),
		bodyHasProperty("image_url"),
		hasValidPrice,
		createDish,
	],
	getDish: [validateDishId, getDish],
	updateDish: [ dishExists, validateDishBodyId, bodyHasProperty("name"), bodyHasProperty("description"), bodyHasProperty("price"), bodyHasProperty("image_url"), hasValidPrice, updateDish, ],
};