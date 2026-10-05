"""
Script untuk test apakah model bisa diload dan melakukan deteksi.
Jalankan: python test_model.py
"""
import sys
import os

MODEL_PATH = "./models/best_model (1).pth"

print("=" * 50)
print("TEST LOADING MODEL YOLOV8")
print("=" * 50)

# 1. Cek file ada
if not os.path.exists(MODEL_PATH):
    print(f"[ERROR] File tidak ditemukan: {MODEL_PATH}")
    sys.exit(1)

size_mb = os.path.getsize(MODEL_PATH) / (1024 * 1024)
print(f"[OK] File ditemukan: {MODEL_PATH} ({size_mb:.1f} MB)")

# 2. Load model
print("\n[INFO] Memuat model...")
try:
    from ultralytics import YOLO
    model = YOLO(MODEL_PATH)
    print("[OK] Model berhasil dimuat!")
    print(f"[INFO] Nama kelas: {model.names}")
    print(f"[INFO] Jumlah kelas: {len(model.names)}")
except Exception as e:
    print(f"[ERROR] Gagal memuat model: {e}")
    sys.exit(1)

# 3. Test deteksi dengan gambar dummy
print("\n[INFO] Test deteksi dengan gambar dummy...")
try:
    import numpy as np
    dummy_img = np.zeros((640, 640, 3), dtype=np.uint8)
    results = model(dummy_img, conf=0.5, verbose=False)
    print(f"[OK] Deteksi berhasil! Ditemukan {len(results[0].boxes)} objek pada gambar kosong.")
    print("\n[SUCCESS] Semua test berhasil! Model siap digunakan.")
except Exception as e:
    print(f"[ERROR] Gagal saat deteksi: {e}")
    sys.exit(1)

print("=" * 50)
