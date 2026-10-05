import os
import cv2
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
from dotenv import load_dotenv

import torch
import timm
from torchvision import transforms
from ultralytics import YOLO

load_dotenv()

app = Flask(__name__)
CORS(app)

# ── Konfigurasi ──────────────────────────────────────────────
PORT        = int(os.getenv("PORT", 5001))
MODEL_PATH  = os.getenv("MODEL_PATH", "./models/best_model.pt")

# ── Load Model YOLO untuk Lokasi (Bounding Box) ──────────────
print("[INFO] Memuat model deteksi objek dasar (YOLOv8s)...")
yolo_model = YOLO("yolov8s.pt")  # Akan otomatis mendownload jika belum ada

# ── Load Model Klasifikasi Custom untuk ODOL ────────────────
print(f"[INFO] Memuat model klasifikasi dari: {MODEL_PATH}")
try:
    checkpoint = torch.load(MODEL_PATH, weights_only=False, map_location='cpu')
    meta = checkpoint['meta']
    model_name = meta['model_name']
    
    cls_model = timm.create_model(model_name, pretrained=False, num_classes=len(meta['classes']))
    cls_model.load_state_dict(checkpoint['state_dict'])
    cls_model.eval()
    
    classes = meta['classes']
    odol_classes = meta['odol_classes']
    temperature = meta.get('temperature', 1.0)
    img_size = meta['img_size']
    
    preprocess = transforms.Compose([
        transforms.ToTensor(),
        transforms.Resize((img_size, img_size), antialias=True),
        transforms.Normalize(mean=meta['mean'], std=meta['std'])
    ])
    print("[INFO] Model Klasifikasi berhasil dimuat!")
except Exception as e:
    print(f"[ERROR] Gagal memuat model klasifikasi: {e}")
    cls_model = None

def pad_square(img_arr):
    h, w = img_arr.shape[:2]
    if h == 0 or w == 0:
        return np.zeros((img_size, img_size, 3), dtype=np.uint8)
    size = max(h, w)
    padded = np.zeros((size, size, 3), dtype=np.uint8)
    y_offset = (size - h) // 2
    x_offset = (size - w) // 2
    padded[y_offset:y_offset+h, x_offset:x_offset+w] = img_arr
    return padded

# ── Rute API ─────────────────────────────────────────────────
@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "Python Flask Model Server berjalan!",
        "yolo_loaded": True,
        "classification_loaded": cls_model is not None
    })

@app.route("/api/detect/image", methods=["POST"])
def detect_image():
    if cls_model is None:
        return jsonify({"error": "Model klasifikasi belum dimuat"}), 503

    img_bytes = None
    if request.is_json:
        data = request.get_json()
        if "image" in data:
            b64_data = data["image"]
            if "," in b64_data:
                b64_data = b64_data.split(",")[1]
            try:
                img_bytes = base64.b64decode(b64_data)
            except Exception as e:
                return jsonify({"error": f"Invalid base64: {e}"}), 400
    
    if not img_bytes:
        return jsonify({"error": "Tidak ada gambar yang dikirim"}), 400

    nparr = np.frombuffer(img_bytes, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if frame is None:
        return jsonify({"error": "Gagal membaca gambar"}), 400

    # 1. Gunakan YOLO untuk mendeteksi lokasi kendaraan (Akurasi minimal 30%)
    results = yolo_model(frame, conf=0.3, verbose=False)
    
    detections = []
    
    for result in results:
        for box in result.boxes:
            cls_id = int(box.cls[0])
            # ID COCO: 2=car, 5=bus, 7=truck (tambahkan 3=motorcycle jika perlu, tapi kita fokus truk/mobil)
            if cls_id in [2, 5, 7]:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                
                # Pastikan bounding box valid dan tidak terlalu kecil (misal abaikan yang lebih kecil dari 40x40 pixel)
                w_box = x2 - x1
                h_box = y2 - y1
                if w_box > 40 and h_box > 40:
                    # 2. Potong (crop) gambar kendaraan dari frame
                    crop = frame[y1:y2, x1:x2]
                    
                    # 3. Masukkan ke model klasifikasi custom (EfficientNet)
                    with torch.no_grad():
                        crop_rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
                        padded = pad_square(crop_rgb)
                        tensor_img = preprocess(padded).unsqueeze(0)
                        
                        logits = cls_model(tensor_img)
                        probs = torch.nn.functional.softmax(logits / temperature, dim=1)[0]
                        conf, cls_idx = torch.max(probs, dim=0)
                        
                        conf_val = conf.item()
                        cls_name = classes[cls_idx.item()]
                        is_odol = cls_name in odol_classes
                        
                        # Hanya simpan jika yakin > 50%
                        if conf_val > 0.5:
                            detections.append({
                                "label": cls_name,
                                "confidence": round(conf_val, 3),
                                "bbox": [x1, y1, x2, y2],
                                "is_odol": is_odol
                            })

    # 4. Gambar bounding box hasil klasifikasi
    for d in detections:
        x1, y1, x2, y2 = d["bbox"]
        label = d["label"]
        conf = d["confidence"]
        is_odol = d["is_odol"]
        
        color = (0, 0, 255) if is_odol else (0, 255, 0)
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
        
        text = f"{label} {conf:.2f}"
        (tw, th), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
        cv2.rectangle(frame, (x1, y1 - th - 10), (x1 + tw + 10, y1), color, -1)
        cv2.putText(frame, text, (x1 + 5, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

    _, buffer = cv2.imencode(".jpg", frame)
    img_b64 = base64.b64encode(buffer).decode("utf-8")

    odol_count = sum(1 for d in detections if d["is_odol"])
    normal_count = sum(1 for d in detections if not d["is_odol"])

    return jsonify({
        "detections":   detections,
        "total":        len(detections),
        "odol_count":   odol_count,
        "normal_count": normal_count,
        "image":        f"data:image/jpeg;base64,{img_b64}"
    })


if __name__ == "__main__":
    print(f"[INFO] Server berjalan di http://localhost:{PORT}")
    app.run(host="0.0.0.0", port=PORT, debug=True)
