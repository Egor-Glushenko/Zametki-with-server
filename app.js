const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Генерация уникальных ID
const generateId = () => Date.now() + Math.floor(Math.random() * 1000);

// Временная "база данных"
let users = [
  { id: 1, username: 'user', password: '123', email: 'user@example.com', createdAt: new Date().toISOString() }
];
let notes = [
  { 
    id: generateId(), 
    userId: 1, 
    title: 'Добро пожаловать!', 
    content: 'Это ваша первая заметка. 🎉', 
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['важное', 'приветствие']
  }
];

// ========== МАРШРУТЫ ПОЛЬЗОВАТЕЛЕЙ ==========

// Проверка работы сервера
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Сервер работает!', 
    usersCount: users.length,
    notesCount: notes.length,
    timestamp: new Date().toISOString()
  });
});

// Регистрация с валидацией
app.post('/api/register', (req, res) => {
  console.log('Регистрация:', req.body);
  
  const { username, password, email } = req.body;
  
  // Валидация
  if (!username || !password || !email) {
    return res.status(400).json({ 
      error: 'Все поля обязательны',
      fields: { username: !username, password: !password, email: !email }
    });
  }
  
  if (username.length < 3) {
    return res.status(400).json({ error: 'Имя пользователя должно быть не менее 3 символов' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' });
  }
  
  if (!email.includes('@')) {
    return res.status(400).json({ error: 'Некорректный email' });
  }
  
  // Проверка существования пользователя
  if (users.some(u => u.username === username)) {
    return res.status(409).json({ error: 'Пользователь с таким именем уже существует' });
  }
  
  if (users.some(u => u.email === email)) {
    return res.status(409).json({ error: 'Пользователь с таким email уже существует' });
  }
  
  // Создание пользователя
  const newUser = {
    id: generateId(),
    username,
    password, // В реальном приложении нужно хэшировать!
    email,
    createdAt: new Date().toISOString(),
    isActive: true
  };
  
  users.push(newUser);
  console.log('Новый пользователь создан:', { id: newUser.id, username });
  
  // Создание первой заметки для нового пользователя
  const welcomeNote = {
    id: generateId(),
    userId: newUser.id,
    title: 'Добро пожаловать! 👋',
    content: `Привет, ${username}! Добро пожаловать в приложение для заметок. Это ваша первая заметка. Вы можете ее отредактировать или удалить.`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['приветствие', 'инструкция']
  };
  
  notes.push(welcomeNote);
  
  res.status(201).json({ 
    success: true, 
    message: 'Регистрация успешна!',
    userId: newUser.id,
    username: newUser.username,
    noteId: welcomeNote.id
  });
});

// Вход пользователя
app.post('/api/login', (req, res) => {
  console.log('Логин запрос:', req.body);
  
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Логин и пароль обязательны' });
  }
  
  const user = users.find(u => 
    u.username === username && 
    u.password === password &&
    u.isActive !== false
  );
  
  if (!user) {
    return res.status(401).json({ error: 'Неверный логин или пароль' });
  }
  
  // Обновляем время последнего входа
  user.lastLogin = new Date().toISOString();
  
  res.json({ 
    success: true,
    token: user.id.toString(),
    username: user.username,
    email: user.email,
    userId: user.id,
    createdAt: user.createdAt
  });
});

// Получение профиля пользователя
app.get('/api/profile', (req, res) => {
  const token = req.headers.authorization;
  
  if (!token) {
    return res.status(401).json({ error: 'Не авторизован' });
  }
  
  const userId = parseInt(token);
  const user = users.find(u => u.id === userId && u.isActive !== false);
  
  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }
  
  // Не отправляем пароль
  const { password, ...userData } = user;
  res.json(userData);
});

// ========== МИДЛВАР АВТОРИЗАЦИИ ==========
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;
  
  if (!token) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }
  
  const userId = parseInt(token);
  
  if (isNaN(userId)) {
    return res.status(401).json({ error: 'Неверный токен' });
  }
  
  const user = users.find(u => u.id === userId && u.isActive !== false);
  
  if (!user) {
    return res.status(401).json({ error: 'Пользователь не найден' });
  }
  
  req.userId = userId;
  req.user = user;
  next();
};

// ========== МАРШРУТЫ ЗАМЕТОК (CRUD) ==========

