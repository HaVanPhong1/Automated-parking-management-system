@echo off
echo ========================================================
echo   KHOI DONG HE THONG QUAN LY DO XE TU DONG AI
echo ========================================================

echo 1. Dang khoi dong Database SQL Server tren Docker...
docker-compose up -d

echo 2. Dang khoi dong AI Microservice (Python EasyOCR)...
start "AI Service Python" cmd /k "cd ai-service && python main.py"

echo 3. Dang khoi dong Backend C# Web API...
start "Backend C# API" cmd /k "dotnet run --project core-backend/CoreBackend.WebApi/CoreBackend.WebApi.csproj --launch-profile http"

echo 4. Dang khoi dong Frontend React...
start "Frontend React" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================
echo   HE THONG DA DUOC KHOI DONG THANH CONG!
echo   - Frontend React: http://localhost:5173
echo   - Backend C# API: http://localhost:5181
echo   - AI Service:     http://localhost:8000
echo ========================================================
pause
