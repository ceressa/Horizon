using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Text;
using System.Text.Json;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Globalization;

namespace Horizon.Controllers
{
    [Route("api/users")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly string _usersFilePath;
        private readonly IWebHostEnvironment _env;
        private const int MAX_ATTEMPTS = 3;
        private const int LOCKOUT_MINUTES = 30;
        private static readonly object _fileLock = new();

        public UsersController(IWebHostEnvironment env)
{
    _env = env;
    _usersFilePath = Path.GetFullPath(Path.Combine(_env.ContentRootPath, "..", "Data", "users.json"));
    Directory.CreateDirectory(Path.GetDirectoryName(_usersFilePath)!);

    Console.WriteLine($"[USERS CONTROLLER] Users file path: {_usersFilePath}");

    // ☕ Başlat: günlük kahve sıfırlayıcı
    StartCoffeeResetScheduler();
}


        // ============================================================
        // ========== JWT LOGIN (ANONYMOUS) ===========================
        // ============================================================
        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                Console.WriteLine($"[LOGIN] Attempt for FedexId: {request.FedexId}");

                if (!System.IO.File.Exists(_usersFilePath))
                {
                    Console.WriteLine("[LOGIN] ERROR: Users file not found");
                    return NotFound(new { success = false, message = "Users file not found" });
                }

                var json = await System.IO.File.ReadAllTextAsync(_usersFilePath, Encoding.UTF8);
                var options = new JsonSerializerOptions 
                { 
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                    PropertyNameCaseInsensitive = true
                };
                var userData = JsonSerializer.Deserialize<UserData>(json, options);
                
                if (userData == null || userData.Users == null)
                {
                    Console.WriteLine("[LOGIN] ERROR: Failed to deserialize user data");
                    return StatusCode(500, new { success = false, message = "Invalid user data" });
                }

                var user = userData.Users.FirstOrDefault(u => u.FedexId.Equals(request.FedexId, StringComparison.OrdinalIgnoreCase));

                if (user == null)
                {
                    Console.WriteLine($"[LOGIN] User not found: {request.FedexId}");
                    return Unauthorized(new { success = false, message = "Invalid credentials" });
                }

                // Lockout check
                if (!string.IsNullOrEmpty(user.LockedUntil))
                {
                    if (DateTime.TryParseExact(user.LockedUntil, "o", CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var lockoutTime) && 
                        lockoutTime > DateTime.UtcNow)
                    {
                        var remaining = Math.Max(1, (int)Math.Ceiling((lockoutTime - DateTime.UtcNow).TotalMinutes));
                        
                        if (remaining > 30)
                        {
                            Console.WriteLine($"[LOGIN] Excessive lockout detected: {remaining} mins. Resetting to {LOCKOUT_MINUTES} mins.");
                            user.LockedUntil = DateTime.UtcNow.AddMinutes(LOCKOUT_MINUTES).ToString("o");
                            await SaveUserData(userData);
                            remaining = LOCKOUT_MINUTES;
                        }
                        
                        Console.WriteLine($"[LOGIN] Account locked for {remaining} minutes");
                        return Unauthorized(new { success = false, message = $"Account locked. Try again in {remaining} minutes." });
                    }
                }

                // Password verification
                if (user.PasswordHash != request.PasswordHash)
                {
                    Console.WriteLine("[LOGIN] Invalid password");
                    await RecordFailedAttemptInternal(userData, user);
                    return Unauthorized(new { success = false, message = "Invalid credentials" });
                }

                // LOGIN SUCCESSFUL - UPDATE USER
                Console.WriteLine($"[LOGIN] === BEFORE UPDATE ===");
                Console.WriteLine($"[LOGIN] LoginCount BEFORE: {user.LoginCount}");
                Console.WriteLine($"[LOGIN] LastLogin BEFORE: {user.LastLogin}");

                user.FailedAttempts = 0;
                user.LockedUntil = null;
                user.LastFailedAttempt = null;
                
                var now = DateTime.UtcNow.ToString("o");
                user.LastLogin = now;
                user.LoginCount = user.LoginCount + 1;
                user.UpdatedAt = now;

                Console.WriteLine($"[LOGIN] === AFTER UPDATE ===");
                Console.WriteLine($"[LOGIN] LoginCount AFTER: {user.LoginCount}");
                Console.WriteLine($"[LOGIN] LastLogin AFTER: {user.LastLogin}");

                await SaveUserData(userData);
                Console.WriteLine($"[LOGIN] User data saved");

                var token = GenerateJwtToken(user);
                
                Console.WriteLine($"[LOGIN] Success for: {user.Name}");
                
                return Ok(new 
{ 
    success = true, 
    token,
    mustChangePassword = user.MustChangePassword,
    user = new 
    { 
        user.FedexId, 
        user.Name, 
        user.Email,
        user.Role,
        user.Countries 
    } 
});

            }
            catch (Exception ex)
            {
                Console.WriteLine($"[LOGIN] Error: {ex.Message}");
                Console.WriteLine($"[LOGIN] Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
		
		// ============================================================
// ========== GET ALL USERS (FOR DASHBOARD) ==================
// ============================================================
[HttpGet]
public async Task<IActionResult> GetAllUsers()
{
    try
    {
        Console.WriteLine("[GET USERS] Fetching all users...");
        
        if (!System.IO.File.Exists(_usersFilePath))
        {
            Console.WriteLine("[GET USERS] Users file not found");
            return NotFound(new { success = false, message = "Users file not found" });
        }

        var json = await System.IO.File.ReadAllTextAsync(_usersFilePath, Encoding.UTF8);
        var options = new JsonSerializerOptions 
        { 
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            PropertyNameCaseInsensitive = true
        };
        var userData = JsonSerializer.Deserialize<UserData>(json, options);
        
        if (userData == null || userData.Users == null)
        {
            Console.WriteLine("[GET USERS] Invalid user data");
            return StatusCode(500, new { success = false, message = "Invalid user data" });
        }

        // Return users without sensitive data
        var safeUsers = userData.Users.Select(u => new 
        {
            u.FedexId,
            u.Name,
            u.Email,
            u.Role,
            u.Countries,
            u.LoginCount,
            u.LastLogin
        }).ToList();

        Console.WriteLine($"[GET USERS] Returning {safeUsers.Count} users");
        
        return Ok(new { users = safeUsers });
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[GET USERS] Error: {ex.Message}");
        return StatusCode(500, new { success = false, message = ex.Message });
    }
}

        // ============================================================
        // ========== TEST ENDPOINT - MANUAL INCREMENT ================
        // ============================================================
        [AllowAnonymous]
        [HttpPost("test-increment-login")]
        public async Task<IActionResult> TestIncrementLogin([FromBody] TestRequest request)
        {
            try
            {
                Console.WriteLine($"[TEST] Manual increment for: {request.FedexId}");

                var json = await System.IO.File.ReadAllTextAsync(_usersFilePath, Encoding.UTF8);
                var options = new JsonSerializerOptions 
                { 
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                    PropertyNameCaseInsensitive = true
                };
                var userData = JsonSerializer.Deserialize<UserData>(json, options);
                var user = userData?.Users.FirstOrDefault(u => u.FedexId.Equals(request.FedexId, StringComparison.OrdinalIgnoreCase));

                if (user == null)
                    return NotFound(new { success = false, message = "User not found" });

                Console.WriteLine($"[TEST] Current LoginCount: {user.LoginCount}");
                
                user.LoginCount++;
                user.LastLogin = DateTime.UtcNow.ToString("o");
                user.UpdatedAt = DateTime.UtcNow.ToString("o");

                Console.WriteLine($"[TEST] New LoginCount: {user.LoginCount}");

                var saveOptions = new JsonSerializerOptions 
                { 
                    WriteIndented = true, 
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                    DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.Never
                };
                
                var updatedJson = JsonSerializer.Serialize(userData, saveOptions);
                System.IO.File.WriteAllText(_usersFilePath, updatedJson, Encoding.UTF8);

                Console.WriteLine($"[TEST] File saved!");

                return Ok(new { success = true, loginCount = user.LoginCount, lastLogin = user.LastLogin });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[TEST ERROR] {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ============================================================
        // ========== CHANGE PASSWORD (ANONYMOUS) =====================
        // ============================================================
        [AllowAnonymous]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] PasswordChangeRequest request)
        {
            try 
            {
                Console.WriteLine($"[CHANGE PASSWORD] Request for: {request.FedexId}");

                if (!System.IO.File.Exists(_usersFilePath))
                    return NotFound(new { success = false, message = "Users file not found" });

                var json = await System.IO.File.ReadAllTextAsync(_usersFilePath, Encoding.UTF8);
                var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
                var userData = JsonSerializer.Deserialize<UserData>(json, options);
                var user = userData?.Users?.FirstOrDefault(u => u.FedexId.Equals(request.FedexId, StringComparison.OrdinalIgnoreCase));

                if (user == null)
                {
                    Console.WriteLine($"[CHANGE PASSWORD] User not found: {request.FedexId}");
                    return NotFound(new { success = false, message = "User not found" });
                }

                user.PasswordHash = request.NewPasswordHash;
                user.MustChangePassword = false;
                user.PasswordChangedAt = DateTime.UtcNow.ToString("o");
                user.UpdatedAt = DateTime.UtcNow.ToString("o");

                await SaveUserData(userData!);
                
                Console.WriteLine($"[CHANGE PASSWORD] Success for: {user.Name}");
                return Ok(new { success = true, message = "Password updated successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CHANGE PASSWORD] Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ============================================================
        // ========== LOCKOUT CHECK (ANONYMOUS) =======================
        // ============================================================
        [AllowAnonymous]
        [HttpPost("check-lockout")]
        public async Task<IActionResult> CheckLockout([FromBody] LockoutCheckRequest request)
        {
            try
            {
                var user = await GetUserByFedexId(request.FedexId);
                if (user == null)
                    return Ok(new { 
                        isLocked = false, 
                        remainingTime = 0, 
                        remainingAttempts = MAX_ATTEMPTS 
                    });

                if (!string.IsNullOrEmpty(user.LockedUntil))
                {
                    if (DateTime.TryParseExact(user.LockedUntil, "o", CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var lockoutTime))
                    {
                        if (lockoutTime > DateTime.UtcNow)
                        {
                            var remaining = Math.Max(1, (int)Math.Ceiling((lockoutTime - DateTime.UtcNow).TotalMinutes));
                            
                            if (remaining > 30)
                            {
                                Console.WriteLine($"[CHECK LOCKOUT] Excessive lockout detected: {remaining} mins. Resetting to {LOCKOUT_MINUTES} mins.");
                                
                                var userData = await LoadUserData();
                                var userToUpdate = userData.Users.FirstOrDefault(u => u.FedexId.Equals(request.FedexId, StringComparison.OrdinalIgnoreCase));
                                if (userToUpdate != null)
                                {
                                    userToUpdate.LockedUntil = DateTime.UtcNow.AddMinutes(LOCKOUT_MINUTES).ToString("o");
                                    await SaveUserData(userData);
                                }
                                
                                remaining = LOCKOUT_MINUTES;
                            }
                            
                            Console.WriteLine($"[CHECK LOCKOUT] Account locked. Remaining: {remaining} minutes");
                            return Ok(new { 
                                isLocked = true, 
                                remainingTime = remaining,
                                remainingAttempts = 0
                            });
                        }
                        else
                        {
                            Console.WriteLine($"[CHECK LOCKOUT] Lockout expired for {request.FedexId}, clearing...");
                            var userData = await LoadUserData();
                            var userToUpdate = userData.Users.FirstOrDefault(u => u.FedexId.Equals(request.FedexId, StringComparison.OrdinalIgnoreCase));
                            if (userToUpdate != null)
                            {
                                userToUpdate.FailedAttempts = 0;
                                userToUpdate.LockedUntil = null;
                                userToUpdate.LastFailedAttempt = null;
                                await SaveUserData(userData);
                            }
                        }
                    }
                }

                var attemptsLeft = Math.Max(0, MAX_ATTEMPTS - user.FailedAttempts);
                
                Console.WriteLine($"[CHECK LOCKOUT] Not locked. Attempts left: {attemptsLeft}");
                return Ok(new { 
                    isLocked = false, 
                    remainingTime = 0,
                    remainingAttempts = attemptsLeft
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CHECK LOCKOUT] Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ============================================================
        // ========== RECORD FAILED ATTEMPT (ANONYMOUS) ===============
        // ============================================================
        [AllowAnonymous]
        [HttpPost("record-failed-attempt")]
        public async Task<IActionResult> RecordFailedAttempt([FromBody] FailedAttemptRequest request)
        {
            try
            {
                var userData = await LoadUserData();
                var user = userData.Users.FirstOrDefault(u => u.FedexId.Equals(request.FedexId, StringComparison.OrdinalIgnoreCase));
                if (user == null) 
                    return NotFound(new { success = false, message = "User not found" });

                await RecordFailedAttemptInternal(userData, user);
                
                var attemptsLeft = Math.Max(0, MAX_ATTEMPTS - user.FailedAttempts);
                
                Console.WriteLine($"[RECORD FAILED] User: {user.FedexId}, Failed attempts: {user.FailedAttempts}, Remaining: {attemptsLeft}");
                
                return Ok(new 
                { 
                    success = true, 
                    failedAttempts = user.FailedAttempts,
                    remainingAttempts = attemptsLeft,
                    isLocked = user.FailedAttempts >= MAX_ATTEMPTS, 
                    lockedUntil = user.LockedUntil 
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[RECORD FAILED] Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ============================================================
        // ========== GET USER SETTINGS ===============================
        // ============================================================
        [Authorize]
        [HttpGet("settings/{fedexId}")]
        public async Task<IActionResult> GetUserSettings(string fedexId)
        {
            try
            {
                Console.WriteLine($"[GET SETTINGS] Request for: {fedexId}");

                var user = await GetUserByFedexId(fedexId);
                
                if (user == null)
                {
                    return NotFound(new { success = false, message = "User not found" });
                }

                var settings = user.Settings ?? new Dictionary<string, object>
                {
                    { "emailNotifications", true },
                    { "projectNotifications", true },
                    { "systemAlerts", true },
                    { "timezone", "Europe/Istanbul" },
                    { "timezoneCode", "TR" },
                    { "timezoneFlagCode", "tr" },
                    { "dateFormat", "DD/MM/YYYY" },
                    { "compactMode", false }
                };

                return Ok(new { success = true, settings });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GET SETTINGS] Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ============================================================
        // ========== UPDATE USER TIMEZONE ============================
        // ============================================================
        [Authorize]
        [HttpPost("update-timezone")]
        public async Task<IActionResult> UpdateTimezone([FromBody] TimezoneUpdateRequest request)
        {
            try
            {
                Console.WriteLine($"[UPDATE TIMEZONE] Request for: {request.FedexId}");

                if (!System.IO.File.Exists(_usersFilePath))
                    return NotFound(new { success = false, message = "Users file not found" });

                var json = await System.IO.File.ReadAllTextAsync(_usersFilePath, Encoding.UTF8);
                var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
                var userData = JsonSerializer.Deserialize<UserData>(json, options);
                var user = userData?.Users?.FirstOrDefault(u => u.FedexId.Equals(request.FedexId, StringComparison.OrdinalIgnoreCase));

                if (user == null)
                    return NotFound(new { success = false, message = "User not found" });

                if (user.Settings == null)
                {
                    user.Settings = new Dictionary<string, object>();
                }

                user.Settings["timezone"] = request.Timezone;
                user.Settings["timezoneCode"] = request.TimezoneCode;
                user.Settings["timezoneFlagCode"] = request.FlagCode;
                user.UpdatedAt = DateTime.UtcNow.ToString("o");

                await SaveUserData(userData!);
                
                Console.WriteLine($"[UPDATE TIMEZONE] Success: {request.Timezone} ({request.TimezoneCode}) for {user.Name}");
                return Ok(new { success = true, message = "Timezone updated successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[UPDATE TIMEZONE] Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ============================================================
        // ========== SAVE USER SETTINGS ==============================
        // ============================================================
        [Authorize]
        [HttpPost("settings/{fedexId}")]
        public async Task<IActionResult> SaveUserSettings(string fedexId, [FromBody] Dictionary<string, object> settings)
        {
            try
            {
                Console.WriteLine($"[SAVE SETTINGS] Request for: {fedexId}");

                if (!System.IO.File.Exists(_usersFilePath))
                    return NotFound(new { success = false, message = "Users file not found" });

                var json = await System.IO.File.ReadAllTextAsync(_usersFilePath, Encoding.UTF8);
                var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
                var userData = JsonSerializer.Deserialize<UserData>(json, options);
                var user = userData?.Users?.FirstOrDefault(u => u.FedexId.Equals(fedexId, StringComparison.OrdinalIgnoreCase));

                if (user == null)
                {
                    return NotFound(new { success = false, message = "User not found" });
                }

                user.Settings = settings;
                user.UpdatedAt = DateTime.UtcNow.ToString("o");

                await SaveUserData(userData!);
                
                Console.WriteLine($"[SAVE SETTINGS] Success for: {user.Name}");
                return Ok(new { success = true, message = "Settings saved successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SAVE SETTINGS] Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ============================================================
        // ========== GET USER PROFILE ================================
        // ============================================================
        [Authorize]
        [HttpGet("profile/{fedexId}")]
        public async Task<IActionResult> GetUserProfile(string fedexId)
        {
            try
            {
                Console.WriteLine($"[GET PROFILE] Request for: {fedexId}");

                var user = await GetUserByFedexId(fedexId);
                
                if (user == null)
                {
                    return NotFound(new { success = false, message = "User not found" });
                }

                // Calculate time since member
                if (!DateTime.TryParse(user.CreatedAt, null, DateTimeStyles.RoundtripKind, out var memberSince))
                {
                    memberSince = DateTime.UtcNow;
                }
                
                var daysSinceMember = (DateTime.UtcNow - memberSince).Days;

                // Calculate time since last login
string lastLoginDisplay = "Never";
string lastLoginRaw = user.LastLogin;

if (!string.IsNullOrEmpty(user.LastLogin))
{
    try
    {
        var lastLogin = DateTime.Parse(user.LastLogin, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind);
        
        if (lastLogin.Kind != DateTimeKind.Utc)
        {
            lastLogin = lastLogin.ToUniversalTime();
        }
        
        var timeSince = DateTime.UtcNow - lastLogin;
        
        Console.WriteLine($"[DEBUG] LastLogin: {lastLogin}, UtcNow: {DateTime.UtcNow}, Diff: {timeSince.TotalMinutes} mins");
        
        if (timeSince.TotalSeconds < 0)
        {
            // Future time - something is wrong, show as "just now"
            lastLoginDisplay = "Just now";
            lastLoginRaw = DateTime.UtcNow.ToString("MMMM dd, yyyy - HH:mm:ss");
        }
        else if (timeSince.TotalSeconds < 60)
        {
            lastLoginDisplay = "Just now";
            lastLoginRaw = lastLogin.ToString("MMMM dd, yyyy - HH:mm:ss");
        }
        else if (timeSince.TotalMinutes < 60)
        {
            lastLoginDisplay = $"{(int)timeSince.TotalMinutes} minutes ago";
            lastLoginRaw = lastLogin.ToString("MMMM dd, yyyy - HH:mm:ss");
        }
        else if (timeSince.TotalHours < 24)
        {
            lastLoginDisplay = $"{(int)timeSince.TotalHours} hours ago";
            lastLoginRaw = lastLogin.ToString("MMMM dd, yyyy - HH:mm:ss");
        }
        else if (timeSince.TotalDays < 30)
        {
            lastLoginDisplay = $"{(int)timeSince.TotalDays} days ago";
            lastLoginRaw = lastLogin.ToString("MMMM dd, yyyy - HH:mm:ss");
        }
        else
        {
            lastLoginDisplay = lastLogin.ToString("MMM dd, yyyy");
            lastLoginRaw = lastLogin.ToString("MMMM dd, yyyy - HH:mm:ss");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[ERROR] Failed to parse LastLogin: {ex.Message}");
        lastLoginDisplay = "Recently";
        lastLoginRaw = "Error parsing date";
    }
}

                // Format total time spent
                var totalHours = user.TotalTimeSpent / 3600;
                var totalMinutes = (user.TotalTimeSpent % 3600) / 60;

                var profile = new
                {
                    fedexId = user.FedexId,
                    name = user.Name,
                    email = user.Email,
                    role = user.Role,
                    countries = user.Countries,
                    
                    // Stats
                    stats = new
{
    memberSince = memberSince.ToString("MMMM dd, yyyy"),
    daysSinceMember = daysSinceMember,
    lastLogin = lastLoginDisplay,
    lastLoginRaw = lastLoginRaw,  // ✅ Now formatted nicely
    loginCount = user.LoginCount,
    totalTimeSpent = $"{totalHours}h {totalMinutes}m",
    totalTimeSpentSeconds = user.TotalTimeSpent,
    coffeeCount = user.CoffeeCount
},
                    
                    // Settings (timezone)
                    timezone = user.Settings?.ContainsKey("timezone") == true 
                        ? user.Settings["timezone"].ToString() 
                        : "Europe/Istanbul",
                    timezoneCode = user.Settings?.ContainsKey("timezoneCode") == true 
                        ? user.Settings["timezoneCode"].ToString() 
                        : "TR",
                    
                    createdAt = user.CreatedAt,
                    updatedAt = user.UpdatedAt
                };

                Console.WriteLine($"[GET PROFILE] Success for: {user.Name}");
                return Ok(new { success = true, profile });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GET PROFILE] Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ============================================================
        // ========== UPDATE COFFEE COUNT =============================
        // ============================================================
        [Authorize]
[HttpPost("update-coffee")]
public async Task<IActionResult> UpdateCoffeeCount([FromBody] CoffeeUpdateRequest request)
{
    try
    {
        Console.WriteLine($"[UPDATE COFFEE] Request for: {request.FedexId}");

        var userData = await LoadUserData();
        var user = userData.Users.FirstOrDefault(u => 
            u.FedexId.Equals(request.FedexId, StringComparison.OrdinalIgnoreCase));

        if (user == null)
            return NotFound(new { success = false, message = "User not found" });

        var today = DateTime.UtcNow.ToString("yyyy-MM-dd");

        // Yeni gün mü?
        if (user.LastCoffeeDate != today)
        {
            // Gün değişmişse önce maksimumu kontrol et
            if (user.CoffeeCount > user.MaxCoffeeCount)
            {
                user.MaxCoffeeCount = user.CoffeeCount;
                user.MaxCoffeeDay = user.LastCoffeeDate;
                Console.WriteLine($"[COFFEE] ☕ New max coffee record: {user.MaxCoffeeCount} on {user.MaxCoffeeDay}");
            }

            // Yeni güne geç, sıfırla
            user.CoffeeCount = 0;
            user.LastCoffeeDate = today;
        }

        // Güncel sayıyı ekle
        user.CoffeeCount = request.CoffeeCount;
        user.LastCoffeeDate = today;
        user.UpdatedAt = DateTime.UtcNow.ToString("o");

        await SaveUserData(userData);

        Console.WriteLine($"[UPDATE COFFEE] Success: {user.CoffeeCount} ({user.LastCoffeeDate}) for {user.Name}");
        return Ok(new 
        { 
            success = true, 
            coffeeCount = user.CoffeeCount, 
            maxCoffeeCount = user.MaxCoffeeCount, 
            maxCoffeeDay = user.MaxCoffeeDay 
        });
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[UPDATE COFFEE] Error: {ex.Message}");
        return StatusCode(500, new { success = false, message = ex.Message });
    }
}

// ============================================================
// ========== DAILY COFFEE RESET (INLINE TIMER) ================
// ============================================================

private static System.Timers.Timer? _coffeeResetTimer;

private void StartCoffeeResetScheduler()
{
    if (_coffeeResetTimer != null)
        return; // already running

    var now = DateTime.Now;
    var nextMidnight = now.Date.AddDays(1).AddSeconds(5);
    var interval = nextMidnight - now;

    Console.WriteLine($"[COFFEE RESET] Next reset scheduled for {nextMidnight}");

    _coffeeResetTimer = new System.Timers.Timer(interval.TotalMilliseconds);
    _coffeeResetTimer.AutoReset = false; // run once, then reschedule
    _coffeeResetTimer.Elapsed += async (sender, e) =>
    {
        await ResetCoffeeCounters();
        _coffeeResetTimer.Dispose();
        _coffeeResetTimer = null;
        StartCoffeeResetScheduler(); // schedule again for next midnight
    };
    _coffeeResetTimer.Start();
}

private async Task ResetCoffeeCounters()
{
    try
    {
        if (!System.IO.File.Exists(_usersFilePath))
        {
            Console.WriteLine("[COFFEE RESET] No users.json found, skipping...");
            return;
        }

        var json = await System.IO.File.ReadAllTextAsync(_usersFilePath);
        var userData = JsonSerializer.Deserialize<UserData>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        if (userData == null || userData.Users.Count == 0)
        {
            Console.WriteLine("[COFFEE RESET] No users to reset.");
            return;
        }

        var today = DateTime.UtcNow.ToString("yyyy-MM-dd");

        foreach (var user in userData.Users)
        {
            if (user.CoffeeCount > user.MaxCoffeeCount)
            {
                user.MaxCoffeeCount = user.CoffeeCount;
                user.MaxCoffeeDay = user.LastCoffeeDate ?? today;
            }

            user.CoffeeCount = 0;
            user.LastCoffeeDate = today;
            user.UpdatedAt = DateTime.UtcNow.ToString("o");
        }

        await SaveUserData(userData);

        Console.WriteLine($"☀️ Coffee counters reset for {userData.Users.Count} users at {DateTime.Now}");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[COFFEE RESET ERROR] {ex.Message}");
    }
}


        // ============================================================
        // ========== UPDATE TIME SPENT ===============================
        // ============================================================
        [Authorize]
        [HttpPost("update-time-spent")]
        public async Task<IActionResult> UpdateTimeSpent([FromBody] TimeSpentUpdateRequest request)
        {
            try
            {
                Console.WriteLine($"[UPDATE TIME] Request for: {request.FedexId}");

                var userData = await LoadUserData();
                var user = userData.Users.FirstOrDefault(u => 
                    u.FedexId.Equals(request.FedexId, StringComparison.OrdinalIgnoreCase));

                if (user == null)
                    return NotFound(new { success = false, message = "User not found" });

                user.TotalTimeSpent += request.SecondsToAdd;
                user.UpdatedAt = DateTime.UtcNow.ToString("o");

                await SaveUserData(userData);
                
                Console.WriteLine($"[UPDATE TIME] Success: {user.TotalTimeSpent}s for {user.Name}");
                return Ok(new { success = true, totalTimeSpent = user.TotalTimeSpent });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[UPDATE TIME] Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ============================================================
        // ========== CLEAR ATTEMPTS (AUTHORIZED) =====================
        // ============================================================
        [Authorize]
        [HttpPost("clear-failed-attempts")]
        public async Task<IActionResult> ClearFailedAttempts([FromBody] ClearAttemptsRequest request)
        {
            try
            {
                Console.WriteLine($"[CLEAR ATTEMPTS] Request for: {request.FedexId}");
                
                var userData = await LoadUserData();
                var user = userData.Users.FirstOrDefault(u => u.FedexId.Equals(request.FedexId, StringComparison.OrdinalIgnoreCase));
                if (user == null) 
                    return NotFound(new { success = false, message = "User not found" });

                user.FailedAttempts = 0;
                user.LockedUntil = null;
                user.LastFailedAttempt = null;
                await SaveUserData(userData);
                
                Console.WriteLine($"[CLEAR ATTEMPTS] Success for: {user.Name}");
                return Ok(new { success = true, message = "Failed attempts cleared" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CLEAR ATTEMPTS] Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ============================================================
        // ========== INTERNAL HELPERS ================================
        // ============================================================
        private async Task RecordFailedAttemptInternal(UserData data, User user)
        {
            user.FailedAttempts++;
            user.LastFailedAttempt = DateTime.UtcNow.ToString("o");
            
            if (user.FailedAttempts >= MAX_ATTEMPTS)
            {
                user.LockedUntil = DateTime.UtcNow.AddMinutes(LOCKOUT_MINUTES).ToString("o");
                Console.WriteLine($"[LOCKOUT] User {user.FedexId} locked until {user.LockedUntil} ({LOCKOUT_MINUTES} minutes)");
            }

            await SaveUserData(data);
        }

        private string GenerateJwtToken(User user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("HorizonSecretKey_ChangeThis!"));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim("fedexId", user.FedexId),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim("countries", string.Join(",", user.Countries ?? new List<string>()))
            };

            var token = new JwtSecurityToken(
                issuer: "HorizonSystem",
                audience: "HorizonUsers",
                claims: claims,
                expires: DateTime.UtcNow.AddHours(8),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private async Task<UserData> LoadUserData()
        {
            if (!System.IO.File.Exists(_usersFilePath))
                throw new FileNotFoundException("Users file not found", _usersFilePath);

            var json = await System.IO.File.ReadAllTextAsync(_usersFilePath, Encoding.UTF8);
            var options = new JsonSerializerOptions 
            { 
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true
            };
            return JsonSerializer.Deserialize<UserData>(json, options) ?? new UserData();
        }

        private async Task<User?> GetUserByFedexId(string fedexId)
        {
            var data = await LoadUserData();
            return data.Users.FirstOrDefault(u => u.FedexId.Equals(fedexId, StringComparison.OrdinalIgnoreCase));
        }

        private async Task SaveUserData(UserData data)
        {
            try
            {
                Console.WriteLine($"[SAVE] === SAVING USER DATA ===");
                Console.WriteLine($"[SAVE] Total users: {data.Users.Count}");
                
                var options = new JsonSerializerOptions 
                { 
                    WriteIndented = true, 
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                    PropertyNameCaseInsensitive = true,
                    DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.Never
                };
                
                var updatedJson = JsonSerializer.Serialize(data, options);
                
                Console.WriteLine($"[SAVE] JSON length: {updatedJson.Length}");
                
                lock (_fileLock)
                {
                    System.IO.File.WriteAllText(_usersFilePath, updatedJson, new UTF8Encoding(false));
                }
                
                Console.WriteLine($"[SAVE] File written successfully");
                Console.WriteLine($"[SAVE] === SAVE COMPLETE ===");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SAVE ERROR] {ex.Message}");
                Console.WriteLine($"[SAVE ERROR] Stack: {ex.StackTrace}");
                throw;
            }
            
            await Task.CompletedTask;
        }

        // ============================================================
        // ========== DATA MODELS =====================================
        // ============================================================
        public class LoginRequest
        {
            public string FedexId { get; set; } = string.Empty;
            public string PasswordHash { get; set; } = string.Empty;
        }

        public class TestRequest
        {
            public string FedexId { get; set; } = string.Empty;
        }

        public class PasswordChangeRequest
        {
            public string FedexId { get; set; } = string.Empty;
            public string NewPasswordHash { get; set; } = string.Empty;
        }

        public class LockoutCheckRequest
        {
            public string FedexId { get; set; } = string.Empty;
        }

        public class FailedAttemptRequest
        {
            public string FedexId { get; set; } = string.Empty;
        }

        public class ClearAttemptsRequest
        {
            public string FedexId { get; set; } = string.Empty;
        }

        public class TimezoneUpdateRequest
        {
            public string FedexId { get; set; } = string.Empty;
            public string Timezone { get; set; } = string.Empty;
            public string TimezoneCode { get; set; } = string.Empty;
            public string FlagCode { get; set; } = string.Empty;
        }

        public class CoffeeUpdateRequest
        {
            public string FedexId { get; set; } = string.Empty;
            public int CoffeeCount { get; set; }
        }

        public class TimeSpentUpdateRequest
        {
            public string FedexId { get; set; } = string.Empty;
            public int SecondsToAdd { get; set; }
        }

        public class UserData
        {
            public List<User> Users { get; set; } = new();
        }

        public class User
        {
            public string FedexId { get; set; } = string.Empty;
            public string Name { get; set; } = string.Empty;
            public string Email { get; set; } = string.Empty;
            public string Role { get; set; } = string.Empty;
            public string PasswordHash { get; set; } = string.Empty;
            public List<string> Countries { get; set; } = new();
            public Dictionary<string, object>? Settings { get; set; }
            
            // Stats & Tracking
            public int LoginCount { get; set; } = 0;
            public int TotalTimeSpent { get; set; } = 0;
            public int CoffeeCount { get; set; } = 0;
    public string? LastCoffeeDate { get; set; } = null;
    public int MaxCoffeeCount { get; set; } = 0;
    public string? MaxCoffeeDay { get; set; } = null;
            
            // Security & Auth
            public bool MustChangePassword { get; set; }
            public string? LastLogin { get; set; }
            public string? PasswordChangedAt { get; set; }
            public int FailedAttempts { get; set; } = 0;
            public string? LockedUntil { get; set; }
            public string? LastFailedAttempt { get; set; }
            
            // Metadata
            public string CreatedAt { get; set; } = string.Empty;
            public string UpdatedAt { get; set; } = string.Empty;
        }
    }
}
