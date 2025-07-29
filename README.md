# 📖 Lissen – Backend API (v1)

Backend de l’application **Lissen**, développée avec **Node.js**, **Express.js**, et **PostgreSQL** via **Sequelize ORM**.

---

## 🚀 Technologies

- **Node.js**
- **Express.js**
- **PostgreSQL**
- **Sequelize ORM**
- **REST API**
- **Postman (test & documentation)**

---

## 📁 Structure du projet

```
.
├── config/                 # Configuration Sequelize / base de données
├── controllers/            # Contrôleurs Express (logique d'API)
├── helpers/                # Utilitaires (ex. exportFormatter)
├── models/                 # Modèles Sequelize
├── routes/                 # Définition des endpoints API
├── services/               # Logique métier des entités
├── index.js                # Entrée principale de l'app Express
├── server.js               # Lancement du serveur et synchronisation DB
├── .env                    # Variables d'environnement
└── README.md               # Documentation projet
```

---

## 🔌 Lancement rapide

1. Cloner le projet
2. Copier `.env.example` vers `.env`
3. Installer les dépendances :
```bash
npm install
```
4. Démarrer le serveur :
```bash
node server.js
```

---

## 🔐 Variables d’environnement (.env)

Exemple de contenu :
```
DATABASE_URL=postgres://user:password@localhost:5432/lissen
PORT=5000
```

---

## 📚 Routes disponibles (API REST)

### 🎨 Thèmes
- `GET    /api/themes`
- `POST   /api/themes`
- `DELETE /api/themes/:name`

### 📖 Bibles
- `GET /api/bibles/:code/books`
- `GET /api/bibles/:code/books/:bookId`

### 📘 Livres & Versets
- `GET /api/books/:bookId/verses`
- `GET /api/books/:bookId/verses/:id`
- `GET /api/books/:bookId/:chapterNum/verses`
- `GET /api/books/:bookId/:chapterNum/:verseNum`
- `GET /api/books/code/:bookCode/:chapterNum/verses`
- `GET /api/books/code/:bookCode/:chapterNum/:verseNum`

### 📝 Méditations
- `POST   /api/meditations/:verseId/toggle`
- `PUT    /api/meditations/:verseId/commentary`
- `POST   /api/meditations/:verseId/themes`
- `DELETE /api/meditations/:verseId/themes/:themeId`
- `GET    /api/meditations/export`

---

## 🧪 Tests API

Utilise [Postman](https://www.postman.com/) :
- Fichier : `Lissen_API_Collection.postman_collection.json`

---

## 🚧 Sécurité

Aucune authentification en V1.  
Des mécanismes de sécurité seront ajoutés dans la V2 :
- Authentification par token
- Rôles & permissions
- Journalisation & protection API

---

## 🧑‍💻 Auteur

Développé dans le cadre de l’application **Lissen**, un outil de méditation quotidienne autour de la Bible.