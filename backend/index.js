// index.js
// library import

const express = require('express');
const cors = require('cors');
const { body, validationResult } = require('express-validator');
const { Todo } = require('./models');
const { Op } = require('sequelize'); 

// initialize
const app = express();
const PORT = 2002

// mdwr
app.use(cors());
app.use(express.json());

// server listen
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});

// GET all todos
app.get('/todos', async (req, res) => {
  try {
    const todos = await Todo.findAll();
    res.json(todos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'gagal mengambil data todos' });
  }
});


// GET todo by exact title
app.get('/todos/title/:title', async (req, res) => {
  try {
    const title = req.params.title;
    const todo = await Todo.findOne({ where: { title } });
    if (!todo) {
      return res.status(404).json({ error: 'Todo dengan title tersebut tidak ditemukan' });
    }
    res.json(todo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'gagal mencari todo by title' });
  }
});
//get todo partial search
app.get('/todos/search', async (req, res) => {
  try {
    const q = req.query.title;
    if (!q) {
      return res.status(400).json({ error: 'query param title required, contoh: /todos/search?title=foo' });
    }

    const todos = await Todo.findAll({
      where: {
        title: {
          [Op.like]: `%${q}%`
        }
      },
      order: [['createdAt', 'DESC']],
    });

    res.json(todos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'gagal melakukan pencarian todos' });
  }
});

// post
app.post(
  '/todos',
  body('title').notEmpty().withMessage('wajib isi judul'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title, description } = req.body;
      const todo = await Todo.create({ title, description, completed: false });
      res.status(201).json(todo);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Gagal membuat todo' });
    }
  }
);

// put
app.put('/todos/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { title, description, completed } = req.body;
    const todo = await Todo.findByPk(id);
    if (!todo) {
      return res.status(404).json({ error: 'Todo tidak ditemukan' });
    }

    await todo.update({ title, description, completed });
    res.json(todo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal mengupdate todo' });
  }
});

// DELETE
app.delete('/todos/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const todo = await Todo.findByPk(id);

    if (!todo) {
      return res.status(404).json({ error: 'Todo tidak ditemukan' });
    }

    await todo.destroy();
    res.json({ message: 'Todo berhasil dihapus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal menghapus todo' });
  }
});

