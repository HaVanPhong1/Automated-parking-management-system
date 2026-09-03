using CoreBackend.Domain.Enums;
using System;

namespace CoreBackend.Domain.Entities;

public class Payment
{
    public int Id { get; set; }
    
    public int SessionId { get; set; }
    public ParkingSession Session { get; set; } = null!;
    
    public decimal Amount { get; set; }
    
    public PaymentMethod PaymentMethod { get; set; }
    public PaymentStatus PaymentStatus { get; set; }
    
    public string? TransactionCode { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
