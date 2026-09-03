using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace CoreBackend.WebApi.Hubs;

public class ParkingHub : Hub
{
    public async Task SendMessage(string user, string message)
    {
        await Clients.All.SendAsync("ReceiveMessage", user, message);
    }
}
