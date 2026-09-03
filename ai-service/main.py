import os
import sys
# Set UTF-8 encoding for Windows stdout/stderr to avoid UnicodeEncodeError in EasyOCR
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import easyocr
import io
import re
from PIL import Image, ImageEnhance
import numpy as np

app = FastAPI(title="AI License Plate Recognition API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize EasyOCR reader with verbose=False to disable crashing progress bar
try:
    reader = easyocr.Reader(['en'], gpu=False, verbose=False)
except Exception as e:
    print(f"EasyOCR Init Warning: {e}")
    reader = None

def clean_vietnamese_plate(raw_text: str) -> str:
    """
    Chuẩn hóa và làm sạch chuỗi OCR thành định dạng biển số xe Việt Nam.
    Ví dụ: '98A 12345', '30F-123.45', '29A12345' -> '98A-12345'
    """
    clean = re.sub(r'[^A-Z0-9]', '', raw_text.upper())
    
    if len(clean) < 4:
        return raw_text.upper().strip()

    # Sửa lỗi phổ biến OCR (nhầm lẫn giữa số và chữ ở 2 ký tự đầu - tỉnh thành)
    char_map_num = {'O': '0', 'Q': '0', 'D': '0', 'I': '1', 'Z': '2', 'S': '5', 'B': '8'}
    first_two = list(clean[:2])
    for i in range(2):
        if first_two[i] in char_map_num:
            first_two[i] = char_map_num[first_two[i]]
    
    rest = clean[2:]
    formatted = "".join(first_two) + rest

    if len(formatted) >= 6:
        match = re.match(r'^(\d{2}[A-Z]{1,2})(\d{4,5})$', formatted)
        if match:
            return f"{match.group(1)}-{match.group(2)}"
    if len(formatted) >= 8:
        # Tách 5 ký tự cuối ra để làm phần số sê-ri phía sau nếu tổng độ dài đủ lớn
        prefix = formatted[:-5]
        suffix = formatted[-5:]
        return f"{prefix}-{suffix}"
    return formatted

@app.get("/")
def read_root():
    return {"message": "License Plate Recognition API is running"}

@app.post("/api/recognize")
async def recognize_license_plate(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert('RGB')
        
        # Tiền xử lý ảnh (Tăng độ tương phản & sắc nét)
        enhancer = ImageEnhance.Contrast(image)
        image_enhanced = enhancer.enhance(1.8)
        
        image_np = np.array(image_enhanced)
        
        if reader is not None:
            result = reader.readtext(image_np)
            raw_text = " ".join([text for _, text, prob in result if prob > 0.15])
        else:
            raw_text = ""

        cleaned_plate = clean_vietnamese_plate(raw_text)

        return {
            "success": True,
            "license_plate": cleaned_plate or raw_text or "UNREADABLE",
            "raw_text": raw_text
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
