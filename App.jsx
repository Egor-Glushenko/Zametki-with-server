import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

// ========== КОМПОНЕНТЫ ==========

// Тестирование соединения
const TestConnection = () => {
  const [status, setStatus] = useState('Проверяем соединение...');
  const [details, setDetails] = useState(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/test');
        const data = await res.json();
        setStatus('✅ Сервер работает!');
        setDetails(data);
      } catch (err) {
        setStatus(`❌ Ошибка: ${err.message}`);
      }
    };
    checkConnection();
  }, []);

  return (
    <div style={styles.container}>
      <h2>Тестирование соединения</h2>
      <div style={styles.statusBox}>
        <h3>{status}</h3>
        {details && (
          <div style={styles.details}>
            <p><strong>Сообщение:</strong> {details.message}</p>
            <p><strong>Пользователей:</strong> {details.usersCount}</p>
            <p><strong>Заметок:</strong> {details.notesCount}</p>
            <p><strong>Время:</strong> {new Date(details.timestamp).toLocaleString()}</p>
          </div>
        )}
      </div>
      <button onClick={() => window.location.href = '/'} style={styles.button}>
        На главную
      </button>
    </div>
  );
};

// Компонент регистрации
const Register = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Очищаем ошибку при вводе
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Имя пользователя обязательно';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Минимум 3 символа';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email обязателен';
    } else if (!formData.email.includes('@')) {
      newErrors.email = 'Некорректный email';
    }

    if (!formData.password) {
      newErrors.password = 'Пароль обязателен';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Минимум 6 символов';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccess('');

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('✅ Регистрация успешна! Выполняется вход...');
        
        // Автоматический вход после регистрации
        setTimeout(async () => {
          try {
            const loginRes = await fetch('http://localhost:5000/api/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                username: formData.username,
                password: formData.password
              })
            });

            const loginData = await loginRes.json();

            if (loginRes.ok) {
              localStorage.setItem('token', loginData.token);
              localStorage.setItem('username', loginData.username);
              localStorage.setItem('userId', loginData.userId);
              localStorage.setItem('userEmail', loginData.email);
              
              if (onLogin) onLogin(loginData.username);
              window.location.href = '/notes';
            }
          // eslint-disable-next-line no-unused-vars
          } catch (loginErr) {
            setErrors({ general: 'Ошибка автоматического входа' });
          }
        }, 1500);
      } else {
        setErrors({ general: data.error || 'Ошибка регистрации' });
      }
    } catch (err) {
      setErrors({ general: 'Ошибка подключения к серверу' });
      console.error('Ошибка регистрации:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2>Регистрация нового аккаунта</h2>
      
      {success && (
        <div style={styles.successBox}>
          {success}
        </div>
      )}

      {errors.general && (
        <div style={styles.errorBox}>
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label htmlFor="username">Имя пользователя *</label>
          <input
            id="username"
            name="username"
            type="text"
            value={formData.username}
            onChange={handleChange}
            placeholder="min 3 символа"
            style={errors.username ? styles.inputError : styles.input}
            disabled={loading}
          />
          {errors.username && <span style={styles.errorText}>{errors.username}</span>}
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="email">Email *</label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="user@example.com"
            style={errors.email ? styles.inputError : styles.input}
            disabled={loading}
          />
          {errors.email && <span style={styles.errorText}>{errors.email}</span>}
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="password">Пароль *</label>
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="min 6 символов"
            style={errors.password ? styles.inputError : styles.input}
            disabled={loading}
          />
          {errors.password && <span style={styles.errorText}>{errors.password}</span>}
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="confirmPassword">Подтверждение пароля *</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="повторите пароль"
            style={errors.confirmPassword ? styles.inputError : styles.input}
            disabled={loading}
          />
          {errors.confirmPassword && <span style={styles.errorText}>{errors.confirmPassword}</span>}
        </div>

        <button 
          type="submit" 
          style={styles.primaryButton}
          disabled={loading}
        >
          {loading ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p>
            Уже есть аккаунт?{' '}
            <a href="/" style={styles.link} onClick={(e) => {
              e.preventDefault();
              window.location.href = '/';
            }}>
              Войти
            </a>
          </p>
        </div>
      </form>
    </div>
  );
};

// Компонент входа
const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('userEmail', data.email);
        
        if (onLogin) onLogin(data.username);
        window.location.href = '/notes';
      } else {
        setError(data.error || 'Ошибка входа');
      }
    } catch (err) {
      setError('Не удалось подключиться к серверу');
      console.error('Ошибка входа:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginHeader}>
        <h2>Вход в систему заметок</h2>
        <p style={{ color: '#666' }}>Управляйте своими идеями и задачами</p>
      </div>

      {error && (
        <div style={styles.errorBox}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label htmlFor="login-username">Имя пользователя</label>
          <input
            id="login-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Введите логин"
            style={styles.input}
            disabled={loading}
            required
          />
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="login-password">Пароль</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Введите пароль"
            style={styles.input}
            disabled={loading}
            required
          />
        </div>

        <button 
          type="submit" 
          style={styles.primaryButton}
          disabled={loading || !username || !password}
        >
          {loading ? 'Вход...' : 'Войти'}
        </button>

        <div style={styles.loginFooter}>
          <p style={{ marginBottom: '10px' }}>
            <strong>Тестовый аккаунт:</strong> user / 123
          </p>
          <p>
            Нет аккаунта?{' '}
            <a href="/register" style={styles.link} onClick={(e) => {
              e.preventDefault();
              window.location.href = '/register';
            }}>
              Зарегистрироваться
            </a>
          </p>
          <p>
            <a href="/test" style={{ ...styles.link, fontSize: '0.9em' }}>
              Проверить соединение с сервером
            </a>
          </p>
        </div>
      </form>
    </div>
  );
};

// Модальное окно редактирования заметки
const EditNoteModal = ({ note, onClose, onSave, isOpen }) => {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [tags, setTags] = useState(note?.tags?.join(', ') || '');
  const [isFavorite, setIsFavorite] = useState(note?.isFavorite || false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setTags(note.tags?.join(', ') || '');
      setIsFavorite(note.isFavorite || false);
    }
  }, [note]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !content.trim()) {
      setError('Заголовок и содержимое обязательны');
      return;
    }

    setLoading(true);

    try {
      const tagsArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      await onSave({
        ...note,
        title: title.trim(),
        content: content.trim(),
        tags: tagsArray,
        isFavorite
      });
    } catch (err) {
      setError('Ошибка при сохранении');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div style={styles.modalOverlay} onClick={handleOverlayClick}>
      <div style={styles.modalContent}>
        <div style={styles.modalHeader}>
          <h3>{note ? 'Редактировать заметку' : 'Новая заметка'}</h3>
          <button onClick={onClose} style={styles.closeButton}>&times;</button>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label>Заголовок *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введите заголовок"
              style={styles.input}
              disabled={loading}
            />
          </div>

          <div style={styles.formGroup}>
            <label>Содержимое *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Введите текст заметки"
              rows={6}
              style={{ ...styles.input, resize: 'vertical' }}
              disabled={loading}
            />
          </div>

          <div style={styles.formGroup}>
            <label>Теги (через запятую)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="работа, личное, идеи"
              style={styles.input}
              disabled={loading}
            />
            <small style={{ color: '#666', fontSize: '0.9em' }}>
              Пример: работа, личное, идеи, покупки
            </small>
          </div>

          <div style={styles.formGroup}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                checked={isFavorite}
                onChange={(e) => setIsFavorite(e.target.checked)}
                disabled={loading}
              />
              <span>Добавить в избранное</span>
            </label>
          </div>

          <div style={styles.modalActions}>
            <button
              type="button"
              onClick={onClose}
              style={styles.secondaryButton}
              disabled={loading}
            >
              Отмена
            </button>
            <button
              type="submit"
              style={styles.primaryButton}
              disabled={loading || !title.trim() || !content.trim()}
            >
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Главный компонент заметок
const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFavorite, setFilterFavorite] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [stats, setStats] = useState(null);

  const username = localStorage.getItem('username') || 'Гость';
  const userEmail = localStorage.getItem('userEmail');

  // Загрузка заметок
  useEffect(() => {
    loadNotes();
    loadStats();
  }, []);

  const loadNotes = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      window.location.href = '/';
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/notes', {
        headers: { 
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      if (res.status === 401) {
        localStorage.clear();
        window.location.href = '/';
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setNotes(data);
        setError('');
      } else {
        const errData = await res.json();
        setError(errData.error || 'Ошибка загрузки');
      }
    } catch (err) {
      setError('Ошибка подключения к серверу');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch('http://localhost:5000/api/stats', {
        headers: { 
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Ошибка загрузки статистики:', err);
    }
  };

  // Создание заметки
  const handleCreateNote = () => {
    setEditingNote(null);
    setShowEditModal(true);
  };

  // Редактирование заметки
  const handleEditNote = (note) => {
    setEditingNote(note);
    setShowEditModal(true);
  };

  // Сохранение заметки (создание или обновление)
  const handleSaveNote = async (noteData) => {
    const token = localStorage.getItem('token');
    const isNewNote = !noteData.id;

    try {
      const url = isNewNote 
        ? 'http://localhost:5000/api/notes'
        : `http://localhost:5000/api/notes/${noteData.id}`;

      const method = isNewNote ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: noteData.title,
          content: noteData.content,
          tags: noteData.tags,
          isFavorite: noteData.isFavorite
        })
      });

      if (res.ok) {
        const savedNote = await res.json();
        
        if (isNewNote) {
          setNotes(prev => [savedNote, ...prev]);
        } else {
          setNotes(prev => prev.map(n => 
            n.id === savedNote.id ? savedNote : n
          ));
        }

        setShowEditModal(false);
        setEditingNote(null);
        loadStats(); // Обновляем статистику
      } else {
        const errData = await res.json();
        alert(errData.error || 'Ошибка сохранения');
      }
    } catch (err) {
      alert('Ошибка подключения к серверу');
      console.error(err);
    }
  };

  // Удаление заметки
  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту заметку?')) {
      return;
    }

    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`http://localhost:5000/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        setNotes(prev => prev.filter(note => note.id !== noteId));
        loadStats(); // Обновляем статистику
      } else {
        const errData = await res.json();
        alert(errData.error || 'Ошибка удаления');
      }
    } catch (err) {
      alert('Ошибка подключения к серверу');
      console.error(err);
    }
  };

  // Переключение избранного
  const handleToggleFavorite = async (note) => {
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`http://localhost:5000/api/notes/${note.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...note,
          isFavorite: !note.isFavorite
        })
      });

      if (res.ok) {
        const updatedNote = await res.json();
        setNotes(prev => prev.map(n => 
          n.id === updatedNote.id ? updatedNote : n
        ));
      }
    } catch (err) {
      console.error('Ошибка обновления:', err);
    }
  };

  // Фильтрация заметок
  const filteredNotes = notes.filter(note => {
    const matchesSearch = searchQuery === '' || 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFavorite = !filterFavorite || note.isFavorite;
    
    return matchesSearch && matchesFavorite;
  });

  // Выход
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <h3>Загрузка заметок...</h3>
          <div style={styles.spinner}></div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Заголовок и управление */}
      <div style={styles.header}>
        <div>
          <h2 style={{ margin: 0 }}>📝 Мои заметки</h2>
          <p style={{ margin: '5px 0 0 0', color: '#666' }}>
            {username} {userEmail && `(${userEmail})`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            onClick={handleCreateNote}
            style={styles.primaryButton}
            title="Создать новую заметку"
          >
            + Новая заметка
          </button>
          <button 
            onClick={handleLogout}
            style={styles.logoutButton}
            title="Выйти из аккаунта"
          >
            Выйти
          </button>
        </div>
      </div>

      {/* Статистика */}
      {stats && (
        <div style={styles.statsContainer}>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{stats.total}</div>
              <div style={styles.statLabel}>Всего заметок</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{stats.favorites}</div>
              <div style={styles.statLabel}>Избранных</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{stats.tags?.length || 0}</div>
              <div style={styles.statLabel}>Тегов</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>
                {stats.lastUpdated ? '✓' : '—'}
              </div>
              <div style={styles.statLabel}>Обновлено</div>
            </div>
          </div>
        </div>
      )}

      {/* Поиск и фильтры */}
      <div style={styles.searchContainer}>
        <div style={styles.searchBox}>
          <input
            type="text"
            placeholder="Поиск по заметкам..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              style={styles.clearSearchButton}
              title="Очистить поиск"
            >
              &times;
            </button>
          )}
        </div>
        
        <div style={styles.filters}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={filterFavorite}
              onChange={(e) => setFilterFavorite(e.target.checked)}
            />
            Только избранные
          </label>
          <button 
            onClick={loadNotes}
            style={styles.refreshButton}
            title="Обновить список"
          >
            ⟳ Обновить
          </button>
        </div>
      </div>

      {/* Сообщения об ошибках */}
      {error && (
        <div style={styles.errorBox}>
          {error}
          <button 
            onClick={() => window.location.href = '/'}
            style={{ marginLeft: '10px', padding: '5px 10px' }}
          >
            Войти заново
          </button>
        </div>
      )}

      {/* Список заметок */}
      <div style={styles.notesGrid}>
        {filteredNotes.length === 0 ? (
          <div style={styles.emptyState}>
            {searchQuery || filterFavorite ? (
              <>
                <h3>Ничего не найдено</h3>
                <p>Попробуйте изменить параметры поиска</p>
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setFilterFavorite(false);
                  }}
                  style={styles.secondaryButton}
                >
                  Сбросить фильтры
                </button>
              </>
            ) : (
              <>
                <h3>У вас пока нет заметок</h3>
                <p>Создайте первую заметку, нажав кнопку "Новая заметка"</p>
                <button 
                  onClick={handleCreateNote}
                  style={styles.primaryButton}
                >
                  Создать первую заметку
                </button>
              </>
            )}
          </div>
        ) : (
          filteredNotes.map(note => (
            <div 
              key={note.id} 
              style={{
                ...styles.noteCard,
                borderLeft: note.isFavorite ? '4px solid #ffd700' : '4px solid #007bff'
              }}
            >
              <div style={styles.noteHeader}>
                <h3 style={{ margin: 0, flex: 1 }}>{note.title}</h3>
                <div style={styles.noteActions}>
                  <button
                    onClick={() => handleToggleFavorite(note)}
                    style={styles.iconButton}
                    title={note.isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
                  >
                    {note.isFavorite ? '★' : '☆'}
                  </button>
                  <button
                    onClick={() => handleEditNote(note)}
                    style={styles.iconButton}
                    title="Редактировать"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    style={{ ...styles.iconButton, color: '#dc3545' }}
                    title="Удалить"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div style={styles.noteContent}>
                <p>{note.content}</p>
              </div>

              {note.tags && note.tags.length > 0 && (
                <div style={styles.tagsContainer}>
                  {note.tags.map((tag, index) => (
                    <span key={index} style={styles.tag}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div style={styles.noteFooter}>
                <div style={styles.noteDates}>
                  <small title="Дата создания">
                    📅 {new Date(note.createdAt).toLocaleDateString()}
                  </small>
                  {note.updatedAt !== note.createdAt && (
                    <small title="Дата обновления">
                      ✏️ {new Date(note.updatedAt).toLocaleDateString()}
                    </small>
                  )}
                </div>
                <small style={{ color: '#666' }}>
                  ID: {note.id.toString().slice(-6)}
                </small>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Модальное окно редактирования */}
      <EditNoteModal
        note={editingNote}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingNote(null);
        }}
        onSave={handleSaveNote}
      />
    </div>
  );
};

// Защищенный маршрут
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  
  if (!token || !username) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// ========== СТИЛИ ==========
const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  
  // Заголовок
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '30px',
    paddingBottom: '20px',
    borderBottom: '2px solid #e9ecef',
  },
  
  // Формы
  form: {
    maxWidth: '500px',
    margin: '0 auto',
  },
  formGroup: {
    marginBottom: '20px',
  },
  input: {
    width: '100%',
    padding: '12px 15px',
    fontSize: '16px',
    border: '1px solid #ced4da',
    borderRadius: '8px',
    boxSizing: 'border-box',
    transition: 'border-color 0.3s',
  },
  inputError: {
    width: '100%',
    padding: '12px 15px',
    fontSize: '16px',
    border: '1px solid #dc3545',
    borderRadius: '8px',
    boxSizing: 'border-box',
    backgroundColor: '#fffafa',
  },
  
  // Кнопки
  button: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'background-color 0.3s',
  },
  primaryButton: {
    padding: '12px 24px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'background-color 0.3s',
  },
  secondaryButton: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.3s',
  },
  logoutButton: {
    padding: '8px 16px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  iconButton: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '5px',
    color: '#666',
    transition: 'color 0.3s',
  },
  
  // Сообщения
  errorBox: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #f5c6cb',
  },
  successBox: {
    backgroundColor: '#d4edda',
    color: '#155724',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #c3e6cb',
  },
  errorText: {
    color: '#dc3545',
    fontSize: '14px',
    marginTop: '5px',
    display: 'block',
  },
  
  // Ссылки
  link: {
    color: '#007bff',
    textDecoration: 'none',
    fontWeight: '600',
    cursor: 'pointer',
  },
  
  // Статистика
  statsContainer: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '10px',
    marginBottom: '30px',
    border: '1px solid #e9ecef',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px',
  },
  statCard: {
    textAlign: 'center',
    padding: '15px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: '5px',
  },
  statLabel: {
    fontSize: '14px',
    color: '#6c757d',
  },
  
  // Поиск
  searchContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    gap: '20px',
    flexWrap: 'wrap',
  },
  searchBox: {
    flex: 1,
    position: 'relative',
    minWidth: '300px',
  },
  searchInput: {
    width: '100%',
    padding: '12px 40px 12px 15px',
    fontSize: '16px',
    border: '2px solid #dee2e6',
    borderRadius: '25px',
    transition: 'border-color 0.3s',
  },
  clearSearchButton: {
    position: 'absolute',
    right: '15px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#6c757d',
  },
  filters: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  refreshButton: {
    padding: '8px 15px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  
  // Заметки
  notesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px',
  },
  noteCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.3s, box-shadow 0.3s',
  },
  noteHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '15px',
  },
  noteActions: {
    display: 'flex',
    gap: '5px',
  },
  noteContent: {
    flex: 1,
    marginBottom: '15px',
    color: '#495057',
    lineHeight: '1.6',
  },
  tagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '15px',
  },
  tag: {
    backgroundColor: '#e9ecef',
    color: '#495057',
    padding: '4px 10px',
    borderRadius: '15px',
    fontSize: '12px',
  },
  noteFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '15px',
    borderTop: '1px solid #e9ecef',
  },
  noteDates: {
    display: 'flex',
    gap: '15px',
  },
  
  // Пустое состояние
  emptyState: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    border: '2px dashed #dee2e6',
  },
  
  // Загрузка
  loadingContainer: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  spinner: {
    width: '50px',
    height: '50px',
    margin: '20px auto',
    border: '5px solid #f3f3f3',
    borderTop: '5px solid #007bff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  
  // Модальное окно
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '30px',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '25px',
    paddingBottom: '15px',
    borderBottom: '2px solid #e9ecef',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '28px',
    cursor: 'pointer',
    color: '#6c757d',
    padding: '0',
    width: '30px',
    height: '30px',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '15px',
    marginTop: '30px',
  },
  
  // Страница входа
  loginHeader: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  loginFooter: {
    marginTop: '30px',
    textAlign: 'center',
    paddingTop: '20px',
    borderTop: '1px solid #e9ecef',
  },
  
  // Тестирование
  statusBox: {
    backgroundColor: '#e9ecef',
    padding: '25px',
    borderRadius: '10px',
    marginBottom: '25px',
  },
  details: {
    backgroundColor: 'white',
    padding: '15px',
    borderRadius: '8px',
    marginTop: '15px',
  },
};

// Добавляем CSS анимацию для спиннера
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`, styleSheet.cssRules.length);

// ========== ГЛАВНЫЙ КОМПОНЕНТ ==========
function App() {
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('username') || null;
  });

  const handleLogin = (name) => {
    setUsername(name);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/test" element={<TestConnection />} />
        <Route 
          path="/" 
          element={
            username ? 
            <Navigate to="/notes" replace /> : 
            <Login onLogin={handleLogin} />
          } 
        />
        <Route 
          path="/register" 
          element={
            username ? 
            <Navigate to="/notes" replace /> : 
            <Register onLogin={handleLogin} />
          } 
        />
        <Route 
          path="/notes" 
          element={
            <PrivateRoute>
              <Notes />
            </PrivateRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;