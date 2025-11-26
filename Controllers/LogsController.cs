using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;

namespace Horizon.API.Controllers
{
    [ApiController]
    [Route("api/logs")]
    public class LogsController : ControllerBase
    {
        private readonly string LogDirectory = Path.GetFullPath(
            Path.Combine(AppContext.BaseDirectory, "..", "Logs")
        );

        public LogsController()
        {
            if (!Directory.Exists(LogDirectory))
                Directory.CreateDirectory(LogDirectory);
        }

        /// <summary>
        /// POST /api/logs
        /// Günlük log kaydeder - Browser'dan gelen tüm data'yi kabul eder
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> SaveLog([FromBody] Dictionary<string, object> logEntry)
        {
            try
            {
                if (logEntry == null)
                    return BadRequest(new { success = false, message = "Invalid or empty log data" });

                // ? Server-side data ekle (override et)
                logEntry["ipAddress"] = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                logEntry["serverTimestamp"] = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");
                
                // ? Client'in gönderdigi tüm browser data'sini koru
                // (userAgent, browserLanguage, platform, screenResolution, timezone, referrer, sessionId, sessionDuration)

                string today = DateTime.UtcNow.ToString("yyyy-MM-dd");
                string logFile = Path.Combine(LogDirectory, $"logs_{today}.json");

                List<Dictionary<string, object>> logs = new();

                if (System.IO.File.Exists(logFile))
                {
                    string existingData = await System.IO.File.ReadAllTextAsync(logFile);
                    if (!string.IsNullOrWhiteSpace(existingData))
                    {
                        logs = JsonSerializer.Deserialize<List<Dictionary<string, object>>>(existingData)
                            ?? new List<Dictionary<string, object>>();
                    }
                }

                logs.Add(logEntry);

                var options = new JsonSerializerOptions { WriteIndented = true };
                string updatedJson = JsonSerializer.Serialize(logs, options);
                await System.IO.File.WriteAllTextAsync(logFile, updatedJson);

                return Ok(new
                {
                    success = true,
                    message = "Log saved successfully",
                    file = $"logs_{today}.json",
                    totalLogs = logs.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Server error: {ex.Message}" });
            }
        }

        /// <summary>
        /// GET /api/logs?date=YYYY-MM-DD
        /// Belirtilen tarihe ait loglari getirir
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetLogs([FromQuery] string? date)
        {
            try
            {
                date ??= DateTime.UtcNow.ToString("yyyy-MM-dd");
                string logFile = Path.Combine(LogDirectory, $"logs_{date}.json");

                if (!System.IO.File.Exists(logFile))
                {
                    return Ok(new
                    {
                        success = true,
                        logs = new List<object>(),
                        message = $"No logs found for {date}"
                    });
                }

                string json = await System.IO.File.ReadAllTextAsync(logFile);
                var logs = JsonSerializer.Deserialize<List<object>>(json) ?? new List<object>();

                return Ok(new
                {
                    success = true,
                    date,
                    count = logs.Count,
                    logs
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Failed to retrieve logs: {ex.Message}" });
            }
        }

        /// <summary>
        /// ? YENI: GET /api/logs/stats?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
        /// Belirtilen tarih araliginda istatistik döner
        /// </summary>
        [HttpGet("stats")]
        public async Task<IActionResult> GetStats([FromQuery] string? startDate, [FromQuery] string? endDate)
        {
            try
            {
                var start = string.IsNullOrEmpty(startDate) ? DateTime.UtcNow.AddDays(-7) : DateTime.Parse(startDate);
                var end = string.IsNullOrEmpty(endDate) ? DateTime.UtcNow : DateTime.Parse(endDate);

                var allLogs = new List<Dictionary<string, object>>();

                // Tarih araligindaki tüm log dosyalarini oku
                for (var date = start.Date; date <= end.Date; date = date.AddDays(1))
                {
                    string logFile = Path.Combine(LogDirectory, $"logs_{date:yyyy-MM-dd}.json");
                    
                    if (System.IO.File.Exists(logFile))
                    {
                        string json = await System.IO.File.ReadAllTextAsync(logFile);
                        var logs = JsonSerializer.Deserialize<List<Dictionary<string, object>>>(json);
                        
                        if (logs != null)
                            allLogs.AddRange(logs);
                    }
                }

                // Istatistikler
                var stats = new
                {
                    totalLogs = allLogs.Count,
                    byLevel = GroupByKey(allLogs, "level"),
                    byEvent = GroupByKey(allLogs, "event"),
                    byUser = GroupByKey(allLogs, "user"),
                    successRate = CalculateSuccessRate(allLogs),
                    uniqueUsers = GetUniqueUsers(allLogs),
                    activeHours = GetActiveHours(allLogs),
                    suspiciousActivities = DetectSuspiciousActivities(allLogs)
                };

                return Ok(new { success = true, startDate = start, endDate = end, stats });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Failed to generate stats: {ex.Message}" });
            }
        }

        // ========== HELPER METHODS ========== //

        private Dictionary<string, int> GroupByKey(List<Dictionary<string, object>> logs, string key)
        {
            var result = new Dictionary<string, int>();
            
            foreach (var log in logs)
            {
                if (log.ContainsKey(key) && log[key] != null)
                {
                    var value = log[key].ToString();
                    if (result.ContainsKey(value))
                        result[value]++;
                    else
                        result[value] = 1;
                }
            }
            
            return result;
        }

        private double CalculateSuccessRate(List<Dictionary<string, object>> logs)
        {
            var total = 0;
            var successful = 0;
            
            foreach (var log in logs)
            {
                if (log.ContainsKey("success") && log["success"] != null)
                {
                    total++;
                    if (log["success"].ToString().ToLower() == "true")
                        successful++;
                }
            }
            
            return total > 0 ? (double)successful / total * 100 : 0;
        }

        private int GetUniqueUsers(List<Dictionary<string, object>> logs)
        {
            var users = new HashSet<string>();
            
            foreach (var log in logs)
            {
                if (log.ContainsKey("user") && log["user"] != null)
                {
                    users.Add(log["user"].ToString());
                }
            }
            
            return users.Count;
        }

        private Dictionary<int, int> GetActiveHours(List<Dictionary<string, object>> logs)
        {
            var hours = new Dictionary<int, int>();
            
            foreach (var log in logs)
            {
                if (log.ContainsKey("timestamp") && log["timestamp"] != null)
                {
                    if (DateTime.TryParse(log["timestamp"].ToString(), out DateTime dt))
                    {
                        var hour = dt.Hour;
                        if (hours.ContainsKey(hour))
                            hours[hour]++;
                        else
                            hours[hour] = 1;
                    }
                }
            }
            
            return hours;
        }

        private List<string> DetectSuspiciousActivities(List<Dictionary<string, object>> logs)
        {
            var suspicious = new List<string>();
            
            // 1. Ayni kullanicidan çok sayida basarisiz giris
            var failedAttempts = new Dictionary<string, int>();
            
            foreach (var log in logs)
            {
                if (log.ContainsKey("event") && log["event"]?.ToString() == "LOGIN_FAILED")
                {
                    var user = log.ContainsKey("user") ? log["user"].ToString() : "unknown";
                    if (failedAttempts.ContainsKey(user))
                        failedAttempts[user]++;
                    else
                        failedAttempts[user] = 1;
                }
            }
            
            foreach (var kvp in failedAttempts)
            {
                if (kvp.Value >= 5)
                    suspicious.Add($"User '{kvp.Key}' has {kvp.Value} failed login attempts");
            }
            
            // 2. Çok sayida unauthorized access
            var unauthorizedAttempts = logs.FindAll(l => 
                l.ContainsKey("event") && l["event"]?.ToString() == "UNAUTHORIZED_ACCESS"
            );
            
            if (unauthorizedAttempts.Count >= 10)
                suspicious.Add($"High number of unauthorized access attempts: {unauthorizedAttempts.Count}");
            
            return suspicious;
        }
    }
}