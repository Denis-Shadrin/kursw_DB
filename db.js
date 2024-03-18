const express = require('express');
const app = express();
const handlebars = require('express-handlebars');
const mysql = require('mysql2');

const host = '127.0.0.1';
const port = 7000;

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "minerals",
    password: ""
});

connection.connect((error) => {
  if (error) {
    console.error('Ошибка подключения к базе данных:', error);
  } else {
    console.log('Подключение к базе данных установлено.');
  }
});

app.use('/css', express.static(`css`));
app.use('/js', express.static(`js`));
app.use('/img', express.static(`img`));
app.use(express.json());
app.use(express.urlencoded({ extended: true}));
app.engine(
    'handlebars',
    handlebars.engine({ defaultLayout: 'main' })
);
app.set('views', './views');
app.set('view engine', 'handlebars');

app.get('/getMineralDescription/:id', (req, res) => {
    const mineralId = req.params.id;
    console.log('Получен запрос для минерала с ID:', mineralId);
    connection.query(
        'SELECT `Description` FROM `mineral` WHERE `PK_Mineral` = ?',
        [mineralId],
        (err, results) => {
            if (err) {
                console.error('Ошибка при запросе к базе данных:', err);
                res.status(500).send('Ошибка при получении описания');
            } else {
                if (results.length > 0) {
                    const mineralDescription = results[0].Description;
                    console.log('Описание минерала:', mineralDescription);
                    res.send(mineralDescription);
                } else {
                    console.log('Минерал с ID', mineralId, 'не найден');
                    res.status(404).send('Минерал не найден');
                }
            }
        }
    );
});


app.get('/', (req, res) => {
	connection.query("SELECT `mineral`.* FROM `mineral`",
                (err, results, fields) => {
                    if (err) {
						console.error('Ошибка!!!', err);
                        debugger;
                    } else {
						//console.log('Результаты:', results);
                        res.render('index', { rocks: results});
                    }
                }
    )
});

app.get('/admin_page', (req, res) => {
	connection.query("SELECT `mineral`.* FROM `mineral`",
                (err, results, fields) => {
                    if (err) {
						console.error('Ошибка!!!', err);
                        debugger;
						
                    } else {
						//console.log('Результаты:', results);
                        res.render('admin_page', { rocks: results});
                    }
                }
    )
})

app.get('/add_form', (req, res) => {
	res.render('add_form');
})

app.post('/add_form', (req, res) => {
    const body = req.body;
    const requiredFields = ['MineralName', 'MineralColor', 'MineralFormula', 'MineralHardness', 'MineralDescription'];
	console.log('body:\n',body);
	if (requiredFields.every(field => body[field])) {
        const sql = "INSERT INTO mineral (Name, Color, Formula, Hardness, Description) VALUES (?, ?, ?, ?, ?)";
        const values = [
            body.MineralName,
            body.MineralColor,
            body.MineralFormula,
            body.MineralHardness,
            body.MineralDescription
        ];
        connection.query(sql, values, (err, results, fields) => {
            if (err) {
                console.error('Ошибка при добавлении:', err);
                res.status(500).json({ error: 'Ошибка при добавлении элемента' });
            } else {
                console.log('Элемент добавлен');
				res.redirect('/admin_page');
            }
        });
		
    } else {
        res.status(400).send('Не все обязательные поля заполнены');
    }
});

app.get('/edit_form/:id', (req, res) => {
  connection.query(`SELECT * FROM mineral WHERE PK_Mineral=${req.params.id}`,
                (err, results, fields) => {
                    if (err) {
                        debugger;
                    }
					const id = req.params.id
					//console.log(`app__get_edit_form_id'`, {results, id})
                    res.render('edit_form', {
						data: results[0],
						id: req.params.id
					});
	})
})

app.post('/edit_form/:id', (req, res) => {
    const id = req.params.id;
    const sql = "UPDATE mineral SET Name = ?, Color = ?, Formula = ?, Hardness = ?, Description = ? WHERE PK_Mineral = ?";

    const values = [
        req.body.MineralName,
        req.body.MineralColor,
        req.body.MineralFormula,
        req.body.MineralHardness,
        req.body.MineralDescription,
        id
    ];
    connection.query(sql, values, (err, results, fields) => {
        if (err) throw err;
        console.log('Элемент изменён');
        res.redirect('/admin_page');
    });
});

app.delete('/delete/:id', (req, res) => {
    const id = req.params.id;
    const sql = `DELETE FROM mineral WHERE PK_Mineral = ${id}`;

    connection.query(sql, (err, results, fields) => {
        if (err) {
            console.error('Ошибка при удалении:', err);
            res.status(500).json({ error: 'Ошибка при удалении элемента' });
        } else {
            console.log('Элемент удален');
            res.status(200).json({ message: 'Элемент успешно удален' });
        }
    });
});
app.listen(port, host, function () {
    console.log(`Server listens http://${host}:${port}`);
});