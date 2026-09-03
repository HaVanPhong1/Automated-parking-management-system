using CoreBackend.Application.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CoreBackend.Application.Interfaces;

public interface IParkingService
{
    Task<ParkingResponse> HandleEntryAsync(ParkingEntryRequest request);
    Task<ParkingResponse> HandleExitAsync(ParkingExitRequest request);
    Task<bool> ConfirmPaymentAsync(int sessionId, string transactionCode);
    Task<List<ParkingResponse>> GetActiveSessionsAsync();
    Task<List<ParkingResponse>> GetHistoryAsync();
    Task<object> GetStatsAsync();
}
