import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';
import * as bodyParser from 'body-parser';

admin.initializeApp(functions.config().firebase);

const db = admin.firestore();
db.settings({
	ignoreUndefinedProperties: true,
});
const app = express();
const main = express();

main.use('/v1', app);
main.use(bodyParser.json());

// The Api will be name as "mercuriusApi" in Google Firebase Function Ignore Unused variable
export const mercuriusApi = functions.https.onRequest(main);

app.get('/ping', (req, res) => {
	res.send('pong');
});

app.get('/products', async (req, res, next) => {
	db.collection('products').get()
		.then( (product) => {
			res.json(
				product.docs.map(doc => {
					const temp_product = doc.data();
					temp_product['id'] = doc.id;
					return temp_product;
				})
			);
		}).catch(next);
});

/*
	Takes a list of JSON product_id and return the corresponding product, amount of is done on the front end
	Ex: [{ "id":"vT1232132kWY2jemSaj8r", "quantity":1}]
 */
app.post('/savedcart', async (req, res, next) => {
	try {
		// req.body HAS to be json !
		const references = req.body.map( (product: { id: any; }) => {
			return db.collection('products').doc(product.id);
		});

		const result = await db.getAll(...references).then( (docs) => {
			return docs.map(doc => {
				const temp_product = doc.data();
				if (temp_product) {
					temp_product['id'] = doc.id;
				}
				return temp_product;
			})
		}).catch(next);
		return res.json(result).end();
	} catch (err) {
		return res.status(500).send('Incorrect Req Body' + '\n' +
			'/savedcart Takes a list of JSON product_id and return the corresponding product, amount of is done on the front end'+ '\n' +
			'Ex: [{ "id":"vT1232132kWY2jemSaj8r", "quantity":1}]'+ '\n' +
			err
		);
	}
});

app.get('/categories', async (req, res, next) => {
	db.collection('categories').get()
		.then( (todos) => {
			res.json(todos.docs.map(doc => doc.data()));
		}).catch(next);
});

/* BASIC CRUD OPERATIONS*/

/* Create */
app.post('/addtodo', async (req, res, next) => {
	const newTodo = new Todo(req.body);
	db.collection('todo').add(newTodo.toPlainObj())
		.then( () => {
			res.sendStatus(200);
		}).catch(next);
});

/* Get All */
app.get('/todos', async (req, res, next) => {
	db.collection('todo').get()
		.then( (todos) => {
			res.json(todos.docs.map(doc => doc.data()));
	}).catch(next);
});

/*Get One */
app.get('/todo/:id', async (req, res, next) => {
	db.collection('todo').doc(req.params.id).get()
		.then( (selectedTodo) => {
			if (selectedTodo.exists){
				res.json(selectedTodo.data());
			} else {
				res.status(500).send("Object does not exist, check the ID");
			}
	}).catch(next);
});

/* Delete One */
app.delete('/deletetodo/:id', async (req, res, next) => {
	db.collection('/todo').doc(req.params.id).delete()
		.then( () => {
			res.sendStatus(200);
	}).catch(next)
});

/* Update One */
app.post('/updatetodo/:id', async (req, res, next) => {
		const newTodo = new Todo(req.body);
		db.collection('todo').doc(req.params.id).update(newTodo.toPlainObj())
			.then( () => {
				res.sendStatus(200);
		}).catch(next);
});

interface TodoConfig {
	title?: string;
	description?: string;
	checked?: boolean;
	dateCreated?: string;
	dateChecked?: string;
}

class Todo implements TodoConfig{
	static DEFAULT_CHECKED = false;
	static DEFAULT_DATE_CREATED = new Date().toLocaleString();

	title?: string;
	description?: string;
	checked?: boolean;
	dateCreated?: string;
	dateChecked?: string ;

	constructor(todoConfig: TodoConfig) {
		this.title = todoConfig.title;
		this.description = todoConfig.description;
		this.checked = todoConfig.checked || Todo.DEFAULT_CHECKED;
		this.dateCreated = todoConfig.dateCreated || Todo.DEFAULT_DATE_CREATED;
		this.dateChecked = todoConfig.dateChecked;
	}

	toPlainObj(): {title?: string; description?: string; checked?: boolean; dateCreated?: string; dateChecked?: string } {
		return Object.assign({}, this);
	}
}

