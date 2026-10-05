# Web Sederhana CCTV

Proyek ini memiliki struktur **frontend** dan **backend** yang terpisah.

## Struktur Folder

```
web_sederhana_cctv/
├── frontend/        # React + Vite
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/         # Node.js + Express
│   ├── index.js
│   ├── .env
│   └── package.json
└── README.md
```

## Cara Menjalankan

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Berjalan di: http://localhost:5173

### Backend (Node.js + Express)
```bash
cd backend
npm install
npm run dev
```
Berjalan di: http://localhost:5000

## API Endpoint (Backend)
| Method | URL           | Keterangan             |
|--------|---------------|------------------------|
| GET    | /             | Cek status server      |
| GET    | /api/hello    | Contoh endpoint API    |
