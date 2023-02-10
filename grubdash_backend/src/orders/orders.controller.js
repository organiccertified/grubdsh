const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
const listOrders = (req, res) => {
	res.json({ data: orders });
}

const createOrder = (req, res) => {
	const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

	const newOrder = {
		id: nextId(),
		deliverTo: deliverTo,
		mobileNumber: mobileNumber,
		status: status ? status : "pending",
		dishes: dishes,
	}

	orders.push(newOrder);

	res.status(201).json({ data: newOrder });
}


const validateOrder = (req, res, next) => {
	const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;

	let message;
	if(!deliverTo || deliverTo === "")
		message = "Order must include a deliverTo";
	else if(!mobileNumber || mobileNumber === "")
		message = "Order must include a mobileNumber";
	else if(!dishes)
		message = "Order must include a dish";
	else if(!Array.isArray(dishes) || dishes.length === 0)
		message = "Order must include at least one dish";
	else {
		for(let idx = 0; idx < dishes.length; idx++) {
			if(!dishes[idx].quantity || dishes[idx].quantity <= 0 || !Number.isInteger(dishes[idx].quantity))
				message = `Dish ${idx} must have a quantity that is an integer greater than 0`;
		}
	}

	if(message) {
		return next({
			status: 400,
			message: message,
		});
	}

	next();
}

const getOrder = (req, res) => {
	res.json({ data: res.locals.order });
}

const validateOrderId = (req, res, next) => {
	const { orderId } = req.params;
	const foundOrder = orders.find((order) => order.id === orderId);

	if(foundOrder) {
		res.locals.order = foundOrder;
		return next();
	}

	next({
		status: 404,
		message: `Order id does not exist: ${orderId}`,
	});
}

const updateOrder = (req, res, next) => {
    const {orderId} = req.params;
    const originalOrder = res.locals.order;
	const { data: { id, deliverTo, mobileNumber, dishes, status } = {} } = req.body;
    if(id && id !== orderId)
      return next({
        status: 400,
        message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
      });
    if (!status || status == "")
      return next({status: 400, message: 'Order must include a status'});
    if (status === "invalid")
      return next({status: 400, message: 'Order status must be valid'});
    if (status === "delivered")
      return next({
        status: 400,
        message: 'A delivered order cannot be changed',
      });

	res.locals.order = {
		id: originalOrder.id,
		deliverTo: deliverTo,
		mobileNumber: mobileNumber,
		dishes: dishes,
		status: status,
	}

	res.json({ data: res.locals.order });
}

const validateStatus = (req, res, next) => {
	const { orderId } = req.params;
	const { data: { id, status } = {} } = req.body;

	let message;
	if(id && id !== orderId)
		message = `Order id does not match route id. Order: ${id}, Route: ${orderId}`
	else if(!status || status === "" || (status !== "pending" && status !== "preparing" && status !== "out-for-delivery"))
		message = "Order must have a status of pending, preparing, out-for-delivery, delivered";
	else if(status === "delivered")
		message = "A delivered order cannot be changed"

	if(message) {
		return next({
			status: 400,
			message: message,
		});
	}

	next();
}

const deleteOrder = (req, res) => {
	const idx = orders.indexOf(res.locals.order);
	orders.splice(idx, 1);

	res.sendStatus(204);
}

const validateDelete = (req, res, next) => {
	if(res.locals.order.status !== "pending") {
		return next({
			status: 400,
			message: "An order cannot be deleted unless it is pending",
		});
	}

	next();
}

module.exports = {
	listOrders,
	createOrder: [validateOrder, createOrder],
	getOrder: [validateOrderId, getOrder],
	updateOrder: [validateOrder, validateOrderId, validateStatus, updateOrder],
	deleteOrder: [validateOrderId, validateDelete, deleteOrder],
}