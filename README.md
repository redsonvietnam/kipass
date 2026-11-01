# Kipass

Kho lÆ°u trá»¯ chÃ­nh thá»©c cho source extension Kipass. Má»¥c tiÃªu cá»§a repo lÃ  giá»¯ lá»‹ch sá»­ phiÃªn báº£n cÃ³ thá»ƒ kiá»ƒm chá»©ng, khÃ´ng ghi Ä‘Ã¨ má»™t báº£n Ä‘Ã£ phÃ¡t hÃ nh vÃ  tÃ¡ch rÃµ **stable** khá»i **preview**.

## PhiÃªn báº£n

| Version | Tráº¡ng thÃ¡i | Ná»™i dung | Báº±ng chá»©ng hiá»‡n cÃ³ |
|---|---|---|---|
| [1.1.0](versions/1.1.0-stable/) | Stable / baseline | HUD Match Center + nháº­n diá»‡n tráº¡ng thÃ¡i + auto-Continue cÃ³ Ä‘iá»u kiá»‡n cho nÃºt Continue gá»‘c á»Ÿ bÆ°á»›c 1 vÃ  2 | NgÆ°á»i dÃ¹ng Ä‘Ã£ xÃ¡c nháº­n tá»«ng hoáº¡t Ä‘á»™ng; source Ä‘Æ°á»£c backup vÃ  hash xÃ¡c minh; cÃº phÃ¡p JS PASS |
| [1.1.1](versions/1.1.1-preview/) | Preview | Fixes hidden-button styling; smartlink verification remains manual | Static checks PASS; browser test pending; not stable |
| [1.2.0](versions/1.2.0-source-only/) | Source archive | Má»‘c code káº¿ tiáº¿p tÃ¬m tháº¥y trong workspace | CÃ³ `content.js`; manifest gá»‘c khÃ´ng tÃ¬m tháº¥y nÃªn chÆ°a Ä‘Ã³ng gÃ³i/khÃ´ng tuyÃªn bá»‘ installable |
| [1.3.0](versions/1.3.0-preview/) | Preview | NIGHTSHIFT visual skin | JS syntax + manifest JSON PASS; chÆ°a cÃ³ functional PASS |
| [1.3.1](versions/1.3.1-preview/) | Preview | NIGHTSHIFT + nháº­n diá»‡n progress `1-of-3` / `1/3` | JS syntax + manifest JSON PASS; chÆ°a cÃ³ functional PASS |
| [1.4.0](versions/1.4.0-preview/) | Preview | NIGHTSHIFT, cÄƒn giá»¯a typography, sÃ¢n cá» xanh | JS syntax + manifest JSON PASS; cÃ i thá»­ trÃªn Titanium nhÆ°ng chÆ°a xÃ¡c nháº­n luá»“ng Verify/Continue hoáº¡t Ä‘á»™ng end-to-end |

## Quy táº¯c quan trá»ng

- KhÃ´ng sá»­a trá»±c tiáº¿p thÆ° má»¥c version Ä‘Ã£ phÃ¡t hÃ nh. Báº£n má»›i luÃ´n cÃ³ thÆ° má»¥c má»›i.
- Chá»‰ gáº¯n nhÃ£n `stable` sau khi cÃ³ test thá»±c táº¿ Ä‘Æ°á»£c ghi trong `docs/TEST-STATUS.md`.
- Má»—i báº£n cÃ i Ä‘áº·t Ä‘Æ°á»£c pháº£i cÃ³ `manifest.json` vá»›i `version` trÃ¹ng thÆ° má»¥c version.
- LÆ°u source nguyÃªn gá»‘c trÆ°á»›c; báº£n sá»­a pháº£i táº¡o version má»›i, khÃ´ng ghi Ä‘Ã¨ baseline.
- KhÃ´ng giáº£ láº­p lÆ°á»£t xem/click quáº£ng cÃ¡o, khÃ´ng giáº£ máº¡o tráº¡ng thÃ¡i Ad Gate vÃ  khÃ´ng tá»± vÆ°á»£t CAPTCHA. Kipass chá»‰ cÃ³ thá»ƒ há»— trá»£ luá»“ng Continue há»£p lá»‡ do website cung cáº¥p.

## Kiá»ƒm tra nhanh

Cháº¡y báº±ng PowerShell trÃªn Windows:

```powershell
.\tools\validate.ps1
```

Script kiá»ƒm tra cÃº phÃ¡p JavaScript cho má»i version cÃ³ source vÃ  JSON cá»§a cÃ¡c manifest cÃ³ trong repo. NÃ³ **khÃ´ng** thay tháº¿ test chá»©c nÄƒng trÃªn trÃ¬nh duyá»‡t/trang KIPAS.

## Cáº¥u trÃºc

```text
versions/
  1.1.0-stable/
  1.2.0-source-only/
  1.3.0-preview/
  1.3.1-preview/
  1.4.0-preview/
docs/
tools/
```

ChÆ°a khai bÃ¡o license trong repo. HÃ£y quyáº¿t Ä‘á»‹nh license trÆ°á»›c khi phÃ¡t hÃ nh cÃ´ng khai rá»™ng rÃ£i.
## Legacy predecessor reference

VerifyGuard 0.3.0 and 0.5.2 are archived separately under [reference/legacy-verifyguard](reference/legacy-verifyguard/) for provenance only. They are not Kipass releases or runtime dependencies. See [project ancestry](docs/ANCESTRY.md).
