# Automated Parking Management System

Hệ thống quản lý đỗ xe tự động tích hợp Trí tuệ nhân tạo (AI) nhận diện biển số xe, thanh toán trực tuyến và giao diện quản trị tập trung. Đồ án được thiết kế cho cấp độ đại học, áp dụng kiến trúc phần mềm hiện đại.

## 🚀 Công nghệ sử dụng

- **Frontend**: React, Tailwind CSS, Vite.
- **Core Backend**: C# .NET Core, Web API, Clean Architecture, Entity Framework Core.
- **AI Microservice**: Python, FastAPI, EasyOCR (nhận diện và làm sạch biển số xe Việt Nam).
- **Database**: SQL Server 2022 (chạy trên Docker).
- **Thanh toán & Thời gian thực**: VNPAY / VietQR (Sandbox), SignalR.

## 📂 Cấu trúc thư mục dự án

```text
Quan_Ly_Do_Xe/
│
├── ai-service/              # Microservice Python nhận diện biển số (FastAPI + EasyOCR)
├── core-backend/            # Backend C# .NET theo Clean Architecture
├── frontend/                # Giao diện người dùng ReactJS (Admin & Guard View)
├── sql-init/                # Script khởi tạo cơ sở dữ liệu
├── docker-compose.yml       # Cấu hình Docker cho SQL Server
└── start_all.bat            # File batch tự động khởi chạy toàn bộ hệ thống
⚙️ Hướng dẫn cài đặt và chạy hệ thống
Cách 1: Khởi động tự động (Khuyên dùng)
Bạn chỉ cần nhấp đúp chuột trực tiếp vào file start_all.bat ở thư mục gốc để tự động bật Docker, AI Service, Backend và Frontend.

Cách 2: Khởi động thủ công từng thành phần
Khởi động Database (Docker):

DOS
docker-compose up -d
Khởi động AI Microservice (Python):

DOS
cd ai-service
python main.py
Khởi động C# Backend:

DOS
cd core-backend/CoreBackend.WebApi
dotnet run --launch-profile http
Khởi động React Frontend:

DOS
cd frontend
npm run dev
🌐 Các cổng truy cập dịch vụ
Frontend React: http://localhost:5173

Backend C# API: http://localhost:5181

AI Service: http://localhost:8000
