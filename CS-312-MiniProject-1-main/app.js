const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg'); // PostgreSQL Pool for database connections
const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// PostgreSQL Database connection
const pool = new Pool({
    user: 'postgres',  // replace with your PostgreSQL username
    host: 'localhost',
    database: 'blogdb',     // replace with your database name (all lowercase, as created earlier)
    password: 'CS312IsCool', // replace with your PostgreSQL password
    port: 5432,
});

// Log when the app connects to the database
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error connecting to the database:', err.stack);
    } else {
        console.log('Connected to the PostgreSQL database');
    }
    release();
});

// Route to show all posts from the database
app.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM blogs ORDER BY date_created DESC');
        console.log('Retrieved posts:', result.rows);  // Log the retrieved posts
        res.render('index', { posts: result.rows });
    } catch (err) {
        console.error('Error retrieving blog posts:', err);
        res.send('Error retrieving blog posts.');
    }
});

// Route to show the form to create a post
app.get('/create', (req, res) => {
    res.render('create');
});

// Route to handle post creation
app.post('/create', async (req, res) => {
    const { title, author, content } = req.body;
    try {
        await pool.query(
            'INSERT INTO blogs (title, creator_name, body, creator_user_id) VALUES ($1, $2, $3, $4)',
            [title, author, content, 1] // Using a fixed user_id (1) for now. Update this when implementing user sessions.
        );
        res.redirect('/');
    } catch (err) {
        console.error('Error creating blog post:', err);
        res.send('Error creating blog post.');
    }
});

// Route to show the form to edit a post
app.get('/edit/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM blogs WHERE blog_id = $1', [req.params.id]);
        if (result.rows.length > 0) {
            res.render('edit', { post: result.rows[0] });
        } else {
            res.send('Post not found.');
        }
    } catch (err) {
        console.error('Error retrieving post for editing:', err);
        res.send('Error retrieving post for editing.');
    }
});

// Route to handle post editing
app.post('/edit/:id', async (req, res) => {
    const { title, content } = req.body;
    try {
        await pool.query('UPDATE blogs SET title = $1, body = $2 WHERE blog_id = $3', [title, content, req.params.id]);
        res.redirect('/');
    } catch (err) {
        console.error('Error updating post:', err);
        res.send('Error updating post.');
    }
});

// Route to handle post deletion
app.get('/delete/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM blogs WHERE blog_id = $1', [req.params.id]);
        res.redirect('/');
    } catch (err) {
        console.error('Error deleting post:', err);
        res.send('Error deleting post.');
    }
});

// Route to show the sign-up form
app.get('/signup', (req, res) => {
    res.render('signup');
});

// Route to handle user sign-up
app.post('/signup', async (req, res) => {
    const { name, password } = req.body;
    try {
        await pool.query('INSERT INTO users (name, password) VALUES ($1, $2)', [name, password]);
        res.redirect('/signin');
    } catch (err) {
        console.error('Error signing up:', err);
        res.send('Error signing up.');
    }
});

// Route to show the sign-in form
app.get('/signin', (req, res) => {
    res.render('signin');
});

// Route to handle user sign-in
app.post('/signin', async (req, res) => {
    const { name, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE name = $1 AND password = $2', [name, password]);
        if (result.rows.length > 0) {
            res.redirect('/');
        } else {
            res.send('Invalid credentials. Please try again.');
        }
    } catch (err) {
        console.error('Error signing in:', err);
        res.send('Error signing in.');
    }
});

// Start the server
app.listen(4000, () => {
    console.log('Server is running on port 4000');
});
