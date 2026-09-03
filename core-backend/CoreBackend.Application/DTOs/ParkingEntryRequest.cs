namespace CoreBackend.Application.DTOs;

public class ParkingEntryRequest
{
    public string LicensePlate { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
}
