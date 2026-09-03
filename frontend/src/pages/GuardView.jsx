import React, { useState, useEffect } from 'react';
import { Camera, Image as ImageIcon, CheckCircle, XCircle, CreditCard, Keyboard, AlertCircle, QrCode, Edit3 } from 'lucide-react';
import axios from 'axios';
import * as signalR from '@microsoft/signalr';

const API_BASE = 'http://localhost:5181/api/parking';
const AI_API = 'http://localhost:8000/api/recognize';

export default function GuardView() {
  const [image, setImage] = useState(null);
  const [plateNumber, setPlateNumber] = useState('');
  const [isManual, setIsManual] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, processing, success, error
  const [message, setMessage] = useState('');
  
  const [activeSession, setActiveSession] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  // Setup SignalR connection for real-time events
  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5181/hubs/parking')
      .configureLogging(signalR.LogLevel.Information)
      .withAutomaticReconnect()
      .build();

    connection.start()
      .then(() => console.log('SignalR Connected!'))
      .catch(err => console.error('SignalR Connection Error: ', err));

    connection.on('ReceiveMessage', (user, msg) => {
      console.log('Realtime notification:', user, msg);
    });

    return () => {
      connection.stop();
    };
  }, []);

  // Handle Image upload and call AI Python Service for Real OCR
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImage(URL.createObjectURL(file));
    setStatus('processing');
    setMessage('Đang gọi AI nhận diện biển số...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Call Python FastAPI AI Service
      const res = await axios.post(AI_API, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success && res.data.license_plate) {
        setPlateNumber(res.data.license_plate);
        setStatus('success');
        setMessage('AI đã đọc biển số! Bạn có thể chỉnh sửa lại bên dưới nếu bị nhầm số.');
      } else {
        setStatus('error');
        setMessage('AI không đọc được biển số. Vui lòng tự nhập bằng tay.');
      }
    } catch (err) {
      console.warn('AI Service not available, falling back to manual entry mode:', err);
      setStatus('success');
      setMessage('Không thể kết nối AI Service. Vui lòng kiểm tra hoặc chỉnh sửa biển số thủ công.');
      if (!plateNumber) setPlateNumber('30F-123.45');
    }
  };

  // Call C# Backend API for Xe Vào (Entry)
  const handleEntry = async () => {
    if (!plateNumber) return;
    setStatus('processing');
    try {
      const res = await axios.post(`${API_BASE}/entry`, {
        licensePlate: plateNumber,
        imageUrl: image || ''
      });
      if (res.data.success) {
        setStatus('success');
        setMessage(`Đã cho XE VÀO bãi thành công (Mã phiên: #${res.data.data.sessionId})`);
        setTimeout(() => reset(), 2500);
      }
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Lỗi hệ thống khi cho xe vào!');
    }
  };

  // Call C# Backend API for Xe Ra (Exit) & Calculate Fee
  const handleExit = async () => {
    if (!plateNumber) return;
    setStatus('processing');
    try {
      const res = await axios.post(`${API_BASE}/exit`, {
        licensePlate: plateNumber,
        imageUrl: image || ''
      });
      if (res.data.success) {
        setActiveSession(res.data.data);
        setShowQR(true);
        setStatus('success');
        setMessage('Vui lòng quét mã VietQR để thanh toán thẳng vào TK ngân hàng!');
      }
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Không tìm thấy thông tin xe trong bãi!');
    }
  };

  // Confirm payment (Cash or VietQR simulator)
  const handleConfirmPayment = async (method) => {
    if (!activeSession) return;
    try {
      const res = await axios.post(`${API_BASE}/confirm-payment`, {
        sessionId: activeSession.sessionId,
        transactionCode: `TRANS-${Date.now()}`
      });
      if (res.data.success) {
        setIsPaid(true);
        setMessage('Thanh toán thành công! Mở BARIE cho xe ra.');
        setTimeout(() => reset(), 3000);
      }
    } catch (err) {
      alert('Lỗi xác nhận thanh toán!');
    }
  };

  const reset = () => {
    setImage(null);
    setPlateNumber('');
    setStatus('idle');
    setMessage('');
    setShowQR(false);
    setActiveSession(null);
    setIsPaid(false);
    setIsManual(false);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 mt-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Bốt Kiểm Soát Bãi Xe</h1>
          <p className="text-slate-400 mt-1">Hệ thống AI nhận diện biển số & Thanh toán VietQR tự động</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => { setIsManual(!isManual); setMessage(''); }}
             className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${
               isManual ? 'bg-primary text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
             }`}
           >
             <Keyboard className="w-4 h-4" />
             {isManual ? 'Chuyển sang Mode Camera' : 'Chế Độ Gõ Thủ Công'}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Camera / Input */}
        <div className="bg-dark border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-cyan-400"></div>
          
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
            <Camera className="w-5 h-5 text-primary" />
            Camera Giám Sát Ra / Vào
          </h2>

          {!isManual ? (
            <div className="aspect-video bg-slate-900 rounded-xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center relative overflow-hidden group">
              {image ? (
                <>
                  <img src={image} alt="Camera view" className="absolute inset-0 w-full h-full object-cover" />
                  {status === 'processing' && (
                    <div className="absolute inset-0 bg-dark/70 backdrop-blur-sm flex flex-col items-center justify-center">
                      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                      <span className="text-primary font-medium animate-pulse">AI Đang phân tích ảnh...</span>
                    </div>
                  )}
                </>
              ) : (
                <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full hover:bg-slate-800/50 transition-colors">
                  <ImageIcon className="w-10 h-10 text-slate-500 mb-3 group-hover:text-primary transition-colors" />
                  <span className="text-slate-400 font-medium">Tải ảnh xe để AI nhận diện tự động</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              )}
            </div>
          ) : (
            <div className="bg-slate-900 rounded-xl p-8 border border-slate-700 flex flex-col items-center justify-center">
               <div className="w-full max-w-sm space-y-4">
                  <label className="block text-sm font-medium text-slate-400">Nhập biển số bằng tay (VD: 98A-25002)</label>
                  <input 
                    type="text" 
                    value={plateNumber}
                    onChange={(e) => {
                      setPlateNumber(e.target.value.toUpperCase());
                      if (e.target.value) setStatus('success');
                      else setStatus('idle');
                    }}
                    className="w-full bg-dark border-2 border-slate-700 rounded-lg px-4 py-3 text-white text-xl font-mono tracking-widest focus:outline-none focus:border-primary transition-colors"
                    placeholder="--- ---"
                  />
               </div>
            </div>
          )}

          {/* Editable Result Box */}
          <div className={`mt-6 p-4 rounded-xl transition-all duration-300 ${
            status === 'success' ? 'bg-primary/10 border border-primary/20' : 
            status === 'error' ? 'bg-rose-500/10 border border-rose-500/20' : 'bg-slate-800/50 border border-slate-700'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <Edit3 className="w-3.5 h-3.5 text-primary" />
                Biển số nhận diện (Cho phép sửa trực tiếp nếu AI đọc nhầm):
              </span>
              {status === 'success' && <CheckCircle className="w-5 h-5 text-primary" />}
              {status === 'error' && <AlertCircle className="w-5 h-5 text-rose-500" />}
            </div>

            <input 
              type="text"
              value={plateNumber}
              onChange={(e) => {
                setPlateNumber(e.target.value.toUpperCase());
                if (e.target.value) setStatus('success');
              }}
              placeholder="Nhập/Sửa biển số tại đây..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white font-mono text-2xl font-bold tracking-widest focus:outline-none focus:border-primary uppercase"
            />
            {message && <p className={`text-xs mt-2 ${status === 'error' ? 'text-rose-400' : 'text-emerald-400'}`}>{message}</p>}
          </div>
        </div>

        {/* Right Column: Actions */}
        <div className="space-y-6">
          <div className="bg-dark border border-slate-800 rounded-2xl p-6 shadow-xl">
             <h2 className="text-lg font-semibold text-white mb-6">Thao tác bốt kiểm soát</h2>
             <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={handleEntry}
                  disabled={!plateNumber || status === 'processing'}
                  className="bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  CHO XE VÀO
                </button>
                <button 
                  onClick={handleExit}
                  disabled={!plateNumber || status === 'processing'}
                  className="bg-gradient-to-br from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-rose-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  CHO XE RA
                </button>
             </div>
          </div>

          {/* VietQR Dynamic Payment UI */}
          {showQR && activeSession && (
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 shadow-xl animate-in fade-in slide-in-from-bottom-4">
               <div className="flex items-center justify-between mb-4">
                 <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-cyan-400" />
                    Thanh Toán VietQR Agribank
                 </h2>
                 {isPaid ? (
                   <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-sm font-medium animate-pulse">Đã nhận tiền</span>
                 ) : (
                   <span className="bg-rose-500/20 text-rose-400 px-3 py-1 rounded-full text-sm font-medium animate-pulse">Chờ quét QR</span>
                 )}
               </div>
               
               <div className="bg-white rounded-xl p-6 flex flex-col items-center justify-center text-slate-900">
                  {!isPaid ? (
                    <>
                      <img 
                        src={activeSession.paymentUrl} 
                        alt="Mã VietQR" 
                        className="w-56 h-auto mb-3 rounded-lg shadow-lg border"
                      />
                      <div className="text-center space-y-1">
                        <p className="text-xs text-slate-500">Mã phiên: #{activeSession.sessionId} | Xe: <span className="font-bold text-slate-800">{activeSession.licensePlate}</span></p>
                        <p className="text-sm font-medium text-slate-700">Nội dung CK: <span className="font-mono text-blue-600 font-bold">GUI XE {activeSession.licensePlate}</span></p>
                        <p className="text-3xl font-extrabold text-emerald-600 pt-1">{(activeSession.fee || 15000).toLocaleString('vi-VN')} VNĐ</p>
                        <p className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 mt-2 font-medium">
                          ✨ Tiền sẽ được chuyển thẳng về TK Agribank (HA VAN PHONG)
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-3" />
                      <h3 className="text-xl font-bold text-slate-900">XÁC NHẬN MỞ BARIE</h3>
                      <p className="text-slate-500 text-sm mt-1">Đã nhận được tiền gửi xe vào TK Agribank. Barie đang mở!</p>
                    </div>
                  )}
               </div>
               
               {!isPaid && (
                 <div className="grid grid-cols-2 gap-3 mt-4">
                   <button 
                     onClick={() => handleConfirmPayment('VietQR')}
                     className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-xl transition-colors shadow-lg shadow-emerald-600/20"
                   >
                     Giả Lập Khách Quét Xong
                   </button>
                   <button 
                     onClick={() => handleConfirmPayment('Cash')}
                     className="bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-xl transition-colors"
                   >
                     Xác Nhận Tiền Mặt
                   </button>
                 </div>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
