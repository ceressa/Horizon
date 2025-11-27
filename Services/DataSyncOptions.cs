using System.Collections.Generic;

namespace Horizon.Services
{
    public class DataSyncOptions
    {
        /// <summary>
        /// Servis sağlayıcısının Horizon/Data altına bıraktığı dosyaların yolu.
        /// </summary>
        public string? SourcePath { get; set; }

        /// <summary>
        /// Yayın sırasında kullanılacak hedef klasör (publish/Data).
        /// </summary>
        public string? TargetPath { get; set; }

        /// <summary>
        /// Kopyalanması beklenen Excel dosya isimleri. Boş bırakılırsa klasördeki tüm .xlsx dosyaları kopyalanır.
        /// </summary>
        public List<string>? FileNames { get; set; }
    }
}
