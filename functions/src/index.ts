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

/* BASIC CRUD OPERATION*/

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

