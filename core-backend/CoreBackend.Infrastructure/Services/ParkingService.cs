using CoreBackend.Application.DTOs;
using CoreBackend.Application.Interfaces;
using CoreBackend.Domain.Entities;
using CoreBackend.Domain.Enums;
using CoreBackend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CoreBackend.Infrastructure.Services;

public class ParkingService : IParkingService
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _config;

    public ParkingService(ApplicationDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
    }

    public async Task<ParkingResponse> HandleEntryAsync(ParkingEntryRequest request)
    {
        var existingSession = await _context.ParkingSessions
            .FirstOrDefaultAsync(s => s.LicensePlate == request.LicensePlate && s.Status == SessionStatus.Parking);
            
        if (existingSession != null)
        {
            throw new Exception("Xe này đang ở trong bãi, không thể vào tiếp.");
        }

        var newSession = new ParkingSession
        {
            LicensePlate = request.LicensePlate,
            TimeIn = DateTime.Now,
            ImageInUrl = request.ImageUrl ?? "",
            Status = SessionStatus.Parking
        };

        _context.ParkingSessions.Add(newSession);
        await _context.SaveChangesAsync();

        return new ParkingResponse
        {
            SessionId = newSession.Id,
            LicensePlate = newSession.LicensePlate,
            TimeIn = newSession.TimeIn,
            Status = newSession.Status.ToString()
        };
    }

    public async Task<ParkingResponse> HandleExitAsync(ParkingExitRequest request)
    {
        var session = await _context.ParkingSessions
            .FirstOrDefaultAsync(s => s.LicensePlate == request.LicensePlate && s.Status == SessionStatus.Parking);

        if (session == null)
        {
            throw new Exception("Không tìm thấy thông tin gửi của xe này trong bãi.");
        }

        session.TimeOut = DateTime.Now;
        session.ImageOutUrl = request.ImageUrl;
        
        var hours = (session.TimeOut.Value - session.TimeIn).TotalHours;
        decimal fee = 15000;
        if (hours > 4) {
             fee = 15000 + (decimal)Math.Ceiling(hours - 4) * 5000;
        }

        var payment = new Payment
        {
            SessionId = session.Id,
            Amount = fee,
            PaymentMethod = PaymentMethod.VNPAY,
            PaymentStatus = PaymentStatus.Pending
        };

        _context.Payments.Add(payment);
        await _context.SaveChangesAsync();

        string bankId = _config["VietQR:BankId"] ?? "VBA";
        string accountNo = _config["VietQR:AccountNo"] ?? "2500205467784";
        string accountName = _config["VietQR:AccountName"] ?? "HA VAN PHONG";

        string addInfo = Uri.EscapeDataString($"GUI XE {session.LicensePlate}");
        string encodedName = Uri.EscapeDataString(accountName);

        string paymentUrl = $"https://img.vietqr.io/image/{bankId}-{accountNo}-compact2.png?amount={fee}&addInfo={addInfo}&accountName={encodedName}";

        return new ParkingResponse
        {
            SessionId = session.Id,
            LicensePlate = session.LicensePlate,
            TimeIn = session.TimeIn,
            TimeOut = session.TimeOut,
            Status = session.Status.ToString(),
            Fee = fee,
            PaymentUrl = paymentUrl
        };
    }

    public async Task<bool> ConfirmPaymentAsync(int sessionId, string transactionCode)
    {
        var session = await _context.ParkingSessions
            .Include(s => s.Payments)
            .FirstOrDefaultAsync(s => s.Id == sessionId);

        if (session == null) return false;

        var payment = session.Payments.FirstOrDefault(p => p.PaymentStatus == PaymentStatus.Pending);
        if (payment != null)
        {
            payment.PaymentStatus = PaymentStatus.Success;
            payment.TransactionCode = transactionCode;
            session.Status = SessionStatus.Completed;
            await _context.SaveChangesAsync();
            return true;
        }
        return false;
    }

    public async Task<List<ParkingResponse>> GetActiveSessionsAsync()
    {
        return await _context.ParkingSessions
            .Where(s => s.Status == SessionStatus.Parking)
            .OrderByDescending(s => s.TimeIn)
            .Select(s => new ParkingResponse
            {
                SessionId = s.Id,
                LicensePlate = s.LicensePlate,
                TimeIn = s.TimeIn,
                Status = "Parking"
            })
            .ToListAsync();
    }

    public async Task<List<ParkingResponse>> GetHistoryAsync()
    {
        return await _context.ParkingSessions
            .Include(s => s.Payments)
            .OrderByDescending(s => s.TimeIn)
            .Select(s => new ParkingResponse
            {
                SessionId = s.Id,
                LicensePlate = s.LicensePlate,
                TimeIn = s.TimeIn,
                TimeOut = s.TimeOut,
                Status = s.Status.ToString(),
                Fee = s.Payments.FirstOrDefault() != null ? s.Payments.FirstOrDefault().Amount : null
            })
            .ToListAsync();
    }

    public async Task<object> GetStatsAsync()
    {
        var activeCount = await _context.ParkingSessions.CountAsync(s => s.Status == SessionStatus.Parking);
        
        var today = DateTime.Today;
        var totalRevenueToday = await _context.Payments
            .Where(p => p.PaymentStatus == PaymentStatus.Success && p.CreatedAt >= today)
            .SumAsync(p => (decimal?)p.Amount) ?? 0;

        var totalSessionsToday = await _context.ParkingSessions
            .CountAsync(s => s.TimeIn >= today);

        return new
        {
            ActiveVehicles = activeCount,
            RevenueToday = totalRevenueToday,
            TotalSessionsToday = totalSessionsToday,
            MaxCapacity = 200
        };
    }
}
