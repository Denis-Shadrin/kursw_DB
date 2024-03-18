const express = require('express');
const app = express();
const handlebars = require('express-handlebars');
const mysql = require('mysql2');

const host = '127.0.0.1';
const port = 7000;

const { Pool } = require('pg');

const pool = new Pool({
  user: 'denis',
  host: '127.0.0.1',
  database: 'AccForCommercialBasis',
  password: '123QWEr!@',
  port: '5432',
});

// Пример выполнения запроса к базе данных
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Ошибка выполнения запроса', err);
  } else {
    console.log('Результат запроса:', res.rows);
  } 

});


app.use('/css', express.static(`css`));
app.use('/js', express.static(`js`));
app.use('/img', express.static(`img`));
app.use(express.json());
app.use(express.urlencoded({ extended: true}));

var hbs = handlebars.create({
	defaultLayout: 'main',
  helpers: {
    formatDate: function (dateString) {  if (!dateString) return '';
        
        // Форматируем дату в формат yyyy-mm-dd
        const date = new Date(dateString);
        const year = date.getFullYear();
        let month = (date.getMonth() + 1).toString();
        let day = date.getDate().toString();

        // Добавляем ведущий ноль, если месяц или день состоят из одной цифры
        if (month.length === 1) month = '0' + month;
        if (day.length === 1) day = '0' + day;

        return `${year}-${month}-${day}`; },
		equals: function (val1, val2) { return val1 === val2 ? 'selected' : ''; }
		
		//bar: function () { return 'BAR!'; }
  }
});


app.engine(
    'handlebars',
    hbs.engine
);
/*
app.engine(
    'handlebars',
    handlebars.engine({ defaultLayout: 'main' })
);
*/


app.set('views', './views');
app.set('view engine', 'handlebars');


app.get('/', (req, res) => {
	res.render('index');
});

