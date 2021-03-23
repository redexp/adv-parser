module.exports = {
	push,
	remove,
};

function push(arr, value) {
	if (!arr.includes(value)) {
		arr.push(value);
	}
}

function remove(arr, value) {
	var index = arr.indexOf(value);

	if (index > -1) {
		arr.splice(index, 1);
	}
}