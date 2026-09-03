using CoreBackend.Domain.Enums;
using System;
using System.Collections.Generic;

namespace CoreBackend.Domain.Entities;

public class ParkingSession
{
    public int Id { get; set; }
    public string LicensePlate { get; set; } = string.Empty;
    
    public DateTime TimeIn { get; set; }
    public DateTime? TimeOut { get; set; }
    
    public string ImageInUrl { get; set; } = string.Empty;
    public string? ImageOutUrl { get; set; }
    
    public SessionStatus Status { get; set; } = SessionStatus.Parking;
    
    // Navigation Property
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
