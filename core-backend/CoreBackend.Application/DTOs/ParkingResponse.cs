using System;

namespace CoreBackend.Application.DTOs;

public class ParkingResponse
{
    public int SessionId { get; set; }
    public string LicensePlate { get; set; } = string.Empty;
    public DateTime TimeIn { get; set; }
    public DateTime? TimeOut { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal? Fee { get; set; }
    public string? PaymentUrl { get; set; }
}