app.get('/fz', async (req, res) => {
  try {
    // Запрос к базе данных для получения данных
    const result = await pool.query('SELECT f.PK_FizLico As pk, f.id AS id, to_char(f.KogdaVidan, \'dd.mm.yyyy\') ' +
	'AS kog, f.KemVidan AS kem, f.FIO AS fio, f.INN AS inn, to_char(f.DateRozhd, \'dd.mm.yyyy\') AS dr, f.AdrReg AS ard,'+
	' f.KontInfo AS info, tp.name AS type FROM fizlico AS f JOIN TipPasporta AS tp ON f.PK_tippasporta = tp.PK_tippasporta;');

    // Передача данных в шаблон Handlebars
    res.render('fz', { fz: result.rows });
  } catch (error) {
    console.error('Ошибка при запросе к базе данных:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/fz_full/:id', async (req, res) => {
  try {
    // Запрос к базе данных для получения данных
	
    const queryText =
      `SELECT p.PK_Potrebitel AS pk_p, pr.PK_Prikaz AS pk_pr, p.fio AS fio, pr.NumberPrikaza AS num, to_char(pr.DatePrikaza, \'dd.mm.yyyy\') AS date_pr, s.PK_Spezialnost AS pk_s, tpr.name AS tpr_n,
      st.name AS st_n, kp.name As kp_n, s.Name As s_n, uo.name AS uo_n, fo.name As fo_n 
      FROM (SELECT * FROM Potrebitel AS pl JOIN FizLico As f ON pl.PK_FizLico = f.PK_FizLico WHERE pl.PK_FizLico = $1) AS p 
      JOIN Spezialnost AS s ON p.PK_Spezialnost = s.PK_Spezialnost 
      JOIN StatusPotreb AS st ON st.PK_StatusPotreb = p.PK_StatusPotreb 
      JOIN KategoriaPotreb AS kp ON p.PK_KategoriaPotreb = kp.PK_KategoriaPotreb 
      JOIN Prikaz AS pr ON p.PK_Prikaz = pr.PK_Prikaz 
      JOIN TipPrikaza AS tpr ON tpr.PK_TipPrikaza = pr.pk_TipPrikaza 
      JOIN UrovObraz AS uo ON uo.PK_UrovObraz = s.PK_UrovObraz 
      JOIN FormaObuch As fo ON fo.PK_FormaObuch = s.PK_FormaObuch;`;

    //console.log('SQL Query:', queryText);
    //console.log('Parameter Values:', [req.params.id]);

    // Запрос к базе данных для получения данных
    const result1 = await pool.query(queryText, [req.params.id]);
	
    // Вывод данных в консоль для отладки
    //console.log('Resulting Rows:', result1.rows);
	
	const queryText2 ='SELECT f.PK_FizLico As pk, f.id AS id, to_char(f.KogdaVidan, \'dd.mm.yyyy\') ' +
	'AS kog, f.KemVidan AS kem, f.FIO AS fio, f.INN AS inn, to_char(f.DateRozhd, \'dd.mm.yyyy\') AS dr, f.AdrReg AS ard,'+
	'f.KontInfo AS info, tp.name AS type FROM fizlico AS f JOIN TipPasporta AS tp ON f.PK_tippasporta = tp.PK_tippasporta WHERE f.PK_FizLico = $1;';
	
	const result2 = await pool.query(queryText2,[req.params.id]);
	
	
	
    // Передача данных в шаблон Handlebars
    res.render('fz_full', { info: result1.rows , general_information :result2.rows});
  } catch (error) {
    console.error('Ошибка при запросе к базе данных:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/add_potreb/:id', async (req, res) => {
	try {
	const id = req.params.id;
    // Запрос к базе данных для получения данных
    const result = await pool.query(`SELECT pk_spezialnost AS pk_spez, s.name AS spez, kodspez, ur.name AS ur, fo.name AS fo
	FROM public.spezialnost AS s 
	JOIN urovobraz As ur ON s.pk_urovobraz = ur.pk_urovobraz
	JOIN formaobuch AS fo ON s.pk_formaobuch = fo.pk_formaobuch;`);
	
	const result2 = await pool.query(`SELECT pk_tipzakasch as pk, name
	FROM public.tipzakasch;`);
	
    // Передача данных в шаблон Handlebars
    res.render('add_potreb', { info_spec: result.rows ,info_zak:result2.rows, id: id});
  } catch (error) {
    console.error('Ошибка при запросе к базе данных:', error);
    res.status(500).send('Internal Server Error');
  }
});


app.post('/add_potreb/:id', async (req, res) => {
    try {
		const result = await pool.query(`
    SELECT proname, proargtypes FROM pg_proc 
    WHERE proname = 'add_potrebitel' AND pronamespace = (
        SELECT oid FROM pg_namespace WHERE nspname = 'public'
    );
`);

if (result.rows.length === 0) {
    console.error('Процедура не найдена');
} else {
    console.log('Процедура найдена:', result.rows[0]);
}
		
        const id 			= req.params.id;
        const pk_spez_2 	= req.body.pk_spez_2;
        const num_doc 		= req.body.num_doc;
        const date_pod 		= req.body.date_pod;
        const date_rastor 	= req.body.date_rastor;
        const kurs 			= req.body.kurs;
        const ucheb_period 	= req.body.ucheb_period;
        const sroc_oplaty 	= req.body.sroc_oplaty;
        const bank_rek 		= req.body.bank_rek;
        const pk_tip 		= req.body.pk_tip;
        const name 			= req.body.name;
        const inn 			= req.body.inn;

        // Проверка заполненности полей
        if (!pk_spez_2 || !num_doc || !date_pod || !date_rastor || !kurs || !ucheb_period || !sroc_oplaty || !bank_rek || !pk_tip || !name || !inn) {
			return res.status(400).send('Все поля формы должны быть заполнены.');
        }
        // Выполнение SQL-запроса для вызова процедуры
        const queryText = `
            CALL add_potrebitel(
			$1::bigint,
			$2::bigint,
			$3::varchar	,
			$4::date		,
			$5::date			,
			$6::integer		,
			$7::varchar	,	
			$8::date			,
			$9::varchar		,
			$10::bigint	,
			$11::varchar	,
			$12::varchar		);
        `;
		const values = [id, 
		pk_spez_2, 
		num_doc, 
		date_pod, 
		date_rastor, 
		kurs, 
		ucheb_period, 
		sroc_oplaty, 
		bank_rek, 
		pk_tip, 
		name, 
		inn];
        await pool.query(queryText, values);
		res.redirect(`/fz_full/${id}`);

    } catch (error) {
        console.error('Ошибка при обработке POST-запроса:', error);
        res.status(500).send('Внутренняя ошибка сервера.');
    }
});

app.get('/add_dop/:id', async (req, res) => {
    try {
	const id = req.params.id;
    // Запрос к базе данных для получения данных
    	
	const result2 = await pool.query(`SELECT pk_tipzakasch as pk, name
	FROM public.tipzakasch;`);
	
    // Передача данных в шаблон Handlebars
    res.render('add_dop', { info_zak:result2.rows, id: id});
  } catch (error) {
    console.error('Ошибка при запросе к базе данных:', error);
    res.status(500).send('Internal Server Error');
  }
});
app.post('/add_dop/:id', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT proname, proargtypes FROM pg_proc 
            WHERE proname = 'add_potrebitel' AND pronamespace = (
                SELECT oid FROM pg_namespace WHERE nspname = 'public'
            );
        `);

        const id = req.params.id;  // Переменную id нужно определить здесь
        const pk_p = id;  // И использовать её в этом месте

        const num_doc = req.body.num_doc;
        const date_podpis = req.body.date_pod;
        const date_rastor = req.body.date_rastor;
        const kurs = req.body.kurs;
        const ucheb_period = req.body.ucheb_period;
        const sroc_oplaty = req.body.sroc_oplaty;
        const bank_rek = req.body.bank_rek;
        const pk_tip = req.body.pk_tip;
        const name = req.body.name;
        const inn = req.body.inn;

        // Проверка заполненности полей
        if (!num_doc || !date_podpis || !date_rastor || !kurs || !ucheb_period || !sroc_oplaty || !bank_rek || !pk_tip || !name || !inn) {
            return res.status(400).send('Все поля формы должны быть заполнены.');
        }

        // Выполнение SQL-запроса для вызова процедуры
        const queryText = `
            CALL add_dop_sogl(
                $1::bigint,
                $2::varchar,
                $3::date,
                $4::date,
                $5::integer,
                $6::varchar,
                $7::date,
                $8::varchar,
                $9::bigint,
                $10::varchar,
                $11::varchar
            );
        `;

        const values = [pk_p, num_doc, date_podpis, date_rastor, kurs, ucheb_period, sroc_oplaty, bank_rek, pk_tip, name, inn];
        await pool.query(queryText, values);
        res.redirect(`/fz`);
    } catch (error) {
        console.error('Ошибка при обработке POST-запроса:', error);
        res.status(500).send('Внутренняя ошибка сервера.');
    }
});

app.get('/yr', async (req, res) => {
  try {
    // Запрос к базе данных для получения данных
    const result = await pool.query('SELECT pk_jurlico AS pk, name AS name, INN AS inn, ogrn AS ogrn, AdrReg AS adr, Kontinfo AS info FROM JurLico;');

    // Передача данных в шаблон Handlebars
    res.render('yr', { general_information: result.rows });
  } catch (error) {
    console.error('Ошибка при запросе к базе данных:', error);
    res.status(500).send('Internal Server Error');
  }
});




app.get('/dolg', async (req, res) => {
	
	try {
    // Запрос к базе данных для получения данных
	await pool.query('UPDATE document SET pk_statusdoc = 7 WHERE srocoplaty < CURRENT_DATE AND oststoim > 0;');

    const result = await pool.query(
	`WITH doc AS(WITH zakazchik AS(
	SELECT pk_jurlico AS pk_j, NULL AS pk_f, name AS zak, kontinfo AS info FROM jurlico 
	UNION 
	SELECT NULL, pk_fizlico, fio, kontinfo FROM fizlico)
	SELECT d.pk_potrebitel AS potr, d.numdoc AS num, d.srocoplaty AS sroc, z.zak AS zak, z.info AS zak_info, d.oststoim AS dolg FROM (SELECT * FROM document WHERE pk_statusdoc = 7) AS d 
	JOIN zakazchik AS z ON
	d.pk_jurlico = z.pk_j OR
	d.pk_fizlico = z.pk_f)
	SELECT d.num AS num, to_char(d.sroc, \'dd.mm.yyyy\') AS sroc, d.zak AS zak, d.zak_info AS zak_info, f.fio AS stud, f.kontinfo AS stud_info, d.dolg AS dolg  FROM doc AS d
	JOIN potrebitel AS p ON p.pk_potrebitel = d.potr
	JOIN fizlico AS f ON p.pk_fizlico = f.pk_fizlico;
	`
	);

    // Передача данных в шаблон Handlebars
    res.render('dolg', { info: result.rows });
  } catch (error) {
    console.error('Ошибка при запросе к базе данных:', error);
    res.status(500).send('Internal Server Error');
  }
  
});

app.get('/dog', async (req, res) => {
	
	try {
    // Запрос к базе данных для получения данных
    const result = await pool.query(
	`
		SELECT d.pk_document AS pk, numdoc AS num, to_char(datepodpis, \'dd.mm.yyyy\') AS podpis, uchebperiod AS period, numkurs AS kurs, 
		st.name AS st, t_d.name AS t_d, f.fio AS stud
		FROM document AS d
		JOIN statusdoc AS st ON st.pk_statusdoc = d.pk_statusdoc 
		JOIN tipdoc AS t_d ON t_d.pk_tipdoc = d.pk_tipdoc
		JOIN potrebitel AS p ON p.pk_potrebitel = d.pk_potrebitel
		JOIN fizlico AS f ON f.pk_fizlico = d.pk_fizlico
		ORDER BY datepodpis;
	`
	);
	//14
	// номер договора num 	дата подписания срок оплаты
	//
    // Передача данных в шаблон Handlebars
    res.render('dog', { info: result.rows });
  } catch (error) {
    console.error('Ошибка при запросе к базе данных:', error);
    res.status(500).send('Internal Server Error');
  }
  
});

app.get('/dog_full/:id', async (req, res) => {
	try {
		const queryText = `
		WITH zakazchik AS 
		(
			SELECT pk_jurlico AS pk_j, NULL AS pk_f, name AS zak, kontinfo AS info FROM jurlico 
			UNION 
			SELECT NULL, pk_fizlico, fio, kontinfo FROM fizlico
		)
		SELECT numdoc AS num, to_char(datepodpis, \'dd.mm.yyyy\') AS podpis, to_char(daterastor, \'dd.mm.yyyy\') AS rastor, 
		uchebperiod AS period, numkurs AS kurs, polnstoim AS poln,
		oststoim AS ost, to_char(srocoplaty, \'dd.mm.yyyy\') AS sroc, bankrekzak AS rek, t_z.name AS t_z, st.name AS st,
		t_d.name AS t_d, z.zak AS zak, f.fio AS stud
		FROM (SELECT * FROM document WHERE pk_document = $1) AS d
		JOIN tipzakasch AS t_z ON t_z.pk_tipzakasch = d.pk_tipzakasch
		JOIN statusdoc AS st ON st.pk_statusdoc = d.pk_statusdoc 
		JOIN tipdoc AS t_d ON t_d.pk_tipdoc = d.pk_tipdoc
		JOIN zakazchik AS z ON d.pk_jurlico = z.pk_j OR d.pk_fizlico = z.pk_f
		JOIN potrebitel AS p ON p.pk_potrebitel = d.pk_potrebitel
		JOIN fizlico AS f ON f.pk_fizlico = d.pk_fizlico
		ORDER BY datepodpis;
		`;
	const result = await pool.query(queryText, [req.params.id]);
	//14
	//num podpis rastor period kurs poln ost sroc rek t_z st t_d zak stud
	
	//Договор: num подписан: podpis расторжен:rastor
	//Заказчик:zak Студент:stud Тип заказчика:t_z
	//курс: kurs
	//
	
		res.render('dog_full', { info: result.rows });
	} catch (error) {
		console.error('Ошибка при запросе к базе данных:', error);
		res.status(500).send('Internal Server Error');
	}
});
app.get('/prikazs', async (req, res) => {
	try {
    // Запрос к базе данных для получения данных
    const result = await pool.query(`SELECT p.pk_prikaz AS pk_p, p.NumberPrikaza AS num, 
	to_char(p.DatePrikaza, \'dd.mm.yyyy\') AS date, t.name AS type 
	FROM prikaz AS p JOIN tipprikaza AS t ON p.pk_tipprikaza = t.pk_tipprikaza WHERE p.pk_tipprikaza <> 6`);

	const result2 = await pool.query(`SELECT pk_tipprikaza as ps_tp, name
	FROM public.tipprikaza WHERE pk_tipprikaza <> 6;`);

    // Передача данных в шаблон Handlebars
    res.render('prikazs', { info_tp:result2.rows,info: result.rows });
  } catch (error) {
    console.error('Ошибка при запросе к базе данных:', error);
    res.status(500).send('Internal Server Error');
  }
  
});

app.get('/prikaz_info/:id', async (req, res) => {
  try {
    // Запрос к базе данных для получения данных
	
    const queryText = 'SELECT f.pk_fizlico AS pk_f, s.name AS spez, f.fio AS fio FROM '+
					'(SELECT * FROM prikaz WHERE pk_prikaz = $1) AS pr                 '+
					'JOIN potrebitel AS p ON pr.pk_prikaz = p.pk_prikaz                '+
					'JOIN fizlico AS f ON f.pk_fizlico = p.pk_fizlico                  '+
					'JOIN spezialnost As s ON s.pk_spezialnost = p.pk_spezialnost ORDER BY s.name;';

	const queryText2 ='SELECT p.NumberPrikaza AS num, to_char(p.DatePrikaza, \'dd.mm.yyyy\') AS date, t.name AS type '+
	'FROM prikaz AS p JOIN tipprikaza AS t ON p.pk_tipprikaza = t.pk_tipprikaza WHERE p.pk_prikaz = $1;';
	 
	
    //console.log('SQL Query:', queryText);
    //console.log('Parameter Values:', [req.params.id]);

    // Запрос к базе данных для получения данных
    const result = await pool.query(queryText, [req.params.id]);
	const result2 = await pool.query(queryText2,[req.params.id]);
	
    // Передача данных в шаблон Handlebars
    res.render('prikaz_info', { info: result.rows ,g_info:result2.rows});
  } catch (error) {
    console.error('Ошибка при запросе к базе данных:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/add_prikaz/:id', async (req, res) => {
    try {
	const id = req.params.id;
	
	const queryText1 =
      `SELECT potr, spez, ur, fo, fio, to_char(datarozhd, \'dd.mm.yyyy\') as dr FROM get_stutus_potreb_for_prikaz($1) ORDER BY spez, ur, fo, fio;`;
	
	 const queryText2 =
      `SELECT name
	FROM public.tipprikaza WHERE pk_tipprikaza = $1;`;
	
	const result1 = await pool.query(queryText1, [id]);
	
	const result2 = await pool.query(queryText2, [id]);
	
    // Передача данных в шаблон Handlebars
    res.render('add_prikaz', { info_pers:result1.rows,name_pr:result2.rows[0].name, id: id});
  } catch (error) {
    console.error('Ошибка при запросе к базе данных:', error);
    res.status(500).send('Internal Server Error');
  }
});
app.post('/add_prikaz/:id', async (req, res) => {
    try {
		console.log('Этот код выполняется!');
        const id = req.params.id;
        const num_doc = req.body.num_doc;
        const date_pod = req.body.date_pod;
		
        const selectedStudents = req.body.selected_students ? req.body.selected_students.split(',') : [];
		console.log('id:', id);
	console.log('num_doc:', num_doc);
	console.log('date_pod:', date_pod);
	console.log('selectedStudents:', selectedStudents);

        // Проверка заполненности полей
        if (!num_doc || !date_pod || !selectedStudents || selectedStudents.length === 0) {

    return res.status(400).send('Все поля формы должны быть заполнены.');
}
        // Выполнение SQL-запроса для вызова процедуры
        const queryText = `
            CALL add_prikaz(
                $1::varchar	,
                $2::date,
                $3::bigint,
				$4::bigint[]);
        `;
	
        // Вместо $1, $2, ..., $n подставьте ваши параметры для процедуры
        const values = [num_doc, date_pod, id, selectedStudents];

        await pool.query(queryText, values);
        res.redirect(`/prikazs`);

    } catch (error) {
        console.error('Ошибка при обработке POST-запроса:', error);
        res.status(500).send('Внутренняя ошибка сервера.');
    }
});


app.get('/spec', async (req, res) => {
	try {
    // Запрос к базе данных для получения данных
    const result = await pool.query(
	'SELECT s.pk_spezialnost AS pk, s.name AS spez, CAST(s.srokobuch AS VARCHAR) AS srok, s.kodspez AS kod, uo.name AS uo, fo.name AS fo FROM spezialnost AS s '+
	'JOIN urovobraz AS uo ON uo.pk_urovobraz = s.pk_urovobraz '+
	'JOIN formaobuch AS fo ON fo.pk_formaobuch = s.pk_formaobuch;');
    // Передача данных в шаблон Handlebars
    res.render('spec', { info: result.rows });
  } catch (error) {
    console.error('Ошибка при запросе к базе данных:', error);
    res.status(500).send('Internal Server Error');
  }
  
});

app.get('/spec_prog/:id', async (req, res) => {
	try {

    const queryText1 = `
	SELECT kurs AS kurs, uchebgod AS god, obrazstandart AS stand, stoimost AS stoim 
	FROM obrazprog WHERE pk_spezialnost = $1 
	ORDER BY obrazstandart, uchebgod, kurs;
	`;
	const queryText2 = `
	SELECT s.name AS spez, s.kodspez AS kod, uo.name AS uo, fo.name AS fo FROM spezialnost AS s
	JOIN urovobraz AS uo ON uo.pk_urovobraz = s.pk_urovobraz 
	JOIN formaobuch AS fo ON fo.pk_formaobuch = s.pk_formaobuch WHERE s.pk_spezialnost = $1 ;
	`;
const result = await pool.query(queryText1, [req.params.id]);
const result2 = await pool.query(queryText2, [req.params.id]);
    res.render('spec_prog', { info: result.rows,info_spec: result2.rows });
  } catch (error) {
    console.error('Ошибка при запросе к базе данных:', error);
    res.status(500).send('Internal Server Error');
  }
  
});

app.get('/getDescription/:id', async (req, res) => {
  const doc_Id = req.params.id;
    //console.log('Получен запрос для  ID:', doc_Id);
	try {
    // Запрос к базе данных для получения данных
	const queryText = `
WITH zakazchik AS (
    SELECT pk_jurlico AS pk_j, NULL AS pk_f, name AS zak FROM jurlico
    UNION
    SELECT NULL, pk_fizlico, fio FROM fizlico
)
SELECT 
    to_char(d.datepodpis, \'dd.mm.yyyy\')  AS podpis, 
    to_char(d.daterastor, \'dd.mm.yyyy\') AS rastor, 
    d.uchebperiod AS period, 
    d.numkurs AS kurs,
    d.polnstoim AS poln, 
    d.oststoim AS osr, 
    to_char(d.srocoplaty, \'dd.mm.yyyy\') AS sroc, 
    d.bankrekzak AS rek, 
    d.pk_statusdoc AS stat,
    d.pk_tipdoc AS tip, 
    d.numdoc AS num, 
    z.zak AS zak
FROM 
    (SELECT * FROM document WHERE pk_potrebitel = $1) AS d 
JOIN zakazchik AS z ON
    d.pk_jurlico = z.pk_j OR
    d.pk_fizlico = z.pk_f;
`;

const result = await pool.query(queryText, [req.params.id]);
const Description = result.rows;
res.send(Description);
    //res.render('spec', { info: result.rows });
  } catch (error) {
    console.error('Ошибка при запросе к базе данных:', error);
    res.status(500).send('Internal Server Error!)201023!');
  }
	
});

app.get('/add_fiz', async (req, res) => {
	
	try {
    // Запрос к базе данных для получения данных
    const result = await pool.query(`SELECT pk_tippasporta as pk, name as name
	FROM public.tippasporta;`);
    // Передача данных в шаблон Handlebars
    res.render('add_fiz', { info: result.rows });
  } catch (error) {
    console.error('Ошибка при запросе к базе данных:', error);
    res.status(500).send('Internal Server Error');
  }

})

app.post('/add_fiz', async (req, res) => {
    try {
        // Извлечение данных из тела запроса
        const { fio, pk_tippasporta, id, kemvidan, kogdavidan, inn, daterozhd, adrreg, kontinfo } = req.body;

        // Проверка, что все обязательные поля заполнены
        if (!fio || !pk_tippasporta || !id || !kemvidan || !kogdavidan || !inn || !daterozhd || !adrreg || !kontinfo) {
            return res.status(400).send('Все поля должны быть заполнены.');
        }

        const queryText = 'INSERT INTO fizlico (fio, pk_tippasporta, id, kemvidan, kogdavidan, inn, daterozhd, adrreg, kontinfo) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)';
        const values = [fio, pk_tippasporta, id, kemvidan, kogdavidan, inn, daterozhd, adrreg, kontinfo];
        await pool.query(queryText, values);

		res.redirect('/fz');
    } catch (error) {
        console.error('Ошибка при добавлении физического лица:', error);
        res.status(500).send('Внутренняя ошибка сервера.');
    }
});

app.get('/edit_fiz/:id', async (req, res) => {
    try {
        const doc_Id = req.params.id;
        // Выполнение SQL-запроса для получения данных юридического лица по ID
        const queryText = `
            SELECT pk_fizlico as pk, id, kogdavidan as kog, fio, inn, daterozhd as dr, adrreg, kontinfo,
			pk_tippasporta as pk_pt, kemvidan
			FROM public.fizlico
			WHERE pk_fizlico = $1;`;
        const result = await pool.query(queryText, [doc_Id]);

		const result2 = await pool.query(`SELECT pk_tippasporta as pk_tp, name as name
		FROM public.tippasporta;`);


        // Передача данных в шаблон и рендер страницы редактирования
        res.render('edit_fiz', { data: result.rows[0] ,info: result2.rows});
    } catch (error) {
        console.error('Ошибка при запросе данных для редактирования:', error);
        res.status(500).send('Внутренняя ошибка сервера.');
    }
});

app.post('/edit_fiz/:id', async (req, res) => {
    try {
        const doc_Id = req.params.id;
        // Извлечение данных из тела запроса
        const { fio, pk_tippasporta, id, kemvidan, kogdavidan, inn, daterozhd, adrreg, kontinfo } = req.body;

        // Проверка, что все обязательные поля заполнены
        if (!fio || !pk_tippasporta || !id || !kemvidan || !kogdavidan || !inn || !daterozhd || !adrreg || !kontinfo) {
            return res.status(400).send('Все поля должны быть заполнены.');
        }

        // Выполнение SQL-запроса для обновления данных в базе данных
        const queryText = `
            UPDATE fizlico
            SET fio = $1, pk_tippasporta = $2, id = $3, kemvidan = $4, kogdavidan = $5, inn = $6, daterozhd = $7, adrreg = $8, kontinfo = $9
            WHERE pk_fizlico = $10`;

        const values = [fio, pk_tippasporta, id, kemvidan, kogdavidan, inn, daterozhd, adrreg, kontinfo, doc_Id];

        await pool.query(queryText, values);

        // Редирект на страницу с информацией о физическом лице после успешного редактирования
        res.redirect(`/fz`);
    } catch (error) {
        console.error('Ошибка при редактировании физического лица:', error);
        res.status(500).send('Внутренняя ошибка сервера.');
    }
});


app.get('/add_yr', async (req, res) => {
	res.render('add_yr');
})

app.post('/add_yr', async (req, res) => {
    try {
        // Извлечение данных из тела запроса
        const { name, inn, ogrn, adrreg, kontinfo } = req.body;

        // Проверка, что все поля заполнены
        if (!name || !inn || !ogrn || !adrreg || !kontinfo) {
            return res.status(400).send('Все поля должны быть заполнены.');
        }

        // Выполнение SQL-запроса для добавления данных в базу данных
        const queryText = 'INSERT INTO jurlico (name, inn, ogrn, adrreg, kontinfo) VALUES ($1, $2, $3, $4, $5)';
        const values = [name, inn, ogrn, adrreg, kontinfo];
        await pool.query(queryText, values);

        // Успешный ответ
        //res.status(200).send('Юридическое лицо успешно добавлено.');
		res.redirect('/yr');
    } catch (error) {
        console.error('Ошибка при добавлении юридического лица:', error);
        res.status(500).send('Внутренняя ошибка сервера.');
    }
});




app.get('/edit_yr/:id', async (req, res) => {
    try {
        const doc_Id = req.params.id;
        // Выполнение SQL-запроса для получения данных юридического лица по ID
        const queryText = `
            SELECT pk_jurlico AS pk, name AS name, INN AS inn, ogrn AS ogrn, 
            AdrReg AS adr, Kontinfo AS info 
            FROM JurLico 
            WHERE pk_jurlico = $1`;
        const result = await pool.query(queryText, [doc_Id]);

        // Передача данных в шаблон и рендер страницы редактирования
        res.render('edit_yr', { data: result.rows[0] });
    } catch (error) {
        console.error('Ошибка при запросе данных для редактирования:', error);
        res.status(500).send('Внутренняя ошибка сервера.');
    }
});

app.post('/edit_yr/:id', async (req, res) => {
    try {
        const doc_Id = req.params.id;
        // Извлечение данных из тела запроса
        const { name, inn, ogrn, adrreg, kontinfo } = req.body;

        // Проверка, что все обязательные поля заполнены
        if (!name || !inn || !ogrn || !adrreg || !kontinfo) {
            return res.status(400).send('Все поля должны быть заполнены.');
        }

        // Выполнение SQL-запроса для обновления данных в базе данных
        const queryText = 'UPDATE JurLico SET name = $1, inn = $2, ogrn = $3, adrreg = $4, kontinfo = $5 WHERE pk_jurlico = $6';
        const values = [name, inn, ogrn, adrreg, kontinfo, doc_Id];
        await pool.query(queryText, values);

        // Редирект на страницу с информацией о юридическом лице после успешного редактирования
        res.redirect(`/yr`);
    } catch (error) {
        console.error('Ошибка при редактировании юридического лица:', error);
        res.status(500).send('Внутренняя ошибка сервера.');
    }
});


app.listen(port, host, function () {
    console.log(`Server listens http://${host}:${port}`);
});

process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  // Закрытие пула соединений
  await pool.end();
  process.exit();
});