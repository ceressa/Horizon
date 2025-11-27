# Logging Guide

Bu uygulamada Serilog kullanılarak dosya bazlı loglama yapılır. Varsayılan yapılandırma `Program.cs` içinde tanımlıdır ve loglar çalıştırılan exe klasörüne (`AppContext.BaseDirectory`) göre `Logs/horizon-<tarih>.log` dosyalarına yazılır. Aynı loglar stdout/stderr üzerine de akıtılır; IIS gibi ortamlarda konsol çıktısı otomatik toplanır.

## Logların oluştuğunu görmek için
1. Uygulamayı normal şekilde başlatın (`dotnet run` veya mevcut servis komutu). Serilog başlangıçta çalıştırılabilir dosyanın yanına (`publish/Logs`) `Logs` klasörünü oluşturur.
2. Her gün dönen dosya adı `horizon-YYYYMMDD.log` şeklindedir; son 14 günlük dosya saklanır ve dosya paylaşımlı (shared) açıldığı için IIS yeniden başlatmalarında dosya kilidi hatası oluşmaz.
3. İçerikleri görmek için bir terminalden aşağıdaki komutları kullanabilirsiniz:
   - Son satırları izlemek: `tail -f Logs/horizon-$(date +%Y%m%d).log`
   - Belirli bir seviyeyi filtrelemek: `grep "[ERR]" Logs/horizon-$(date +%Y%m%d).log`
   - IIS altında çalışırken yayın klasöründeki `Logs/stdout_*.log` dosyalarını da kontrol edebilirsiniz (stdout logu `publish/web.config` ile açık).

## DataSync loglarını üretmek
- Arka plan zamanlayıcısı her saat otomatik çalışır; her çalışmada başlangıç, başarı, uyarı ve hata mesajları loga düşer.
- Manuel tetikleme yapmak için HTTP POST isteği gönderin:
  ```bash
  curl -X POST http://<sunucu-adresi>/api/data/sync
  ```
  Bu istek, kopyalama denemesini hemen başlatır ve süreçle ilgili loglar aynı dosyaya yazılır.

## Yapılandırmayı özelleştirmek
- `appsettings.json` içindeki `DataSync` bölümüyle kaynak/ hedef klasörleri ve kopyalanacak dosya adlarını değiştirebilirsiniz.
- Log seviyesi veya hedefi değiştirmek için `Program.cs` içindeki Serilog kurulumunu düzenleyebilirsiniz.
