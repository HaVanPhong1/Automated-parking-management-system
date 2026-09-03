using CoreBackend.Application.DTOs;
using CoreBackend.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace CoreBackend.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ParkingController : ControllerBase
{
    private readonly IParkingService _parkingService;

    public ParkingController(IParkingService parkingService)
    {
        _parkingService = parkingService;
    }

    [HttpPost("entry")]
    public async Task<IActionResult> Entry([FromBody] ParkingEntryRequest request)
    {
        try
        {
            var result = await _parkingService.HandleEntryAsync(request);
            return Ok(new { success = true, data = result });
        }
        catch (System.Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPost("exit")]
    public async Task<IActionResult> Exit([FromBody] ParkingExitRequest request)
    {
        try
        {
            var result = await _parkingService.HandleExitAsync(request);
            return Ok(new { success = true, data = result });
        }
        catch (System.Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPost("confirm-payment")]
    public async Task<IActionResult> ConfirmPayment([FromBody] ConfirmPaymentRequest request)
    {
        var result = await _parkingService.ConfirmPaymentAsync(request.SessionId, request.TransactionCode);
        if (result)
        {
            return Ok(new { success = true, message = "Thanh toán thành công. Mở cổng!" });
        }
        return BadRequest(new { success = false, message = "Giao dịch không hợp lệ." });
    }

    [HttpGet("active-sessions")]
    public async Task<IActionResult> GetActiveSessions()
    {
        var sessions = await _parkingService.GetActiveSessionsAsync();
        return Ok(new { success = true, data = sessions });
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetHistory()
    {
        var history = await _parkingService.GetHistoryAsync();
        return Ok(new { success = true, data = history });
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var stats = await _parkingService.GetStatsAsync();
        return Ok(new { success = true, data = stats });
    }
}

public class ConfirmPaymentRequest
{
    public int SessionId { get; set; }
    public string TransactionCode { get; set; } = string.Empty;
}
