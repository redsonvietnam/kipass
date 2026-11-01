# Kipass

Kho lưu trữ chính thức cho source extension Kipass. Mục tiêu của repo là giữ lịch sử phiên bản có thể kiểm chứng, không ghi đè một bản đã phát hành và tách rõ **stable** khỏi **preview**.

## Phiên bản

| Version | Trạng thái | Nội dung | Bằng chứng hiện có |
|---|---|---|---|
| [1.1.0](versions/1.1.0-stable/) | Stable / baseline | HUD Match Center + nhận diện trạng thái + auto-Continue có điều kiện cho nút Continue gốc ở bước 1 và 2 | Người dùng đã xác nhận từng hoạt động; source được backup và hash xác minh; cú pháp JS PASS |
| [1.2.0](versions/1.2.0-source-only/) | Source archive | Mốc code kế tiếp tìm thấy trong workspace | Có `content.js`; manifest gốc không tìm thấy nên chưa đóng gói/không tuyên bố installable |
| [1.3.0](versions/1.3.0-preview/) | Preview | NIGHTSHIFT visual skin | JS syntax + manifest JSON PASS; chưa có functional PASS |
| [1.3.1](versions/1.3.1-preview/) | Preview | NIGHTSHIFT + nhận diện progress `1-of-3` / `1/3` | JS syntax + manifest JSON PASS; chưa có functional PASS |
| [1.4.0](versions/1.4.0-preview/) | Preview | NIGHTSHIFT, căn giữa typography, sân cỏ xanh | JS syntax + manifest JSON PASS; cài thử trên Titanium nhưng chưa xác nhận luồng Verify/Continue hoạt động end-to-end |

## Quy tắc quan trọng

- Không sửa trực tiếp thư mục version đã phát hành. Bản mới luôn có thư mục mới.
- Chỉ gắn nhãn `stable` sau khi có test thực tế được ghi trong `docs/TEST-STATUS.md`.
- Mỗi bản cài đặt được phải có `manifest.json` với `version` trùng thư mục version.
- Lưu source nguyên gốc trước; bản sửa phải tạo version mới, không ghi đè baseline.
- Không giả lập lượt xem/click quảng cáo, không giả mạo trạng thái Ad Gate và không tự vượt CAPTCHA. Kipass chỉ có thể hỗ trợ luồng Continue hợp lệ do website cung cấp.

## Kiểm tra nhanh

Chạy bằng PowerShell trên Windows:

```powershell
.\tools\validate.ps1
```

Script kiểm tra cú pháp JavaScript cho mọi version có source và JSON của các manifest có trong repo. Nó **không** thay thế test chức năng trên trình duyệt/trang KIPAS.

## Cấu trúc

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

Chưa khai báo license trong repo. Hãy quyết định license trước khi phát hành công khai rộng rãi.