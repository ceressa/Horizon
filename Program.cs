using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using System.Text;
using Horizon.Services;

// ========== SERILOG SETUP ==========
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information() // Log seviyesi (Debug, Information, Warning, Error, Fatal)
    .WriteTo.File(
        path: "Logs/horizon-.log",
        rollingInterval: RollingInterval.Day, // Günlük dosya rotasyonu
        retainedFileCountLimit: 14, // Son 14 günün loglarını sakla
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss} [{Level:u3}] {Message:lj}{NewLine}{Exception}"
    )
    .CreateLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    // Serilog'u uygulamaya entegre et
    builder.Host.UseSerilog();

    // Add services to the container.
    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddHostedService<DataSyncService>();

    // ========== JWT AUTHENTICATION ==========
    var key = Encoding.UTF8.GetBytes("HorizonSecretKey_ChangeThis!"); // Backend ile aynı key

    builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false; // Development ortamı için
        options.SaveToken = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = true,
            ValidIssuer = "HorizonSystem",
            ValidateAudience = true,
            ValidAudience = "HorizonUsers",
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

    // ========== CORS ==========
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowAll",
            policyBuilder => policyBuilder
                .AllowAnyOrigin()
                .AllowAnyMethod()
                .AllowAnyHeader());
    });

    var app = builder.Build();

    // Configure the HTTP request pipeline.
    app.UseStaticFiles();
    app.UseRouting();

    app.UseCors("AllowAll");

    app.UseAuthentication(); // Authorization'dan önce
    app.UseAuthorization();

    app.MapControllers();
    app.MapFallbackToFile("index.html");

    Log.Information("Horizon API is starting up...");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application startup failed.");
}
finally
{
    Log.CloseAndFlush(); // Log dosyasını düzgün kapat
}
