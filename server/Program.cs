using Microsoft.EntityFrameworkCore;
using server.Data;
using server.Seed;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddDbContext<GameDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("GameDb")));
builder.Services.AddControllers();
builder.Services.AddScoped<server.Services.GameService>();
builder.Services.AddScoped<server.Services.CustomerService>();
builder.Services.AddScoped<server.Services.FootballService>();
builder.Services.AddScoped<server.Services.HistoryService>();
builder.Services.AddEndpointsApiExplorer();

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:5173"];
builder.Services.AddCors(options => options.AddDefaultPolicy(policy =>
    policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<GameDbContext>();
    db.Database.Migrate();
    var isNewSave = !db.Players.Any();
    DatabaseSeeder.Seed(db);
    AchievementSeeder.Seed(db);
    SeedData.Initialize(db);
    RandomEventSeeder.Seed(db);
    if (isNewSave) db.Customers.ExecuteUpdate(s => s.SetProperty(c => c.HasLeft, true));
}

app.UseCors();
app.MapControllers();
app.Run();
