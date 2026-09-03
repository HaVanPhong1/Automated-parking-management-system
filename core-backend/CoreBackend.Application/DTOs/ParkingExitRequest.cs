namespace CoreBackend.Application.DTOs;

public class ParkingExitRequest
{
    public string LicensePlate { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
}
