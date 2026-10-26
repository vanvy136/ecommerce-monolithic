# Ecommerce Monolithic Backend

Backend cho hệ thống thương mại điện tử, xây dựng bằng Node.js, Express, Prisma ORM và PostgreSQL.

## 1. Công nghệ sử dụng

- Node.js và Express
- PostgreSQL 16
- Prisma ORM
- Docker Compose
- JWT Authentication
- Swagger UI

## 2. Chức năng

Hệ thống cung cấp 15 API thuộc 5 nhóm:

| Nhóm | Chức năng |
|---|---|
| Health | Kiểm tra trạng thái Backend |
| Products | Xem, thêm, sửa, xóa sản phẩm |
| Authentication | Đăng ký, đăng nhập, xem thông tin tài khoản |
| Orders | Tạo và tra cứu đơn hàng |
| Shipments | Tạo, tra cứu và cập nhật trạng thái vận chuyển |

Hệ thống hỗ trợ xác thực JWT và phân quyền đối với các chức năng yêu cầu quyền truy cập.

## 3. Yêu cầu môi trường

- Node.js và npm
- Docker Desktop
- PostgreSQL 16 (thông qua Docker Compose)

## 4. Cài đặt

Clone repository:

```bash
git clone https://github.com/vanvy136/ecommerce-monolithic.git
cd ecommerce-monolithic
```

Cài đặt dependencies:

```bash
npm install
```

## 5. Cấu hình môi trường

Tạo file `.env` tại thư mục gốc.

Các biến môi trường cần thiết:

```dotenv
DATABASE_URL="postgresql://<db_user>:<db_password>@localhost:5433/ecommerce_db?schema=public"
JWT_SECRET="<your_jwt_secret>"
PORT=3001
```

Thay các giá trị trong dấu `< >` bằng cấu hình thực tế. Không commit file `.env` lên GitHub.

Thông tin tài khoản PostgreSQL và mật khẩu phải tương ứng với cấu hình trong `docker-compose.yml`.

## 6. Khởi động PostgreSQL

```bash
docker compose up -d
```

PostgreSQL được ánh xạ ra cổng `5433` trên máy tính.

## 7. Khởi tạo Prisma

Tạo Prisma Client:

```bash
npx prisma generate
```

Áp dụng migration:

```bash
npx prisma migrate deploy
```

Nếu cần dữ liệu mẫu, kiểm tra cấu hình và nội dung `prisma/seed.js` trước khi thực hiện seed.

## 8. Khởi động Backend

```bash
npm start
```

Với `PORT=3001`, Backend chạy tại:

```text
http://localhost:3001
```

## 9. Kiểm tra API

Health Check:

```text
GET http://localhost:3001/health
```

Swagger UI:

```text
http://localhost:3001/api-docs/
```

OpenAPI JSON:

```text
http://localhost:3001/swagger.json
```

## 10. Cấu trúc dự án

```text
ecommerce-monolithic/
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.js
├── .gitignore
├── docker-compose.yml
├── package.json
├── package-lock.json
├── prisma.config.ts
├── server.js
├── swagger.js
└── README.md
```

## 11. Repository

https://github.com/vanvy136/ecommerce-monolithic