// Получить все заметки пользователя
app.get('/api/notes', authMiddleware, (req, res) => {
  const userNotes = notes
    .filter(note => note.userId === req.userId)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)); // Сначала новые
  
  console.log(`Заметки пользователя ${req.userId}: ${userNotes.length} шт.`);
  
  res.json(userNotes);
});

// Получить одну заметку по ID
app.get('/api/notes/:id', authMiddleware, (req, res) => {
  const noteId = parseInt(req.params.id);
  const note = notes.find(n => n.id === noteId && n.userId === req.userId);
  
  if (!note) {
    return res.status(404).json({ error: 'Заметка не найдена' });
  }
  
  res.json(note);
});

// Создать новую заметку
app.post('/api/notes', authMiddleware, (req, res) => {
  const { title, content, tags } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({ error: 'Заголовок и содержимое обязательны' });
  }
  
  const now = new Date().toISOString();
  const newNote = {
    id: generateId(),
    userId: req.userId,
    title: title.trim(),
    content: content.trim(),
    tags: Array.isArray(tags) ? tags : [],
    createdAt: now,
    updatedAt: now,
    isFavorite: false
  };
  
  notes.push(newNote);
  console.log(`Создана заметка: ${newNote.title} (ID: ${newNote.id})`);
  
  res.status(201).json(newNote);
});

// Обновить существующую заметку
app.put('/api/notes/:id', authMiddleware, (req, res) => {
  const noteId = parseInt(req.params.id);
  const { title, content, tags, isFavorite } = req.body;
  
  const noteIndex = notes.findIndex(n => n.id === noteId && n.userId === req.userId);
  
  if (noteIndex === -1) {
    return res.status(404).json({ error: 'Заметка не найдена' });
  }
  
  // Обновляем только переданные поля
  if (title !== undefined) notes[noteIndex].title = title.trim();
  if (content !== undefined) notes[noteIndex].content = content.trim();
  if (tags !== undefined) notes[noteIndex].tags = Array.isArray(tags) ? tags : [];
  if (isFavorite !== undefined) notes[noteIndex].isFavorite = Boolean(isFavorite);
  
  notes[noteIndex].updatedAt = new Date().toISOString();
  
  console.log(`Обновлена заметка: ${notes[noteIndex].title} (ID: ${noteId})`);
  
  res.json(notes[noteIndex]);
});

// Удалить заметку
app.delete('/api/notes/:id', authMiddleware, (req, res) => {
  const noteId = parseInt(req.params.id);
  const noteIndex = notes.findIndex(n => n.id === noteId && n.userId === req.userId);
  
  if (noteIndex === -1) {
    return res.status(404).json({ error: 'Заметка не найдена' });
  }
  
  const deletedNote = notes[noteIndex];
  notes.splice(noteIndex, 1);
  
  console.log(`Удалена заметка: ${deletedNote.title} (ID: ${noteId})`);
  
  res.json({ 
    success: true, 
    message: 'Заметка удалена',
    noteId: deletedNote.id 
  });
});

// Поиск заметок
app.get('/api/notes/search/:query', authMiddleware, (req, res) => {
  const query = req.params.query.toLowerCase();
  
  const filteredNotes = notes.filter(note => 
    note.userId === req.userId &&
    (note.title.toLowerCase().includes(query) || 
     note.content.toLowerCase().includes(query))
  );
  
  res.json(filteredNotes);
});

// Получить статистику
app.get('/api/stats', authMiddleware, (req, res) => {
  const userNotes = notes.filter(note => note.userId === req.userId);
  
  const stats = {
    total: userNotes.length,
    favorites: userNotes.filter(n => n.isFavorite).length,
    lastCreated: userNotes.length > 0 ? 
      new Date(userNotes[userNotes.length - 1].createdAt).toLocaleDateString() : 
      null,
    lastUpdated: userNotes.length > 0 ? 
      new Date(userNotes[0].updatedAt).toLocaleDateString() : // Первая заметка в сортировке по updatedAt
      null,
    tags: [...new Set(userNotes.flatMap(n => n.tags || []))],
    byMonth: {}
  };
  
  // Статистика по месяцам
  userNotes.forEach(note => {
    const month = new Date(note.createdAt).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
    stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;
  });
  
  res.json(stats);
});

module.exports = app;